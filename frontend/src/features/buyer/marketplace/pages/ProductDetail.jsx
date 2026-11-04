
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import BuyerPortalShell from "../../../../shared/components/BuyerPortalShell";
import SupplierOffers from "../components/SupplierOffers";
import { getProductById } from "../services/productApi";

import ProductGallery from "../components/product-detail/ProductGallery";
import ProductOverview from "../components/product-detail/ProductOverview";
import ProductInformationTabs from "../components/product-detail/ProductInformationTabs";
import RelatedProducts from "../components/product-detail/RelatedProducts";

export default function ProductDetail() {
  const { productId } = useParams();

  const [product, setProduct] = useState(null);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setError("");
    setProduct(null);
    setSelectedOffer(null);

    getProductById(productId, {
      signal: controller.signal,
    })
      .then((data) => {
        if (!controller.signal.aborted) {
          setProduct(data);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError(err.message || "Failed to load product details");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [productId]);

  const productName =
    product?.product_name ??
    product?.name ??
    "Product detail";

  if (loading) {
    return (
      <BuyerPortalShell currentTab="marketplace">
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p role="status" className="text-sm font-semibold text-slate-600">
            Loading aerospace component details...
          </p>
          <p className="text-xs text-slate-400 mt-1">Retrieving catalog record and verified supplier listings</p>
        </div>
      </BuyerPortalShell>
    );
  }

  if (error) {
    return (
      <BuyerPortalShell currentTab="marketplace">
        <div className="space-y-4">
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 transition"
          >
            ← Back to Marketplace
          </Link>

          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-6"
          >
            <h1 className="font-semibold text-red-800">
              Unable to load product
            </h1>
            <p className="mt-2 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </BuyerPortalShell>
    );
  }

  if (!product) {
    return (
      <BuyerPortalShell currentTab="marketplace">
        <div className="space-y-4">
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 transition"
          >
            ← Back to Marketplace
          </Link>

          <div className="rounded-xl border border-slate-200 bg-white p-8">
            <h1 className="text-2xl font-bold text-slate-900">
              Product not found
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              The requested aircraft component does not exist in the catalog.
            </p>
          </div>
        </div>
      </BuyerPortalShell>
    );
  }

  return (
    <BuyerPortalShell currentTab="marketplace">
      <div className="space-y-6">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-sm">
          <ol className="flex flex-wrap items-center gap-2 text-slate-500">
            <li>
              <Link to="/" className="hover:text-blue-600 transition">
                Home
              </Link>
            </li>
            <li aria-hidden="true">›</li>
            <li>
              <Link to="/marketplace" className="hover:text-blue-600 transition">
                Marketplace
              </Link>
            </li>
            <li aria-hidden="true">›</li>
            <li className="font-semibold text-slate-900">
              {productName}
            </li>
          </ol>
        </nav>

        {/* Recommendation banner */}
        {product.recommendation_reason && (
          <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4">
            <p className="text-sm leading-6 text-slate-700">
              {product.recommendation_reason}
            </p>

            <Link
              to="/recommendations"
              className="shrink-0 rounded-lg border border-sky-200 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-sky-50"
            >
              Back to recommendations
            </Link>
          </section>
        )}

        {/* Product Gallery + Overview */}
        <section className="grid items-start gap-6 lg:grid-cols-2">
          <ProductGallery product={product} />

          <ProductOverview
            product={product}
            selectedOffer={selectedOffer}
          />
        </section>

        {/* Supplier Offers */}
        <SupplierOffers
          productId={productId}
          onOfferSelect={setSelectedOffer}
        />

        {/* Product Information */}
        <ProductInformationTabs
          product={product}
          selectedOffer={selectedOffer}
        />

        {/* Related Products */}
        <RelatedProducts product={product} />
      </div>
    </BuyerPortalShell>
  );
}
