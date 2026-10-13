import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { engineApi } from "../../services/engineApi";
import { rulApi } from "../../services/rulApi";
import UrgencyBadge from "../../components/engine/UrgencyBadge";
import RULTrendChart from "../../components/engine/RULTrendChart";
import Breadcrumb from "../../components/common/Breadcrumb";
import { formatDate } from "../../utils/format";

export default function EngineDetail() {
  const { id } = useParams();
  const [engine, setEngine] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    engineApi.getById(id).then(setEngine);
    rulApi.getHistory(id).then(setHistory);
  }, [id]);

  if (!engine) return <p className="text-sm text-neutral-500">Loading engine…</p>;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "My Engines", to: "/buyer/engines" }, { label: engine.id }]} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="mono text-xl font-semibold text-primary-800">{engine.id}</h1>
          <p className="text-sm text-neutral-500">{engine.model} · Cycle {engine.currentCycle.toLocaleString()}</p>
        </div>
        <UrgencyBadge urgency={engine.urgency} />
      </div>

      <div className="card p-4">
        <p className="mb-1 font-semibold text-primary-800">Latest Prediction</p>
        <p className="mono text-3xl font-bold text-primary-800">{engine.latestRul} <span className="text-sm font-normal text-neutral-500">cycles remaining</span></p>
        <p className="mt-1 text-sm text-neutral-500">Last analysis: {formatDate(engine.lastAnalysis)}</p>
      </div>

      <div className="card p-4">
        <p className="mb-3 font-semibold text-primary-800">RUL History</p>
        <RULTrendChart data={history} />
      </div>

      <div className="card p-4">
        <p className="mb-2 font-semibold text-primary-800">Sensor Upload History</p>
        <p className="text-sm text-neutral-500">Last CSV uploaded on {formatDate(engine.lastAnalysis)}.</p>
      </div>

      <div className="flex gap-3">
        <Link to={`/buyer/rul-analysis?engine=${engine.id}`} className="btn-secondary">Run New Analysis</Link>
        <Link to={`/buyer/recommendations?engine=${engine.id}`} className="btn-primary">View Replacement Recommendations</Link>
      </div>
    </div>
  );
}
