import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ProductVisual from "../../components/public-marketplace/ProductVisual";
import { getProductGalleryImages } from "./productImages";
import { getProductById } from "../../services/productApi";
import { getProductOffers } from "../../services/supplierOfferService";
import { useAuth } from "../../auth/AuthContext";
import { useCart } from "../../features/buyer/cart";

function formatPrice(price) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

/**
 * Supplier Offers Panel
 * Handles offer selection, pricing presentation, and cart integration.
 */
function SupplierOffersPanel({ productId, onSelectOffer }) {
  const [offers, setOffers] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cartMessage, setCartMessage] = useState("");
  const [adding, setAdding] = useState(false);
  const { status, user } = useAuth();
  const { addItem } = useCart();
  const isBuyer = status === "authenticated" && user?.role === "BUYER";

  useEffect(() => {
    const controller = new AbortController();

    async function fetchOffers() {
      setLoading(true);
      setError("");
      setOffers([]);
      setSelectedId(null);
      try {
        const data = await getProductOffers(productId, { signal: controller.signal });
        if (!controller.signal.aborted) {
          const list = Array.isArray(data) ? data : [];
          setOffers(list);
          if (list.length > 0) {
            const inStock = list.find((o) => Number(o.stock_quantity) > 0) || list[0];
            setSelectedId(inStock.listing_id);
          }
        }
      } catch (err) {
        if (!controller.signal.aborted && err.name !== "AbortError") {
          setError(err.message || "Failed to load supplier offers");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchOffers();
    return () => controller.abort();
  }, [productId]);

  const selectedOffer = offers.find(
    (offer) => String(offer.listing_id) === String(selectedId)
  );

  useEffect(() => {
    if (onSelectOffer) {
      onSelectOffer(selectedOffer || null);
    }
  }, [selectedOffer, onSelectOffer]);

  async function handleAddToCart() {
    if (!selectedOffer || !isBuyer) return;
    setAdding(true);
    setCartMessage("");
    try {
      await addItem(selectedOffer.listing_id, 1);
      setCartMessage("Added to your procurement cart.");
    } catch (err) {
      setCartMessage(err.message || "Unable to add this offer to your cart.");
    } finally {
      setAdding(false);
    }
  }

  function renderConditionBadge(condition) {
    const cond = String(condition || "").toUpperCase().trim();
    if (cond === "NEW" || cond === "FN" || cond === "NE") {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wide shrink-0">
          NEW
        </span>
      );
    }
    if (cond.includes("REFURB") || cond.includes("OH") || cond === "SV") {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 uppercase tracking-wide shrink-0">
          REFURBISHED
        </span>
      );
    }
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wide shrink-0">
        {cond || "USED"}
      </span>
    );
  }

  return (
    <section
      aria-labelledby="supplier-offers-heading"
      className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <h2
          id="supplier-offers-heading"
          className="text-sm font-bold uppercase tracking-wider text-slate-900"
        >
          Available Supplier Offers
        </h2>

        {!loading && !error && (
          <span className="text-xs font-semibold text-slate-500">
            {offers.length} {offers.length === 1 ? "offer" : "offers"}
          </span>
        )}
      </div>

      <p
        role="note"
        className="mt-3 rounded-lg bg-sky-50 border border-sky-100 p-2.5 text-[11px] text-sky-800 leading-relaxed"
      >
        Verified supplier listings from the AeroRUL database. Current catalog pricing and stock are educational demonstrations.
      </p>

      {/* Loading state */}
      {loading && (
        <div className="py-8 flex flex-col items-center justify-center text-center">
          <div className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-[#0B1F3A] animate-spin" />
          <p role="status" className="mt-2 text-xs text-slate-500">
            Fetching available supplier quotations...
          </p>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <p role="alert" className="mt-4 text-xs text-rose-600 font-medium">
          Unable to load supplier offers: {error}
        </p>
      )}

      {/* Empty state */}
      {!loading && !error && offers.length === 0 && (
        <div className="mt-4 rounded-xl border border-slate-200 p-5 bg-slate-50/50 text-center">
          <p className="font-semibold text-slate-800 text-xs">
            No supplier offers available
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            There are currently no active listings from approved suppliers for this component.
          </p>
        </div>
      )}

      {/* Offers list */}
      {!loading && !error && offers.length > 0 && (
        <>
          <div className="mt-4 space-y-3">
            {offers.map((offer) => {
              const isSelected = String(selectedId) === String(offer.listing_id);
              const isOutOfStock = Number(offer.stock_quantity) < 1;

              return (
                <label
                  key={offer.listing_id}
                  className={`block cursor-pointer rounded-xl border p-4 transition-all ${
                    isSelected
                      ? "border-[#0B1F3A] bg-sky-50/30 ring-1 ring-[#0B1F3A]/20 shadow-xs"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  } ${isOutOfStock ? "opacity-60" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="supplier-offer"
                      value={offer.listing_id}
                      checked={isSelected}
                      disabled={isOutOfStock}
                      onChange={() => setSelectedId(offer.listing_id)}
                      className="mt-1 text-[#0B1F3A] focus:ring-[#0B1F3A] accent-[#0B1F3A]"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-slate-900 truncate">
                            {offer.store_name}
                          </p>
                          <p className="mt-0.5 font-mono text-[10px] text-slate-400 truncate">
                            SKU: {offer.seller_sku}
                          </p>
                        </div>
                        {renderConditionBadge(offer.condition)}
                      </div>

                      <div className="mt-3 flex items-baseline justify-between">
                        <p className="text-xl font-extrabold text-[#0B1F3A] font-mono">
                          {formatPrice(offer.price)}
                        </p>
                        <span className="text-[10px] text-slate-400 font-medium">USD / unit</span>
                      </div>

                      <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                        <span>
                          Stock:{" "}
                          <strong className="text-slate-800 font-mono">
                            {offer.stock_quantity} units
                          </strong>
                        </span>
                        <span>
                          Lead time:{" "}
                          <strong className="text-slate-800 font-mono">
                            {offer.lead_time_days} days
                          </strong>
                        </span>
                      </div>

                      {isOutOfStock && (
                        <p className="mt-1.5 text-[11px] font-bold text-rose-600">
                          Out of stock
                        </p>
                      )}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>

          {/* Selected Offer Summary */}
          {selectedOffer && (
            <div
              role="status"
              className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5"
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Selected Offer
              </p>
              <div className="flex items-baseline justify-between mt-1.5">
                <span className="text-xs font-semibold text-slate-800 truncate">
                  {selectedOffer.store_name}
                </span>
                <span className="font-mono text-base font-extrabold text-[#0B1F3A]">
                  {formatPrice(selectedOffer.price)}
                </span>
              </div>
            </div>
          )}

          {/* Purchase Action CTA */}
          {isBuyer ? (
            <button
              type="button"
              className="w-full mt-4 py-3 px-4 rounded-xl text-xs font-bold bg-[#0B1F3A] text-white hover:bg-slate-800 active:bg-slate-900 disabled:opacity-40 transition-colors shadow-xs"
              onClick={handleAddToCart}
              disabled={!selectedOffer || Number(selectedOffer.stock_quantity) < 1 || adding}
            >
              {adding ? "Adding to Cart..." : "Add Selected Offer to Cart"}
            </button>
          ) : status === "anonymous" ? (
            <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <p className="text-xs text-slate-600">
                <Link className="font-bold text-[#0B1F3A] underline" to="/login">
                  Sign in as a Buyer
                </Link>{" "}
                to add parts to procurement cart.
              </p>
            </div>
          ) : (
            <p className="mt-4 text-xs text-slate-500 text-center">
              Cart procurement is reserved for registered Buyer accounts.
            </p>
          )}

          {cartMessage && (
            <p className="mt-2.5 text-xs font-semibold text-emerald-700 text-center" role="status">
              {cartMessage}
            </p>
          )}
        </>
      )}
    </section>
  );
}

export default function ProductDetail() {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchProduct() {
      setLoading(true);
      setError("");
      try {
        const data = await getProductById(productId, { signal: controller.signal });
        if (!controller.signal.aborted) {
          setProduct(data);
          setSelectedImageIndex(0);
        }
      } catch (err) {
        if (!controller.signal.aborted && err.name !== "AbortError") {
          setError(err.message || "Failed to load product details");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchProduct();
    return () => controller.abort();
  }, [productId]);

  const name = product?.name ?? product?.product_name ?? "Aviation Component";
  const specs = product?.technical_specs;

  // Process Shelf Life Limit
  const shelfLifeRaw = specs?.source_shelf_life_days;
  const shelfLifeNum = Number(shelfLifeRaw);
  const hasValidShelfLife =
    shelfLifeRaw !== null &&
    shelfLifeRaw !== undefined &&
    shelfLifeRaw !== "" &&
    Number.isFinite(shelfLifeNum) &&
    shelfLifeNum > 0;
  const shelfLifeDisplay = hasValidShelfLife
    ? `${shelfLifeNum} ${shelfLifeNum === 1 ? "calendar day" : "calendar days"}`
    : "Not specified — confirm with supplier.";

  // Process Maintenance Classification
  const repairableRaw = specs?.source_is_repairable;
  const maintenanceClassification =
    repairableRaw === true
      ? "Repairable / Overhaulable Unit"
      : repairableRaw === false
      ? "Not designated as repairable"
      : "Not specified — confirm with supplier";

  // Retrieve gallery images deterministically
  const gallery = product ? getProductGalleryImages(product) : [];
  const activeImage = gallery[selectedImageIndex] || gallery[0] || null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
        <Link to="/marketplace" className="hover:text-slate-900 transition-colors">
          Marketplace
        </Link>
        <span className="text-slate-300" aria-hidden="true">/</span>
        {product?.category_name && (
          <>
            <Link
              to={`/marketplace?category=${encodeURIComponent(product.category_name)}`}
              className="hover:text-slate-900 transition-colors"
            >
              {product.category_name}
            </Link>
            <span className="text-slate-300" aria-hidden="true">/</span>
          </>
        )}
        <span className="font-mono text-slate-800 font-semibold truncate max-w-xs">
          {product?.part_number || name}
        </span>
      </nav>

      {/* Loading State */}
      {loading && (
        <div className="py-24 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-full border-3 border-slate-200 border-t-[#0B1F3A] animate-spin" />
          <p className="mt-4 text-xs font-semibold text-slate-600">
            Loading Aircraft Component Specification...
          </p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div role="alert" className="bg-white rounded-xl border border-red-200 p-8 text-center max-w-lg mx-auto">
          <p className="font-bold text-red-700 text-sm">Error Loading Product</p>
          <p className="mt-1 text-xs text-slate-500">{error}</p>
          <Link
            to="/marketplace"
            className="mt-4 inline-block px-4 py-2 bg-[#0B1F3A] text-white rounded-lg text-xs font-bold"
          >
            Return to Marketplace
          </Link>
        </div>
      )}

      {/* Not Found State */}
      {!loading && !error && !product && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
          <h1 className="text-xl font-bold text-slate-900">Product Not Found</h1>
          <p className="mt-2 text-xs text-slate-500">
            The requested aircraft part does not exist in the active AeroRUL catalog.
          </p>
          <Link
            to="/marketplace"
            className="mt-5 inline-block px-4 py-2 bg-[#0B1F3A] text-white rounded-lg text-xs font-bold"
          >
            Browse Marketplace
          </Link>
        </div>
      )}

      {/* Main Content Layout */}
      {!loading && !error && product && (
        <div className="grid gap-8 lg:grid-cols-12 items-start">
          {/* LEFT COLUMN: Product Identity, Gallery & Technical Information (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Header & Identity Card */}
            <article className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  {product.category_name && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-100">
                      {product.category_name}
                    </span>
                  )}
                  {product.product_type && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                      {product.product_type}
                    </span>
                  )}
                </div>
                <span className="font-mono text-xs font-bold text-slate-700 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
                  P/N: {product.part_number || "N/A"}
                </span>
              </div>

              <div className="mt-6">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {name}
                </h1>
                <p className="text-xs font-semibold text-slate-500 mt-1.5">
                  Original Equipment Manufacturer (OEM):{" "}
                  <span className="text-slate-800 font-bold inline-block break-words [text-wrap:pretty]">
                    {product.manufacturer || "Certified Aerospace OEM"}
                  </span>
                </p>
              </div>

              {/* 2. Product Image Gallery */}
              <div className="mt-8 space-y-3.5">
                {activeImage ? (
                  <>
                    {/* Prominent Main Image View */}
                    <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80">
                      <img
                        src={activeImage.src}
                        alt={activeImage.alt || name}
                        className="w-full h-full object-cover object-center transition-all duration-200"
                      />
                      <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md text-[10px] font-medium bg-slate-900/75 text-slate-200 backdrop-blur-xs select-none">
                        Representative image
                      </span>
                    </div>

                    {/* Gallery Thumbnails */}
                    {gallery.length > 1 && (
                      <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                        {gallery.map((img, idx) => {
                          const isActive = selectedImageIndex === idx;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setSelectedImageIndex(idx)}
                              className={`relative w-20 h-14 sm:w-24 sm:h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                                isActive
                                  ? "border-[#0B1F3A] ring-2 ring-[#0B1F3A]/30 shadow-xs"
                                  : "border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100"
                              }`}
                              aria-label={`Select reference view ${idx + 1}`}
                            >
                              <img
                                src={img.src}
                                alt=""
                                className="w-full h-full object-cover object-center"
                              />
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Discreet Disclaimer Caption */}
                    <p className="text-[11px] text-slate-400 italic">
                      Representative component imagery. Actual item specifications may vary.
                    </p>
                  </>
                ) : (
                  <div className="p-8 bg-gradient-to-b from-slate-50 to-white rounded-2xl border border-slate-100 flex flex-col items-center justify-center">
                    <ProductVisual
                      product={product}
                      size="lg"
                      showDisclaimer={true}
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            </article>

            {/* 3. Product Overview Section */}
            <section className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 pb-3 border-b border-slate-100">
                Product Overview
              </h2>

              <dl className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100">
                  <dt className="text-slate-400 font-medium">Part Number</dt>
                  <dd className="font-mono font-bold text-slate-800 mt-1 break-all">
                    {product.part_number || "—"}
                  </dd>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100">
                  <dt className="text-slate-400 font-medium">Category</dt>
                  <dd className="font-semibold text-slate-800 mt-1">
                    {product.category_name || "General Aviation"}
                  </dd>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100">
                  <dt className="text-slate-400 font-medium">Manufacturer (OEM)</dt>
                  <dd className="font-semibold text-slate-800 mt-1 break-words [text-wrap:pretty] leading-snug">
                    {product.manufacturer || "Certified Aerospace OEM"}
                  </dd>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100">
                  <dt className="text-slate-400 font-medium">Classification</dt>
                  <dd className="font-semibold text-slate-800 mt-1">
                    {product.product_type || "Standard Airframe Part"}
                  </dd>
                </div>
              </dl>

              <div className="mt-6">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Functional Description
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {product.description ||
                    "Certified aerospace replacement component manufactured to aviation tolerance specifications."}
                </p>
              </div>
            </section>

            {/* 4. Technical Specifications Section */}
            <section className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 pb-3 border-b border-slate-100">
                Technical Specifications
              </h2>

              <dl className="mt-4 divide-y divide-slate-100 text-xs">
                <div className="py-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <dt className="font-semibold text-slate-700">Component Family</dt>
                  <dd className="text-slate-800 font-medium">
                    {specs?.source_part_family || product.category_name || "Aerospace Hardware"}
                  </dd>
                </div>

                <div className="py-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <dt className="font-semibold text-slate-700">Maintenance Classification</dt>
                  <dd className="text-slate-800 font-medium">
                    {maintenanceClassification}
                  </dd>
                </div>

                <div className="py-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <dt className="font-semibold text-slate-700">Shelf Life Limit</dt>
                  <dd className="text-slate-800 font-medium">
                    {shelfLifeDisplay}
                  </dd>
                </div>
              </dl>
            </section>

            {/* 5. Why Source Through AeroRUL? Section */}
            <section className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs">
              <div className="pb-4 border-b border-slate-100">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  Why Source Through AeroRUL?
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  A more connected way to source aviation parts and manage procurement.
                </p>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Benefit 1 — Multiple Supplier Options */}
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">
                      Multiple Supplier Options
                    </h3>
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                      Compare offers from multiple suppliers in one marketplace.
                    </p>
                  </div>
                </div>

                {/* Benefit 2 — Transparent Procurement */}
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">
                      Transparent Procurement
                    </h3>
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                      Evaluate pricing, availability, condition, and lead times before buying.
                    </p>
                  </div>
                </div>

                {/* Benefit 3 — Streamlined B2B Checkout */}
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">
                      Streamlined B2B Checkout
                    </h3>
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                      Manage business purchasing through a structured checkout process.
                    </p>
                  </div>
                </div>

                {/* Benefit 4 — Centralized Order Tracking */}
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">
                      Centralized Order Tracking
                    </h3>
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                      Access procurement orders and their recorded statuses from your Buyer workspace.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* 6. Academic Demonstration Disclosure Section */}
            {specs?.is_demo && (
              <section className="bg-slate-50/70 rounded-2xl border border-slate-200/80 p-5 text-xs text-slate-600">
                <div className="flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Educational Demonstration Disclosure
                    </h3>
                    <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                      This catalog item is part of the AeroRUL educational evaluation dataset. All listings, references, and supplier quotations are simulated for university research and engineering demonstration purposes.
                    </p>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* RIGHT COLUMN: Available Supplier Offers Panel (4 Cols, Sticky) */}
          <aside className="lg:col-span-4 sticky top-24">
            <SupplierOffersPanel productId={productId} />
          </aside>
        </div>
      )}
    </div>
  );
}
