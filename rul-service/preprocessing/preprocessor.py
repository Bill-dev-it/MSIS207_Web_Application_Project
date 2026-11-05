"""
Condition-Aware Preprocessor for AeroRUL Turbofan Inference.
Faithfully executes the exact Block B condition clustering and per-regime sensor normalization
from the research project (proposed_model/condition_token_pc_v3 and condition_kmeans_pc_v2),
using frozen pre-fitted KMeans centroids and per-regime standard scalers.
"""

import json
from pathlib import Path
from typing import Dict, Any, Tuple, Optional
import numpy as np
import pandas as pd


class PreprocessingValidationError(ValueError):
    """Raised when uploaded CSV fails schema or data integrity validation."""
    pass


class ConditionAwarePreprocessor:
    """
    Validates raw engine CSV inputs, computes flight regimes, and creates model-ready tensors.
    """

    def __init__(self, artifacts_path: Optional[Path] = None):
        if artifacts_path is None:
            artifacts_path = Path(__file__).resolve().parent / "scaler_artifacts.json"
        self.artifacts_path = Path(artifacts_path)
        if not self.artifacts_path.exists():
            raise FileNotFoundError(f"Scaler artifacts not found: {self.artifacts_path}")

        with open(self.artifacts_path, "r", encoding="utf-8") as f:
            artifacts = json.load(f)

        self.subset = artifacts["subset"]
        self.k_regimes = int(artifacts["k_regimes"])
        self.operating_settings = list(artifacts["operating_settings"])
        self.selected_sensors = list(artifacts["selected_sensors"])
        self.centroids = np.array(artifacts["centroids"], dtype=np.float64)  # (6, 3)

        self.regime_scalers = {}
        for c, sc in artifacts["regime_scalers"].items():
            self.regime_scalers[int(c)] = {
                "mean": np.array(sc["mean"], dtype=np.float64),
                "std": np.array(sc["std"], dtype=np.float64),
            }

        self.global_scaler = {
            "mean": np.array(artifacts["global_scaler"]["mean"], dtype=np.float64),
            "std": np.array(artifacts["global_scaler"]["std"], dtype=np.float64),
        }

    def validate_and_load_dataframe(self, csv_path: Path) -> pd.DataFrame:
        """Loads and strictly validates input CSV format, headers, data types, and engine consistency."""
        csv_path = Path(csv_path)
        if not csv_path.exists():
            raise PreprocessingValidationError(f"Input file does not exist: {csv_path}")

        try:
            df = pd.read_csv(csv_path)
        except Exception as e:
            raise PreprocessingValidationError(f"Failed to parse CSV file: {str(e)}")

        return self.validate_dataframe(df)

    def validate_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        """Validates an already parsed input dataframe using the model schema."""
        df = df.copy()
        if df.empty:
            raise PreprocessingValidationError("Uploaded CSV is empty.")

        # Check required columns
        required_cols = ["unit", "cycle"] + self.operating_settings + self.selected_sensors
        missing_cols = [c for c in required_cols if c not in df.columns]
        if missing_cols:
            raise PreprocessingValidationError(
                f"Missing required columns in CSV: {missing_cols}. "
                f"Required: unit, cycle, {self.operating_settings}, {self.selected_sensors}"
            )

        # Check single engine requirement for MVP
        unique_units = df["unit"].unique()
        if len(unique_units) > 1:
            raise PreprocessingValidationError(
                f"Multiple engine IDs detected: {unique_units.tolist()}. "
                "The MVP inference pipeline expects exactly ONE engine per uploaded CSV."
            )

        # Verify numeric types
        for col in required_cols:
            if not pd.api.types.is_numeric_dtype(df[col]):
                try:
                    df[col] = pd.to_numeric(df[col])
                except Exception:
                    raise PreprocessingValidationError(f"Column '{col}' must contain valid numeric values.")

        # Check for NaN / Inf
        subset_df = df[required_cols]
        if subset_df.isna().any().any():
            nan_cols = subset_df.columns[subset_df.isna().any()].tolist()
            raise PreprocessingValidationError(f"CSV contains NaN or null values in columns: {nan_cols}.")

        if np.isinf(subset_df.to_numpy(dtype=np.float64)).any():
            raise PreprocessingValidationError("CSV contains infinite (inf / -inf) values.")

        # Sort by cycle ascending and check duplicates
        df = df.sort_values(by="cycle", ascending=True).reset_index(drop=True)
        if df["cycle"].duplicated().any():
            dup_cycles = df["cycle"][df["cycle"].duplicated()].unique().tolist()
            raise PreprocessingValidationError(f"Duplicate cycle numbers detected: {dup_cycles[:10]}.")

        return df

    def transform(self, df: pd.DataFrame, window_size: int = 30) -> Tuple[np.ndarray, np.ndarray, Dict[str, Any]]:
        """
        Transforms raw engine records into model input tensors:
        - sensor_tensor: (1, window_size, 14)
        - condition_tensor: (1, window_size, 6)
        """
        engine_id = int(df["unit"].iloc[0])
        total_cycles = len(df)
        cycle_start = int(df["cycle"].iloc[max(0, total_cycles - window_size)])
        cycle_end = int(df["cycle"].iloc[-1])

        # 1. Flight regime prediction via nearest centroid distance
        settings = df[self.operating_settings].to_numpy(dtype=np.float64)  # (N, 3)
        dists = np.sum((settings[:, None, :] - self.centroids[None, :, :]) ** 2, axis=2)  # (N, 6)
        regimes = np.argmin(dists, axis=1)  # (N,)

        # 2. Per-regime sensor standard normalization on 14 selected sensors
        sensors = df[self.selected_sensors].to_numpy(dtype=np.float64)  # (N, 14)
        norm_sensors = np.zeros_like(sensors, dtype=np.float64)

        for c, sc in self.regime_scalers.items():
            mask = regimes == c
            if np.any(mask):
                norm_sensors[mask] = (sensors[mask] - sc["mean"]) / sc["std"]

        # 3. Construct one-hot condition stream (N, 6)
        cond = np.zeros((total_cycles, self.k_regimes), dtype=np.float32)
        cond[np.arange(total_cycles), regimes] = 1.0

        # 4. Window slicing / padding
        padding_applied = False
        if total_cycles >= window_size:
            w_sensors = norm_sensors[-window_size:]
            w_cond = cond[-window_size:]
        else:
            padding_applied = True
            pad_len = window_size - total_cycles
            w_sensors = np.vstack([np.repeat(norm_sensors[[0]], pad_len, axis=0), norm_sensors])
            w_cond = np.vstack([np.repeat(cond[[0]], pad_len, axis=0), cond])

        sensor_tensor = np.expand_dims(w_sensors.astype(np.float32), axis=0)  # (1, 30, 14)
        condition_tensor = np.expand_dims(w_cond.astype(np.float32), axis=0)  # (1, 30, 6)

        window_regimes = regimes[-min(total_cycles, window_size):].tolist()
        dominant_regime = int(pd.Series(window_regimes).mode()[0])

        metadata = {
            "engine_id": engine_id,
            "total_cycles_provided": total_cycles,
            "window_length_used": window_size,
            "cycle_start": cycle_start,
            "cycle_end": cycle_end,
            "sensor_count": len(self.selected_sensors),
            "operating_settings_count": len(self.operating_settings),
            "dominant_regime": dominant_regime,
            "padding_applied": padding_applied,
        }

        return sensor_tensor, condition_tensor, metadata
