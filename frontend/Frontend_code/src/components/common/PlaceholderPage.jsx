export default function PlaceholderPage({ title, description }) {
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold text-primary-800">{title}</h1>
      <div className="card p-6 text-sm text-neutral-500">
        {description || "This screen is scoped as P2 and not built out in this first pass."}
      </div>
    </div>
  );
}
