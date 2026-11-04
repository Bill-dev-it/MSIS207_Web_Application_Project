const orderConfirmationRepository = require("./orderConfirmation.repository");

async function getConfirmation(orderId, companyId) {
  if (!orderId || isNaN(Number(orderId))) {
    throw new Error("Invalid order ID provided.");
  }

  const confirmation = await orderConfirmationRepository.getOrderConfirmation(
    Number(orderId),
    companyId
  );
  if (!confirmation) {
    throw new Error("Order confirmation not found or access denied.");
  }

  return confirmation;
}

module.exports = {
  getConfirmation,
};

