import json
import random
import torch
from datasets import Dataset

class Dataloader:
    def __init__(self, batch_size, dataset_path, test_size=0.2):
        self.batch_size = batch_size
        with open(dataset_path, "r") as f:
            dataset_data = json.load(f)

        random.shuffle(dataset_data)
        split_index = int(len(dataset_data) * (1 - test_size))

        train_data = dataset_data[:split_index]
        test_data = dataset_data[split_index:]

        self.train_dataset = Dataset(train_data)
        self.test_dataset = Dataset(test_data)

        self.train_dataloader = torch.utils.data.DataLoader(
            self.train_dataset,
            batch_size=self.batch_size,
            shuffle=True,
        )

        self.test_dataloader = torch.utils.data.DataLoader(
            self.test_dataset,
            batch_size=self.batch_size,
            shuffle=False,
        )

        print(
            f"Dataset split into {len(self.train_dataset)} training and {len(self.test_dataset)} testing samples."
        )

    def get_train_dataloader(self):
        return self.train_dataloader

    def get_test_dataloader(self):
        return self.test_dataloader
