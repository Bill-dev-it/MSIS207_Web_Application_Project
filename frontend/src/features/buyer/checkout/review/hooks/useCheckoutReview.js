import { useState, useEffect, useCallback, useMemo } from "react";
import reviewApi from "../services/reviewApi";
import { useCart } from "../../../cart";

const CHECKOUT_KEY_STORAGE = "aerorul_checkout_key";

function createCheckoutKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `buyer_${crypto.randomUUID()}`;
  }
  return `buyer_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function useCheckoutReview() {
  const { items, subtotal, refreshCart } = useCart();
  const [address, setAddress] = useState(null);
  const [deliveryMethod, setDeliveryMethod] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const checkoutKey = useMemo(() => {
    const stored = sessionStorage.getItem(CHECKOUT_KEY_STORAGE);
    if (stored) return stored;
    const key = createCheckoutKey();
    sessionStorage.setItem(CHECKOUT_KEY_STORAGE, key);
    return key;
  }, []);

  const addressId = sessionStorage.getItem("aerorul_checkout_address_id");
  const deliveryMethodId = sessionStorage.getItem("aerorul_checkout_delivery_id");
  const paymentMethodId = sessionStorage.getItem("aerorul_checkout_payment_id");
  const purchaseReference = sessionStorage.getItem("aerorul_po_reference") || "";

  const loadReviewData = useCallback(async (signal) => {
    try {
      setLoading(true);
      setError("");
      const [addresses, methods, buyerCompany] = await Promise.all([
        reviewApi.getAddresses({ signal }),
        reviewApi.getDeliveryMethods({ signal }),
        reviewApi.getCompany({ signal }),
      ]);
      if (signal?.aborted) return;
      const selectedAddress = addresses.find(
        (candidate) => String(candidate.address_id) === String(addressId)
      );
      const selectedDelivery = methods.find((method) => method.id === deliveryMethodId);
      if (!selectedAddress || !selectedDelivery) {
        setError("Checkout details are missing. Return to shipping and select a saved address and delivery option.");
        return;
      }
      setAddress(selectedAddress);
      setDeliveryMethod(selectedDelivery);
      setCompany(buyerCompany);
    } catch (err) {
      if (!signal?.aborted) setError(err.message || "Failed to load checkout review data.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [addressId, deliveryMethodId]);

  useEffect(() => {
    const controller = new AbortController();
    loadReviewData(controller.signal);
    return () => controller.abort();
  }, [loadReviewData]);

  const placeOrder = async () => {
    if (!address?.address_id || !deliveryMethod?.id) {
      setSubmitError("Checkout details are missing. Please return to Shipping.");
      return null;
    }
    if (paymentMethodId !== "SIMULATION") {
      setSubmitError("Only the development payment simulation is supported.");
      return null;
    }
    if (items.length === 0) {
      setSubmitError("Your cart is empty.");
      return null;
    }
    if (purchaseReference.length > 100) {
      setSubmitError("Purchase reference must be 100 characters or fewer.");
      return null;
    }

    try {
      setIsSubmitting(true);
      setSubmitError("");
      const result = await reviewApi.placeOrder({
        shipping_address_id: String(address.address_id),
        billing_address_id: String(address.address_id),
        delivery_method_id: deliveryMethod.id,
        purchase_reference: purchaseReference.trim() || null,
        payment_method: "SIMULATION",
        checkout_key: checkoutKey,
      });

      for (const key of [
        "aerorul_checkout_address_id",
        "aerorul_checkout_delivery_id",
        "aerorul_checkout_payment_id",
        "aerorul_checkout_key",
        "aerorul_po_reference",
      ]) {
        sessionStorage.removeItem(key);
      }
      await refreshCart();
      return result;
    } catch (err) {
      setSubmitError(err.message || "Failed to place order.");
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    items,
    subtotal,
    address,
    deliveryMethod,
    company,
    paymentMethodId,
    purchaseReference,
    loading,
    error,
    isSubmitting,
    submitError,
    placeOrder,
  };
}

export default useCheckoutReview;
