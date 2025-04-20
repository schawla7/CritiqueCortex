import os

# which model to use on your local Ollama server (or other LiteLLM endpoint)
MODEL_ID     = os.getenv("LLM_MODEL_ID",    "ollama_chat/qwen2:7b")
API_BASE     = os.getenv("LLM_API_BASE",    "http://127.0.0.1:11434")
NUM_CTX      = int(os.getenv("LLM_NUM_CTX", "8192"))

# default generation params (can be overridden per-call)
TEMPERATURE  = float(os.getenv("LLM_TEMPERATURE", "0.7"))
MAX_TOKENS   = int(os.getenv("LLM_MAX_TOKENS", "8192"))
