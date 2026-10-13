import { PRODUCTS } from "../../services/mockData";
import DataTable from "../../components/common/DataTable";
import Badge from "../../components/common/Badge";
import { formatCurrency } from "../../utils/format";

export default function AdminProducts() {
  const columns = [
    { key: "name", header: "Product" },
    { key: "partNumber", header: "Part Number", render: (r) => <span className="mono text-xs">{r.partNumber}</span> },
    { key: "price", header: "Price", render: (r) => formatCurrency(r.price, r.currency) },
    { key: "status", header: "Status", render: () => <Badge tone="success">Active</Badge> },
    { key: "action", header: "Action", render: () => <button className="btn-secondary !px-2 !py-1 text-xs">Hide</button> },
  ];
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-primary-800">Products</h1>
      <DataTable columns={columns} rows={PRODUCTS} rowKey="id" />
    </div>
  );
}
