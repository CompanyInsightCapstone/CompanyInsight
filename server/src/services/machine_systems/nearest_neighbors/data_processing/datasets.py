import torch
from transformers import BertTokenizer
from tokenizer import Tokenizer


class Dataset(torch.utils.data.Dataset):
    def __init__(self, data, tokenizer_name="bert-base-uncased", max_length=128):
        self.data = data
        self.tokenizer = Tokenizer(tokenizer_name)
        self.max_length = max_length
        self.numerical_features_keys = [
            "close",
            "open",
            "high",
            "low",
            "volume",
            "simpleMovingAverage",
        ]

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        item = self.data[idx]
        query = item["query"]
        document_info = item["positive_document"]

        document_description = document_info.get("description", "")
        document_name = document_info.get("name", "")
        document_symbol = document_info.get("symbol", "")
        document_exchange = document_info.get("exchange", "")
        document_asset_type = document_info.get("assetType", "")

        document_text = f"{document_name} [SEP] {document_symbol} [SEP] {document_exchange} [SEP] {document_asset_type} [SEP] {document_description}"

        tokenized_query = self.tokenizer(
            query,
            padding="max_length",
            truncation=True,
            max_length=self.max_length,
            return_tensors="pt",
        )

        tokenized_document = self.tokenizer(
            document_text,
            padding="max_length",
            truncation=True,
            max_length=self.max_length,
            return_tensors="pt",
        )

        query_input_ids = tokenized_query["input_ids"].squeeze(0)
        query_attention_mask = tokenized_query["attention_mask"].squeeze(0)

        document_input_ids = tokenized_document["input_ids"].squeeze(0)
        document_attention_mask = tokenized_document["attention_mask"].squeeze(0)

        numerical_features = [
            document_info.get(key, 0.0) for key in self.numerical_features_keys
        ]
        numerical_features_tensor = torch.tensor(numerical_features, dtype=torch.float)

        return {
            "query_input_ids": query_input_ids,
            "query_attention_mask": query_attention_mask,
            "document_input_ids": document_input_ids,
            "document_attention_mask": document_attention_mask,
            "document_numerical_features": numerical_features_tensor,
        }
