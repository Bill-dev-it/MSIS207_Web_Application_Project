import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import { getSupplierListingById, saveSupplierListing } from "../../services/supplierService";
import { SUPPLIER_DEMO_MODE } from "../../features/supplier/api";
import { validateListing } from "../../features/supplier/listings/listingValidation";
import ProductSelector from "../../features/supplier/listings/ProductSelector";

const emptyForm = {
  product_id: "",
  seller_sku: "",
  condition: "NEW",
  price: "",
  stock_quantity: "0",
  lead_time_days: "0",
  status: "DRAFT",
};

export default function SupplierListingForm() {
  const { listingId } = useParams();
  const isEdit = Boolean(listingId);
  const [form, setForm] = useState(emptyForm);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;

    getSupplierListingById(listingId)
      .then((listing) => {
        if (!listing) {
          setError("Listing not found.");
          return;
        }

        setForm({
          product_id: String(listing.product_id),
          seller_sku: listing.seller_sku,
          condition: listing.condition,
          price: String(listing.price),
          stock_quantity: String(listing.stock_quantity),
          lead_time_days: String(listing.lead_time_days),
          status: listing.status,
        });
        setSelectedProduct({
          product_id: String(listing.product_id),
          product_name: listing.product_name,
          part_number: listing.part_number,
        });
      })
      .catch((err) => setError(err.message || "Unable to load listing."))
      .finally(() => setLoading(false));
  }, [listingId, isEdit]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setMessage("");
  }

  function handleProductSelect(product) {
    setSelectedProduct(product);
    setForm((previous) => ({ ...previous, product_id: String(product.product_id) }));
    setMessage("");
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    const validationError = validateListing(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (SUPPLIER_DEMO_MODE) {
      setMessage("Form validation passed. No data was saved in demo mode.");
      return;
    }
    setSaving(true);
    try {
      await saveSupplierListing(listingId, form);
      setMessage(isEdit ? "Listing updated successfully." : "Listing created successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Supplier Portal"
        title={isEdit ? "Edit Listing" : "Create Listing"}
        description="Enter and validate aviation parts listing details."
      />

      <div className="mb-5">
        <Link to="/supplier/listings" className="text-sm font-medium text-accent-600 hover:underline">
          ← Back to My Listings
        </Link>
      </div>

      <p role="note" className="mb-6 rounded-lg bg-accent-50 p-4 text-sm text-primary-800">
        {SUPPLIER_DEMO_MODE
          ? "Demo mode: You can validate this form but changes are not saved."
          : "Live mode: Saving requires supplier login."}
      </p>

      {loading && <p role="status">Loading listing...</p>}
      {!loading && error && (
        <p role="alert" className="mb-5 text-sm text-critical">{error}</p>
      )}

      {!loading && (!isEdit || form.product_id) && (
        <form onSubmit={handleSubmit} className="card p-5 sm:p-8">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <ProductSelector selectedProduct={selectedProduct} onSelect={handleProductSelect} />
              <input type="hidden" name="product_id" value={form.product_id} />
            </div>
            <div>
              <label className="label" htmlFor="seller_sku">Seller SKU *</label>
              <input id="seller_sku" name="seller_sku" className="input" maxLength="100"
                value={form.seller_sku} onChange={handleChange} required />
            </div>
            <div>
              <label className="label" htmlFor="condition">Condition *</label>
              <select id="condition" name="condition" className="input" value={form.condition} onChange={handleChange}>
                <option value="NEW">New</option>
                <option value="USED">Used</option>
                <option value="REFURBISHED">Refurbished</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="price">Price (USD) *</label>
              <input id="price" name="price" type="number" min="0" step="0.01" className="input"
                value={form.price} onChange={handleChange} required />
            </div>
            <div>
              <label className="label" htmlFor="stock_quantity">Stock Quantity *</label>
              <input id="stock_quantity" name="stock_quantity" type="number" min="0" step="1" className="input"
                value={form.stock_quantity} onChange={handleChange} required />
            </div>
            <div>
              <label className="label" htmlFor="lead_time_days">Lead Time (Days) *</label>
              <input id="lead_time_days" name="lead_time_days" type="number" min="0" step="1" className="input"
                value={form.lead_time_days} onChange={handleChange} required />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="status">Listing Status *</label>
              <select id="status" name="status" className="input" value={form.status} onChange={handleChange}>
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="HIDDEN">Hidden</option>
              </select>
            </div>
          </div>

          {message && (
            <p role="status" className="mt-6 rounded-lg border border-success/30 bg-green-50 p-3 text-sm text-green-800">
              {message}
            </p>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : SUPPLIER_DEMO_MODE ? "Validate Listing" : isEdit ? "Save Changes" : "Create Listing"}
            </button>
            <Link to="/supplier/listings" className="btn btn-secondary">Cancel</Link>
          </div>
        </form>
      )}
    </div>
  );
}
