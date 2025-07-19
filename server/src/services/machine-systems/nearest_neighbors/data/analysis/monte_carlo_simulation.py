import gc
import json
import os
import random
import sys
import time
import uuid
from collections import Counter, defaultdict
from concurrent.futures import as_completed, ThreadPoolExecutor
from datetime import datetime

import numpy as np
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline as hf_pipeline
from utils import *
from scoring import *


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
n = len(document_objects)
inverted_index = build_inverted_index(document_objects)
idf = compute_idf(inverted_index, n)
numerical_index = build_numerical_index(document_objects)
doc_norms = compute_doc_norms(inverted_index, idf, n)


try:
    model_name = "mistralai/Mistral-7B-Instruct-v0.2"
    device = 0 if torch.cuda.is_available() else -1

    print(f"Initializing LLM pipeline using {model_name}...")
    query_generator = hf_pipeline(
        "text-generation",
        model=model_name,
        tokenizer=model_name,
        device=device,
        max_length=200,
        do_sample=True,
        temperature=0.7,
        top_p=0.9,
    )
    print(f"Successfully initialized LLM pipeline using {model_name}")
except Exception as e:
    print(f"Error initializing Mistral model: {e}")
    try:
        model_name = "google/gemma-7b-it"
        print(f"Falling back to {model_name}...")
        query_generator = hf_pipeline(
            "text-generation",
            model=model_name,
            tokenizer=model_name,
            device=device,
            max_length=200,
            do_sample=True,
            temperature=0.7,
        )
        print(f"Successfully initialized LLM pipeline using {model_name}")
    except Exception as e:
        print(f"Error initializing Gemma model: {e}")
        try:
            model_name = "google/flan-t5-large"
            print(f"Falling back to {model_name}...")
            query_generator = hf_pipeline(
                "text2text-generation",
                model=model_name,
                tokenizer=model_name,
                device=device,
                max_length=150,
            )
            print(f"Successfully initialized LLM pipeline using {model_name}")
        except Exception as e:
            print(f"Error initializing all LLM models: {e}")
            query_generator = None


