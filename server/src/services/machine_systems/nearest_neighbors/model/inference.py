import torch
from data_processing.tokenizer import Tokenizer
from document_encoder import DocumentEncoder
from query_encoder import QueryEncoder

tokenizer = Tokenizer()
query_path = "parameters/epoch_5_query_encoder.pt"
document_path = "parameters/epoch_5_document_encoder.pt"
query_encoder = QueryEncoder()
document_encoder = DocumentEncoder()
query_encoder.load_state_dict(torch.load(query_path))
document_encoder.load_state_dict(torch.load(document_path))


def compute_document_embedding(document_raw):
    document = tokenizer(document_raw)
    document_embedding = document_encoder(document)
    return document_embedding


def compute_query_embedding(query_raw):
    query = tokenizer(query_raw)
    query_embedding = query_encoder(query)
    return query_embedding
