export default function FilterPanel({ categories, filters, onChange }) {
  function set(key, value) {
    onChange({ ...filters, [key]: value });
  }
  return (
    <div className="card space-y-5 p-4">
      <div>
        <p className="label">Category</p>
        <select className="input" value={filters.categoryId || ""} onChange={(e) => set("categoryId", e.target.value || undefined)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <p className="label">Engine Model</p>
        <input className="input" placeholder="e.g. CFM56-7B" value={filters.engineModel || ""} onChange={(e) => set("engineModel", e.target.value || undefined)} />
      </div>
      <div>
        <p className="label">Part Number</p>
        <input className="input" placeholder="e.g. HPT-7B-3391" value={filters.query || ""} onChange={(e) => set("query", e.target.value || undefined)} />
      </div>
      <div>
        <p className="label">Max Price</p>
        <input type="number" className="input" placeholder="No limit" value={filters.maxPrice || ""} onChange={(e) => set("maxPrice", e.target.value ? Number(e.target.value) : undefined)} />
      </div>
      <button className="btn-secondary w-full" onClick={() => onChange({})}>
        Clear filters
      </button>
    </div>
  );
}
