#!/usr/bin/env python3
"""
AeroRUL Condition-Aware iTransformer standalone inference CLI.

For offline model-package use; the Express web path uses the internal FastAPI
service instead.
- Reads engine sensor CSV history from --input argument.
- Prints machine-readable JSON strictly to stdout.
- Diagnostic logs / traceback sent strictly to stderr.
- Exits with status code 0 on success, 1 on failure.

Usage:
    python inference/predict_cli.py --input samples/valid_engine_sample.csv
"""

import os
import sys
import json
import argparse
import traceback
import warnings
from pathlib import Path

# Silence all Python and TensorFlow warnings so stdout contains pure JSON
warnings.filterwarnings("ignore")

# Ensure UTF-8 output on Windows consoles
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Ensure project root is in sys.path
PACKAGE_ROOT = Path(__file__).resolve().parent.parent
if str(PACKAGE_ROOT) not in sys.path:
    sys.path.insert(0, str(PACKAGE_ROOT))

# Suppress TF logs from stdout
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"



def main():
    parser = argparse.ArgumentParser(
        description="AeroRUL Condition-Aware iTransformer RUL Prediction CLI"
    )
    parser.add_argument(
        "--input", "-i",
        required=True,
        type=str,
        help="Path to engine sensor history CSV file."
    )
    parser.add_argument(
        "--output", "-o",
        required=False,
        type=str,
        default=None,
        help="Optional path to write JSON output to disk."
    )
    parser.add_argument(
        "--clip-max-rul",
        type=float,
        default=125.0,
        help="Piecewise linear RUL clip ceiling (default: 125.0 cycles, matching training)."
    )

    args = parser.parse_args()

    input_path = Path(args.input)
    if not input_path.is_absolute():
        input_path = (Path.cwd() / input_path).resolve()

    try:
        from inference.runner import RULInferenceEngine
        from preprocessing.preprocessor import PreprocessingValidationError

        engine = RULInferenceEngine(package_root=PACKAGE_ROOT)
        result = engine.predict_from_csv(input_path, clip_max_rul=args.clip_max_rul)

        # Output JSON to stdout
        json_output = json.dumps(result, indent=2)
        print(json_output)

        # Optional write to file
        if args.output:
            out_file = Path(args.output)
            out_file.parent.mkdir(parents=True, exist_ok=True)
            with open(out_file, "w", encoding="utf-8") as f:
                f.write(json_output)

        sys.exit(0)

    except Exception as e:
        # Determine error type
        error_type = type(e).__name__
        error_message = str(e)

        # Print clean error JSON to stdout for Express consumer
        error_payload = {
            "success": false if False else False,
            "error": error_message,
            "error_type": error_type,
            "input_file": str(input_path.name)
        }
        print(json.dumps(error_payload, indent=2))

        # Send technical diagnostic traceback to stderr
        sys.stderr.write(f"\n[AeroRUL Inference Error] {error_type}: {error_message}\n")
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
