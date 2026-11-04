const publicListingService = require("./public-listing.service");

const MAX_BIGINT = 9223372036854775807n;

function isValidBigIntId(value) {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
    return false;
  }

  try {
    return BigInt(value) <= MAX_BIGINT;
  } catch {
    return false;
  }
}

async function getProductOffers(req, res) {
  const { productId } = req.params;

  if (!isValidBigIntId(productId)) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_PRODUCT_ID",
        message: "Product ID must be a valid positive integer.",
      },
    });
  }

  try {
    const offers = await publicListingService.getOffersByProductId(productId);

    if (offers === null) {
      return res.status(404).json({
        success: false,
        error: {
          code: "PRODUCT_NOT_FOUND",
          message: "Product not found.",
        },
      });
    }

    return res.status(200).json({
      success: true,
      count: offers.length,
      data: offers,
    });
  } catch (error) {
    console.error("Get product offers failed:", error);

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unable to retrieve supplier offers.",
      },
    });
  }
}

module.exports = {
  getProductOffers,
};
