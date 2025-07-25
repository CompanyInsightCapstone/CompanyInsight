import json
import multiprocessing as mp
import os
import time

from fuzzywuzzy import fuzz, process

# Post-invariant of this overall data generation process is that:
# For all queries, only 1 query-document instance must exist in the finalized dataset.
# Fuzzy similarity queries are ignored, this will deal with situations where an LLM generates two almost identical queries save for punctuation or some wording differences.
# Queries can only appear once in the entire dataset, while documents can appear multiple times.


class DiskWriter:
    """
    This class is for a process that will write buffer results to disk (file), in batches.
    It'll be submitted to ProcessPoolExecutor in a larger pipeline.
    """

    def __init__(self, buffer, file_name, batch_size=100):
        self.buffer = buffer
        self.file_name = file_name
        self.batch_size = batch_size
        self.similarity_threshold = 95
        self.query_set = set()
        self.current_batch = list()
        self.total_processed = 0
        self.total_duplicates = 0
        self.stop_event = mp.Event()
        os.makedirs(os.path.dirname(os.path.abspath(file_name)), exist_ok=True)
        if not os.path.exists(file_name):
            with open(file_name, "w") as file:
                json.dump([], file)

    def write_batch_to_disk(self):
        """Write the current batch to disk after checking invariants."""
        if not self.current_batch:
            return
        try:
            with open(self.file_name, "r") as file:
                try:
                    data = json.load(file)
                except json.JSONDecodeError:
                    data = []
            valid_entries = filter(self.invariant_checker_fn, self.current_batch)
            count = 0
            for entry in valid_entries:
                data.append(entry)
                count += 1
            with open(self.file_name, "w") as file:
                json.dump(data, file, indent=4)
            self.total_processed += count
        except Exception as e:
            print(f"Error writing batch to disk: {e}")
        self.current_batch = []

    def invariant_checker_fn(self, entry):
        query = entry.get("query", "")
        for existing_query in self.query_set:
            if (
                fuzz.token_sort_ratio(query, existing_query) > self.similarity_threshold
                or existing_query == query
            ):
                self.total_duplicates += 1
                return False
        positive_document = entry.get("positive_document", None)
        negative_document = entry.get("negative_document", None)
        pos_id = positive_document.get("id", None)
        neg_id = negative_document.get("id", None)
        if pos_id == neg_id:
            self.total_duplicates += 1
            return False
        self.query_set.add(query)
        return True

    def process_buffer(self):
        while (
            not (self.buffer.is_done() and self.buffer.empty())
            and not self.stop_event.is_set()
        ):
            item = self.buffer.get()
            if item:
                self.current_batch.append(item)
                if len(self.current_batch) >= self.batch_size:
                    self.write_batch_to_disk()
            else:
                time.sleep(0.1)

        if self.current_batch:
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
