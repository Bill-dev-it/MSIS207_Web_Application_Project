import { formatCurrency } from "../../utils/format";

export default function PriceBlock({ price, currency, size = "md" }) {
  return (
    <span className={size === "lg" ? "text-2xl font-semibold text-primary-800" : "text-base font-semibold text-primary-800"}>
      {formatCurrency(price, currency)}
    </span>
  );
}
