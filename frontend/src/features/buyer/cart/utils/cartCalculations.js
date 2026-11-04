export function formatCurrency(amount) {
  const val = Number(amount);
  if (!Number.isFinite(val)) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
}

export function calculateCartTotals(items = [], shippingFee = 0) {
  const subtotal = items.reduce((sum, item) => {
    return sum + (Number(item.line_total) || 0);
  }, 0);

  const total = subtotal + Number(shippingFee || 0);

  return {
    subtotal,
    shippingFee,
    total,
  };
}

