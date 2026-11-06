"""
Core Inference Engine for AeroRUL Condition-Aware iTransformer.
Handles model restoration, checkpoint loading, CPU execution, and prediction packaging.
"""

import os
import sys
import time
from pathlib import Path
from typing import Dict, Any, Optional
import numpy as np

# Suppress verbose TensorFlow logs to keep stdout clean for JSON
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

import tensorflow as tf

from model.architecture import build_condition_token_itransformer
from preprocessing.preprocessor import ConditionAwarePreprocessor, PreprocessingValidationError


class RULInferenceEngine:
    """Production inference engine for Condition-Aware iTransformer RUL model."""

    def __init__(self, package_root: Optional[Path] = None):
        if package_root is None:
            package_root = Path(__file__).resolve().parent.parent
        self.package_root = Path(package_root)

        # Paths
        self.checkpoint_path = self.package_root / "checkpoints" / "best_model.weights.h5"
        self.scaler_artifacts_path = self.package_root / "preprocessing" / "scaler_artifacts.json"

        if not self.checkpoint_path.exists():
            raise FileNotFoundError(f"Checkpoint weights not found: {self.checkpoint_path}")
        if not self.scaler_artifacts_path.exists():
            raise FileNotFoundError(f"Scaler artifacts not found: {self.scaler_artifacts_path}")

        # Initialize preprocessor
        self.preprocessor = ConditionAwarePreprocessor(self.scaler_artifacts_path)

        # Build model and load weights
        self.model = build_condition_token_itransformer()
        self.model.load_weights(str(self.checkpoint_path))

    def predict_from_csv(self, csv_path: Path, clip_max_rul: float = 125.0) -> Dict[str, Any]:
        """
        Executes end-to-end inference on an uploaded engine CSV file.
        """
        df = self.preprocessor.validate_and_load_dataframe(csv_path)
        return self._predict_validated_dataframe(df, clip_max_rul=clip_max_rul)

    def predict_from_dataframe(self, df, clip_max_rul: float = 125.0) -> Dict[str, Any]:
        """Executes inference after validating a parsed CSV dataframe."""
        df = self.preprocessor.validate_dataframe(df)
        return self._predict_validated_dataframe(df, clip_max_rul=clip_max_rul)

    def _predict_validated_dataframe(self, df, clip_max_rul: float) -> Dict[str, Any]:
        t0 = time.perf_counter()
        # 1. Validation & Preprocessing
        sensor_tensor, condition_tensor, meta = self.preprocessor.transform(df)

        # 2. Model Prediction (CPU evaluation mode)
        # Using model.predict on pre-built batch tensor
        raw_pred = float(self.model([sensor_tensor, condition_tensor], training=False).numpy()[0, 0])

        # 3. Target Clipping
        clipped_pred = float(np.clip(raw_pred, 0.0, clip_max_rul))

        latency_ms = round((time.perf_counter() - t0) * 1000.0, 2)

        return {
            "success": True,
            "model_id": "condition_aware_itransformer_v3",
            "model_architecture": "Condition Token iTransformer (14 Inverted Sensor Tokens + 1 Condition Token)",
            "dataset": f"NASA_CMAPSS_{self.preprocessor.subset}",
            "predicted_rul_cycles": round(clipped_pred, 2),
            "raw_predicted_rul_cycles": round(raw_pred, 2),
            "rul_clip_applied": bool(raw_pred != clipped_pred),
            "unit": "engine_cycles",
            "input_summary": meta,
            "evaluation": {
                "metric": "RMSE_125",
                "checkpoint_test_rmse_cycles": 13.94,
                "subset_10seed_mean_rmse_cycles": 14.17,
                "subset_10seed_std_rmse_cycles": 0.30,
                "source": "NASA C-MAPSS FD002 Test Set (259 engines, seed=42)"
            },
            "execution": {
                "inference_time_ms": latency_ms,
                "device": "CPU"
            }
        }
