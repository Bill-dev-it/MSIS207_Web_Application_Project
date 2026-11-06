export default function OrderShippingInformation({ shippingAddressSnapshot, companyName }) {
  let addr = shippingAddressSnapshot;
  if (typeof addr === "string") {
    try {
      addr = JSON.parse(addr);
    } catch {
      addr = {};
    }
  }

  return (
    <section className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-2">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
        Maintenance Facility Destination
      </h3>
      <div className="text-xs text-slate-700 leading-relaxed pt-1">
        <p className="font-bold text-slate-900 text-sm">{companyName}</p>
        <p className="font-semibold text-slate-800">{addr?.recipient_name || "Receiving Facility"}</p>
        <p>{addr?.address_line || "Airport Maintenance Perimeter"}</p>
        <p>
          {addr?.city}, {addr?.region} {addr?.postal_code}
        </p>
        <p className="text-slate-500 pt-1">
          Country: {addr?.country_code} • Tel: {addr?.phone}
        </p>
      </div>
    </section>
  );
}

