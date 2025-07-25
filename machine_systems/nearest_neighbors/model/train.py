import torch
import torch.nn.functional as F
from torch.optim import AdamW
from tqdm import tqdm
import os

class Trainer:
    def __init__(self, query_encoder, document_encoder, device='cuda', temperature=1.0, margin=0.3, lr=2e-5, save_dir='checkpoints'):
        self.query_encoder = query_encoder.to(device)
        self.document_encoder = document_encoder.to(device)
        self.device = device
        self.temperature = temperature
        self.margin = margin
        self.save_dir = save_dir
        os.makedirs(save_dir, exist_ok=True)
        self.optimizer = AdamW(
            list(self.query_encoder.parameters()) + list(self.document_encoder.parameters()),
            lr=lr
        )

    def compute_triplet_loss(self, query_embeds, pos_doc_embeds, neg_doc_embeds):
        pos_sim = torch.sum(query_embeds * pos_doc_embeds, dim=1)
        neg_sim = torch.sum(query_embeds * neg_doc_embeds, dim=1)
        loss = F.relu(self.margin - pos_sim + neg_sim).mean()
        return loss, (pos_sim, neg_sim)

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
                pos_batch = {
                    "document_input_ids": batch_data["positive_document_input_ids"],
                    "document_attention_mask": batch_data["positive_document_attention_mask"],
                    "document_numerical_features": batch_data["positive_numerical_features"]
                }
                neg_batch = {
                    "document_input_ids": batch_data["negative_document_input_ids"],
                    "document_attention_mask": batch_data["negative_document_attention_mask"],
                    "document_numerical_features": batch_data["negative_numerical_features"]
                }
                pos_doc_emb = self.document_encoder(pos_batch)
                neg_doc_emb = self.document_encoder(neg_batch)
                loss, _ = self.compute_triplet_loss(query_emb, pos_doc_emb, neg_doc_emb)
                self.optimizer.zero_grad()
                loss.backward()
                self.optimizer.step()
                total_loss += loss.item()
            avg_loss = total_loss / len(dataloader)
            print(f"Epoch {epoch}, Average Loss: {avg_loss:.4f}")
            self.save(
                query_path=os.path.join(self.save_dir, f"epoch_{epoch}_query_encoder.pt"),
                document_path=os.path.join(self.save_dir, f"epoch_{epoch}_document_encoder.pt")
            )
            epoch_losses.append(avg_loss)
        return epoch_losses

    def calculate_metrics(self, predictions, labels, threshold=0.5):
        binary_preds = (predictions > threshold).float()
        true_positives = (binary_preds * labels).sum().item()
        false_positives = (binary_preds * (1 - labels)).sum().item()
        false_negatives = ((1 - binary_preds) * labels).sum().item()
        true_negatives = ((1 - binary_preds) * (1 - labels)).sum().item()
        accuracy = (true_positives + true_negatives) / (true_positives + true_negatives + false_positives + false_negatives)
        precision = true_positives / (true_positives + false_positives) if (true_positives + false_positives) > 0 else 0
        recall = true_positives / (true_positives + false_negatives) if (true_positives + false_negatives) > 0 else 0
        f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0

        return {
            "precision": precision,
            "recall": recall,
            "f1": f1,
            "accuracy": accuracy
        }

    def evaluate(self, dataloader):
        """
        Evaluate the model by comparing positive and negative document similarities.
        This method focuses on whether positive documents have higher similarity scores
        than negative documents for each query.
        """
        self.query_encoder.eval()
        self.document_encoder.eval()
        all_query_embs = []
        all_pos_doc_embs = []
        all_neg_doc_embs = []

        with torch.no_grad():
            for batch_data in tqdm(dataloader, desc="Evaluating"):
                for k in batch_data.keys():
                    batch_data[k] = batch_data[k].to(self.device)
                q_emb = self.query_encoder(batch_data)
                all_query_embs.append(q_emb.cpu())
                pos_batch = {
                    "document_input_ids": batch_data["positive_document_input_ids"],
                    "document_attention_mask": batch_data["positive_document_attention_mask"],
                    "document_numerical_features": batch_data["positive_numerical_features"]
                }
                pos_d_emb = self.document_encoder(pos_batch)
                all_pos_doc_embs.append(pos_d_emb.cpu())
                neg_batch = {
                    "document_input_ids": batch_data["negative_document_input_ids"],
                    "document_attention_mask": batch_data["negative_document_attention_mask"],
                    "document_numerical_features": batch_data["negative_numerical_features"]
                }
                neg_d_emb = self.document_encoder(neg_batch)
                all_neg_doc_embs.append(neg_d_emb.cpu())
        all_query_embs = torch.cat(all_query_embs, dim=0)
        all_pos_doc_embs = torch.cat(all_pos_doc_embs, dim=0)
        all_neg_doc_embs = torch.cat(all_neg_doc_embs, dim=0)
        pos_sims = torch.sum(all_query_embs * all_pos_doc_embs, dim=1)
        neg_sims = torch.sum(all_query_embs * all_neg_doc_embs, dim=1)
        triplet_accuracy = (pos_sims > neg_sims).float().mean().item()
        sim_diffs = pos_sims - neg_sims
        avg_sim_diff = sim_diffs.mean().item()
        median_sim_diff = sim_diffs.median().item()
        min_sim_diff = sim_diffs.min().item()
        max_sim_diff = sim_diffs.max().item()
        positive_diffs = (sim_diffs > 0).sum().item()
        zero_diffs = (sim_diffs == 0).sum().item()
        negative_diffs = (sim_diffs < 0).sum().item()

        print(f"Evaluation results:")
        print(f"Average positive similarity: {pos_sims.mean().item():.4f}")
        print(f"Average negative similarity: {neg_sims.mean().item():.4f}")
        print(f"Triplet accuracy (pos_sim > neg_sim): {triplet_accuracy:.4f}")
        print(f"Similarity difference statistics:")
        print(f"  Average difference: {avg_sim_diff:.4f}")
        print(f"  Median difference: {median_sim_diff:.4f}")
        print(f"  Min difference: {min_sim_diff:.4f}")
        print(f"  Max difference: {max_sim_diff:.4f}")
        print(f"  Positive differences: {positive_diffs} ({positive_diffs/len(sim_diffs):.2%})")
        print(f"  Zero differences: {zero_diffs} ({zero_diffs/len(sim_diffs):.2%})")
        print(f"  Negative differences: {negative_diffs} ({negative_diffs/len(sim_diffs):.2%})")

        return {
            "pos_sims": pos_sims,
            "neg_sims": neg_sims,
            "sim_diffs": sim_diffs,
            "triplet_accuracy": triplet_accuracy,
            "avg_sim_diff": avg_sim_diff,
            "positive_diffs_percentage": positive_diffs/len(sim_diffs)
        }

    def save(self, query_path, document_path):
        torch.save(self.query_encoder.state_dict(), query_path)
        torch.save(self.document_encoder.state_dict(), document_path)

    def load(self, query_path, document_path):
        self.query_encoder.load_state_dict(torch.load(query_path))
        self.document_encoder.load_state_dict(torch.load(document_path))
