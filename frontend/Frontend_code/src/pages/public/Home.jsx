import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { productApi } from "../../services/productApi";
import { SUPPLIERS } from "../../services/mockData";
import ProductCard from "../../components/marketplace/ProductCard";
import SearchBar from "../../components/marketplace/SearchBar";

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    productApi.listCategories().then(setCategories);
    productApi.list().then((all) => setFeatured(all.slice(0, 3)));
  }, []);

  function handleSearch(query) {
    navigate(`/marketplace?q=${encodeURIComponent(query)}`);
  }

  return (
    <div>
      <section className="border-b border-neutral-200 bg-primary-700 text-white">
        <div className="container-page grid gap-8 py-16 md:grid-cols-2 md:items-center">
          <div>
            <h1 className="text-3xl font-bold leading-tight md:text-4xl">
              Know when to replace an engine part — before it fails you.
            </h1>
            <p className="mt-4 max-w-lg text-white/80">
              AeroRUL predicts remaining useful life from your engine sensor data, flags
              replacement urgency, and connects you straight to compatible parts from
              verified aviation suppliers.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/marketplace" className="btn-accent">Explore Marketplace</Link>
              <Link to="/register" className="btn-secondary !bg-transparent !text-white !border-white/30">
                Analyze My Engine
              </Link>
            </div>
          </div>
          <div className="rounded-[12px] border border-white/15 bg-white/5 p-6">
            <p className="mb-3 text-sm font-medium text-white/70">ENG-037 · CFM56-7B</p>
            <div className="flex items-center gap-4">
              <div className="mono text-4xl font-bold text-warning">18</div>
              <div className="text-sm text-white/80">predicted cycles remaining — Replacement Soon</div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page -mt-6 pb-2">
        <div className="card p-4">
          <SearchBar onSearch={handleSearch} />
        </div>
      </section>

      <section className="container-page py-12">
        <h2 className="mb-4 text-lg font-semibold text-primary-800">Featured Categories</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {categories.map((c) => (
            <Link
              key={c.id}
              to={`/marketplace?category=${c.id}`}
              className="card flex flex-col items-center gap-2 p-4 text-center hover:border-accent"
            >
              <span className="text-2xl">🔩</span>
              <span className="text-sm font-medium text-primary-800">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-page py-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-primary-800">Featured & Recommended Products</h2>
          <Link to="/marketplace" className="text-sm font-medium text-accent hover:underline">View all</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="container-page py-12">
        <h2 className="mb-4 text-lg font-semibold text-primary-800">Verified Suppliers</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {SUPPLIERS.map((s) => (
            <div key={s.id} className="card p-4">
              <p className="font-medium text-primary-800">{s.name}</p>
              <p className="text-sm text-neutral-500">{s.region} · ⭐ {s.rating}</p>
              {s.verified && <p className="mt-1 text-xs font-medium text-accent">✔ Verified supplier</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-white py-12">
        <div className="container-page">
          <h2 className="mb-6 text-lg font-semibold text-primary-800">How RUL-Based Replacement Works</h2>
          <div className="grid gap-4 sm:grid-cols-4">
            {["Predict", "Understand", "Recommend", "Purchase"].map((step, idx) => (
              <div key={step} className="card p-4">
                <p className="mono text-xs text-neutral-500">{idx + 1}</p>
                <p className="mt-1 font-medium text-primary-800">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
