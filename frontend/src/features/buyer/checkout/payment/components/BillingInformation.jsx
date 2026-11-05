export default function BillingInformation({ company }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-bold text-slate-900">Buyer company</h2>
        <p className="mt-1 text-sm text-slate-600">
          The order is associated with the company authenticated for this Buyer account.
        </p>
      </div>
      <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-800">
        {company?.company_name || "Company details unavailable"}
        {company?.tax_id ? ` · Tax ID: ${company.tax_id}` : ""}
      </p>
    </section>
  );
}
