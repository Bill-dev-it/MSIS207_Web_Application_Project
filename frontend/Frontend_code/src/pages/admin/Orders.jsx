import { ORDERS } from "../../services/mockData";
import DataTable from "../../components/common/DataTable";
import { formatCurrency, formatDate } from "../../utils/format";

export default function AdminOrders() {
  const columns = [
    { key: "id", header: "Order ID" },
    { key: "placedAt", header: "Date", render: (r) => formatDate(r.placedAt) },
    { key: "total", header: "Total", render: (r) => formatCurrency(r.total) },
    { key: "status", header: "Status" },
  ];
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-primary-800">Orders</h1>
      <p className="text-sm text-neutral-500">Admin observes orders; order fulfillment stays with buyers and suppliers.</p>
      <DataTable columns={columns} rows={ORDERS} rowKey="id" />
    </div>
  );
}
