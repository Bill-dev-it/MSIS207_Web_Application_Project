import { useState } from "react";

export default function ShippingAddressForm({ onSave, onCancel, isSaving = false }) {
  const [formData, setFormData] = useState({
    recipient_name: "",
    phone: "",
    address_line: "",
    city: "",
    region: "",
    postal_code: "",
    country_code: "",
  });
  const [formError, setFormError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!/^[A-Za-z]{2}$/.test(formData.country_code.trim())) {
      setFormError("Enter a two-letter ISO country code, such as US or VN.");
      return;
    }
    setFormError("");
    onSave({ ...formData, country_code: formData.country_code.trim().toUpperCase() });
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
          <label htmlFor="buyer-address-recipient" className="block text-slate-600 font-semibold mb-1">
            Facility / Receiving Contact Name
          </label>
          <input
            type="text"
            name="recipient_name"
            id="buyer-address-recipient"
            value={formData.recipient_name}
            onChange={handleChange}
            placeholder="e.g. Hangar 4 Logistics Dock"
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
          />
        </div>

        <div>
          <label htmlFor="buyer-address-phone" className="block text-slate-600 font-semibold mb-1">
            Dispatch Phone Number
          </label>
          <input
            type="text"
            name="phone"
            id="buyer-address-phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+1-555-0199"
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="buyer-address-line" className="block text-slate-600 font-semibold mb-1">
            Street Address / Airport Terminal / Gate
          </label>
          <input
            type="text"
            name="address_line"
            id="buyer-address-line"
            value={formData.address_line}
            onChange={handleChange}
            placeholder="e.g. 100 Aviation Way, Gate 12"
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
          />
        </div>

        <div>
          <label htmlFor="buyer-address-city" className="block text-slate-600 font-semibold mb-1">City</label>
          <input
            type="text"
            name="city"
            id="buyer-address-city"
            value={formData.city}
            onChange={handleChange}
            placeholder="Dallas"
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
          />
        </div>

        <div>
          <label htmlFor="buyer-address-region" className="block text-slate-600 font-semibold mb-1">State / Province</label>
          <input
            type="text"
            name="region"
            id="buyer-address-region"
            value={formData.region}
            onChange={handleChange}
            placeholder="TX"
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
          />
        </div>

        <div>
          <label htmlFor="buyer-address-postal" className="block text-slate-600 font-semibold mb-1">Postal / ZIP Code</label>
          <input
            type="text"
            name="postal_code"
            id="buyer-address-postal"
            value={formData.postal_code}
            onChange={handleChange}
            placeholder="75261"
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
            required
          />
        </div>

        <div>
          <label htmlFor="buyer-address-country" className="block text-slate-600 font-semibold mb-1">Country code (ISO 3166-1 alpha-2)</label>
          <input
            type="text"
            name="country_code"
            id="buyer-address-country"
            value={formData.country_code}
            onChange={handleChange}
            placeholder="US"
            maxLength={2}
            autoCapitalize="characters"
            pattern="[A-Za-z]{2}"
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
