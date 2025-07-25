import torch
import torch.nn as nn
import torch.nn.functional as F
from .components.transformer import Transformer
from .components.ffnn import FFNN

class QueryEncoder(nn.Module):
    def __init__(self, bert_model_name='bert-base-uncased', output_dim=768):
        super(QueryEncoder, self).__init__()
        self.transformer = Transformer(bert_model_name)
        self.projection = nn.Linear(768, output_dim)

    def forward(self, inputs):
        transformer_input = {
            "input_ids": inputs['query_input_ids'],
            "attention_mask": inputs['query_attention_mask']
        }
        transformer_output = self.transformer(transformer_input)
        query_embedding = self.projection(transformer_output)
        query_embedding = F.normalize(query_embedding, p=2, dim=1)
        return query_embedding
