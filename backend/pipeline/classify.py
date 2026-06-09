import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import numpy as np
import io, os

# === Transforms ===
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225])
])

# === Model Definition ===
def build_model() -> nn.Module:
    model = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.DEFAULT)
    model.classifier[1] = nn.Linear(model.last_channel, 2)  # 0=bukan plat, 1=plat
    return model

# === Path model ===
MODEL_PATH = os.path.join(os.path.dirname(__file__), "../models/classify.pt")

def _load_model() -> nn.Module:
    m = build_model()
    if os.path.exists(MODEL_PATH):
        m.load_state_dict(torch.load(MODEL_PATH, map_location="cpu"))
    m.eval()
    return m

_model = _load_model()

# === Rule-based fallback ===
def _rule_based_check(image: Image.Image) -> tuple[bool, float]:
    """
    Validasi cepat berbasis aturan saat model belum ditraining.
    Plat Indonesia: landscape, rasio 2:1–5:1, dominan gelap/terang/merah.
    """
    w, h = image.size
    ratio = w / h if h > 0 else 0

    if not (1.5 <= ratio <= 6.0):
        return False, 0.3

    arr = np.array(image.convert("RGB"))
    brightness = arr.mean()
    r_mean = arr[:, :, 0].mean()
    g_mean = arr[:, :, 1].mean()
    b_mean = arr[:, :, 2].mean()

    is_dark  = brightness < 120           # plat hitam
    is_light = brightness > 150           # plat putih
    is_red   = r_mean > g_mean * 1.3 and r_mean > b_mean * 1.3  # plat dinas

    is_plate = is_dark or is_light or is_red
    return is_plate, 0.75 if is_plate else 0.4

# === Public API ===
def is_valid_plate(image_bytes: bytes) -> dict:
    """
    Input : raw image bytes (JPEG/PNG/RGBA)
    Output: {
        "is_valid":   bool,
        "confidence": float,
        "method":     "model" | "rule_based" | "default"
    }

    Jika models/classify.pt belum ada, default return is_valid=True
    agar pipeline tidak blocked saat demo/development.
    """
    if not os.path.exists(MODEL_PATH):
        # Model belum ditraining — loloskan semua gambar agar pipeline tidak blocked
        return {"is_valid": True, "confidence": 0.5, "method": "default"}

    try:
        image = Image.open(io.BytesIO(image_bytes))
        if image.mode != "RGB":
            image = image.convert("RGB")

        tensor = transform(image).unsqueeze(0)
        with torch.no_grad():
            logits = _model(tensor)
            probs  = torch.softmax(logits, dim=1)
            conf, pred = torch.max(probs, 1)

        return {
            "is_valid":   bool(pred.item() == 1),
            "confidence": float(conf.item()),
            "method":     "model"
        }
    except Exception:
        return {"is_valid": True, "confidence": 0.5, "method": "default"}
