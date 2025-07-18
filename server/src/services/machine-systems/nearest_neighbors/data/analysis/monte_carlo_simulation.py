import gc
import json
import os
import random
import sys
import time
from collections import defaultdict
from concurrent.futures import as_completed, ThreadPoolExecutor
from datetime import datetime
import numpy as np
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline as hf_pipeline
from utils import config, load_company_documents

current_dir = config()
nearest_neighbors_dir = os.path.dirname(os.path.dirname(current_dir))
data_dir = os.path.join(nearest_neighbors_dir, "data")
analysis_dir = os.path.join(data_dir, "analysis")
simulations_dir = os.path.join(data_dir, "qd_simulations")
dataset_dir = os.path.join(data_dir, "dataset")

os.makedirs(data_dir, exist_ok=True)
os.makedirs(analysis_dir, exist_ok=True)
os.makedirs(simulations_dir, exist_ok=True)
os.makedirs(dataset_dir, exist_ok=True)

from models.database import Database

document_objects = load_company_documents()

SYSTEM_PROMPTS = [
    """Generate short financial search queries (2-10 words). One query per line. No formatting.""",
    """Create brief stock market search queries. Raw text only. One per line. No explanations.""",
    """Financial search queries only. Keep under 10 words. No numbering or formatting.""",
]

try:
    model_name = "google/flan-t5-base"
    device = 0 if torch.cuda.is_available() else -1
    query_generator = hf_pipeline(
        "text2text-generation",
        model=model_name,
        tokenizer=model_name,
        device=device,
        max_length=100,
    )
    print(f"Successfully initialized LLM pipeline using {model_name}")
except Exception as e:
    print(f"Error initializing LLM pipeline: {e}")
    query_generator = None

patterns = [
    "Queries about stock name or symbol",
    "Queries about stock price",
    "Queries about an overview of the company",
    "Queries about the company's sector or industry",
    "Queries about rising / falling stock prices",
    "Queries about company performance",
    "Queries about company financials",
    "Queries about company stock trends",
]

prompts = [
    "Generate search queries for {pattern} related to {company}",
    "Create 5 search queries about {pattern} for {company}",
    "What would users search for regarding {pattern} for {company}?",
    "List potential search queries about {company} focusing on {pattern}",
    "Generate realistic user queries about {pattern} for {company}",
]


def rule_based_annotation_qd(query, documents):
    """
    Rule-based annotation for query-document pairs.
    Args:
        query (str): The query string.
        documents (list): A list of documents.
    Returns:
        tuple: (positive_document, scores) - The annotated document with highest relevance score and metadata
    """
    scores = {}
    scores["metadata"] = {
        "query": query,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "average_score": None,
        "min_score": None,
        "max_score": None,
    }
    query_lower = query.lower()
    all_scores = []
    for doc in documents:
        score = 0.1
        if any(term in query_lower for term in ["price", "stock price", "value", "$"]):
            if "close" in doc and doc["close"]:
                score += 0.5
            if "simpleMovingAverage" in doc and doc["simpleMovingAverage"]:
                score += 0.3
        elif any(term in query_lower for term in ["name", "symbol", "ticker"]):
            if (
                "name" in doc
                and doc["name"]
                and any(
                    term.lower() in doc["name"].lower() for term in query_lower.split()
                )
            ):
                score += 0.6
            if (
                "symbol" in doc
                and doc["symbol"]
                and doc["symbol"].lower() in query_lower
            ):
                score += 0.7
        else:
            if "description" in doc and doc["description"]:
                query_terms = [term for term in query_lower.split() if len(term) > 2]
                matches = sum(
                    1 for term in query_terms if term in doc["description"].lower()
                )
                score += min(0.8, matches * 0.2)
        scores[doc["id"]] = score
        all_scores.append(score)
    positive_document = max(documents, key=lambda x: scores.get(x["id"], 0))
    scores["metadata"]["average_score"] = (
        sum(all_scores) / len(all_scores) if all_scores else 0
    )
    scores["metadata"]["min_score"] = min(all_scores) if all_scores else 0
    scores["metadata"]["max_score"] = max(all_scores) if all_scores else 0
    return positive_document, scores


