import { useState } from "react";

export default function ShippingAddressForm({ onSave, onCancel, isSaving = false }) {
  const [formData, setFormData] = useState({
    recipient_name: "",
    phone: "",
    address_line: "",
    city: "",
    region: "",
    postal_code: "",
    country_code: "USA",
  });
  const [formError, setFormError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.address_line || !formData.city || !formData.postal_code) {
      setFormError("Address line, city, and postal code are mandatory.");
      return;
    }
    setFormError("");
    onSave(formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4"
    >
      <h3 className="text-sm font-bold text-slate-800">Register New Delivery Location</h3>

      {formError && (
        <p className="text-xs text-rose-600 font-semibold">{formError}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label className="block text-slate-600 font-semibold mb-1">
            Facility / Receiving Contact Name
          </label>
          <input
            type="text"
            name="recipient_name"
            value={formData.recipient_name}
            onChange={handleChange}
            placeholder="e.g. Hangar 4 Logistics Dock"
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
          />
        </div>

        <div>
          <label className="block text-slate-600 font-semibold mb-1">
            Dispatch Phone Number
          </label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+1-555-0199"
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-slate-600 font-semibold mb-1">
            Street Address / Airport Terminal / Gate
          </label>
          <input
            type="text"
            name="address_line"
            value={formData.address_line}
            onChange={handleChange}
            placeholder="e.g. 100 Aviation Way, Gate 12"
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
          />
        </div>

        <div>
          <label className="block text-slate-600 font-semibold mb-1">City</label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="Dallas"
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
          />
        </div>

        <div>
          <label className="block text-slate-600 font-semibold mb-1">State / Province</label>
          <input
            type="text"
            name="region"
            value={formData.region}
            onChange={handleChange}
            placeholder="TX"
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
          />
        </div>

        <div>
          <label className="block text-slate-600 font-semibold mb-1">Postal / ZIP Code</label>
          <input
            type="text"
            name="postal_code"
            value={formData.postal_code}
            onChange={handleChange}
            placeholder="75261"
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
            required
          />
        </div>

        <div>
          <label className="block text-slate-600 font-semibold mb-1">Country</label>
          <input
            type="text"
            name="country_code"
            value={formData.country_code}
            onChange={handleChange}
            placeholder="USA"
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg border border-slate-200 bg-white"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:bg-slate-300"
        >
          {isSaving ? "Saving..." : "Save Facility Address"}
        </button>
      </div>
    </form>
  );
}

