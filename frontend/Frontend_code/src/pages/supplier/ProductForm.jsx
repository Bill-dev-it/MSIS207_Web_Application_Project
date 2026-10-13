import { useNavigate, useParams } from "react-router-dom";

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  function handleSubmit(e) {
    e.preventDefault();
    navigate("/supplier/products");
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-primary-800">{isEdit ? "Edit Product" : "Add Product"}</h1>
      <form className="card grid gap-4 p-5 sm:grid-cols-2" onSubmit={handleSubmit}>
        <div>
          <label className="label">Product name</label>
          <input className="input" required />
        </div>
        <div>
          <label className="label">Part number / SKU</label>
          <input className="input" required />
        </div>
        <div>
          <label className="label">Category</label>
          <select className="input">
            <option>Engines</option>
            <option>Turbine Components</option>
            <option>Compressor Parts</option>
            <option>Bearings</option>
            <option>Sensors</option>
          </select>
        </div>
        <div>
          <label className="label">Engine compatibility</label>
          <input className="input" placeholder="e.g. CFM56-7B, CFM56-5B" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Description</label>
          <textarea className="input" rows={3} />
        </div>
        <div>
          <label className="label">Price (USD)</label>
          <input type="number" className="input" required />
        </div>
        <div>
          <label className="label">Stock</label>
          <input type="number" className="input" required />
        </div>
        <div>
          <label className="label">Condition</label>
          <select className="input">
            <option>New</option>
            <option>Refurbished</option>
            <option>Exchange</option>
          </select>
        </div>
        <div>
          <label className="label">Shipping estimate (days)</label>
          <input type="number" className="input" />
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input">
            <option>Draft</option>
            <option>Active</option>
            <option>Hidden</option>
          </select>
        </div>
        <div>
          <label className="label">Images</label>
          <input type="file" className="text-sm" multiple />
        </div>
        <div className="flex gap-3 sm:col-span-2">
          <button type="submit" className="btn-primary">{isEdit ? "Save Changes" : "Create Product"}</button>
          <button type="button" className="btn-secondary" onClick={() => navigate("/supplier/products")}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
