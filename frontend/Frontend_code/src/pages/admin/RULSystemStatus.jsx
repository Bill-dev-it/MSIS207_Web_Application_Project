export default function RULSystemStatus() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-primary-800">RUL System Status</h1>
      <div className="card space-y-3 p-4 text-sm">
        <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-success" /> Prediction API — Operational</div>
        <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-success" /> Sensor ingestion — Operational</div>
        <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-warning" /> Model retraining job — Degraded</div>
      </div>
    </div>
  );
}
