import torch
from transformers import BertTokenizer
from data_processing.tokenizer import Tokenizer


class TrainingDataset(torch.utils.data.Dataset):
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

    def _process_document(self, document_info):
        """Process a document into text and numerical features"""
        document_description = document_info.get("description", "")
        document_name = document_info.get("name", "")
        document_symbol = document_info.get("symbol", "")
        document_exchange = document_info.get("exchange", "")
        document_asset_type = document_info.get("assetType", "")

        document_text = f"{document_name} [SEP] {document_symbol} [SEP] {document_exchange} [SEP] {document_asset_type} [SEP] {document_description}"

        tokenized_document = self.tokenizer(
            document_text
        )

        document_input_ids = tokenized_document["input_ids"].squeeze(0)
        document_attention_mask = tokenized_document["attention_mask"].squeeze(0)

        numerical_features = [
            document_info.get(key, 0.0) for key in self.numerical_features_keys
        ]
        numerical_features_tensor = torch.tensor(numerical_features, dtype=torch.float)

        return document_input_ids, document_attention_mask, numerical_features_tensor

    def __getitem__(self, idx):
        item = self.data[idx]
        query = item["query"]
        positive_document = item["positive_document"]
        negative_document = item["negative_document"]

        query_tokenized = self.tokenizer(
            query
        )
        query_input_ids = query_tokenized["input_ids"].squeeze(0)
        query_attention_mask = query_tokenized["attention_mask"].squeeze(0)

        (
            positive_document_input_ids,
            positive_document_attention_mask,
            positive_numerical_features,
        ) = self._process_document(positive_document)
        (
            negative_document_input_ids,
            negative_document_attention_mask,
            negative_numerical_features,
        ) = self._process_document(negative_document)

        return {
            "query_input_ids": query_input_ids,
            "query_attention_mask": query_attention_mask,
            "positive_document_input_ids": positive_document_input_ids,
            "positive_document_attention_mask": positive_document_attention_mask,
            "positive_numerical_features": positive_numerical_features,
            "negative_document_input_ids": negative_document_input_ids,
            "negative_document_attention_mask": negative_document_attention_mask,
            "negative_numerical_features": negative_numerical_features,
        }
