import torch
import torch.nn as nn
from nss_model.model.components.transformer import Transformer
from nss_model.model.components.ffnn import FFNN

class QueryEncoder(nn.Module):
    def __init__(self, bert_model_name='bert-base-uncased'):
        super(QueryEncoder, self).__init__()
        self.transformer = Transformer(bert_model_name)

    def forward(self, inputs):
        transformer_input = {
            "input_ids": inputs['query_input_ids'],
            "attention_mask": inputs['query_attention_mask']
        }
        query_embedding = self.transformer(transformer_input) 
        return query_embedding
