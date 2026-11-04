import { useState, useEffect, useCallback } from "react";
import paymentApi from "../services/paymentApi";

export function useCheckoutPayment() {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedMethodId, setSelectedMethodId] = useState(() => {
    return sessionStorage.getItem("aerorul_checkout_payment_id") || "NET_30";
  });

  const [useShippingAddressForBilling, setUseShippingAddressForBilling] = useState(true);
  const [billingNotes, setBillingNotes] = useState(() => {
    return sessionStorage.getItem("aerorul_billing_notes") || "";
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [methods, comp] = await Promise.all([
        paymentApi.getSupportedPaymentMethods(),
        paymentApi.getCompany(),
      ]);
      setPaymentMethods(methods);
      setCompany(comp);

      if (!sessionStorage.getItem("aerorul_checkout_payment_id") && methods.length > 0) {
        setSelectedMethodId(methods[0].id);
        sessionStorage.setItem("aerorul_checkout_payment_id", methods[0].id);
      }
    } catch (err) {
      setError(err.message || "Failed to load payment options.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectPaymentMethod = (id) => {
    setSelectedMethodId(id);
    sessionStorage.setItem("aerorul_checkout_payment_id", id);
  };

  const updateBillingNotes = (text) => {
    setBillingNotes(text);
    sessionStorage.setItem("aerorul_billing_notes", text);
  };

  const selectedPaymentMethod =
    paymentMethods.find((m) => m.id === selectedMethodId) || paymentMethods[0] || null;

  return {
    paymentMethods,
    company,
    selectedMethodId,
    selectedPaymentMethod,
    useShippingAddressForBilling,
    billingNotes,
    loading,
    error,
    selectPaymentMethod,
    setUseShippingAddressForBilling,
    updateBillingNotes,
  };
}

export default useCheckoutPayment;

