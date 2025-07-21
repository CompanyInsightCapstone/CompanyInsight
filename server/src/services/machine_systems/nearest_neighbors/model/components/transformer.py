import torch
import torch.nn as nn
from transformers import BertModel, BertConfig, BertTokenizer

class Transformer(nn.Module):
    def __init__(self, bert_model_name='bert-base-uncased'):
        super(Transformer, self).__init__()
        self.config = BertConfig.from_pretrained(bert_model_name)
        self.bert = BertModel.from_pretrained(bert_model_name, config=self.config)

    def forward(self, x):
        raw_outputs = self.bert(**x)
        sequence_outputs = raw_outputs.last_hidden_state
        text_embeddings = sequence_outputs[:,0,:]
        return text_embeddings
