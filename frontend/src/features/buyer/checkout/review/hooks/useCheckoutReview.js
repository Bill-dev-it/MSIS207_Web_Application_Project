import { useState, useEffect, useCallback, useMemo } from "react";
import reviewApi from "../services/reviewApi";
import { isSupportedPaymentMethod } from "../../payment/services/paymentApi";
import { useCart } from "../../../cart";

const CHECKOUT_KEY_STORAGE = "aerorul_checkout_key";
const CHECKOUT_KEY_PATTERN = /^[A-Za-z0-9_-]{1,100}$/;
const POSITIVE_BIGINT_PATTERN = /^[1-9]\d*$/;
const MAX_BIGINT = 9223372036854775807n;

function isValidBigIntId(value) {
  if (typeof value !== "string" || !POSITIVE_BIGINT_PATTERN.test(value)) {
    return false;
  }
  try {
    return BigInt(value) <= MAX_BIGINT;
  } catch {
    return false;
  }
}

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
    if (stored && CHECKOUT_KEY_PATTERN.test(stored)) return stored;
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
      const normalizedAddressId = String(addressId ?? "").trim();
      const selectedAddress = isValidBigIntId(normalizedAddressId)
        ? addresses.find(
            (candidate) => String(candidate.address_id) === normalizedAddressId
          )
        : null;
      const selectedDelivery = methods.find((method) => method.id === deliveryMethodId);
      if (!selectedAddress || !selectedDelivery) {
        setError("Checkout details are missing. Return to shipping and select a saved address and delivery option.");
        return;
      }
      if (!isSupportedPaymentMethod(paymentMethodId)) {
        setError("Payment method is missing or unsupported. Return to payment and choose Simulated Payment or Bank Transfer (Demo).");
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
  }, [addressId, deliveryMethodId, paymentMethodId]);

  useEffect(() => {
    const controller = new AbortController();
    loadReviewData(controller.signal);
    return () => controller.abort();
  }, [loadReviewData]);

  const placeOrder = async () => {
    const shippingAddressId = String(address?.address_id ?? "").trim();
    if (!isValidBigIntId(shippingAddressId) || !deliveryMethod?.id) {
      setSubmitError("Checkout details are missing. Please return to Shipping.");
      return null;
    }
    if (!isSupportedPaymentMethod(paymentMethodId)) {
      setSubmitError("Select a supported payment method (Simulated Payment or Bank Transfer (Demo)).");
      return null;
    }
    if (items.length === 0) {
      setSubmitError("Your cart is empty.");
      return null;
    }
    const cleanPurchaseReference = purchaseReference.trim();
    if (cleanPurchaseReference.length > 100) {
      setSubmitError("Purchase reference must be 100 characters or fewer.");
      return null;
    }

    try {
      setIsSubmitting(true);
      setSubmitError("");
      const result = await reviewApi.placeOrder({
        shipping_address_id: shippingAddressId,
        billing_address_id: shippingAddressId,
        delivery_method_id: deliveryMethod.id,
        purchase_reference: cleanPurchaseReference || null,
        payment_method: paymentMethodId,
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
