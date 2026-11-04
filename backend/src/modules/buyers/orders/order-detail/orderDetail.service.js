const orderDetailRepository = require("./orderDetail.repository");

async function getOrderDetail(orderId, companyId) {
  if (!orderId || isNaN(Number(orderId))) {
    throw new Error("Invalid order ID provided.");
  }

  const order = await orderDetailRepository.getOrderDetailById(Number(orderId), companyId);
  if (!order) {
    throw new Error("Order not found or access denied.");
  }

  return order;
}

module.exports = {
  getOrderDetail,
};

