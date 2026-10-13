import { Link } from "react-router-dom";
import UrgencyBadge from "./UrgencyBadge";
import { formatDate } from "../../utils/format";

export default function EngineCard({ engine }) {
  return (
    <div className="card flex items-center justify-between gap-4 p-4">
      <div>
        <p className="mono text-sm font-semibold text-primary-800">{engine.id}</p>
        <p className="text-sm text-neutral-500">{engine.model} · Cycle {engine.currentCycle.toLocaleString()}</p>
        <p className="text-xs text-neutral-500">Last analysis {formatDate(engine.lastAnalysis)}</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="mono text-lg font-semibold text-primary-800">{engine.latestRul}</p>
          <UrgencyBadge urgency={engine.urgency} />
        </div>
        <Link to={`/buyer/engines/${engine.id}`} className="btn-secondary text-xs">View</Link>
      </div>
    </div>
  );
}
