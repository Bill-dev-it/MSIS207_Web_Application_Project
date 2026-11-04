import json
from pathlib import Path

import numpy as np


FEATURE_COLUMNS = [
    "sensor_2",
    "sensor_3",
    "sensor_4",
    "sensor_7",
    "sensor_8",
    "sensor_9",
    "sensor_11",
    "sensor_12",
    "sensor_13",
    "sensor_14",
    "sensor_15",
    "sensor_17",
    "sensor_20",
    "sensor_21",
]

WINDOW_SIZE = 30


def load_scaler(json_path: str):
    path = Path(json_path)

    if not path.exists():
        raise FileNotFoundError(
            f"Preprocessing artifact not found: {path}"
        )

    with path.open("r", encoding="utf-8") as file:
        artifact = json.load(file)

    # Kiểm tra schema theo cấu trúc thực tế của JSON.
    scaler = artifact["scaler"]

    if scaler["type"] != "global":
        raise ValueError("Expected global Z-score scaler.")

    raw_mean = [
        float.fromhex(v) if isinstance(v, str) and v.startswith("0x") else float(v)
        for v in scaler["mean"]
    ]
    raw_std = [
        float.fromhex(v) if isinstance(v, str) and v.startswith("0x") else float(v)
        for v in scaler["std"]
    ]
    mean = np.asarray(raw_mean, dtype=np.float64)
    std = np.asarray(raw_std, dtype=np.float64)

    if mean.shape != (14,) or std.shape != (14,):
        raise ValueError("Scaler must contain 14 means and std values.")

    if not np.all(np.isfinite(mean)):
        raise ValueError("Scaler mean contains invalid values.")

    if not np.all(np.isfinite(std)) or np.any(std <= 0):
        raise ValueError("Scaler std contains invalid values.")

    return mean, std


def normalize_sensor_window(sensor_window, mean, std):
    values = np.asarray(sensor_window, dtype=np.float64)

    if values.shape != (30, 14):
        raise ValueError(
            f"Expected sensor window shape (30, 14), got {values.shape}"
        )

    if not np.all(np.isfinite(values)):
        raise ValueError("Sensor window contains invalid values.")

    normalized = (values - mean) / std

    return normalized.astype(np.float32)