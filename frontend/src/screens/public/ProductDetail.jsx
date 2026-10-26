
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import SupplierOffers from "../../components/public-marketplace/SupplierOffers";
import { getProductById } from "../../services/productApi";

export default function ProductDetail() {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    getProductById(productId, { signal: controller.signal })
      .then(setProduct)
      .catch((err) => {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [productId]);

  const name = product?.name ?? product?.product_name;
  const specs = product?.technical_specs;

  return (
    <div className="container-page py-12">
      <Link
        to="/marketplace"
        className="text-sm font-medium text-accent-600 hover:underline"
      >
        ← Back to Marketplace
      </Link>

      {loading && (
        <p role="status" className="mt-8 text-neutral-500">
          Loading product...
        </p>
      )}

      {!loading && error && (
        <p role="alert" className="mt-8 text-critical">
          {error}
        </p>
      )}

      {!loading && !error && !product && (
        <div className="card mt-8 p-8">
          <h1 className="text-2xl font-bold text-primary-800">
            Product not found
          </h1>
          <p className="mt-3 text-neutral-500">
            The requested product does not exist in the current catalog.
          </p>
        </div>
      )}

      {!loading && !error && product && (
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <article className="card p-8 lg:col-span-2">
            <p className="font-mono text-sm text-neutral-500">
              {product.part_number || "Part number unavailable"}
            </p>

            <h1 className="mt-3 text-3xl font-bold text-primary-800">
              {name || "Unnamed product"}
            </h1>

            <div className="mt-5 flex flex-wrap gap-2">
              {product.category_name && (
                <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
                  {product.category_name}
                </span>
              )}

              {product.product_type && (
                <span className="rounded-full bg-accent-50 px-3 py-1 text-xs font-medium text-accent-600">
                  {product.product_type}
                </span>
              )}
            </div>

            <dl className="mt-6 grid gap-4 border-t border-neutral-200 pt-5 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-neutral-500">Manufacturer</dt>
                <dd className="mt-1 font-medium text-primary-800">
                  {product.manufacturer || "Not available"}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-neutral-500">Part Number</dt>
                <dd className="mt-1 break-all font-mono text-sm text-primary-800">
                  {product.part_number || "Not available"}
                </dd>
              </div>
            </dl>

            <h2 className="mt-8 text-lg font-semibold text-primary-800">
              Product Description
            </h2>

            <p className="mt-3 whitespace-pre-line leading-relaxed text-neutral-500">
              {product.description || "No description available."}
            </p>

            {specs && typeof specs === "object" && (
              <section className="mt-8">
                <h2 className="text-lg font-semibold text-primary-800">
                  Technical Specifications
                </h2>

                <dl className="mt-4 divide-y divide-neutral-200">
                  {Object.entries(specs).map(([key, value]) => (
                    <div
                      key={key}
                      className="grid gap-2 py-3 sm:grid-cols-2"
                    >
                      <dt className="text-sm font-medium text-primary-800">
                        {key.replaceAll("_", " ")}
                      </dt>
                      <dd className="break-words text-sm text-neutral-500">
                        {typeof value === "object"
                          ? JSON.stringify(value)
                          : String(value)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}
          </article>

          <aside className="card h-fit min-w-0 p-5 sm:p-6">
            <SupplierOffers productId={productId} />
          </aside>
        </div>
      )}
    </div>
  );
}
