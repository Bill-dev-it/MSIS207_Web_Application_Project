const checkoutRepository = require("./checkout.repository");

async function getAddresses(companyId) {
  return await checkoutRepository.getAddressesByCompanyId(companyId);
}

async function addAddress(companyId, addressData) {
  if (!addressData.address_line || !addressData.city || !addressData.postal_code) {
    throw new Error("Address line, city, and postal code are required.");
  }
  return await checkoutRepository.createAddress(companyId, addressData);
}

async function getDeliveryMethods() {
  return checkoutRepository.getDeliveryMethods();
}

async function getCompany(companyId) {
  return await checkoutRepository.getCompanyById(companyId);
}

async function placeOrder({
  userId,
  companyId,
  shippingAddress,
  billingAddress,
  deliveryMethodId,
  purchaseReference,
  paymentMethod,
  checkoutKey,
}) {
  if (!shippingAddress) {
    throw new Error("Shipping address is required.");
  }

  return await checkoutRepository.placeOrderTransaction({
    userId,
    companyId,
    shippingAddress,
    billingAddress,
    deliveryMethodId,
    purchaseReference,
    paymentMethod,
    checkoutKey,
  });
}

module.exports = {
  getAddresses,
  addAddress,
  getDeliveryMethods,
  getCompany,
  placeOrder,
};

