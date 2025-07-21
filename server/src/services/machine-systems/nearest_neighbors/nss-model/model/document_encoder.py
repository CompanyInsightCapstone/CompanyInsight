import torch
import torch.nn as nn
from nss_model.model.components.transformer import Transformer
from nss_model.model.components.ffnn import FFNN

class DocumentEncoder(nn.Module):
    def __init__(self, bert_model_name='bert-base-uncased', numerical_dim=6, combined_dim=768, hidden_dim=128):
        super(DocumentEncoder, self).__init__()
        self.transformer = Transformer(bert_model_name)
        self.ffnn = FFNN(input_dim=numerical_dim, hidden_dim=hidden_dim, output_dim=hidden_dim)
        self.projection = nn.Linear(combined_dim + hidden_dim, combined_dim)

    def forward(self, inputs):
        transformer_input = {
            "input_ids": inputs['document_input_ids'],
            "attention_mask": inputs['document_attention_mask']
        }
        document_textual = self.transformer(transformer_input)
        document_numerical = self.ffnn(inputs['document_numerical_features'])

        combined = torch.cat([document_textual, document_numerical], dim=-1)
        document_embedding = self.projection(combined)

        return document_embedding
