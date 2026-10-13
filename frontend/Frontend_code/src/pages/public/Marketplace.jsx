import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { productApi } from "../../services/productApi";
import { useCart } from "../../hooks/useCart";
import ProductCard from "../../components/marketplace/ProductCard";
import FilterPanel from "../../components/marketplace/FilterPanel";
import SearchBar from "../../components/marketplace/SearchBar";
import EmptyState from "../../components/common/EmptyState";
import Breadcrumb from "../../components/common/Breadcrumb";

export default function Marketplace() {
  const [params] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    query: params.get("q") || undefined,
    categoryId: params.get("category") || undefined,
  });
  const { addItem } = useCart();

  useEffect(() => {
    productApi.listCategories().then(setCategories);
  }, []);

  useEffect(() => {
    setLoading(true);
    productApi.list(filters).then((res) => {
      setProducts(res);
      setLoading(false);
    });
  }, [filters]);

  return (
    <div className="container-page py-8">
      <Breadcrumb items={[{ label: "Home", to: "/" }, { label: "Marketplace" }]} />
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-primary-800">Marketplace</h1>
        <div className="w-full sm:max-w-md">
          <SearchBar defaultValue={filters.query} onSearch={(q) => setFilters((f) => ({ ...f, query: q }))} />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-[240px_1fr]">
        <FilterPanel categories={categories} filters={filters} onChange={setFilters} />
        <div>
          {loading ? (
            <p className="text-sm text-neutral-500">Loading products…</p>
          ) : products.length === 0 ? (
            <EmptyState title="No products match your filters" description="Try clearing a filter or searching a different part number." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} onAddToCart={addItem} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
