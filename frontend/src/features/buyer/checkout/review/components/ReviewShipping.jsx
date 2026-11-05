import { Link } from "react-router-dom";
import { formatCurrency } from "../../../cart/utils/cartCalculations";

export default function ReviewShipping({ address, deliveryMethod }) {
  return (
    <section className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs">
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
        <h2 className="text-base font-bold text-slate-900">
          2. Destination Facility & Freight Speed
        </h2>
        <Link
          to="/checkout/shipping"
          className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
        >
          Change
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">
            Maintenance Receiving Address
          </span>
          {address ? (
            <>
              <p className="font-bold text-slate-900 text-sm">{address.recipient_name}</p>
              <p className="text-slate-700">{address.address_line}</p>
              <p className="text-slate-700">
                {address.city}, {address.region} {address.postal_code}, {address.country_code}
              </p>
              <p className="text-slate-500 pt-1">Tel: {address.phone}</p>
            </>
          ) : (
            <p className="text-rose-600 font-semibold">No address selected.</p>
          )}
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">
            Aerospace Freight Dispatch
          </span>
          {deliveryMethod ? (
            <>
              <p className="font-bold text-slate-900 text-sm">{deliveryMethod.name}</p>
              <p className="text-slate-700">{deliveryMethod.description}</p>
              <p className="text-slate-700">Estimated transit: {deliveryMethod.lead_time}</p>
              <p className="font-mono font-bold text-slate-900 pt-1">
                Rate: {formatCurrency(deliveryMethod.cost)}
              </p>
            </>
          ) : (
            <p className="text-slate-500">No delivery method selected.</p>
          )}
        </div>
      </div>
    </section>
  );
}
