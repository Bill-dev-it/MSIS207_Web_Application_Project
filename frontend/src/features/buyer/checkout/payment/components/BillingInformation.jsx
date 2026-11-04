export default function BillingInformation({
  useShippingAddressForBilling,
  onToggleSameAsShipping,
  company,
  billingNotes,
  onBillingNotesChange,
}) {
  return (
    <section className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs">
      <div className="mb-4">
        <h2 className="text-base font-bold text-slate-900">
          2. Billing Entity & Invoicing
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Verify corporate billing attribution and accounts payable references.
        </p>
      </div>

      <div className="space-y-4">
        <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100/60 transition">
          <input
            type="checkbox"
            checked={useShippingAddressForBilling}
            onChange={(e) => onToggleSameAsShipping(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-xs font-semibold text-slate-800">
            Use maintenance facility destination address as billing destination
          </span>
        </label>

        {company && (
          <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl text-xs space-y-1">
            <p className="font-bold text-slate-900">
              Tax Invoice Issued To: {company.company_name}
            </p>
            <p className="text-slate-500">
              Corporate Account Jurisdiction: {company.country_code} • Tax / VAT ID: {company.tax_id || "Exempt / Direct"}
            </p>
          </div>
        )}

        <div>
          <label
            htmlFor="billing-instructions"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            Accounts Payable / Invoicing Remarks
          </label>
          <textarea
            id="billing-instructions"
            rows={2}
            value={billingNotes}
            onChange={(e) => onBillingNotesChange(e.target.value)}
            placeholder="e.g. Please append internal project code CFM-ENG-2026 to final invoice"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>
    </section>
  );
}