def rule_based_annotation_qd(query, documents):
    """
    Rule-based annotation for query-document pairs with index-based search.
    Args:
        query (str): The query string.
        documents (list): A list of documents.
    Returns:
        tuple: (positive_document, scores) - The annotated document with highest relevance score and metadata
    """
    query_lower = query.lower()
    all_scores = []
    scores = {}
    for i, doc in enumerate(documents):
        score = 0.0
        tf_idf_results = index_search(query_lower, inverted_index, idf, doc_norms)
        tf_idf_score = 0.0
        if tf_idf_results:
            for result_score, result_idx in tf_idf_results:
                if result_idx == i:
                    tf_idf_score = result_score
                    break

        numerical_score = numerical_index_search(query_lower, numerical_index, doc)
        score += (tf_idf_score) + (numerical_score * 0.5)
        scores[doc["id"]] = score
        all_scores.append(score)
    positive_document = max(documents, key=lambda x: scores.get(x["id"], 0))
    return positive_document


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

    def generate_company_specific_queries(self, num_queries=50):
        """
        Generate queries that specifically focus on company names and symbols.

        Args:
            num_queries: Number of company-specific queries to generate

        Returns:
            List of company-specific queries
        """
        company_queries = []

        selected_companies = (
            random.sample(document_objects, min(len(document_objects), num_queries))
            if len(document_objects) > 10
            else document_objects
        )

        for company in selected_companies:
            if len(company_queries) >= num_queries:
                break

            company_name = company.get("name", "")
            company_symbol = company.get("symbol", "")

            if not company_name or not company_symbol:
                continue

            company_identifier = random.choice(
                [
                    company_name,
                    company_symbol,
                    f"{company_name} ({company_symbol})",
                    company_symbol,
                ]
            )

            template = random.choice(COMPANY_QUERY_TEMPLATES)
            query = template.format(company=company_identifier)
            query = query.strip()
            if query and len(query.split()) <= 15:
                company_queries.append(query)

        return company_queries

    def generate_general_sector_queries(self, num_queries=50):
        """
        Generate queries that focus on sectors and general investment topics without specific company names.

        Args:
            num_queries: Number of general sector queries to generate

        Returns:
            List of general sector queries
        """
        sector_queries = []
        sectors = [
            "technology",
            "healthcare",
            "financial",
            "energy",
            "consumer",
            "industrial",
            "utilities",
            "real estate",
            "communication",
            "materials",
            "retail",
            "automotive",
            "pharmaceutical",
            "banking",
            "insurance",
            "media",
            "entertainment",
            "telecom",
            "semiconductor",
            "software",
            "hardware",
            "biotech",
            "fintech",
            "renewable energy",
            "oil and gas",
            "mining",
            "agriculture",
        ]

        for _ in range(num_queries):
            if len(sector_queries) >= num_queries:
                break

            sector = random.choice(sectors)
            template = random.choice(GENERAL_QUERY_TEMPLATES)

            query = template.format(sector=sector)
            query = query.strip()
            if query and len(query.split()) <= 15:
                sector_queries.append(query)

        return sector_queries

    def generate_search_queries(self, num_queries=100):
        """
        Generate synthetic search queries using patterns and company names.
        Uses LLM if available, otherwise falls back to simple pattern-based generation.

        This enhanced version balances between:
        - LLM-generated general queries (most common)
        - Sector-based template queries (second most common)
        - Company-specific template queries (limited to 10% or less)

        Args:
            num_queries: Number of queries to generate

        Returns:
            List of generated search queries
        """
        generated_queries = []
        company_specific_count = int(num_queries * 0.1)
        sector_based_count = int(num_queries * 0.4)
        general_count = num_queries - company_specific_count - sector_based_count
        company_queries = self.generate_company_specific_queries(company_specific_count)
        generated_queries.extend(company_queries)
        sector_queries = self.generate_general_sector_queries(sector_based_count)
        generated_queries.extend(sector_queries)
        batch_size = 5 if query_generator else 1
        num_batches = (general_count + batch_size - 1) // batch_size

        for batch in range(num_batches):
            if len(generated_queries) >= num_queries:
                break

            pattern = random.choice(patterns)

            prompt_template = (
                random.choice(prompts[:10])
                if len(prompts) >= 10
                else random.choice(prompts)
            )
            system_prompt = random.choice(SYSTEM_PROMPTS)
            formatted_prompt = prompt_template.format(pattern=pattern, company="")
            if query_generator:
                try:

                    full_prompt = (
                        f"{system_prompt}\n\n"
                        f"TASK: {formatted_prompt}\n\n"
                        f"IMPORTANT: Generate general investment queries that DON'T mention specific company names. "
                        f"Focus on sectors, trends, strategies, and market conditions instead. "
                        f"Make queries realistic, as if typed by a real investor looking for general information.\n\n"
                        f"QUERIES:"
                    )

                    result = query_generator(
                        full_prompt,
                        max_length=100,
                        do_sample=True,
                        temperature=0.8,
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
                    simple_query = f"{pattern.lower().replace('queries about ', '')}"
                    generated_queries.append(simple_query)
            else:
                simple_query = f"{pattern.lower().replace('queries about ', '')}"
                generated_queries.append(simple_query)

            if len(generated_queries) >= num_queries:
                generated_queries = generated_queries[:num_queries]
                break

        random.shuffle(generated_queries)
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

        selected_query = random.choice(self.search_queries)
        positive_document = rule_based_annotation_qd(
            selected_query, self.document_objects
        )

        return {
            "id": str(uuid.uuid4()),
            "query": selected_query,
            "positive_document": positive_document,
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
                    "document": item["positive_document"],
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
                if completed_simulations > 0:
                    print(
                        f"Progress: {(completed_simulations / len(futures)) * 100:.1f}% complete"
                    )

            except Exception as e:
                print(f"Error in thread: {e}")

    unique_pairs = {}
    for i in range(n_simulations):
        try:
            sim_file = os.path.join(simulations_dir, f"qd_dataset_sim_{i}.json")
            if os.path.exists(sim_file):
                with open(sim_file, "r") as f:
                    instances = json.load(f)
                    for instance in instances:

                        query = instance["query"]
                        doc_id = instance["document"].get("id", "unknown")
                        pair_key = f"{query}::{doc_id}"
                        if pair_key not in unique_pairs:
                            unique_pairs[pair_key] = instance
                    print(f"Processed {len(instances)} instances from simulation {i}")
        except Exception as e:
            print(f"Error reading simulation {i}: {e}")

    all_instances = []
    for idx, (_, instance) in enumerate(unique_pairs.items()):
        new_instance = {
            "id": idx,
            "query": instance["query"],
            "positive_document": instance["document"],
        }
        all_instances.append(new_instance)

    print(
        f"After removing duplicates, found {len(all_instances)} unique query-document pairs"
    )

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
    num_worker_threads = os.cpu_count()
    num_simulations = 25
    dataset_size_per_simulation = 800
    run(num_simulations, num_worker_threads, dataset_size_per_simulation)

if __name__ == "__main__":
    main()
