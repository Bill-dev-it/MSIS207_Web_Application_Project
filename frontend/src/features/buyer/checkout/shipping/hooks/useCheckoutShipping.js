import { useState, useEffect, useCallback } from "react";
import shippingApi from "../services/shippingApi";

export function useCheckoutShipping() {
  const [addresses, setAddresses] = useState([]);
  const [deliveryMethods, setDeliveryMethods] = useState([]);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState(
    () => sessionStorage.getItem("aerorul_checkout_address_id") || ""
  );
  const [selectedMethodId, setSelectedMethodId] = useState(
    () => sessionStorage.getItem("aerorul_checkout_delivery_id") || ""
  );

  const loadData = useCallback(async (signal) => {
    try {
      setLoading(true);
      setError("");
      const [addressData, methodsData, companyData] = await Promise.all([
        shippingApi.getAddresses({ signal }),
        shippingApi.getDeliveryMethods({ signal }),
        shippingApi.getCompany({ signal }),
      ]);
      if (signal?.aborted) return;
      setAddresses(addressData);
      setDeliveryMethods(methodsData);
      setCompany(companyData);

      const storedAddress = sessionStorage.getItem("aerorul_checkout_address_id");
      const validAddress = addressData.find((address) => String(address.address_id) === storedAddress);
      const addressId = validAddress?.address_id ?? addressData[0]?.address_id ?? "";
      setSelectedAddressId(String(addressId));
      if (addressId) sessionStorage.setItem("aerorul_checkout_address_id", String(addressId));
      else sessionStorage.removeItem("aerorul_checkout_address_id");

      const storedMethod = sessionStorage.getItem("aerorul_checkout_delivery_id");
      const validMethod = methodsData.find((method) => method.id === storedMethod);
      const methodId = validMethod?.id ?? methodsData[0]?.id ?? "";
      setSelectedMethodId(methodId);
      if (methodId) sessionStorage.setItem("aerorul_checkout_delivery_id", methodId);
      else sessionStorage.removeItem("aerorul_checkout_delivery_id");
    } catch (err) {
      if (!signal?.aborted) setError(err.message || "Failed to load shipping data.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);
    return () => controller.abort();
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
      setSaveError("");
      const newAddress = await shippingApi.addAddress(formData);
      setAddresses((previous) => [...previous, newAddress]);
      selectAddress(newAddress.address_id);
      setShowNewAddressForm(false);
      return true;
    } catch (err) {
      setSaveError(err.message || "Could not save address.");
      return false;
    } finally {
      setIsSavingAddress(false);
    }
  };

  const selectedDeliveryMethod =
    deliveryMethods.find((method) => method.id === selectedMethodId) || null;

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
    saveError,
    isSavingAddress,
    setShowNewAddressForm,
    selectAddress,
    selectDeliveryMethod,
    saveAddress,
  };
}

export default useCheckoutShipping;
