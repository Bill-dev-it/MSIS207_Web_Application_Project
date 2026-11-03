import { useEffect, useState } from "react";
import { fetchSupplierOverview } from "./overviewApi";

export default function OverviewCards() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetchSupplierOverview()
      .then((data) => { if (active) setSummary(data); })
      .catch((err) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, []);

  if (error) return <p role="alert" className="text-critical">{error}</p>;
  if (!summary) return <p role="status">Loading supplier overview...</p>;

  const cards = [
    ["Total listings", summary.listings.total],
    ["Active listings", summary.listings.active],
    ["Low stock", summary.listings.low_stock],
    ["Incoming orders", summary.orders.total],
  ];
  return (
    <section aria-label="Supplier statistics" className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map(([label, value]) => (
        <div key={label} className="card p-4">
          <p className="text-sm text-neutral-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-primary-800">{value}</p>
        </div>
      ))}
    </section>
  );
}
