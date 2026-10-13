import { useState } from "react";
import { ORDERS, PRODUCTS } from "../../services/mockData";
import DataTable from "../../components/common/DataTable";
import { formatCurrency, formatDate } from "../../utils/format";

const STAGES = ["New Orders", "Confirmed", "Processing", "Shipped", "Delivered"];
const STAGE_MAP = { Placed: "New Orders", Confirmed: "Confirmed", Processing: "Processing", Shipped: "Shipped", Delivered: "Delivered" };

export default function SupplierOrders() {
  const [statusFilter, setStatusFilter] = useState("");
  const rows = ORDERS.map((o) => ({
    ...o,
    stage: STAGE_MAP[o.status] || o.status,
    itemSummary: o.items.map((i) => PRODUCTS.find((p) => p.id === i.productId)?.name).join(", "),
  }));
  const filtered = statusFilter ? rows.filter((r) => r.stage === statusFilter) : rows;

  const columns = [
    { key: "id", header: "Order ID", render: (r) => <span className="font-medium text-primary-800">{r.id}</span> },
    { key: "itemSummary", header: "Items" },
    { key: "placedAt", header: "Date", render: (r) => formatDate(r.placedAt) },
    { key: "total", header: "Total", render: (r) => formatCurrency(r.total) },
    { key: "stage", header: "Status" },
    { key: "action", header: "Action", render: () => <button className="btn-secondary text-xs">Update Status</button> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-primary-800">Orders</h1>
        <select className="input max-w-[200px]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STAGES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <DataTable columns={columns} rows={filtered} rowKey="id" emptyLabel="No orders yet" />
    </div>
  );
}
