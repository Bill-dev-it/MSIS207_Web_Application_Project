import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import { getSupplierListingById } from "../../services/supplierService";

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
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

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
      })
      .catch(() => setError("Unable to load listing."))
      .finally(() => setLoading(false));
  }, [listingId, isEdit]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setMessage("");
  }

  function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    const productId = Number(form.product_id);
    const price = Number(form.price);
    const stock = Number(form.stock_quantity);
    const leadTime = Number(form.lead_time_days);

    if (!Number.isSafeInteger(productId) || productId <= 0) {
      setError("Product ID must be a positive integer.");
      return;
    }

    if (!form.seller_sku.trim() ||
        form.seller_sku.trim().length > 100) {
      setError("SKU must contain 1 to 100 characters.");
      return;
    }

    if (form.price.trim() === "" ||
        !/^\d+(\.\d{1,2})?$/.test(form.price) ||
        !Number.isFinite(price) ||
        price > 9999999999999999.99) {
      setError("Enter a valid non-negative price with up to 2 decimals.");
      return;
    }

    if (!Number.isSafeInteger(stock) ||
        stock < 0 ||
        !Number.isSafeInteger(leadTime) ||
        leadTime < 0) {
      setError("Stock and lead time must be non-negative integers.");
      return;
    }

    if (stock > 2147483647 || leadTime > 2147483647) {
      setError("Stock and lead time exceed database limits.");
      return;
    }

    if (!["NEW", "USED", "REFURBISHED"].includes(form.condition) ||
        !["DRAFT", "ACTIVE", "HIDDEN"].includes(form.status)) {
      setError("Invalid condition or listing status.");
      return;
    }

    setMessage(
      "Form validation passed. No data was saved. " +
      "The database and SKU uniqueness checks require the backend."
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Supplier Portal"
        title={isEdit ? "Edit Listing" : "Create Listing"}
        description="Enter and validate aviation parts listing details."
      />

      <div className="mb-5">
        <Link
          to="/supplier/listings"
          className="text-sm font-medium text-accent-600 hover:underline"
        >
          ← Back to My Listings
        </Link>
      </div>

      <p
        role="note"
        className="mb-6 rounded-lg bg-accent-50 p-4 text-sm text-primary-800"
      >
        Demo mode: You can fill and validate this form,
        but changes are not saved yet.
      </p>

      {loading && (
        <p role="status">Loading listing...</p>
      )}

      {!loading && error && (
        <p role="alert" className="mb-5 text-sm text-critical">
          {error}
        </p>
      )}

      {!loading && (!isEdit || form.product_id) && (
        <form onSubmit={handleSubmit} className="card p-5 sm:p-8">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="product_id">
                Product ID *
              </label>
              <input
                id="product_id"
                name="product_id"
                type="number"
                min="1"
                step="1"
                className="input"
                value={form.product_id}
                onChange={handleChange}
                required
              />
              <p className="mt-1 text-xs text-neutral-500">
                Must reference an existing catalog product.
              </p>
            </div>

            <div>
              <label className="label" htmlFor="seller_sku">
                Seller SKU *
              </label>
              <input
                id="seller_sku"
                name="seller_sku"
                className="input"
                maxLength="100"
                value={form.seller_sku}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="condition">
                Condition *
              </label>
              <select
                id="condition"
                name="condition"
                className="input"
                value={form.condition}
                onChange={handleChange}
              >
                <option value="NEW">New</option>
                <option value="USED">Used</option>
                <option value="REFURBISHED">Refurbished</option>
              </select>
            </div>

            <div>
              <label className="label" htmlFor="price">
                Price (USD) *
              </label>
              <input
                id="price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                className="input"
                value={form.price}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="stock_quantity">
                Stock Quantity *
              </label>
              <input
                id="stock_quantity"
                name="stock_quantity"
                type="number"
                min="0"
                step="1"
                className="input"
                value={form.stock_quantity}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="lead_time_days">
                Lead Time (Days) *
              </label>
              <input
                id="lead_time_days"
                name="lead_time_days"
                type="number"
                min="0"
                step="1"
                className="input"
                value={form.lead_time_days}
                onChange={handleChange}
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="label" htmlFor="status">
                Listing Status *
              </label>
              <select
                id="status"
                name="status"
                className="input"
                value={form.status}
                onChange={handleChange}
              >
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="HIDDEN">Hidden</option>
              </select>
            </div>
          </div>

          {message && (
            <p
              role="status"
              className="mt-6 rounded-lg border border-success/30 bg-green-50 p-3 text-sm text-green-800"
            >
              {message}
            </p>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <button type="submit" className="btn btn-primary">
              Validate Listing
            </button>

            <Link
              to="/supplier/listings"
              className="btn btn-secondary"
            >
              Cancel
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
