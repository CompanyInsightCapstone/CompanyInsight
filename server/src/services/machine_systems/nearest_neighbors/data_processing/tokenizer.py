from transformers import BertTokenizer

class Tokenizer:
    def __init__(self, tokenizer_name='bert-base-uncased'):
        self.tokenizer = BertTokenizer.from_pretrained(tokenizer_name)
        self.max_length = 128

    def __call__(self, text):
        return self.tokenizer(text, padding='max_length', truncation=True, max_length=self.max_length, return_tensors = 'pt')
