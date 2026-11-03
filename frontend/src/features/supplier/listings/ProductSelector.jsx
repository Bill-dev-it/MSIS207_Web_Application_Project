import { useEffect, useState } from "react";
import { getProducts } from "../../../services/productApi";

const PAGE_SIZE = 12;

function productLabel(product) {
  const details = [product.part_number, product.manufacturer, product.category_name]
    .filter(Boolean)
    .join(" · ");
  return details ? `${product.product_name} — ${details}` : product.product_name;
}

export default function ProductSelector({ selectedProduct, onSelect }) {
  const [choosing, setChoosing] = useState(!selectedProduct);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ page: 1, total_pages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!choosing) return undefined;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      setError("");
      getProducts({
        q: query,
        sort: "product_name",
        page,
        perPage: PAGE_SIZE,
        signal: controller.signal,
      })
        .then((response) => {
          if (controller.signal.aborted) return;
          setProducts(response.data);
          setMeta(response.meta);
        })
        .catch((err) => {
          if (controller.signal.aborted) return;
          setProducts([]);
          setMeta({ page: 1, total_pages: 0 });
          setError(err.message || "Unable to load catalog products.");
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [choosing, query, page]);

  function chooseProduct(product) {
    onSelect(product);
    setChoosing(false);
    setQuery("");
    setPage(1);
  }

  if (selectedProduct && !choosing) {
    return (
      <div>
        <p className="label">Selected catalog product</p>
        <div className="mt-1 flex flex-col gap-3 rounded-lg border border-neutral-200 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="break-words font-semibold text-primary-800">
              {selectedProduct.product_name || "Product name unavailable"}
            </p>
            <p className="mt-1 break-all font-mono text-sm text-neutral-600">
              {selectedProduct.part_number || "Part number unavailable"}
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              Product ID: {selectedProduct.product_id}
            </p>
          </div>
          <button type="button" className="btn btn-secondary shrink-0" onClick={() => setChoosing(true)}>
            Change product
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="label" htmlFor="catalog-product-search">Search catalog products *</label>
      <input
        id="catalog-product-search"
        className="input mt-1"
        type="search"
        maxLength={200}
        placeholder="Search by product name, part number or manufacturer"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setPage(1);
          setLoading(true);
          setError("");
        }}
        aria-describedby="catalog-product-help catalog-product-status"
      />
      <p id="catalog-product-help" className="mt-1 text-xs text-neutral-500">
        Select an active catalog product to use in this listing.
      </p>

      <div id="catalog-product-status" className="mt-3" aria-live="polite">
        {loading && <p role="status" className="text-sm text-neutral-500">Searching catalog products...</p>}
        {!loading && error && <p role="alert" className="text-sm text-critical">Unable to load products: {error}</p>}
        {!loading && !error && products.length === 0 && (
          <p role="status" className="text-sm text-neutral-500">No matching products found.</p>
        )}
      </div>

      {!loading && !error && products.length > 0 && (
        <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto" aria-label="Catalog product search results">
          {products.map((product) => (
            <li key={product.product_id}>
              <button
                type="button"
                className="w-full rounded-lg border border-neutral-200 p-3 text-left hover:border-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                onClick={() => chooseProduct(product)}
                aria-label={`Select ${productLabel(product)}`}
              >
                <span className="block break-words font-semibold text-primary-800">
                  {product.product_name}
                </span>
                <span className="mt-1 block break-all font-mono text-sm text-neutral-600">
                  {product.part_number}
                </span>
                <span className="mt-1 block text-xs text-neutral-500">
                  {[product.manufacturer, product.category_name, product.product_type].filter(Boolean).join(" · ")}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {meta.total_pages > 1 && (
        <nav className="mt-4 flex flex-wrap items-center justify-between gap-3" aria-label="Product search result pages">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={loading || page <= 1}
            onClick={() => {
              setLoading(true);
              setPage((current) => Math.max(1, current - 1));
            }}
          >
            Previous
          </button>
          <p className="text-sm text-neutral-600" aria-live="polite">
            Page {meta.page} of {meta.total_pages}
          </p>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={loading || page >= meta.total_pages}
            onClick={() => {
              setLoading(true);
              setPage((current) => Math.min(meta.total_pages, current + 1));
            }}
          >
            Next
          </button>
        </nav>
      )}

      {selectedProduct && (
        <button type="button" className="btn btn-secondary mt-3" onClick={() => setChoosing(false)}>
          Keep current product
        </button>
      )}
    </div>
  );
}
