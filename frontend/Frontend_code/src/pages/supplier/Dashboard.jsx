import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { productApi } from "../../services/productApi";
import { formatCurrency } from "../../utils/format";

export default function SupplierDashboard() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    productApi.listBySupplier(user?.id).then(setProducts);
  }, [user]);

  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 5);
  const revenue = products.reduce((sum, p) => sum + p.price * Math.max(0, 20 - p.stock), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-primary-800">Welcome back, {user?.companyName}</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Revenue (30d)", value: formatCurrency(revenue) },
          { label: "Orders", value: 12 },
          { label: "Active Products", value: products.length },
          { label: "Low Stock", value: lowStock.length },
        ].map((kpi) => (
          <div key={kpi.label} className="card p-4">
            <p className="text-2xl font-semibold text-primary-800">{kpi.value}</p>
            <p className="text-sm text-neutral-500">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-4">
          <p className="mb-2 font-semibold text-primary-800">Top Products</p>
          <div className="space-y-2 text-sm">
            {products.slice(0, 4).map((p) => (
              <div key={p.id} className="flex justify-between">
                <span>{p.name}</span>
                <span className="text-neutral-500">{p.stock} in stock</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-4">
          <p className="mb-2 font-semibold text-primary-800">Low-stock Alerts</p>
          {lowStock.length === 0 ? (
            <p className="text-sm text-neutral-500">No products are running low.</p>
          ) : (
            <div className="space-y-2 text-sm">
              {lowStock.map((p) => (
                <div key={p.id} className="flex justify-between text-critical">
                  <span>{p.name}</span>
                  <span>{p.stock} left</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