class SyntheticDatasetGenerator:
    def __init__(self, dataset_size, iteration_number):
        """
        Initialize the synthetic dataset generator.

        Args:
            dataset_size: Number of data instances to generate
            iteration_number: Current iteration number for tracking
            document_objects: List of document objects to use for annotation
        """
        self.dataset_size = dataset_size
        self.iteration_number = iteration_number
        self.document_objects = document_objects
        self.search_queries = []
        self.dataset_scores_list = []

    def generate_search_queries(self, num_queries=100):
        """
        Generate synthetic search queries using patterns and company names.
        Uses LLM if available, otherwise falls back to simple pattern-based generation.

        Args:
            num_queries: Number of queries to generate

        Returns:
            List of generated search queries
        """
        generated_queries = []

        batch_size = 5 if query_generator else 1
        num_batches = (num_queries + batch_size - 1) // batch_size
        for batch in range(num_batches):
            company = random.choice(document_objects)
            pattern = random.choice(patterns)
            prompt_template = random.choice(prompts)
            system_prompt = random.choice(SYSTEM_PROMPTS)

            company_name = company["name"] + " " + company["symbol"]
            formatted_prompt = prompt_template.format(
                pattern=pattern, company=company_name
            )

            if query_generator:
                try:
                    full_prompt = (
                        f"{system_prompt}\n\nTASK: {formatted_prompt}\n\nQUERIES:"
                    )
                    result = query_generator(
                        full_prompt,
                        max_length=100,
                        do_sample=True,
                        temperature=0.7,
                        num_return_sequences=4,
                        num_beams=4,
                    )

                    for output in result:
                        generated_text = output["generated_text"].strip()
                        queries = [
                            q.strip() for q in generated_text.split("\n") if q.strip()
                        ]
                        for query in queries:
                            clean_query = query.strip()
                            clean_query = clean_query.lstrip("0123456789.- *•").strip()
                            clean_query = clean_query.strip("\"'").strip()

                            if clean_query and len(clean_query.split()) <= 15:
                                generated_queries.append(clean_query)

                                if len(generated_queries) >= num_queries:
                                    break

                        if len(generated_queries) >= num_queries:
                            break

                except Exception as e:
                    print(f"Error generating queries with LLM: {e}")
                    simple_query = (
                        f"{pattern.lower().replace('queries about ', '')} {company}"
                    )
                    generated_queries.append(simple_query)
            else:
                simple_query = (
                    f"{pattern.lower().replace('queries about ', '')} {company}"
                )
                generated_queries.append(simple_query)
            if len(generated_queries) >= num_queries:
                generated_queries = generated_queries[:num_queries]
                break

        self.search_queries = generated_queries
        return generated_queries

    def make_data_instance(self):
        """
        Create a single data instance with query and annotated document.

        Returns:
            Dictionary containing the data instance
        """
        if not self.search_queries:
            self.generate_search_queries()
        query = random.choice(self.search_queries)
        document_sample = random.sample(self.document_objects, random.randint(5, 30))
        positive_document, scores = rule_based_annotation_qd(query, document_sample)
        self.dataset_scores_list.append(scores)
        return {
            "id": f"query_{self.iteration_number}_{len(self.dataset_scores_list)}",
            "positive_document": positive_document,
            "query": query,
            "scores": scores,
        }


