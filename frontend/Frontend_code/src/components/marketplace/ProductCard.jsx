import { Link } from "react-router-dom";
import Badge from "../common/Badge";
import PriceBlock from "./PriceBlock";
import SupplierBadge from "./SupplierBadge";

const STOCK_TONE = { "In stock": "success", "Low stock": "warning", "Out of stock": "critical" };

function stockLabel(stock) {
  if (stock <= 0) return "Out of stock";
  if (stock <= 5) return "Low stock";
  return "In stock";
}

export default function ProductCard({ product, onAddToCart }) {
  const stock = stockLabel(product.stock);
  return (
    <div className="card flex flex-col overflow-hidden">
      <Link to={`/products/${product.id}`} className="flex h-36 items-center justify-center bg-neutral-100 text-4xl">
        ✈️
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/products/${product.id}`} className="text-sm font-semibold text-primary-800 hover:text-accent">
            {product.name}
          </Link>
          <Badge tone={STOCK_TONE[stock]}>{stock}</Badge>
        </div>
        <p className="mono text-xs text-neutral-500">{product.partNumber}</p>
        <SupplierBadge supplier={product.supplier} />
        <div className="flex flex-wrap gap-1">
          {product.compatibility.map((c) => (
            <span key={c} className="mono rounded-md bg-neutral-100 px-1.5 py-0.5 text-[11px] text-primary-800">
              {c}
            </span>
          ))}
        </div>
        <div className="mt-auto flex items-center justify-between pt-2">
          <PriceBlock price={product.price} currency={product.currency} />
          <div className="flex gap-2">
            <Link to={`/products/${product.id}`} className="btn-secondary !px-3 !py-1.5 text-xs">
              View
            </Link>
            <button
              className="btn-primary !px-3 !py-1.5 text-xs"
              onClick={() => onAddToCart?.(product)}
              disabled={product.stock <= 0}
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
