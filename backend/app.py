# app.py
import time
import uuid
from flask import Flask, request, jsonify
from flask_cors import CORS

from modules.summarizer import summarize_reviews
from modules.interactive_query import interactive_query
from modules.ir_pipeline import ReviewIndexer, ir_augmented_chat

app = Flask(__name__)
CORS(app)

# --- In‑memory metrics store ---
metrics = {
    "total_queries":    0,   # number of /chat calls
    "total_retrieved":  0,   # sum of all top_k retrieved across queries
    "click_count":      0,   # number of click events reported
}
followup_latencies   = []   # list of seconds between chats in same session
session_start_times  = {}   # session_id -> timestamp of last /chat

# --- Summarize endpoint untouched ---
@app.route("/summarize", methods=["POST"])
def summarize():
    """
    Expects JSON of the form:
      {
        "reviews": [ { "rating": 5, "text": "…" }, … ],
        "specs":   { "Brand Name": "Portal Games", … }
      }
    Returns:
      { "summary": "…" }
    """
    data    = request.get_json(force=True)
    reviews = data.get("reviews", [])
    specs   = data.get("specs", {})
    result  = summarize_reviews(reviews, specs)
    return jsonify(result)


# --- Chat endpoint with IR + session tracking ---
@app.route("/chat", methods=["POST"])
def chat():
    """
    Request JSON:
      {
        "reviews": [ { "rating": 5, "text": "…" }, … ],
        "query":   "Follow‑up question",
        // optional on follow‑up:
        "session_id": "uuid-from-first-call"
      }
    Response JSON:
      {
        "session_id": "…",          # new or echoed
        "retrieved":  [0,3,5,2,1],   # indices of top_k reviews
        "response":   "...",        # LLM answer
        "sources":    [1,4]         # cited among those top_k
      }
    """
    data      = request.get_json(force=True)
    reviews   = data.get("reviews", [])
    user_q    = data.get("query", "")
    sess_id   = data.get("session_id")
    now       = time.time()

    # --- follow‑up latency tracking ---
    if sess_id and sess_id in session_start_times:
        elapsed = now - session_start_times[sess_id]
        followup_latencies.append(elapsed)

    # assign/generate session_id
    if not sess_id or sess_id not in session_start_times:
        sess_id = str(uuid.uuid4())
    session_start_times[sess_id] = now

    # --- IR + LLM chat ---
    indexer = ReviewIndexer()
    indexer.build_index(reviews)
    result  = ir_augmented_chat(reviews, user_q, indexer, top_k=5)

    # --- update IR metrics ---
    metrics["total_queries"]   += 1
    metrics["total_retrieved"] += len(result["retrieved"])

    # attach session_id for the front‑end
    result["session_id"] = sess_id
    return jsonify(result)


# --- Click tracking endpoint ---
@app.route("/metrics/click", methods=["POST"])
def click():
    """
    Called by front‑end whenever a user clicks on a retrieved review.
    Request JSON:
      { "session_id": "…" }
    """
    metrics["click_count"] += 1
    return jsonify({"status": "ok"}), 200


# --- Serve real‑time metrics ---
@app.route("/metrics", methods=["GET"])
def get_metrics():
    """
    Returns:
      {
        "ctr": 0.12,                   # clicks / total_retrieved
        "mean_followup_latency": 4.5  # in seconds, or null if none yet
      }
    """
    total_ret = metrics["total_retrieved"]
    ctr        = (metrics["click_count"] / total_ret) if total_ret else 0.0

    if followup_latencies:
        mean_lat = sum(followup_latencies) / len(followup_latencies)
    else:
        mean_lat = None

    return jsonify({
        "ctr": float(ctr),
        "mean_followup_latency": mean_lat
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=9000, debug=True)
