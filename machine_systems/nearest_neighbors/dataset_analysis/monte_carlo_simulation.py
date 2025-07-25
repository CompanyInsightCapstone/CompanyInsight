import gc
import json
import multiprocessing
import os
import random
import sys
import threading
import time
import uuid
from collections import Counter, defaultdict
from concurrent.futures import as_completed, ProcessPoolExecutor, ThreadPoolExecutor
from datetime import datetime

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))

import numpy as np
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline as hf_pipeline

from ...models.database import Database
from .scoring import (
    build_inverted_index,
    build_numerical_index,
    compute_doc_norms,
    compute_idf,
    index_search,
    numerical_index_search,
)
from .utils import (
    COMPANY_QUERY_TEMPLATES,
    config,
    GENERAL_QUERY_TEMPLATES,
    load_company_documents,
    patterns,
    prompts,
    SYSTEM_PROMPTS,
)

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

document_objects = load_company_documents()
n = len(document_objects)
inverted_index = build_inverted_index(document_objects)
idf = compute_idf(inverted_index, n)
numerical_index = build_numerical_index(document_objects)
doc_norms = compute_doc_norms(inverted_index, idf, n)


try:
    model_name = "google/flan-t5-large"
    device = 0 if torch.cuda.is_available() else -1
    query_generator = hf_pipeline(
        task="text2text-generation",
        model=model_name,
        tokenizer=model_name,
        device=device,
        max_length=150,
        do_sample=True,
        temperature=0.7,
    )
except Exception as e:
    print(f"Error initializing LLM models: {e}")
    query_generator = None


def rule_based_annotation_qd(query, documents):
    """
    Rule-based annotation for query-document pairs with index-based search.
    Args:
        query (str): The query string.
        documents (list): A list of documents.
    Returns:
        tuple: (positive_document, scores) - The annotated document randomly selected from top 3 highest relevance scores
    """
    query_lower = query.lower()
    scored_docs = []
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
        score += (tf_idf_score) * +numerical_score

        company_name = doc.get("name", "").lower()
        company_symbol = doc.get("symbol", "").lower()

        if company_name and query_lower.startswith(company_name):
            score += 2.0
        elif company_symbol and query_lower.startswith(company_symbol):
            score += 1.5
        elif company_name and company_name in query_lower.split()[:3]:
            score += 1.0
        elif company_symbol and company_symbol in query_lower.split()[:3]:
            score += 0.8

        scored_docs.append((doc, score))

    scored_docs.sort(key=lambda x: x[1], reverse=True)

    selected_doc = scored_docs[0][0]
    return selected_doc


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


