FROM python:3.11-slim

WORKDIR /app

# System libs untuk OpenCV / EasyOCR (libGL dkk) — base Debian punya apt normal,
# jadi tidak ada masalah "externally-managed" seperti di Nix/Railway.
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# HuggingFace Spaces: arahkan HOME & cache ke direktori yang pasti writable
# supaya download model EasyOCR / yolov8n.pt tidak kena permission error.
ENV HOME=/app \
    MPLCONFIGDIR=/tmp/matplotlib \
    PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# HuggingFace Spaces wajib listen di port 7860
EXPOSE 7860

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
