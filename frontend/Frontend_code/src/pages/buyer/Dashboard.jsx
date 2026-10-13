import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { engineApi } from "../../services/engineApi";
import { orderApi } from "../../services/orderApi";
import UrgencyBadge from "../../components/engine/UrgencyBadge";
import OrderStatusTimeline from "../../components/order/OrderStatusTimeline";
import { formatCurrency, formatDate } from "../../utils/format";

export default function Dashboard() {
  const { user } = useAuth();
  const [engines, setEngines] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    engineApi.listMyEngines().then(setEngines);
    orderApi.list().then(setOrders);
  }, []);

  const alertEngine = engines.find((e) => e.urgency === "Replace Soon");
  const alertCount = engines.filter((e) => e.urgency !== "Normal").length;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-primary-800">Welcome, {user?.companyName}</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Engines", value: engines.length },
          { label: "Active Orders", value: orders.filter((o) => o.status !== "Delivered").length },
          { label: "RUL Alerts", value: alertCount },
          { label: "Wishlist", value: 0 },
        ].map((kpi) => (
          <div key={kpi.label} className="card p-4">
            <p className="text-2xl font-semibold text-primary-800">{kpi.value}</p>
            <p className="text-sm text-neutral-500">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="card p-4">
        <p className="mb-3 font-semibold text-primary-800">Engine Health Overview</p>
        <div className="divide-y divide-neutral-200">
          {engines.map((e) => (
            <div key={e.id} className="flex items-center justify-between py-2.5 text-sm">
              <span className="mono font-medium text-primary-800">{e.id}</span>
              <span className="mono text-neutral-500">RUL {e.latestRul}</span>
              <UrgencyBadge urgency={e.urgency} />
            </div>
          ))}
        </div>
      </div>

      {alertEngine && (
        <div className="card border-critical/30 bg-critical/5 p-4">
          <p className="font-semibold text-primary-800">Replacement Recommendation</p>
          <p className="mt-1 text-sm text-primary-800">
            {alertEngine.id} · RUL {alertEngine.latestRul} cycles ·{" "}
            <span className="font-medium text-critical">HIGH urgency</span>
          </p>
          <Link to="/buyer/recommendations" className="btn-primary mt-3 inline-flex">
            View Replacement Options
          </Link>
        </div>
      )}

      <div className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-semibold text-primary-800">Recent Orders / Shipment Status</p>
          <Link to="/buyer/orders" className="text-sm text-accent hover:underline">View all</Link>
        </div>
        <div className="space-y-4">
          {orders.slice(0, 2).map((o) => (
            <div key={o.id} className="border-b border-neutral-200 pb-3 last:border-0 last:pb-0">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-primary-800">{o.id}</span>
                <span className="text-neutral-500">{formatDate(o.placedAt)} · {formatCurrency(o.total)}</span>
              </div>
              <OrderStatusTimeline status={o.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
