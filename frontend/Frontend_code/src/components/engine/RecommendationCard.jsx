import { Link } from "react-router-dom";
import { formatCurrency } from "../../utils/format";
import CompatibilityBadge from "../marketplace/CompatibilityBadge";
import SupplierBadge from "../marketplace/SupplierBadge";

export default function RecommendationCard({ product, highlight, onAddToCart }) {
  return (
    <div className={`card p-4 ${highlight ? "border-accent ring-1 ring-accent/30" : ""}`}>
      {highlight && <p className="mb-2 text-xs font-semibold uppercase text-accent">Top Recommendation</p>}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <Link to={`/products/${product.id}`} className="font-semibold text-primary-800 hover:text-accent">
            {product.name}
          </Link>
          <p className="mono text-xs text-neutral-500">{product.partNumber}</p>
          <CompatibilityBadge models={product.compatibility} score={product.compatibilityScore} />
          <SupplierBadge supplier={product.supplier} />
        </div>
        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          <p className="text-lg font-semibold text-primary-800">{formatCurrency(product.price, product.currency)}</p>
          <p className="text-xs text-neutral-500">{product.stock} in stock · {product.deliveryDays}-day delivery</p>
          <div className="flex gap-2">
            <Link to={`/products/${product.id}`} className="btn-secondary text-xs">View Product</Link>
            <button className="btn-primary text-xs" onClick={() => onAddToCart?.(product)}>Add to Cart</button>
          </div>
        </div>
      </div>
    </div>
  );
}
