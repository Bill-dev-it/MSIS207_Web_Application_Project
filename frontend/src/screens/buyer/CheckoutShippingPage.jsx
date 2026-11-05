import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import CheckoutStepper from "../../features/buyer/checkout/components/CheckoutStepper";
import CheckoutOrderSummary from "../../features/buyer/checkout/components/CheckoutOrderSummary";
import ShippingAddressList from "../../features/buyer/checkout/shipping/components/ShippingAddressList";
import ShippingAddressForm from "../../features/buyer/checkout/shipping/components/ShippingAddressForm";
import DeliveryMethodSelector from "../../features/buyer/checkout/shipping/components/DeliveryMethodSelector";
import CompanyDetailsForm from "../../features/buyer/checkout/shipping/components/CompanyDetailsForm";
import { useCheckoutShipping } from "../../features/buyer/checkout/shipping/hooks/useCheckoutShipping";
import { useCart } from "../../features/buyer/cart";

export default function CheckoutShippingPage() {
  const navigate = useNavigate();
  const { items, subtotal } = useCart();
  const {
    addresses,
    deliveryMethods,
    company,
    selectedAddressId,
    selectedMethodId,
    selectedDeliveryMethod,
    showNewAddressForm,
    loading,
    error,
    saveError,
    isSavingAddress,
    setShowNewAddressForm,
    selectAddress,
    selectDeliveryMethod,
    saveAddress,
  } = useCheckoutShipping();

  const [purchaseReference, setPurchaseReference] = useState(() => {
    return sessionStorage.getItem("aerorul_po_reference") || "";
  });

  const handleContinue = () => {
    if (!selectedAddressId) {
      alert("Please select or add a facility destination address.");
      return;
    }
    navigate("/checkout/payment");
  };

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stepper Step 2 */}
        <CheckoutStepper currentStep={2} />

        {/* Page Heading */}
        <div className="mb-8">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Shipping & Destination Logistics
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Specify receiving maintenance hangar, freight dispatch speed, and regulatory consignment details.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-20 text-center">
            <div className="inline-block w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium text-slate-600">
              Retrieving registered airline facilities and aerospace freight options...
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm mb-6 flex items-start gap-3">
            <span className="font-bold">⚠️</span>
            <div>
              <p className="font-semibold">Failed to load logistics options</p>
              <p className="text-xs text-rose-700 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Content Layout */}
        {!loading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 8 Cols: Form Sections */}
            <div className="lg:col-span-8 space-y-6">
              {/* 1. Address List */}
              <ShippingAddressList
                addresses={addresses}
                selectedAddressId={selectedAddressId}
                onSelectAddress={selectAddress}
                onToggleNewAddress={() => setShowNewAddressForm((p) => !p)}
                showNewAddressForm={showNewAddressForm}
              />

              {/* Expandable New Address Form */}
              {showNewAddressForm && (
                <>
                  {saveError && <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800" role="alert">{saveError}</p>}
                  <ShippingAddressForm
                    onSave={saveAddress}
                    onCancel={() => setShowNewAddressForm(false)}
                    isSaving={isSavingAddress}
                  />
                </>
              )}

              {/* 2. Delivery Method */}
              <DeliveryMethodSelector
                methods={deliveryMethods}
                selectedMethodId={selectedMethodId}
                onSelectMethod={selectDeliveryMethod}
              />

              {/* 3. Company Entity */}
              <CompanyDetailsForm company={company} />

              {/* Navigation Actions */}
              <div className="pt-4 flex items-center justify-between gap-4 border-t border-slate-200">
                <Link
                  to="/cart"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Cart
                </Link>

                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={!items.length || !selectedAddressId || !selectedDeliveryMethod}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <span>Continue to Payment</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Right 4 Cols: Order Summary */}
            <div className="lg:col-span-4">
              <CheckoutOrderSummary
                items={items}
                subtotal={subtotal}
                shippingFee={selectedDeliveryMethod?.cost || 0}
                deliveryMethodName={selectedDeliveryMethod?.name || "Not selected"}
                purchaseReference={purchaseReference}
                currentStep={2}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
