import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { engineApi } from "../../services/engineApi";
import DataTable from "../../components/common/DataTable";
import UrgencyBadge from "../../components/engine/UrgencyBadge";
import { formatDate } from "../../utils/format";

export default function MyEngines() {
  const [engines, setEngines] = useState([]);

  useEffect(() => {
    engineApi.listMyEngines().then(setEngines);
  }, []);

  const columns = [
    { key: "id", header: "Engine ID", render: (r) => <span className="mono font-medium">{r.id}</span> },
    { key: "model", header: "Engine Model" },
    { key: "currentCycle", header: "Current Cycle", render: (r) => r.currentCycle.toLocaleString() },
    { key: "latestRul", header: "Latest RUL", render: (r) => <span className="mono">{r.latestRul}</span> },
    { key: "urgency", header: "Urgency", render: (r) => <UrgencyBadge urgency={r.urgency} /> },
    { key: "lastAnalysis", header: "Last Analysis", render: (r) => formatDate(r.lastAnalysis) },
    {
      key: "action",
      header: "Action",
      render: (r) => (
        <div className="flex gap-3 text-sm font-medium text-accent">
          <Link to={`/buyer/engines/${r.id}`}>View</Link>
          <Link to={`/buyer/rul-analysis?engine=${r.id}`}>Analyze</Link>
          <Link to={`/buyer/recommendations?engine=${r.id}`}>Recommendations</Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-primary-800">My Engines</h1>
      <DataTable columns={columns} rows={engines} rowKey="id" />
    </div>
  );
}
