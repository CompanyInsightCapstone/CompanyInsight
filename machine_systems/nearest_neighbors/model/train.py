import torch
import torch.nn.functional as F
from torch.optim import AdamW
from tqdm import tqdm
import os

class Trainer:
    def __init__(self, query_encoder, document_encoder, device='cuda', temperature=1.0, lr=2e-5, save_dir='checkpoints'):
        self.query_encoder = query_encoder.to(device)
        self.document_encoder = document_encoder.to(device)
        self.device = device
        self.temperature = temperature
        self.save_dir = save_dir
        os.makedirs(save_dir, exist_ok=True)
        self.optimizer = AdamW(
            list(self.query_encoder.parameters()) + list(self.document_encoder.parameters()),
            lr=lr
        )
        
    def computeLoss(self, query_embeds, doc_embeds):
        logits = torch.matmul(query_embeds, doc_embeds.T)
        logits /= self.temperature
        labels = torch.arange(logits.size(0)).to(self.device)
        loss = F.cross_entropy(logits, labels)
        return loss, logits

    def train(self, dataloader, num_epochs=1):
        epoch_losses = []
        for epoch in range(1, num_epochs + 1):
            self.query_encoder.train()
            self.document_encoder.train()
            total_loss = 0
            for batch_data in tqdm(dataloader, desc=f"Epoch: {epoch}"):
                for k in batch_data.keys():
                    batch_data[k] = batch_data[k].to(self.device)
                query_emb = self.query_encoder(batch_data)
                doc_emb = self.document_encoder(batch_data)
                query_emb = F.normalize(query_emb, p=2, dim=1)
                doc_emb = F.normalize(doc_emb, p=2, dim=1)
                loss, _ = self.computeLoss(query_emb, doc_emb)
                self.optimizer.zero_grad()
                loss.backward()
                self.optimizer.step()
                total_loss += loss.item()
            avg_loss = total_loss / len(dataloader)
            self.save(
                query_path=os.path.join(self.save_dir, f"epoch_{epoch}_query_encoder.pt"),
                document_path=os.path.join(self.save_dir, f"epoch_{epoch}_document_encoder.pt")
            )
            epoch_losses.append(avg_loss)
        return epoch_losses

    def evaluate(self, dataloader):
      self.query_encoder.eval()
      self.document_encoder.eval()
      all_query_embs = []
      all_doc_embs = []
      with torch.no_grad():
          for batch_data in tqdm(dataloader, desc="Evaluating"):
              for k in batch_data:
                  batch_data[k] = batch_data[k].to(self.device)
              q_emb = F.normalize(self.query_encoder(batch_data), p=2, dim=1)
              d_emb = F.normalize(self.document_encoder(batch_data), p=2, dim=1)
              all_query_embs.append(q_emb.cpu())
              all_doc_embs.append(d_emb.cpu())
      all_query_embs = torch.cat(all_query_embs, dim=0)
      all_doc_embs = torch.cat(all_doc_embs, dim=0)
      sims = torch.matmul(all_query_embs, all_doc_embs.T)
      return sims

    def save(self, query_path, document_path):
        torch.save(self.query_encoder.state_dict(), query_path)
        torch.save(self.document_encoder.state_dict(), document_path)

    def load(self, query_path, document_path):
        self.query_encoder.load_state_dict(torch.load(query_path))
        self.document_encoder.load_state_dict(torch.load(document_path))
