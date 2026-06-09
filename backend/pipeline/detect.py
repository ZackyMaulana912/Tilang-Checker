from ultralytics import YOLO
from PIL import Image
import numpy as np
import io

_model = None

def _get_model():
    global _model
    if _model is None:
        _model = YOLO("yolov8n.pt")
    return _model

def _to_jpeg(image: Image.Image) -> bytes:
    buf = io.BytesIO()
    image.save(buf, format="JPEG")
    return buf.getvalue()

def detect_plate(image_bytes: bytes) -> dict:
    """
    Input : raw image bytes (JPEG, PNG, RGBA — semua format)
    Output: {
        "found": bool,
        "is_valid_plate": bool,
        "crop_bytes": bytes | None,  # crop area plat
        "confidence": float
    }
    """
    # Konversi RGBA/PNG → RGB sebelum proses
    image = Image.open(io.BytesIO(image_bytes))
    if image.mode != "RGB":
        image = image.convert("RGB")
    results = _get_model()(image, verbose=False)

    # Filter deteksi: cari class kendaraan (car=2, motorcycle=3, truck=7, bus=5)
    vehicle_classes = {2, 3, 5, 7}
    best = None
    best_conf = 0.0

    for r in results:
        for box in r.boxes:
            cls  = int(box.cls[0])
            conf = float(box.conf[0])
            if cls in vehicle_classes and conf > best_conf:
                best = box
                best_conf = conf

    # VEHICLE_CROP_CONF_MIN: hanya crop jika YOLO sangat yakin (foto full kendaraan).
    # Jika confidence rendah, foto kemungkinan close-up plat/stiker — gunakan full image.
    VEHICLE_CROP_CONF_MIN = 0.70

    if best is None or best_conf < VEHICLE_CROP_CONF_MIN:
        return {
            "found": True,
            "is_valid_plate": True,
            "crop_bytes": _to_jpeg(image),
            "confidence": best_conf if best is not None else 0.5
        }

    # Crop area bawah kendaraan (area plat biasanya di bawah)
    x1, y1, x2, y2 = map(int, best.xyxy[0])
    plate_y1 = y1 + int((y2 - y1) * 0.6)  # ambil 40% bawah
    crop = image.crop((x1, plate_y1, x2, y2))

    return {
        "found": True,
        "is_valid_plate": True,
        "crop_bytes": _to_jpeg(crop),
        "confidence": best_conf
    }
