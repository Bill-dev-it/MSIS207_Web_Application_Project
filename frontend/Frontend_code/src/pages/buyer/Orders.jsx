import { useEffect, useState } from "react";
import { orderApi } from "../../services/orderApi";
import DataTable from "../../components/common/DataTable";
import OrderStatusTimeline from "../../components/order/OrderStatusTimeline";
import { formatCurrency, formatDate } from "../../utils/format";
import { Link } from "react-router-dom";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    orderApi.list().then(setOrders);
  }, []);

  const filtered = statusFilter ? orders.filter((o) => o.status === statusFilter) : orders;

  const columns = [
    { key: "id", header: "Order ID", render: (r) => <Link to={`/buyer/orders/${r.id}`} className="font-medium text-accent">{r.id}</Link> },
    { key: "placedAt", header: "Date", render: (r) => formatDate(r.placedAt) },
    { key: "total", header: "Total", render: (r) => formatCurrency(r.total) },
    { key: "status", header: "Status", render: (r) => <OrderStatusTimeline status={r.status} /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-primary-800">Orders</h1>
        <select className="input max-w-[200px]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {["Placed", "Confirmed", "Processing", "Shipped", "Delivered"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <DataTable columns={columns} rows={filtered} rowKey="id" emptyLabel="No orders yet" />
    </div>
  );
}
