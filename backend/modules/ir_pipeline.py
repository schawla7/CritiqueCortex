# modules/ir_pipeline.py

import faiss
import numpy as np
from transformers import AutoTokenizer, AutoModel
from .interactive_query import interactive_query

class ReviewIndexer:
    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        # load a lightweight sentence‑transformer
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model     = AutoModel.from_pretrained(model_name)
        self.index     = None

    def embed_texts(self, texts: list[str]) -> np.ndarray:
        inputs = self.tokenizer(texts, return_tensors="pt", padding=True, truncation=True)
        outs   = self.model(**inputs, return_dict=True).last_hidden_state
        mask   = inputs.attention_mask.unsqueeze(-1)
        summed = (outs * mask).sum(1)
        counts = mask.sum(1)
        return (summed / counts).detach().cpu().numpy()

    def build_index(self, reviews: list[dict]):
        texts = [r["text"] for r in reviews]
        embs  = self.embed_texts(texts)
        d     = embs.shape[1]
        # cosine similarity via inner product on normalized vectors
        faiss.normalize_L2(embs)
        idx   = faiss.IndexFlatIP(d)
        idx.add(embs)
        self.index = idx

    def retrieve(self, query: str, top_k: int = 5) -> list[int]:
        q_emb = self.embed_texts([query])
        faiss.normalize_L2(q_emb)
        _, I = self.index.search(q_emb, top_k)
        return I[0].tolist()


def ir_augmented_chat(
    reviews: list[dict],
    user_q: str,
    indexer: ReviewIndexer,
    top_k: int = 5
) -> dict:
    """
    1) Retrieve top_k indices via indexer
    2) Call your existing interactive_query on just those reviews
    3) Return dict with retrieval + LLM response + sources
    """
    idxs       = indexer.retrieve(user_q, top_k=top_k)
    top_reviews = [reviews[i] for i in idxs]
    chat_resp   = interactive_query(top_reviews, user_q)
    return {
        "retrieved": idxs,
        "response":  chat_resp.response,
        "sources":   chat_resp.sources
    }
