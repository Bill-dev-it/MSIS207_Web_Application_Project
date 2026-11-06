import { Link } from "react-router-dom";

export function RulAlertCard({ alert }) {
  if (!alert) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">
          Stored RUL predictions
        </h2>
        <p className="mt-3 text-sm text-slate-600">
          There are no critical stored predictions for this company. AeroRUL does not run RUL inference from this dashboard.
        </p>
        <Link className="mt-4 inline-block text-sm font-semibold text-blue-700 underline" to="/buyer/engines">
          View company engines
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-amber-300 bg-amber-50 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-amber-900">
            Stored critical RUL prediction
          </h2>
          <p className="mt-3 text-lg font-bold text-slate-900">{alert.engineCode}</p>
          <p className="text-sm text-slate-700">{alert.modelName}</p>
          <p className="mt-3 text-sm text-amber-900">
            Recorded prediction: {alert.predictedRul} cycles remaining. This value comes from a previously stored successful prediction; no inference is run here.
          </p>
        </div>
        <Link
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          to={`/buyer/engines/${encodeURIComponent(alert.engineId)}`}
        >
          View engine record
        </Link>
      </div>
    </section>
  );
}