def thread_function(start_simulation, end_simulation, dataset_size_per_simulation=1000):
    """
    Function executed by each thread to generate synthetic datasets.

    Args:
        start_simulation: Starting simulation index
        end_simulation: Ending simulation index (exclusive)
        dataset_size_per_simulation: Number of instances to generate per simulation

    Returns:
        List of generated datasets
    """
    results = []
    for sim_index in range(start_simulation, end_simulation):
        print(f"Starting simulation {sim_index}")
        start_time = time.time()
        generator = SyntheticDatasetGenerator(
            dataset_size=dataset_size_per_simulation,
            iteration_number=sim_index,
        )
        generator.generate_search_queries(
            num_queries=max(10, dataset_size_per_simulation // 10)
        )

        dataset = []
        for instance_index in range(generator.dataset_size):
            try:
                instance = generator.make_data_instance()
                dataset.append(instance)
                print(
                    f"Simulation {sim_index}: Generated instance {instance_index+1}/{generator.dataset_size}"
                )
            except Exception as e:
                print(f"Error generating instance: {e}")
                continue
        os.makedirs(simulations_dir, exist_ok=True)
        with open(
            os.path.join(simulations_dir, f"qd_dataset_sim_{sim_index}.json"), "w"
        ) as f:
            serializable_dataset = []
            for item in dataset:
                serializable_item = {
                    "id": item["id"],
                    "query": item["query"],
                    "positive_document_id": (
                        item["positive_document"].get("id")
                        if isinstance(item["positive_document"], dict)
                        else None
                    ),
                    "scores": item["scores"],
                }
                serializable_dataset.append(serializable_item)
            json.dump(serializable_dataset, f, indent=2)
        del dataset
        del generator
        gc.collect()
    return results


def run(n_simulations=100, num_workers=10, dataset_size_per_simulation=1000):
    """
    Run the Monte Carlo simulation with multiple threads.

    Args:
        n_simulations: Total number of simulations to run
        num_workers: Number of worker threads to use
        dataset_size_per_simulation: Number of instances to generate per simulation
    """
    print(
        f"Starting Monte Carlo simulation with {n_simulations} simulations using {num_workers} workers"
    )

    estimated_time_per_sim = 5 * (dataset_size_per_simulation / 1000)
    total_estimated_time = (estimated_time_per_sim * n_simulations) / num_workers
    hours, remainder = divmod(total_estimated_time, 3600)
    minutes, seconds = divmod(remainder, 60)

    print(
        f"Estimated time to complete: {int(hours)} hours, {int(minutes)} minutes, {int(seconds)} seconds"
    )
    print(f"Estimated completion time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    start_time = time.time()
    work_chunk_size = max(1, n_simulations // num_workers)
    all_results = []
    completed_simulations = 0

    with ThreadPoolExecutor(max_workers=min(num_workers, os.cpu_count())) as executor:
        futures = []
        for i in range(0, n_simulations, work_chunk_size):
            end = min(i + work_chunk_size, n_simulations)
            futures.append(
                executor.submit(thread_function, i, end, dataset_size_per_simulation)
            )

        for future in as_completed(futures):
            try:
                results = future.result()
                all_results.extend(results)

                completed_simulations += 1
                elapsed_time = time.time() - start_time
                progress_percent = (completed_simulations / len(futures)) * 100
                if completed_simulations > 0:
                    time_per_chunk = elapsed_time / completed_simulations
                    remaining_chunks = len(futures) - completed_simulations
                    remaining_time = time_per_chunk * remaining_chunks

                    hours, remainder = divmod(remaining_time, 3600)
                    minutes, seconds = divmod(remainder, 60)

                    est_completion_time = datetime.now().fromtimestamp(
                        time.time() + remaining_time
                    )

                    print(f"Progress: {progress_percent:.1f}% complete")
                    print(
                        f"Estimated time remaining: {int(hours)} hours, {int(minutes)} minutes, {int(seconds)} seconds"
                    )
                    print(
                        f"Estimated completion time: {est_completion_time.strftime('%Y-%m-%d %H:%M:%S')}"
                    )
            except Exception as e:
                print(f"Error in thread: {e}")

    with open(os.path.join(simulations_dir, "simulation_stats.json"), "w") as f:
        json.dump(all_results, f, indent=2)

    print("Aggregating all simulation results...")
    all_instances = []
    for i in range(n_simulations):
        try:
            sim_file = os.path.join(simulations_dir, f"qd_dataset_sim_{i}.json")
            if os.path.exists(sim_file):
                with open(sim_file, "r") as f:
                    instances = json.load(f)
                    all_instances.extend(instances)
                    print(f"Added {len(instances)} instances from simulation {i}")
        except Exception as e:
            print(f"Error reading simulation {i}: {e}")

    aggregated_file = os.path.join(dataset_dir, "aggregated_qd_dataset.json")
    with open(aggregated_file, "w") as f:
        json.dump(all_instances, f, indent=2)

    print(
        f"Wrote aggregated dataset with {len(all_instances)} instances to {aggregated_file}"
    )

    total_time = time.time() - start_time
    print(f"All threads completed successfully in {total_time:.2f} seconds")
    print(
        f"Generated {len(all_results)} simulations with a total of {len(all_instances)} instances"
    )


def main():
    """Main function to run the Monte Carlo simulation"""
    num_worker_threads = os.cpu_count() - 1
    num_simulations = 10
    dataset_size_per_simulation = 1
    run(num_simulations, num_worker_threads, dataset_size_per_simulation)


if __name__ == "__main__":
    main()
