"use strict";

const service = require("../../services/buyer/checkout.service");

function fail(res, error) {
  const status = error.statusCode || 500;
  if (status >= 500) console.error("Buyer checkout request failed:", error);
  return res.status(status).json({
    success: false,
    error: {
      code: error.code || "INTERNAL_SERVER_ERROR",
      message: status >= 500 ? "Unable to process checkout request." : error.message,
    },
  });
}

async function getAddresses(req, res) {
  try {
    const data = await service.getAddresses(req.authUser.company_id);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return fail(res, error);
  }
}

async function addAddress(req, res) {
  try {
    const data = await service.addAddress(req.authUser.company_id, req.body);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return fail(res, error);
  }
}

async function getDeliveryMethods(req, res) {
  try {
    const data = await service.getDeliveryMethods();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return fail(res, error);
  }
}

async function getCompany(req, res) {
  try {
    const data = await service.getCompany(req.authUser.company_id);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return fail(res, error);
  }
}

async function placeOrder(req, res) {
  try {
    const result = await service.placeOrder({
      userId: req.authUser.user_id,
      companyId: req.authUser.company_id,
      shippingAddressId: req.body?.shipping_address_id,
      billingAddressId: req.body?.billing_address_id ?? null,
      deliveryMethodId: req.body?.delivery_method_id,
      purchaseReference: req.body?.purchase_reference ?? null,
      paymentMethod: req.body?.payment_method,
      checkoutKey: req.body?.checkout_key,
    });
    return res.status(result.created ? 201 : 200).json({ success: true, data: result.order });
  } catch (error) {
    return fail(res, error);
  }
}

module.exports = { getAddresses, addAddress, getDeliveryMethods, getCompany, placeOrder };
