/**
 * Row → DTO mappers for the Buyer/Admin API. snake_case (DB) → camelCase (API) happens ONLY here.
 */
const { num, iso } = require("./mapper");

const ORDER_STATUS_BY_RANK = { 1: "CONFIRMED", 2: "PROCESSING", 3: "SHIPPED", 4: "DELIVERED" };

const toPredictionDto = (r) => ({
  predictionId: num(r.prediction_id),
  uploadId: num(r.upload_id),
  predictedRul: num(r.predicted_rul),
  cycleAtPrediction: num(r.cycle_at_prediction),
  urgency: r.urgency,
  recommendationStatus: r.recommendation_status,
  explanation: r.explanation,
  predictionDate: iso(r.prediction_date),
});

const toUploadDto = (r) => ({
  uploadId: num(r.upload_id),
  originalFileName: r.original_file_name,
  firstCycle: num(r.first_cycle),
  lastCycle: num(r.last_cycle),
  rowCount: num(r.row_count),
  status: r.status,
  isDemo: r.is_demo,
  createdAt: iso(r.created_at),
});

const toEngineDto = (r, predictions = [], uploads = []) => {
  const latest = predictions.length ? predictions[predictions.length - 1] : null;
  return {
    engineId: num(r.engine_id),
    engineCode: r.engine_code,
    serialNumber: r.serial_number,
    currentCycle: num(r.current_cycle),
    engineModel: {
      engineModelId: num(r.engine_model_id),
      manufacturer: r.engine_manufacturer,
      modelName: r.model_name,
      engineFamily: r.engine_family,
      engineType: r.engine_type,
    },
    aircraft: {
      aircraftId: num(r.aircraft_id),
      registrationNumber: r.registration_number,
      manufacturer: r.aircraft_manufacturer,
      model: r.aircraft_model,
      status: r.aircraft_status,
    },
    latestPrediction: latest,
    rulHistory: predictions.map((p) => ({
      cycle: p.cycleAtPrediction,
      predictedRul: p.predictedRul,
      urgency: p.urgency,
      predictionDate: p.predictionDate,
    })),
    uploads,
  };
};

const toListingDto = (r) => ({
  listingId: num(r.listing_id),
  sellerSku: r.seller_sku,
  condition: r.condition,
  unitPrice: num(r.price),
  stockQuantity: num(r.stock_quantity),
  leadTimeDays: num(r.lead_time_days),
  productId: num(r.product_id),
  productName: r.product_name,
  partNumber: r.part_number,
  manufacturer: r.product_manufacturer,
  supplier: { supplierId: num(r.supplier_id), storeName: r.store_name },
});

const toCartItemDto = (r) => ({
  cartItemId: num(r.cart_item_id),
  quantity: num(r.quantity),
  lineTotal: Math.round(Number(r.price) * Number(r.quantity) * 100) / 100,
  available:
    r.listing_status === "ACTIVE" && r.supplier_status === "APPROVED" && Number(r.stock_quantity) >= Number(r.quantity),
  ...toListingDto(r),
});

const toOrderSummaryDto = (r) => ({
  orderId: num(r.order_id),
  orderNumber: r.order_number,
  purchaseReference: r.purchase_reference,
  status: ORDER_STATUS_BY_RANK[r.status_rank],
  currency: r.currency,
  subtotal: num(r.subtotal),
  shippingTotal: num(r.shipping_total),
  grandTotal: num(r.grand_total),
  itemCount: num(r.item_count),
  supplierNames: r.supplier_names || [],
  createdAt: iso(r.created_at),
});

module.exports = {
  ORDER_STATUS_BY_RANK,
  toPredictionDto,
  toUploadDto,
  toEngineDto,
  toListingDto,
  toCartItemDto,
  toOrderSummaryDto,
};
