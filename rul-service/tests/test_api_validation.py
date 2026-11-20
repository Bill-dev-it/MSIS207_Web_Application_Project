"""HTTP validation and auth tests for rul-service/api.py using Python stdlib unittest."""

import asyncio
import json
import sys
import unittest
from pathlib import Path
from types import SimpleNamespace

import pandas as pd

PACKAGE_ROOT = Path(__file__).resolve().parent.parent
if str(PACKAGE_ROOT) not in sys.path:
    sys.path.insert(0, str(PACKAGE_ROOT))

import api  # noqa: E402
from preprocessing.preprocessor import PreprocessingValidationError  # noqa: E402

VALID_TOKEN = "T" * 32


def make_csv_bytes(rows=30):
    lines = [",".join(api.REQUIRED_COLUMNS)]
    for cycle in range(1, rows + 1):
        lines.append(",".join(["1", str(cycle), "20.0", "0.7", "100.0"] + ["1.0"] * 14))
    return ("\n".join(lines) + "\n").encode("utf-8")


async def call_asgi(method, path, headers=None, body=b""):
    raw_headers = [(k.lower().encode("latin-1"), str(v).encode("latin-1")) for k, v in (headers or {}).items()]
    sent = []
    chunks = iter([body]) if body else iter(())

    async def receive():
        chunk = next(chunks, None)
        return {"type": "http.request", "body": chunk or b"", "more_body": chunk is not None}

    async def send(msg):
        sent.append(msg)

    scope = {
        "type": "http", "asgi": {"version": "3.0"}, "http_version": "1.1", "method": method,
        "scheme": "http", "path": path, "raw_path": path.encode("ascii"), "query_string": b"",
        "headers": raw_headers, "client": ("127.0.0.1", 50000), "server": ("127.0.0.1", 8000), "app": api.app,
    }
    await api.app(scope, receive, send)
    status = next(m["status"] for m in sent if m["type"] == "http.response.start")
    payload = b"".join(m.get("body", b"") for m in sent if m["type"] == "http.response.body")
    return status, json.loads(payload.decode("utf-8")) if payload else None


class StubEngine:
    def __init__(self, error=None):
        self.preprocessor = SimpleNamespace(subset="FD002")
        self.calls = []
        self.error = error

    def predict_from_dataframe(self, df):
        self.calls.append(df)
        if self.error:
            raise self.error
        return {"success": True, "model_id": api.MODEL_ID, "dataset": "NASA_CMAPSS_FD002", "predicted_rul_cycles": 19.33}


class TestFastAPIValidation(unittest.TestCase):
    def setUp(self):
        self.engine = StubEngine()
        api.app.state.service_token = VALID_TOKEN
        api.app.state.engine = self.engine

    def test_01_rejects_missing_or_wrong_service_token(self):
        for headers in [{}, {"X-RUL-Service-Token": "wrong"}]:
            status, body = asyncio.run(call_asgi("POST", "/v1/predict", headers=headers, body=make_csv_bytes(30)))
            self.assertEqual(status, 401)
            self.assertEqual(body["error"]["code"], "SERVICE_AUTH_REQUIRED")

    def test_02_authenticated_health_and_valid_csv_inference(self):
        status, health = asyncio.run(call_asgi("GET", "/health", headers={"X-RUL-Service-Token": VALID_TOKEN}))
        self.assertEqual((status, health), (200, {"success": True, "data": {"status": "healthy", "model_loaded": True}}))

        headers = {"X-RUL-Service-Token": VALID_TOKEN, "Content-Type": "text/csv; charset=utf-8"}
        status, body = asyncio.run(call_asgi("POST", "/v1/predict", headers=headers, body=make_csv_bytes(30)))
        self.assertEqual((status, body["predicted_rul_cycles"]), (200, 19.33))
        self.assertEqual(len(self.engine.calls), 1)
        self.assertIsInstance(self.engine.calls[0], pd.DataFrame)
        self.assertEqual(len(self.engine.calls[0]), 30)

    def test_03_rejects_invalid_csv_short_history_and_wrong_media_type(self):
        auth = {"X-RUL-Service-Token": VALID_TOKEN}
        status, body = asyncio.run(call_asgi("POST", "/v1/predict", headers={**auth, "Content-Type": "application/json"}, body=b"{}"))
        self.assertEqual((status, body["error"]["code"]), (415, "UNSUPPORTED_MEDIA_TYPE"))

        csv_headers = {**auth, "Content-Type": "text/csv; charset=utf-8"}
        status, body = asyncio.run(call_asgi("POST", "/v1/predict", headers=csv_headers, body=b"unit,cycle\n1,1\n"))
        self.assertEqual((status, body["error"]["code"]), (422, "INVALID_SENSOR_CSV"))

        status, body = asyncio.run(call_asgi("POST", "/v1/predict", headers=csv_headers, body=make_csv_bytes(29)))
        self.assertEqual((status, body["error"]["code"]), (422, "INSUFFICIENT_HISTORY"))

    def test_04_rejects_oversized_payload(self):
        headers = {"X-RUL-Service-Token": VALID_TOKEN, "Content-Type": "text/csv", "Content-Length": str(api.MAX_CSV_BYTES + 1)}
        status, body = asyncio.run(call_asgi("POST", "/v1/predict", headers=headers, body=b"x"))
        self.assertEqual((status, body["error"]["code"]), (413, "PAYLOAD_TOO_LARGE"))

    def test_05_maps_inference_and_preprocessing_errors(self):
        headers = {"X-RUL-Service-Token": VALID_TOKEN, "Content-Type": "text/csv; charset=utf-8"}
        valid_csv = make_csv_bytes(30)

        api.app.state.engine = StubEngine(error=PreprocessingValidationError("Duplicate cycle detected"))
        status, body = asyncio.run(call_asgi("POST", "/v1/predict", headers=headers, body=valid_csv))
        self.assertEqual((status, body["error"]["code"]), (422, "INVALID_SENSOR_CSV"))

        api.app.state.engine = StubEngine(error=RuntimeError("boom"))
        status, body = asyncio.run(call_asgi("POST", "/v1/predict", headers=headers, body=valid_csv))
        self.assertEqual((status, body["error"]["code"]), (500, "INFERENCE_FAILED"))


if __name__ == "__main__":
    unittest.main()
