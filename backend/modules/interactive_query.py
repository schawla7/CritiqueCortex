import json
from pydantic import BaseModel
from .llm_client import chat

class ChatResponse(BaseModel):
    response: str
    sources: list[int]

def interactive_query(
    reviews: list[dict], 
    user_query: str
) -> ChatResponse:
    """
    Let the user ask follow‑up questions on the review set.
    The model will answer *only* from those reviews and cite which
    reviews it used.
    """
    # 1) Number and serialize the reviews
    reviews_str = "\n".join(
        f"{i+1}. Rating: {r['rating']}, Text: {r['text']}"
        for i, r in enumerate(reviews)
    )

    # 2) Build a prompt that forces citation
    prompt = (
        f"Here are the customer reviews:\n{reviews_str}\n\n"
        f"User question: {user_query}\n\n"
        "Answer the question using **only** these reviews. "
        "At the end, include a JSON field `sources` listing the review numbers you used.\n\n"
        "Return exactly valid JSON with these two keys:\n"
        "  • `response`: your answer text\n"
        "  • `sources`: an array of integers (the review indices cited)\n"
    )

    # 3) Call our new chat() helper (single-turn is fine too)
    raw = chat([
        {"role": "user", "content": [{"type": "text", "text": prompt}]}
    ], max_tokens=300)
    print("Raw response:", raw)
    # 4) Parse & validate
    data = json.loads(raw)
    return ChatResponse.parse_obj(data)