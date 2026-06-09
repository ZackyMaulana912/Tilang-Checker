import os
from dotenv import load_dotenv
load_dotenv()

LLM_MODE       = os.getenv("LLM_MODE", "local")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
LOCAL_LLM_URL  = os.getenv("LOCAL_LLM_URL", "http://localhost:1234/v1/chat/completions")
LOCAL_LLM_MODEL = "qwen2.5-coder-7b-instruct"

OCR_CONFIDENCE_THRESHOLD = 0.5
