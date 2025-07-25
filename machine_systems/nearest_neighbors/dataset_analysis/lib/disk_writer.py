import json
import multiprocessing as mp
import os
import time
import threading
from typing import Dict, List, Any, Set
from fuzzywuzzy import fuzz

# Post-invariant of this overall data generation process is that:
# For all queries, only 1 query-document instance must exist in the finalized dataset.
# Fuzzy similarity queries are ignored, this will deal with situations where an LLM generates two almost identical queries save for punctuation or some wording differences.
# Queries can only appear once in the entire dataset, while documents can appear multiple times.


class DiskWriter:
    def __init__(self, buffer, file_name, batch_size=8):
        self.buffer = buffer
        self.file_name = file_name
        self.batch_size = batch_size
        self.similarity_threshold = 90 
        self.query_set = set()
        self.current_batch = list()
        self.total_processed = 0
        self.total_duplicates = 0
        self.lock = threading.Lock()
        self.stop_event = mp.Event()
        os.makedirs(os.path.dirname(self.file_name), exist_ok=True)
        print(f"DiskWriter initialized with file path: {os.path.abspath(file_name)}")
        if not os.path.exists(file_name):
            with open(file_name, "w") as file:
                json.dump([], file)
            print(f"Created new output file: {file_name}")

    def write_batch_to_disk(self):
        if not self.current_batch:
            return
        print(f"Processing batch of {len(self.current_batch)} items")
        try:
            valid_entries = list(filter(self.invariant_checker_fn, self.current_batch))
            print(f"Found {len(valid_entries)} valid entries in batch")
            if not valid_entries:
                self.current_batch = []
                return
            with self.lock:
                try:
                    with open(self.file_name, "r") as file:
                        try:
                            data = json.load(file)
                        except json.JSONDecodeError:
                            data = []
                            print("Empty or invalid JSON file, starting with empty data")
                except Exception as e:
                    print(f"Error reading file: {e}, starting with empty data")
                    data = []
                data.extend(valid_entries)
                with open(self.file_name, "w") as file:
                    json.dump(data, file, indent=2)
                self.total_processed += len(valid_entries)
                print(f"Wrote {len(valid_entries)} entries to disk. Total: {self.total_processed}")
        except Exception as e:
            print(f"Error writing batch to disk: {e}")

        self.current_batch = []

    def invariant_checker_fn(self, entry):
        query = entry.get("query", "")
        positive_document = entry.get("positive_document", None)
        negative_document = entry.get("negative_document", None)
        if not query or not positive_document or not negative_document:
            self.total_duplicates += 1
            return False
        if query in self.query_set:
            self.total_duplicates += 1
            return False
        sample_size = min(20, len(self.query_set))
        if sample_size > 0:
            sample = list(self.query_set)[-sample_size:]
            for existing_query in sample:
                if fuzz.token_sort_ratio(query, existing_query) > self.similarity_threshold:
                    self.total_duplicates += 1
                    return False
        if isinstance(positive_document, dict) and "data" in positive_document:
            positive_document = positive_document.get("data", {})
        if isinstance(negative_document, dict) and "data" in negative_document:
            negative_document = negative_document.get("data", {})
        pos_id = positive_document.get("id", None) if isinstance(positive_document, dict) else None
        neg_id = negative_document.get("id", None) if isinstance(negative_document, dict) else None
        if pos_id is None or neg_id is None:
            self.query_set.add(query)
            return True
        if pos_id == neg_id:
            self.total_duplicates += 1
            return False
        self.query_set.add(query)
        return True

    def process_buffer(self):
        print("Starting to process buffer")
        while (
            not (self.buffer.is_done() and self.buffer.empty())
            and not self.stop_event.is_set()
        ):
            item = self.buffer.get()
            if item:
                print(f"Got item from buffer: {str(item)[:50]}...")
                self.current_batch.append(item)
                if len(self.current_batch) >= self.batch_size:
                    print(f"Batch size reached ({self.batch_size}), writing to disk")
                    self.write_batch_to_disk()
            else:
                if self.current_batch:
                    print(f"No new items, writing current batch of {len(self.current_batch)} items")
                    self.write_batch_to_disk()
                time.sleep(0.1)
        if self.current_batch:
            print(f"Processing remaining {len(self.current_batch)} items")
            self.write_batch_to_disk()

    def run(self):
        try:
            print(f"DiskWriter started for {self.file_name}")
            self.process_buffer()
            print(
                f"DiskWriter finished. Processed {self.total_processed} entries, rejected {self.total_duplicates} duplicates."
            )
        except Exception as e:
            print(f"Error in DiskWriter: {e}")
        finally:
            if self.current_batch:
                self.write_batch_to_disk()

    def stop(self):
        """Signal the process to stop."""
        self.stop_event.set()