def process_function(chunk_index, chunk_size):
    """
    Function executed by each process to generate a chunk of the synthetic dataset.

    Args:
        chunk_index: Index of this chunk
        chunk_size: Number of instances to generate in this chunk

    Returns:
        Generated dataset chunk
    """
    print(
        f"Process {os.getpid()} initializing for chunk {chunk_index} with size {chunk_size}"
    )

    process_query_generator = None
    try:
        model_name = "google/flan-t5-large"
        device = "cpu"
        if torch.cuda.is_available():
            device = 0
            print(f"Device set to use cuda")
        else:
            print(f"Device set to use cpu")

        print(f"Process {os.getpid()} initializing LLM pipeline using {model_name}...")
        process_query_generator = hf_pipeline(
            task="text2text-generation",
            model=model_name,
            tokenizer=model_name,
            device=device,
            max_length=150,
            do_sample=True,
            temperature=0.7,
        )
    except Exception as e:
        print(f"Process {os.getpid()} error initializing LLM: {e}")

    print(f"Process {os.getpid()} starting chunk {chunk_index}")
    start_time = time.time()

    generator = SyntheticDatasetGenerator(
        dataset_size=chunk_size, iteration_number=chunk_index
    )
    if process_query_generator:
        generator.query_generator = process_query_generator
    generator.generate_search_queries(num_queries=chunk_size // 2)
    dataset = []
    for i in range(chunk_size):
        try:
            instance = generator.make_data_instance()
            if instance:
                dataset.append(instance)
            if i > 0 and i % 100 == 0:
                print(
                    f"Process {os.getpid()}, Chunk {chunk_index}: Generated {i}/{chunk_size} instances"
                )
        except Exception as e:
            print(f"Error generating instance {i} in chunk {chunk_index}: {e}")

    os.makedirs(simulations_dir, exist_ok=True)
    with open(
        os.path.join(simulations_dir, f"qd_dataset_chunk_{chunk_index}.json"), "w"
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

    print(
        f"Process {os.getpid()} completed chunk {chunk_index} in {time.time() - start_time:.2f} seconds"
    )

    del dataset
    del generator
    gc.collect()
    return serializable_dataset


def run(total_dataset_size=10000, num_workers=10, chunk_size=1000):
    """
    Run the dataset generation process using multiple processes.

    Args:
        total_dataset_size: Total number of unique instances to generate
        num_workers: Maximum number of worker processes to use
        chunk_size: Size of each chunk processed by a worker

    Returns:
        None
    """
    print(
        f"Starting dataset generation for {total_dataset_size} unique instances using {num_workers} processes"
    )

    start_time = time.time()
    unique_pairs = set()
    all_instances = []
    chunk_index = 0

    while len(unique_pairs) < total_dataset_size:
        remaining = total_dataset_size - len(unique_pairs)
        current_batch_size = min(remaining * 2, num_workers * chunk_size)
        current_num_chunks = max(1, (current_batch_size + chunk_size - 1) // chunk_size)
        current_num_workers = min(num_workers, current_num_chunks)

        print(
            f"Need {remaining} more unique pairs. Generating batch of {current_batch_size} instances with {current_num_workers} workers"
        )

        with ProcessPoolExecutor(max_workers=current_num_workers) as executor:
            futures = [
                executor.submit(process_function, chunk_index + i, chunk_size)
                for i in range(current_num_chunks)
            ]

            completed_chunks = 0
            for future in as_completed(futures):
                try:
                    results = future.result()
                    completed_chunks += 1
                    print(
                        f"Batch progress: {(completed_chunks / len(futures)) * 100:.1f}% complete"
                    )
                except Exception as e:
                    print(f"Error in process: {e}")

        new_pairs_found = 0
        for i in range(current_num_chunks):
            try:
                chunk_file = os.path.join(
                    simulations_dir, f"qd_dataset_chunk_{chunk_index + i}.json"
                )
                if os.path.exists(chunk_file):
                    with open(chunk_file, "r") as f:
                        instances = json.load(f)
                        print(
                            f"Processing {len(instances)} instances from chunk {chunk_index + i}"
                        )

                        for instance in instances:
                            query = instance["query"]
                            document = instance["document"]
                            doc_id = (
                                document.get("id", "")
                                if isinstance(document, dict)
                                else ""
                            )
                            pair_key = (query, doc_id)

                            if pair_key not in unique_pairs:
                                unique_pairs.add(pair_key)
                                new_instance = {
                                    "query": query,
                                    "positive_document": document,
                                }
                                all_instances.append(new_instance)
                                new_pairs_found += 1

                                if len(unique_pairs) % 100 == 0:
                                    print(
                                        f"Found {len(unique_pairs)}/{total_dataset_size} unique pairs"
                                    )

                                if len(unique_pairs) >= total_dataset_size:
                                    break

                    try:
                        os.remove(chunk_file)
                    except Exception as e:
                        print(f"Failed to remove chunk file {chunk_file}: {e}")

                if len(unique_pairs) >= total_dataset_size:
                    break
            except Exception as e:
                print(f"Error reading chunk {chunk_index + i}: {e}")

        print(f"Found {new_pairs_found} new unique pairs in this batch")
        chunk_index += current_num_chunks

        if new_pairs_found == 0:
            print(
                "Warning: No new unique pairs found in this batch. Adjusting generation parameters..."
            )
            time.sleep(1)

    final_dataset = all_instances[:total_dataset_size]
    aggregated_file = os.path.join(dataset_dir, "deduplicated_qd_dataset.json")
    with open(aggregated_file, "w") as f:
        json.dump(final_dataset, f, indent=2)

    training_file = os.path.join(dataset_dir, "training_qd_dataset.json")
    training_format = [
        {"query": instance["query"], "document": instance["positive_document"]}
        for instance in final_dataset
    ]

    with open(training_file, "w") as f:
        json.dump(training_format, f, indent=2)

    print(
        f"Wrote deduplicated dataset with {len(final_dataset)} instances to {aggregated_file}"
    )

    elapsed_time = time.time() - start_time
    hours, remainder = divmod(elapsed_time, 3600)
    minutes, seconds = divmod(remainder, 60)
    print(
        f"Dataset generation completed in {int(hours)}h {int(minutes)}m {seconds:.2f}s"
    )


def main():
    """
    Main entry point for the Monte Carlo simulation.
    Parses command line arguments if provided, otherwise uses defaults.
    """
    import argparse

    parser = argparse.ArgumentParser(
        description="Run Monte Carlo simulation for dataset generation"
    )
    parser.add_argument(
        "--size", type=int, default=10000, help="Total dataset size to generate"
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=max(1, os.cpu_count() // 2),
        help="Number of worker processes to use",
    )
    parser.add_argument(
        "--chunk",
        type=int,
        default=1000,
        help="Size of each chunk processed by a worker",
    )

    args = parser.parse_args()

    print(
        f"Starting simulation with dataset_size={args.size}, workers={args.workers}, chunk_size={args.chunk}"
    )
    run(total_dataset_size=args.size, num_workers=args.workers, chunk_size=args.chunk)


if __name__ == "__main__":
    main()
