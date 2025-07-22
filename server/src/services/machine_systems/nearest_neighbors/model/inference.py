import torch
from ..data_processing.tokenizer import Tokenizer
from .document_encoder import DocumentEncoder
from .query_encoder import QueryEncoder
import os

tokenizer = Tokenizer()
query_path = "parameters/epoch_5_query_encoder.pt"
document_path = "parameters/epoch_5_document_encoder.pt"
query_path = os.path.join(os.path.dirname(__file__), query_path)
document_path = os.path.join(os.path.dirname(__file__), document_path)

query_encoder = QueryEncoder()
document_encoder = DocumentEncoder()
query_encoder.load_state_dict(torch.load(query_path, map_location=torch.device('cpu')))
document_encoder.load_state_dict(torch.load(document_path, map_location=torch.device('cpu')))


def compute_document_embedding(company):
    name = company.get("name", "")
    symbol = company.get("symbol", "")
    description = company.get("description", "")
    exchange = company.get("exchange", "")
    asset_type = company.get("assetType", "")
    document_string =  f"{name} [SEP] {symbol} [SEP] {exchange} [SEP] {asset_type} [SEP] {description}"
    document = tokenizer(document_string)

    document_input_ids = document["input_ids"]
    document_attention_mask = document["attention_mask"] 

    numerical_features = [
            company.get(key, 0.0) for key in [
            "close",
            "open",
            "high",
            "low",
            "volume",
            "simpleMovingAverage",
        ]
    ]
    numerical_features_tensor = torch.tensor([numerical_features], dtype=torch.float)  # Add batch dimension
    encoder_input = {
        "document_input_ids": document_input_ids,
        "document_attention_mask": document_attention_mask,
        "document_numerical_features": numerical_features_tensor,
    }
    document_embedding = document_encoder(encoder_input)
    return document_embedding.detach().cpu().numpy().tolist()[0]

def compute_query_embedding(query_raw):
    query = tokenizer(query_raw)
    query_input = {
        "query_input_ids": query["input_ids"],
        "query_attention_mask": query["attention_mask"]
    }
    query_embedding = query_encoder(query_input)
    return query_embedding.detach().cpu().numpy().tolist()[0]
