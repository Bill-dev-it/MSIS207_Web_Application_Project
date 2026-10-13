export default function SupplierBadge({ supplier }) {
  if (!supplier) return null;
  return (
    <span className="inline-flex items-center gap-1 text-sm text-neutral-500">
      {supplier.name}
      {supplier.verified && (
        <span className="text-accent" title="Verified supplier">✔</span>
      )}
    </span>
  );
}
