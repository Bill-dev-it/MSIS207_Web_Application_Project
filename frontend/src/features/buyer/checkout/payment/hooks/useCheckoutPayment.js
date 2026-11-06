import { useState, useEffect, useCallback } from "react";
import paymentApi, { isSupportedPaymentMethod } from "../services/paymentApi";
import shippingApi from "../../shipping/services/shippingApi";

const PAYMENT_STORAGE_KEY = "aerorul_checkout_payment_id";

function getInitialPaymentMethodId() {
  const stored = sessionStorage.getItem(PAYMENT_STORAGE_KEY);
  if (isSupportedPaymentMethod(stored)) {
    return stored;
  }
  return "SIMULATION";
}

export function useCheckoutPayment() {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [deliveryMethods, setDeliveryMethods] = useState([]);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedMethodId, setSelectedMethodId] = useState(getInitialPaymentMethodId);

  const loadData = useCallback(async (signal) => {
    try {
      setLoading(true);
      setError("");
      const [methods, comp, deliveries] = await Promise.all([
        paymentApi.getSupportedPaymentMethods(),
        paymentApi.getCompany({ signal }),
        shippingApi.getDeliveryMethods({ signal }),
      ]);
      if (signal?.aborted) return;
      setPaymentMethods(methods);
      setCompany(comp);
      setDeliveryMethods(deliveries);

      const storedMethodId = sessionStorage.getItem(PAYMENT_STORAGE_KEY);
      const validStoredMethod = methods.find((method) => method.id === storedMethodId);
      const fallbackMethod =
        methods.find((method) => method.id === "SIMULATION") || methods[0];
      const activeMethod = validStoredMethod || fallbackMethod;
      if (!activeMethod) {
        throw new Error("No supported payment methods are available.");
      }
      setSelectedMethodId(activeMethod.id);
      sessionStorage.setItem(PAYMENT_STORAGE_KEY, activeMethod.id);

      const storedDeliveryId = sessionStorage.getItem("aerorul_checkout_delivery_id");
      const selectedDelivery = deliveries.find((method) => method.id === storedDeliveryId) || deliveries[0];
      if (selectedDelivery) {
        sessionStorage.setItem("aerorul_checkout_delivery_id", selectedDelivery.id);
      }
    } catch (err) {
      if (!signal?.aborted) setError(err.message || "Failed to load payment options.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);
    return () => controller.abort();
  }, [loadData]);

  const selectPaymentMethod = (id) => {
    if (!isSupportedPaymentMethod(id)) return;
    setSelectedMethodId(id);
    sessionStorage.setItem(PAYMENT_STORAGE_KEY, id);
  };

  const selectedDeliveryMethod =
    deliveryMethods.find((method) => method.id === sessionStorage.getItem("aerorul_checkout_delivery_id")) || null;

  return {
    paymentMethods,
    selectedDeliveryMethod,
    company,
    selectedMethodId,
    loading,
    error,
    selectPaymentMethod,
  };
}

export default useCheckoutPayment;
