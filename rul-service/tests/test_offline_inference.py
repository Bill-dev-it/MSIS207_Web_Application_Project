"""
Focused offline inference test suite for AeroRUL Condition-Aware iTransformer package.
Can be executed with:
    python -m unittest tests/test_offline_inference.py
"""

import sys
import unittest
import numpy as np
import pandas as pd
from pathlib import Path

PACKAGE_ROOT = Path(__file__).resolve().parent.parent
if str(PACKAGE_ROOT) not in sys.path:
    sys.path.insert(0, str(PACKAGE_ROOT))

from model.architecture import build_condition_token_itransformer
from preprocessing.preprocessor import ConditionAwarePreprocessor, PreprocessingValidationError
from inference.runner import RULInferenceEngine


class TestOfflineInference(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.package_root = PACKAGE_ROOT
        cls.ckpt_path = cls.package_root / "checkpoints" / "best_model.weights.h5"
        cls.scaler_path = cls.package_root / "preprocessing" / "scaler_artifacts.json"
        cls.valid_csv = cls.package_root / "samples" / "valid_engine_sample.csv"
        cls.invalid_csv = cls.package_root / "samples" / "invalid_engine_sample.csv"

    def test_01_artifacts_exist(self):
        """Verify checkpoint and preprocessing artifacts are present and non-empty."""
        self.assertTrue(self.ckpt_path.exists(), f"Checkpoint missing: {self.ckpt_path}")
        self.assertGreater(self.ckpt_path.stat().st_size, 100_000, "Checkpoint file too small")
        self.assertTrue(self.scaler_path.exists(), f"Scaler artifacts missing: {self.scaler_path}")
        self.assertGreater(self.scaler_path.stat().st_size, 1000, "Scaler artifacts file too small")

    def test_02_preprocessor_initialization(self):
        """Verify preprocessor loads centroids and 6 regime scalers."""
        prep = ConditionAwarePreprocessor(self.scaler_path)
        self.assertEqual(prep.subset, "FD002")
        self.assertEqual(prep.k_regimes, 6)
        self.assertEqual(prep.centroids.shape, (6, 3))
        self.assertEqual(len(prep.selected_sensors), 14)
        self.assertEqual(len(prep.regime_scalers), 6)

    def test_03_model_build_and_load_weights(self):
        """Verify model architecture compiles and weights load without error."""
        model = build_condition_token_itransformer()
        model.load_weights(str(self.ckpt_path))
        self.assertIsNotNone(model)

    def test_04_valid_sample_prediction(self):
        """Verify inference on authentic NASA C-MAPSS FD002 test sample produces expected prediction."""
        engine = RULInferenceEngine(package_root=self.package_root)
        result = engine.predict_from_csv(self.valid_csv)

        self.assertTrue(result["success"])
        self.assertEqual(result["model_id"], "condition_aware_itransformer_v3")
        self.assertEqual(result["dataset"], "NASA_CMAPSS_FD002")
        self.assertEqual(result["input_summary"]["engine_id"], 1)
        self.assertEqual(result["input_summary"]["total_cycles_provided"], 258)
        self.assertEqual(result["input_summary"]["window_length_used"], 30)

        # Expected RUL for Unit 1 is ~19.33 cycles (ground truth in RUL_FD002 is 18.0)
        pred_rul = result["predicted_rul_cycles"]
        self.assertIsInstance(pred_rul, float)
        self.assertGreater(pred_rul, 15.0)
        self.assertLess(pred_rul, 25.0)
        self.assertAlmostEqual(pred_rul, 19.33, delta=0.5)

    def test_05_deterministic_repeatability(self):
        """Verify two successive predictions on the same input yield identical numeric output."""
        engine = RULInferenceEngine(package_root=self.package_root)
        res1 = engine.predict_from_csv(self.valid_csv)
        res2 = engine.predict_from_csv(self.valid_csv)

        self.assertEqual(res1["predicted_rul_cycles"], res2["predicted_rul_cycles"])
        self.assertEqual(res1["raw_predicted_rul_cycles"], res2["raw_predicted_rul_cycles"])

    def test_06_invalid_sample_rejection(self):
        """Verify corrupt/missing-column CSV is rejected with PreprocessingValidationError."""
        engine = RULInferenceEngine(package_root=self.package_root)
        with self.assertRaises(PreprocessingValidationError) as ctx:
            engine.predict_from_csv(self.invalid_csv)
        self.assertIn("Missing required columns", str(ctx.exception))

    def test_07_short_history_front_padding(self):
        """Verify engines with history shorter than window length (W=30) are safely front-padded."""
        # Read first 15 cycles of valid CSV
        df = pd.read_csv(self.valid_csv).head(15)
        short_csv_path = self.package_root / "samples" / "temp_short_sample.csv"
        try:
            df.to_csv(short_csv_path, index=False)
            engine = RULInferenceEngine(package_root=self.package_root)
            result = engine.predict_from_csv(short_csv_path)

            self.assertTrue(result["success"])
            self.assertEqual(result["input_summary"]["total_cycles_provided"], 15)
            self.assertTrue(result["input_summary"]["padding_applied"])
            self.assertIsInstance(result["predicted_rul_cycles"], float)
        finally:
            if short_csv_path.exists():
                short_csv_path.unlink()


if __name__ == "__main__":
    unittest.main()
