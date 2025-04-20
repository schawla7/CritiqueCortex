# import json
# from .llm_client import summarize as llm_summarize

# def summarize_reviews(reviews: list[dict], specs: dict) -> dict:
#     """
#     Build a single prompt from the scraped reviews + specs,
#     call the LLM, and return its structured summary as:
#       {
#         "summary": "...",
#         "pros": ["…","…"],
#         "cons": ["…","…"],
#         "sentiment": "…"
#       }
#     """
#     # 1) Serialize specs
#     spec_str = json.dumps(specs, ensure_ascii=False, indent=2)

#     # 2) Serialize reviews
#     reviews_str = "\n".join(
#         f"- Rating: {r.get('rating')}, Text: {r.get('text')}"
#         for r in reviews
#     )

#     # 3) Build prompt, asking for JSON output
#     prompt = (
#         f"Here are the product specifications:\n{spec_str}\n\n"
#         f"Here are customer reviews:\n{reviews_str}\n\n"
#         "Please produce a concise summary of this product,\n"
#         "outlining the main pros and cons, overall sentiment,\n"
#         "and any recurring themes.\n\n"
#         "❗️ **Important**: return your answer *only* as valid JSON* with exactly these keys:\n"
#         "  • \"summary\": a short paragraph string describing the product at a high level\n"
#         "  • \"pros\": an array of strings listing each positive point\n"
#         "  • \"cons\": an array of strings listing each negative point\n"
#         "  • \"sentiment\": a single-sentence string describing the overall sentiment\n"
#     )

#     # 4) Call the LLM
#     raw = llm_summarize(prompt, max_tokens=300)

#     # 5) Parse or fallback
#     try:
#         data = json.loads(raw)
#         # ensure keys exist
#         return {
#             "summary": data.get("summary", "").strip(),
#             "pros": data.get("pros", []),
#             "cons": data.get("cons", []),
#             "sentiment": data.get("sentiment", "").strip(),
#         }
#     except json.JSONDecodeError:
#         # fallback: wrap whole text under "summary"
#         return {
#             "summary": raw.strip(),
#             "pros": [],
#             "cons": [],
#             "sentiment": ""
#         }

import json
from pydantic import BaseModel
from .llm_client import summarize as llm_summarize

class ReviewSummary(BaseModel):
    summary: str
    pros: list[str]
    cons: list[str]
    sentiment: str

def summarize_reviews(reviews: list[dict], specs: dict) -> dict:
    """
    Build a single prompt from the scraped reviews + specs,
    call the LLM (with a Pydantic model), and return its structured summary.
    """
    # 1) Serialize specs
    spec_str = json.dumps(specs, ensure_ascii=False, indent=2)

    # 2) Serialize reviews
    reviews_str = "\n".join(
        f"- Rating: {r.get('rating')}, Text: {r.get('text')}"
        for r in reviews
    )

    # 3) Build prompt (no need to embed JSON instructions here — llm_client will do it)
    prompt = (
        f"Here are the product specifications:\n{spec_str}\n\n"
        f"Here are customer reviews:\n{reviews_str}\n\n"
        "Please produce a concise summary of this product, "
        "outlining the main pros and cons, overall sentiment, "
        "and any recurring themes."
    )

    # 4) Call the LLM with our ReviewSummary model
    summary_obj = llm_summarize(
        prompt,
        max_tokens=300,
        response_model=ReviewSummary,
    )

    # 5) Return as dict
    return summary_obj.dict()
