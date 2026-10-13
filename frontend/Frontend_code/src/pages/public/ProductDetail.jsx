import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { productApi } from "../../services/productApi";
import { useCart } from "../../hooks/useCart";
import PriceBlock from "../../components/marketplace/PriceBlock";
import CompatibilityBadge from "../../components/marketplace/CompatibilityBadge";
import SupplierBadge from "../../components/marketplace/SupplierBadge";
import Breadcrumb from "../../components/common/Breadcrumb";

const TABS = ["Overview", "Technical Specs", "Compatibility", "Shipping", "Supplier", "Reviews"];

export default function ProductDetail() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const [product, setProduct] = useState(null);
  const [tab, setTab] = useState("Overview");
  const { addItem } = useCart();

  const fromRecommendation = params.get("from") === "recommendation";
  const engineId = params.get("engine");

  useEffect(() => {
    productApi.getById(id).then(setProduct);
  }, [id]);

  if (!product) return <div className="container-page py-8 text-sm text-neutral-500">Loading product…</div>;

  return (
    <div className="container-page py-8">
      <Breadcrumb items={[{ label: "Home", to: "/" }, { label: "Marketplace", to: "/marketplace" }, { label: product.name }]} />

      {fromRecommendation && (
        <div className="mb-4 rounded-[12px] border border-accent/30 bg-accent-50 p-4 text-sm text-primary-800">
          <span className="font-medium">Recommended</span> because {engineId || "your engine"} has low predicted RUL /
          high replacement urgency, and this product is compatible with the engine model.
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-2">
        <div className="flex h-72 items-center justify-center rounded-[12px] bg-neutral-100 text-6xl">✈️</div>
        <div>
          <h1 className="text-xl font-semibold text-primary-800">{product.name}</h1>
          <p className="mono mt-1 text-sm text-neutral-500">{product.partNumber}</p>
          <div className="mt-4 flex items-center gap-3">
            <PriceBlock price={product.price} currency={product.currency} size="lg" />
            <span className="text-sm text-neutral-500">{product.stock} in stock · ⭐ {product.rating}</span>
          </div>
          <div className="mt-3">
            <SupplierBadge supplier={product.supplier} />
          </div>
          <div className="mt-3">
            <CompatibilityBadge models={product.compatibility} score={product.compatibilityScore} />
          </div>
          <p className="mt-2 text-sm text-neutral-500">
            {product.condition} · Estimated delivery in {product.deliveryDays} days
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button className="btn-primary" onClick={() => addItem(product)} disabled={product.stock <= 0}>Add to Cart</button>
            <button className="btn-accent" onClick={() => addItem(product)} disabled={product.stock <= 0}>Buy Now</button>
            <button className="btn-secondary">Wishlist</button>
          </div>
        </div>
      </div>

      <div className="mt-10 border-b border-neutral-200">
        <div className="flex gap-6 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-medium ${
                tab === t ? "border-primary-700 text-primary-800" : "border-transparent text-neutral-500 hover:text-primary-800"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="py-6 text-sm text-primary-800">
        {tab === "Overview" && (
          <p>
            {product.name} ({product.partNumber}) is a {product.condition.toLowerCase()} component listed by{" "}
            {product.supplier?.name}, compatible with {product.compatibility.join(", ")}.
          </p>
        )}
        {tab === "Technical Specs" && (
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <li><span className="text-neutral-500">Category:</span> {product.categoryId}</li>
            <li><span className="text-neutral-500">Condition:</span> {product.condition}</li>
            <li><span className="text-neutral-500">Part Number:</span> {product.partNumber}</li>
          </ul>
        )}
        {tab === "Compatibility" && <CompatibilityBadge models={product.compatibility} score={product.compatibilityScore} />}
        {tab === "Shipping" && <p>Estimated delivery: {product.deliveryDays} business days after order confirmation.</p>}
        {tab === "Supplier" && (
          <div>
            <p className="font-medium">{product.supplier?.name}</p>
            <p className="text-neutral-500">Region: {product.supplier?.region} · Rating {product.supplier?.rating}</p>
            <Link to="#" className="mt-1 inline-block text-accent hover:underline">View supplier store</Link>
          </div>
        )}
        {tab === "Reviews" && <p className="text-neutral-500">No reviews yet for this product.</p>}
      </div>
    </div>
  );
}
