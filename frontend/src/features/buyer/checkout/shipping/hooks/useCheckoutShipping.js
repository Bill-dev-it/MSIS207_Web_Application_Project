import { useState, useEffect, useCallback } from "react";
import shippingApi from "../services/shippingApi";

export function useCheckoutShipping() {
  const [addresses, setAddresses] = useState([]);
  const [deliveryMethods, setDeliveryMethods] = useState([]);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);

  const [selectedAddressId, setSelectedAddressId] = useState(() => {
    return sessionStorage.getItem("aerorul_checkout_address_id") || "";
  });

  const [selectedMethodId, setSelectedMethodId] = useState(() => {
    return sessionStorage.getItem("aerorul_checkout_delivery_id") || "STANDARD";
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [addrRes, methodsRes, compRes] = await Promise.all([
        shippingApi.getAddresses(),
        shippingApi.getDeliveryMethods(),
        shippingApi.getCompany(),
      ]);

      setAddresses(addrRes);
      setDeliveryMethods(methodsRes);
      setCompany(compRes);

      // Auto-select first address if none selected
      if (!selectedAddressId && addrRes.length > 0) {
        setSelectedAddressId(String(addrRes[0].address_id));
        sessionStorage.setItem("aerorul_checkout_address_id", String(addrRes[0].address_id));
      }

      if (!sessionStorage.getItem("aerorul_checkout_delivery_id") && methodsRes.length > 0) {
        setSelectedMethodId(methodsRes[0].id);
        sessionStorage.setItem("aerorul_checkout_delivery_id", methodsRes[0].id);
      }
    } catch (err) {
      setError(err.message || "Failed to load shipping data.");
    } finally {
      setLoading(false);
    }
  }, [selectedAddressId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectAddress = (id) => {
    setSelectedAddressId(String(id));
    sessionStorage.setItem("aerorul_checkout_address_id", String(id));
  };

  const selectDeliveryMethod = (id) => {
    setSelectedMethodId(id);
    sessionStorage.setItem("aerorul_checkout_delivery_id", id);
  };

  const saveAddress = async (formData) => {
    try {
      setIsSavingAddress(true);
      const newAddr = await shippingApi.addAddress(formData);
      setAddresses((prev) => [...prev, newAddr]);
      selectAddress(newAddr.address_id);
      setShowNewAddressForm(false);
    } catch (err) {
      alert(err.message || "Could not save address.");
    } finally {
      setIsSavingAddress(false);
    }
  };

  const selectedDeliveryMethod =
    deliveryMethods.find((m) => m.id === selectedMethodId) || deliveryMethods[0] || null;

  return {
    addresses,
    deliveryMethods,
    company,
    selectedAddressId,
    selectedMethodId,
    selectedDeliveryMethod,
    showNewAddressForm,
    loading,
    error,
    isSavingAddress,
    setShowNewAddressForm,
    selectAddress,
    selectDeliveryMethod,
    saveAddress,
  };
}

export default useCheckoutShipping;

