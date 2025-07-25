import json
import os

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline as hf_pipeline
from typing import *


class QueryGeneration:
    def __init__(self, system_prompt: str):
        self.system_prompt = system_prompt
        self.language_model = hf_pipeline(
            task="text2text-generation",
            model="google/flan-t5-large",
            tokenizer="google/flan-t5-large",
            device=0 if torch.cuda.is_available() else -1,
            max_length=150,
            do_sample=True,
            temperature=0.7,
        )

    def generate(self, query_prompt: str) -> str:
        full_prompt = (
            f"{self.system_prompt}\n\n"
            f"TASK: {query_prompt}\n\n"
            f"Make queries realistic, as if typed by a real investor/user looking for general stock price/financial information\n\n"
        )
        query = self.language_model(
            full_prompt,
            max_length=100,
            do_sample=True,
            temperature=0.7,
            num_return_sequences=1,
            num_beams=4,
        )[0]["generated_text"]

        return query
