import { SUPPLIERS } from "../../services/mockData";
import DataTable from "../../components/common/DataTable";
import Badge from "../../components/common/Badge";

export default function AdminSuppliers() {
  const columns = [
    { key: "name", header: "Supplier" },
    { key: "region", header: "Region" },
    { key: "rating", header: "Rating" },
    { key: "verified", header: "Status", render: (r) => <Badge tone={r.verified ? "success" : "warning"}>{r.verified ? "Verified" : "Pending"}</Badge> },
    {
      key: "action",
      header: "Action",
      render: (r) => (
        <div className="flex gap-2">
          <button className="btn-secondary !px-2 !py-1 text-xs">{r.verified ? "Suspend" : "Approve"}</button>
        </div>
      ),
    },
  ];
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-primary-800">Suppliers</h1>
      <DataTable columns={columns} rows={SUPPLIERS} rowKey="id" />
    </div>
  );
}
