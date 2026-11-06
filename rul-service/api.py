"""Internal FastAPI service for the frozen AeroRUL inference model."""

import asyncio
import csv
import hmac
import io
import logging
import os
from contextlib import asynccontextmanager
from typing import AsyncIterator

import pandas as pd
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.concurrency import run_in_threadpool

from inference.runner import RULInferenceEngine
from preprocessing.preprocessor import PreprocessingValidationError

MAX_CSV_BYTES = 1024 * 1024
MIN_OBSERVATIONS = 30
MODEL_ID = "condition_aware_itransformer_v3"
REQUIRED_COLUMNS = (
    "unit", "cycle", "setting_1", "setting_2", "setting_3",
    "sensor_2", "sensor_3", "sensor_4", "sensor_7", "sensor_8",
    "sensor_9", "sensor_11", "sensor_12", "sensor_13", "sensor_14",
    "sensor_15", "sensor_17", "sensor_20", "sensor_21",
)
logger = logging.getLogger("aerorul.inference")
inference_lock = asyncio.Lock()


def error_response(status_code: int, code: str, message: str) -> JSONResponse:
    return JSONResponse(status_code=status_code, content={
        "success": False,
        "error": {"code": code, "message": message},
    })


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    token = os.environ.get("RUL_SERVICE_TOKEN", "")
    if len(token) < 32 or not token.isascii() or any(character.isspace() for character in token):
        raise RuntimeError("RUL_SERVICE_TOKEN must contain at least 32 characters.")
    app.state.service_token = token
    app.state.engine = RULInferenceEngine()
    yield


