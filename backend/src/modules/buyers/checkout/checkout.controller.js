const checkoutService = require("./checkout.service");

// Fallback demo buyer context: John Doe (user_id = 1), Demo Horizon Airlines (company_id = 1)
function getBuyerContext(req) {
  return {
    userId: req.user?.id ? Number(req.user.id) : 1,
    companyId: req.user?.companyId ? Number(req.user.companyId) : 1,
  };
}

async function getAddresses(req, res) {
  try {
    const { companyId } = getBuyerContext(req);
    const addresses = await checkoutService.getAddresses(companyId);

    return res.status(200).json({
      success: true,
      data: addresses,
    });
  } catch (error) {
    console.error("Get addresses error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve saved addresses.",
    });
  }
}

async function addAddress(req, res) {
  try {
    const { companyId } = getBuyerContext(req);
    const newAddress = await checkoutService.addAddress(companyId, req.body);

    return res.status(201).json({
      success: true,
      message: "Address saved successfully.",
      data: newAddress,
    });
  } catch (error) {
    console.error("Add address error:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to save address.",
    });
  }
}

async function getDeliveryMethods(req, res) {
  try {
    const methods = await checkoutService.getDeliveryMethods();
    return res.status(200).json({
      success: true,
      data: methods,
    });
  } catch (error) {
    console.error("Get delivery methods error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve delivery options.",
    });
  }
}

async function getCompanyDetails(req, res) {
  try {
    const { companyId } = getBuyerContext(req);
    const company = await checkoutService.getCompany(companyId);

    return res.status(200).json({
      success: true,
      data: company,
    });
  } catch (error) {
    console.error("Get company details error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve company details.",
    });
  }
}

async function placeOrder(req, res) {
  try {
    const { userId, companyId } = getBuyerContext(req);
    const {
      shipping_address,
      billing_address,
      delivery_method_id,
      purchase_reference,
      payment_method,
      checkout_key,
    } = req.body;

    const order = await checkoutService.placeOrder({
      userId,
      companyId,
      shippingAddress: shipping_address,
      billingAddress: billing_address,
      deliveryMethodId: delivery_method_id,
      purchaseReference: purchase_reference,
      paymentMethod: payment_method,
      checkoutKey: checkout_key,
    });

    return res.status(201).json({
      success: true,
      message: "Order placed successfully.",
      data: order,
    });
  } catch (error) {
    console.error("Place order error:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Unable to place order.",
    });
  }
}

module.exports = {
  getAddresses,
  addAddress,
  getDeliveryMethods,
  getCompanyDetails,
  placeOrder,
};

