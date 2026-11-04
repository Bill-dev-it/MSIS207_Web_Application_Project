import { Link } from "react-router-dom";
import { RULGauge } from "./RULGauge";

export function PredictionResult({ result }) {
  if (!result) return null;

  return (
    <div className="space-y-6">
      {/* RUL Gauge */}
      <RULGauge value={result.predictedRul} urgency={result.urgency} />

      {/* Prediction Metadata Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
          Inference Telemetry Details
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block">Target Engine:</span>
            <span className="font-mono font-bold text-slate-900">{result.engineCode}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Engine Model:</span>
            <span className="font-semibold text-slate-800">{result.engineModelName}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Cycle at Prediction:</span>
            <span className="font-mono font-bold text-slate-900">{result.cycle} cycles</span>
          </div>
          <div>
            <span className="text-slate-400 block">Inference Model:</span>
            <span className="font-mono font-semibold text-slate-800">
              {result.modelName} ({result.modelVersion})
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
          {result.explanation}
        </p>

        <p className="text-[11px] text-slate-400 italic">
          * Notice: RUL estimates the remaining useful operating cycles before maintenance overhaul is required. It does not replace full visual and ultrasonic non-destructive testing (NDT).
        </p>
      </div>

      {/* Recommended Compatible Replacement Parts */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Recommended Spare Parts for Replacement ({result.recommendations?.length || 0})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified OEM and PMA replacement parts compatible with {result.engineModelName}
            </p>
          </div>
          <Link
            to={`/marketplace?search=${encodeURIComponent(result.engineModelName)}`}
            className="text-xs font-bold text-blue-600 hover:text-blue-700"
          >
            Browse All Compatible Parts &rarr;
          </Link>
        </div>

        {(!result.recommendations || result.recommendations.length === 0) ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No active supplier listings currently in stock for this engine fitment.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {result.recommendations.map((rec) => {
              const item = rec.listing;
              return (
                <div
                  key={rec.recommendationId}
                  className="p-5 hover:bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                        Rank #{rec.rank}
                      </span>
                      <span className="font-bold text-slate-900 text-sm">
                        {item.product_name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono">
                      Part #: {item.part_number} &bull; Supplier: {item.store_name} &bull; Condition: {item.condition}
                    </p>
                    <p className="text-[11px] text-slate-500 italic">
                      {rec.reason}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <span className="font-mono text-base font-bold text-slate-900">
                        ${Number(item.price).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                      <span className="block text-[10px] text-emerald-600 font-semibold">
                        {item.stock_quantity} available in stock
                      </span>
                    </div>

                    <Link
                      to={`/marketplace/products/${item.product_id}`}
                      className="px-3.5 py-2 bg-[#0B192C] text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs"
                    >
                      View Offer
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