app = FastAPI(
    title="AeroRUL Internal Inference API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)


async def require_service_token(request: Request):
    expected = request.app.state.service_token
    supplied = request.headers.get("x-rul-service-token", "")
    if not hmac.compare_digest(supplied.encode("utf-8"), expected.encode("ascii")):
        return error_response(401, "SERVICE_AUTH_REQUIRED", "Valid internal service authentication is required.")
    return None


async def read_csv(request: Request):
    content_type = request.headers.get("content-type", "")
    parts = [part.strip() for part in content_type.split(";")]
    if not parts or parts[0].lower() != "text/csv":
        return None, error_response(415, "UNSUPPORTED_MEDIA_TYPE", "Upload CSV as UTF-8 text/csv.")
    for parameter in parts[1:]:
        if parameter.lower().startswith("charset=") and parameter.split("=", 1)[1].strip('"').lower() != "utf-8":
            return None, error_response(415, "UNSUPPORTED_MEDIA_TYPE", "Upload CSV as UTF-8 text/csv.")

    content_length = request.headers.get("content-length")
    if content_length:
        try:
            if int(content_length) > MAX_CSV_BYTES:
                return None, error_response(413, "PAYLOAD_TOO_LARGE", "CSV must be 1 MiB or smaller.")
        except ValueError:
            return None, error_response(400, "INVALID_REQUEST_BODY", "Invalid Content-Length header.")

    chunks = []
    byte_count = 0
    async for chunk in request.stream():
        byte_count += len(chunk)
        if byte_count > MAX_CSV_BYTES:
            return None, error_response(413, "PAYLOAD_TOO_LARGE", "CSV must be 1 MiB or smaller.")
        chunks.append(chunk)
    if byte_count == 0:
        return None, error_response(422, "INVALID_SENSOR_CSV", "CSV cannot be empty.")
    try:
        csv_text = b"".join(chunks).decode("utf-8", errors="strict")
    except UnicodeDecodeError:
        return None, error_response(422, "INVALID_SENSOR_CSV", "CSV must use valid UTF-8 encoding.")
    if csv_text.startswith("\ufeff") or "\x00" in csv_text:
        return None, error_response(422, "INVALID_SENSOR_CSV", "CSV must not contain a BOM or null bytes.")
    try:
        raw_headers = next(csv.reader(io.StringIO(csv_text)))
    except (csv.Error, StopIteration):
        return None, error_response(422, "INVALID_SENSOR_CSV", "Unable to parse the uploaded CSV header.")
    raw_headers = [column.strip() for column in raw_headers]
    if len(raw_headers) != len(set(raw_headers)):
        return None, error_response(422, "INVALID_SENSOR_CSV", "CSV header columns must be unique.")
    normalized_columns = [column.strip().lower().replace("_", "").replace("-", "").replace(" ", "") for column in raw_headers]
    ground_truth_prefixes = (
        "truerul", "actualrul", "predictedrul", "rul", "target", "label",
        "remaininglife", "remainingusefullife", "groundtruth",
    )
    if any(column.startswith(ground_truth_prefixes) and not column.startswith("rule")
           for column in normalized_columns):
        return None, error_response(422, "INVALID_SENSOR_CSV", "Ground-truth RUL and target label columns are not accepted.")
    try:
        dataframe = pd.read_csv(io.StringIO(csv_text))
    except (pd.errors.ParserError, pd.errors.EmptyDataError, UnicodeError, ValueError):
        return None, error_response(422, "INVALID_SENSOR_CSV", "Unable to parse the uploaded CSV.")

    dataframe.columns = [str(column).strip() for column in dataframe.columns]
    columns = [str(column) for column in dataframe.columns]
    if any(column not in columns for column in REQUIRED_COLUMNS):
        return None, error_response(422, "INVALID_SENSOR_CSV", "CSV must contain all 19 required sensor input columns.")
    if len(dataframe) < MIN_OBSERVATIONS:
        return None, error_response(422, "INSUFFICIENT_HISTORY", "Provide 30 or more observations.")
    for column in ("unit", "cycle"):
        values = pd.to_numeric(dataframe[column], errors="coerce")
        if values.isna().any() or (values <= 0).any() or ((values % 1) != 0).any():
            return None, error_response(422, "INVALID_SENSOR_CSV",
                                        f"'{column}' must contain positive integers.")
    return dataframe, None


@app.get("/health")
async def health(request: Request):
    unauthorized = await require_service_token(request)
    if unauthorized:
        return unauthorized
    return {"success": True, "data": {"status": "healthy", "model_loaded": hasattr(request.app.state, "engine")}}


@app.get("/v1/model-info")
async def model_info(request: Request):
    unauthorized = await require_service_token(request)
    if unauthorized:
        return unauthorized
    engine = request.app.state.engine
    return {
        "success": True,
        "data": {
            "model_id": MODEL_ID,
            "model_architecture": "Condition Token iTransformer (14 Inverted Sensor Tokens + 1 Condition Token)",
            "dataset_subset": engine.preprocessor.subset,
            "window_size": 30,
            "input_contract": {
                "media_type": "text/csv; charset=utf-8",
                "maximum_bytes": MAX_CSV_BYTES,
                "minimum_observations": MIN_OBSERVATIONS,
                "one_unit_per_csv": True,
                "required_columns": list(REQUIRED_COLUMNS),
                "ground_truth_labels": False,
                "values": "raw, unscaled values in compatible physical units",
            },
        },
    }


@app.post("/v1/predict")
async def predict(request: Request):
    unauthorized = await require_service_token(request)
    if unauthorized:
        return unauthorized
    dataframe, error = await read_csv(request)
    if error:
        return error
    try:
        async with inference_lock:
            result = await run_in_threadpool(request.app.state.engine.predict_from_dataframe, dataframe)
    except PreprocessingValidationError as exc:
        return error_response(422, "INVALID_SENSOR_CSV", str(exc))
    except Exception:
        logger.exception("RUL model inference failed.")
        return error_response(500, "INFERENCE_FAILED", "The RUL model could not process this CSV.")
    if result.get("success") is not True or result.get("model_id") != MODEL_ID:
        return error_response(502, "INVALID_INFERENCE_RESPONSE", "Model returned an invalid prediction response.")
    return result
