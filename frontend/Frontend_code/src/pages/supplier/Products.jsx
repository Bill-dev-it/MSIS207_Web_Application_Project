import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { productApi } from "../../services/productApi";
import DataTable from "../../components/common/DataTable";
import Badge from "../../components/common/Badge";
import { formatCurrency } from "../../utils/format";

export default function SupplierProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    productApi.listBySupplier(user?.id).then(setProducts);
  }, [user]);

  const columns = [
    { key: "name", header: "Product", render: (r) => <span className="font-medium text-primary-800">{r.name}</span> },
    { key: "partNumber", header: "Part Number", render: (r) => <span className="mono text-xs">{r.partNumber}</span> },
    { key: "price", header: "Price", render: (r) => formatCurrency(r.price, r.currency) },
    { key: "stock", header: "Stock" },
    { key: "status", header: "Status", render: () => <Badge tone="success">Active</Badge> },
    {
      key: "action",
      header: "Action",
      render: (r) => <Link to={`/supplier/products/${r.id}/edit`} className="text-sm font-medium text-accent">Edit</Link>,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-primary-800">Products</h1>
        <Link to="/supplier/products/new" className="btn-primary">Add Product</Link>
      </div>
      <DataTable columns={columns} rows={products} rowKey="id" emptyLabel="No products listed yet" />
    </div>
  );
}
