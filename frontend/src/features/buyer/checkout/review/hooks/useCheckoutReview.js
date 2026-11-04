import { useState, useEffect, useCallback } from "react";
import reviewApi from "../services/reviewApi";
import { useCart } from "../../../cart";

export function useCheckoutReview() {
  const { items, subtotal, refreshCart } = useCart();
  const [address, setAddress] = useState(null);
  const [deliveryMethod, setDeliveryMethod] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const addressId = sessionStorage.getItem("aerorul_checkout_address_id");
  const deliveryMethodId = sessionStorage.getItem("aerorul_checkout_delivery_id") || "STANDARD";
  const paymentMethodId = sessionStorage.getItem("aerorul_checkout_payment_id") || "NET_30";
  const purchaseReference = sessionStorage.getItem("aerorul_po_reference") || "";

  const loadReviewData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [addrs, methods, comp] = await Promise.all([
        reviewApi.getAddresses(),
        reviewApi.getDeliveryMethods(),
        reviewApi.getCompany(),
      ]);

      const matchedAddr = addrs.find((a) => String(a.address_id) === String(addressId)) || addrs[0] || null;
      const matchedMethod = methods.find((m) => m.id === deliveryMethodId) || methods[0] || null;

      setAddress(matchedAddr);
      setDeliveryMethod(matchedMethod);
      setCompany(comp);
    } catch (err) {
      setError(err.message || "Failed to load checkout review data.");
    } finally {
      setLoading(false);
    }
  }, [addressId, deliveryMethodId]);

  useEffect(() => {
    loadReviewData();
  }, [loadReviewData]);

  const placeOrder = async () => {
    if (!address) {
      setSubmitError("Shipping address is missing. Please return to Shipping.");
      return null;
    }
    if (items.length === 0) {
      setSubmitError("Your cart is empty.");
      return null;
    }

    try {
      setIsSubmitting(true);
      setSubmitError("");

      const payload = {
        shipping_address: address,
        billing_address: address,
        delivery_method_id: deliveryMethod?.id || "STANDARD",
        purchase_reference: purchaseReference,
        payment_method: paymentMethodId === "NET_30" ? "CORPORATE_TERMS" : "SIMULATION",
        checkout_key: `chk_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      };

      const result = await reviewApi.placeOrder(payload);

      // Clean session storage
      sessionStorage.removeItem("aerorul_checkout_address_id");
      sessionStorage.removeItem("aerorul_checkout_delivery_id");
      sessionStorage.removeItem("aerorul_checkout_payment_id");
      sessionStorage.removeItem("aerorul_po_reference");

      // Refresh cart
      await refreshCart();

      return result;
    } catch (err) {
      console.error("Order submission failed:", err);
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

