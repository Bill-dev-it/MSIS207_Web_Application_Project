import { SUPPLIERS, PRODUCTS, ORDERS } from "../../services/mockData";
import { formatCurrency } from "../../utils/format";

export default function AdminDashboard() {
  const revenue = ORDERS.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-primary-800">Admin Dashboard</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "Users", value: 128 },
          { label: "Suppliers", value: SUPPLIERS.length },
          { label: "Orders", value: ORDERS.length },
          { label: "Revenue", value: formatCurrency(revenue) },
          { label: "Products", value: PRODUCTS.length },
        ].map((kpi) => (
          <div key={kpi.label} className="card p-4">
            <p className="text-xl font-semibold text-primary-800">{kpi.value}</p>
            <p className="text-sm text-neutral-500">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-4">
          <p className="mb-2 font-semibold text-primary-800">New Supplier Requests</p>
          <div className="space-y-2 text-sm">
            {SUPPLIERS.filter((s) => !s.verified).map((s) => (
              <div key={s.id} className="flex items-center justify-between">
                <span>{s.name}</span>
                <div className="flex gap-2">
                  <button className="btn-secondary !px-2 !py-1 text-xs">Approve</button>
                  <button className="btn-secondary !px-2 !py-1 text-xs text-critical">Reject</button>
                </div>
              </div>
            ))}
            {SUPPLIERS.every((s) => s.verified) && <p className="text-neutral-500">No pending requests.</p>}
          </div>
        </div>
        <div className="card p-4">
          <p className="mb-2 font-semibold text-primary-800">System / RUL Service Status</p>
          <div className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 rounded-full bg-success" />
            RUL prediction service — Operational
          </div>
        </div>
      </div>
    </div>
  );
}
