export default function CompanyDetailsForm({ company }) {
  if (!company) return null;

  return (
    <section className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs">
      <div className="mb-3">
        <h2 className="text-base font-bold text-slate-900">
          3. Corporate Buyer Profile
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Invoicing and dual-release certificates will be registered under this verified entity.
        </p>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div>
          <span className="text-slate-400 font-semibold block">Company Entity</span>
          <span className="font-bold text-slate-900 text-sm mt-0.5 block">
            {company.company_name}
          </span>
        </div>

        <div>
          <span className="text-slate-400 font-semibold block">Operator Type</span>
          <span className="font-bold text-slate-800 uppercase mt-0.5 block">
            {company.company_type || "Commercial Airline"}
          </span>
        </div>

        <div>
          <span className="text-slate-400 font-semibold block">Jurisdiction</span>
          <span className="font-bold text-slate-800 uppercase mt-0.5 block">
            {company.country_code} (FAA / EASA Reciprocal)
          </span>
        </div>
      </div>
    </section>
  );
}

