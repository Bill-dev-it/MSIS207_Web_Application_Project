import { useState, useEffect, useCallback } from "react";
import {
  getRulEngines,
  uploadSensorCsv,
  runRulPrediction,
  getEnginePredictionHistory,
} from "../services/rulAnalysisApi";

export function useRULAnalysis(initialEngineId) {
  const [engines, setEngines] = useState([]);
  const [selectedEngineId, setSelectedEngineId] = useState(initialEngineId || "");
  const [step, setStep] = useState(1);
  const [uploadData, setUploadData] = useState(null);
  const [predictionResult, setPredictionResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load engines on mount
  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const data = await getRulEngines();
        if (isMounted) {
          setEngines(data);
          if (!selectedEngineId && data.length > 0) {
            setSelectedEngineId(data[0].engineId);
          }
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  // Update selected engine if prop changes
  useEffect(() => {
    if (initialEngineId) {
      setSelectedEngineId(initialEngineId);
    }
  }, [initialEngineId]);

  // Load history when engine is selected
  const loadHistory = useCallback(async (engineId) => {
    if (!engineId) return;
    try {
      const hist = await getEnginePredictionHistory(engineId);
      setHistory(hist);
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  }, []);

  useEffect(() => {
    if (selectedEngineId) {
      loadHistory(selectedEngineId);
    }
  }, [selectedEngineId, loadHistory]);

  const selectedEngine = engines.find(
    (e) => String(e.engineId) === String(selectedEngineId)
  );

  async function handleUploadAndPredict({ fileName, csvContent }) {
    if (!selectedEngineId) {
      setError("Please select an engine first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 2: Upload
      const up = await uploadSensorCsv({
        engineId: selectedEngineId,
        fileName,
        csvContent,
      });
      setUploadData(up);
      setStep(3);

      // Step 3: Run Prediction
      const result = await runRulPrediction({
        engineId: selectedEngineId,
        uploadId: up.uploadId,
        csvContent,
      });
      setPredictionResult(result);
      setStep(4);

      // Refresh history
      await loadHistory(selectedEngineId);
    } catch (err) {
      setError(err.message || "Failed to process RUL prediction pipeline.");
    } finally {
      setLoading(false);
    }
  }

  return {
    engines,
    selectedEngineId,
    setSelectedEngineId,
    selectedEngine,
    step,
    setStep,
    uploadData,
    predictionResult,
    history,
    loading,
    error,
    handleUploadAndPredict,
  };
}

