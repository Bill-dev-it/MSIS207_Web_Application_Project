import { useSearchParams } from "react-router-dom";
import BuyerPortalShell from "../../../../shared/components/BuyerPortalShell";
import { useRULAnalysis } from "../hooks/useRULAnalysis";
import { RULWorkflowStepper } from "../components/RULWorkflowStepper";
import { EngineSelector } from "../components/EngineSelector";
import { SensorUploadForm } from "../components/SensorUploadForm";
import { PredictionResult } from "../components/PredictionResult";
import { PredictionHistory } from "../components/PredictionHistory";

export default function RULAnalysis() {
  const [searchParams, setSearchParams] = useSearchParams();
  const engineIdFromUrl = searchParams.get("engineId");

  const {
    engines,
    selectedEngineId,
    setSelectedEngineId,
    selectedEngine,
    step,
    predictionResult,
    history,
    loading,
    error,
    handleUploadAndPredict,
  } = useRULAnalysis(engineIdFromUrl);

  function handleEngineSelection(engineId) {
    setSelectedEngineId(engineId);
    setSearchParams({ engineId: String(engineId) });
  }

  return (
    <BuyerPortalShell currentTab="dashboard">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Remaining Useful Life (RUL) Predictive Maintenance
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Inference pipeline powered by NASA C-MAPSS dataset algorithms and real-time spare part fitment.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* Workflow Stepper */}
        <RULWorkflowStepper currentStep={step} />

        {/* Step 1: Engine Selector */}
        <EngineSelector
          engines={engines}
          selectedEngineId={selectedEngineId}
          onSelectEngine={handleEngineSelection}
        />

        {/* Step 2 & 3: Sensor Upload Form */}
        <SensorUploadForm
          engine={selectedEngine}
          onUploadSuccess={handleUploadAndPredict}
          loading={loading}
        />

        {/* Step 4: Prediction Result & Recommendations */}
        {predictionResult && (
          <PredictionResult result={predictionResult} />
        )}

        {/* Historical Inferences */}
        <PredictionHistory history={history} />
      </div>
    </BuyerPortalShell>
  );
}
