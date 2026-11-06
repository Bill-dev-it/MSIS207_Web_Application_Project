export default function ShippingAddressList({
  addresses = [],
  selectedAddressId,
  onSelectAddress,
  onToggleNewAddress,
  showNewAddressForm = false,
}) {
  return (
    <section className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            1. Maintenance Facility & Destination Address
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Select the designated hangar or receiving station for this shipment.
          </p>
        </div>

        <button
          type="button"
          onClick={onToggleNewAddress}
          className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
        >
          {showNewAddressForm ? "Cancel" : "+ Add New Facility"}
        </button>
      </div>

      {addresses.length === 0 ? (
        <p className="text-xs text-slate-500 py-4 italic">
          No registered facilities found for your corporate account. Please add an address below.
        </p>
      ) : (
        <fieldset className="grid grid-cols-1 gap-4 border-0 p-0 sm:grid-cols-2">
          <legend className="sr-only">Choose a saved shipping address</legend>
          {addresses.map((addr) => {
            const isSelected = String(addr.address_id) === String(selectedAddressId);

            return (
              <label
                key={addr.address_id}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative ${
                  isSelected
                    ? "border-blue-600 bg-blue-50/40 shadow-xs"
                    : "border-slate-200 bg-slate-50/50 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="shipping_address"
                      value={addr.address_id}
                      checked={isSelected}
                      onChange={() => onSelectAddress(addr.address_id)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-bold text-slate-900">
                      {addr.recipient_name}
                    </span>
                  </div>
                  {isSelected && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                      Selected
                    </span>
                  )}
                </div>

                <div className="mt-2 text-xs text-slate-600 leading-relaxed pl-6">
                  <p className="font-medium text-slate-800">{addr.address_line}</p>
                  <p>
                    {addr.city}, {addr.region} {addr.postal_code}
                  </p>
                  <p className="text-slate-400 mt-1">
                    Country: {addr.country_code} • Tel: {addr.phone}
                  </p>
                </div>
              </label>
            );
          })}
        </fieldset>
      )}
    </section>
  );
}
