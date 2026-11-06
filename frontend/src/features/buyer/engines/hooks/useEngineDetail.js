import { useState, useEffect, useCallback } from "react";
import { getEngineById, getEngineSensorUploads } from "../services/engineApi";

export function useEngineDetail(engineId) {
  const [engine, setEngine] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDetail = useCallback(async (signal) => {
    if (!engineId) return;
    setLoading(true);
    setError(null);
    try {
      const [engData, uploadsData] = await Promise.all([
        getEngineById(engineId, { signal }),
        getEngineSensorUploads(engineId, { limit: 10, signal }),
      ]);
      setEngine(engData);
      setUploads(uploadsData);
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err.message || "Failed to load engine detail");
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [engineId]);

  useEffect(() => {
    const controller = new AbortController();
    fetchDetail(controller.signal);
    return () => controller.abort();
  }, [fetchDetail]);

  return {
    engine,
    uploads,
    loading,
    error,
    refresh: () => fetchDetail(),
  };
}
