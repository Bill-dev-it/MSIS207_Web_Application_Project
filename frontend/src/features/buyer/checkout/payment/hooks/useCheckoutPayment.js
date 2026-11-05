import { useState, useEffect, useCallback } from "react";
import paymentApi from "../services/paymentApi";
import shippingApi from "../../shipping/services/shippingApi";

export function useCheckoutPayment() {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [deliveryMethods, setDeliveryMethods] = useState([]);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedMethodId, setSelectedMethodId] = useState(() => {
    return sessionStorage.getItem("aerorul_checkout_payment_id") || "SIMULATION";
  });

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

      const selectedMethod = methods.find((method) => method.id === "SIMULATION");
      if (!selectedMethod) throw new Error("Simulated payment is not available.");
      setSelectedMethodId("SIMULATION");
      sessionStorage.setItem("aerorul_checkout_payment_id", "SIMULATION");

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
    if (id !== "SIMULATION") return;
    setSelectedMethodId(id);
    sessionStorage.setItem("aerorul_checkout_payment_id", id);
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
