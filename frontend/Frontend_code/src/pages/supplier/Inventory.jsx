import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { productApi } from "../../services/productApi";
import DataTable from "../../components/common/DataTable";

export default function Inventory() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    productApi.listBySupplier(user?.id).then(setProducts);
  }, [user]);

  const columns = [
    { key: "name", header: "Product" },
    { key: "partNumber", header: "Part Number", render: (r) => <span className="mono text-xs">{r.partNumber}</span> },
    {
      key: "stock",
      header: "Stock Quantity",
      render: (r) => <input type="number" className="input !w-24" defaultValue={r.stock} />,
    },
    { key: "save", header: "", render: () => <button className="btn-secondary text-xs">Update</button> },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-primary-800">Inventory</h1>
      <p className="text-sm text-neutral-500">
        Manage stock quantity for your marketplace listings. Upstream procurement, warehouse transfer, and goods
        receipt are out of scope for this marketplace.
      </p>
      <DataTable columns={columns} rows={products} rowKey="id" />
    </div>
  );
}
