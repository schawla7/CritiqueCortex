from flask import Flask, request, jsonify
from flask_cors import CORS

from modules.summarizer import summarize_reviews
from modules.interactive_query import interactive_query

app = Flask(__name__)
CORS(app)


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
    data = request.get_json(force=True)
    reviews = data.get("reviews", [])
    specs   = data.get("specs", {})
    result  = summarize_reviews(reviews, specs)
    return jsonify(result)

@app.route("/chat", methods=["POST"])
def chat():
    """
+    Expects JSON of the form:
+      {
+        "reviews": [ { "rating": 5, "text": "…" }, … ],
+        "query":   "User’s follow‑up question here"
+      }
+    Returns:
+      {
+        "response": "...",
+        "sources": [1, 4, 5]
+      }
+    """
    data = request.get_json(force=True)
    reviews = data.get("reviews", [])
    user_q  = data.get("query", "")
    # call your interactive_query helper (returns a Pydantic model)
    chat_resp = interactive_query(reviews, user_q)
    # jsonify the dict
    return jsonify(chat_resp.dict())

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

