
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getProducts } from "../../services/productApi";

function getProductId(product) {
  return product.product_id ?? product.id;
}

function getProductName(product) {
  return product.name ?? product.product_name ?? "Unnamed product";
}

export default function Marketplace() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const query = searchParams.get("q") ?? "";

  useEffect(() => {
    const controller = new AbortController();

    getProducts({ signal: controller.signal })
      .then(setProducts)
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
  }, []);

  const filteredProducts = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    if (!keyword) return products;

    return products.filter((product) => {
      const searchableText = [
        getProductName(product),
        product.part_number,
        product.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(keyword);
    });
  }, [products, query]);

  return (
    <div className="container-page py-12">
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent-600">
          Aviation Parts Catalog
        </p>

        <h1 className="mt-3 text-3xl font-bold text-primary-800">
          Marketplace
        </h1>

        <p className="mt-3 text-neutral-500">
          Explore aviation parts and components available
          through AeroRUL.
        </p>
      </header>

      <form
        role="search"
        className="mb-8 flex flex-col gap-3 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();

          const formData = new FormData(event.currentTarget);
          const value = String(formData.get("search") ?? "").trim();

          setSearchParams(value ? { q: value } : {});
        }}
      >
        <label htmlFor="product-search" className="sr-only">
          Search products
        </label>

        <input
          id="product-search"
          key={query}
          name="search"
          type="search"
          defaultValue={query}
          placeholder="Search by product or part number"
          className="input flex-1"
        />

        <button type="submit" className="btn btn-primary">
          Search
        </button>
      </form>

      {loading && (
        <p role="status" className="text-neutral-500">
          Loading products...
        </p>
      )}

      {!loading && error && (
        <div role="alert" className="card p-6">
          <h2 className="font-semibold text-critical">
            Unable to load products
          </h2>
          <p className="mt-2 text-sm text-neutral-500">
            {error}
          </p>
          <p className="mt-2 text-sm text-neutral-500">
            Check the backend connection and API configuration.
          </p>
        </div>
      )}

      {!loading && !error && (
        <>
          <p className="mb-5 text-sm text-neutral-500">
            {filteredProducts.length} products found
          </p>

          {filteredProducts.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="font-medium text-primary-800">
                No matching products
              </p>
              <p className="mt-2 text-sm text-neutral-500">
                Try a different search term.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product) => {
                const id = getProductId(product);

                return (
                  <article key={id} className="card flex flex-col p-6">
                    <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                      <span className="font-mono text-xl font-bold">
                        AR
                      </span>
                    </div>

                    <p className="font-mono text-xs text-neutral-500">
                      {product.part_number || "Part number unavailable"}
                    </p>

                    <h2 className="mt-2 text-lg font-semibold text-primary-800">
                      {getProductName(product)}
                    </h2>

                    <p className="mt-3 line-clamp-3 flex-1 text-sm text-neutral-500">
                      {product.description || "No description available."}
                    </p>

                    {id != null && (
                      <Link
                        to={`/marketplace/products/${encodeURIComponent(id)}`}
                        className="btn btn-secondary mt-6"
                      >
                        View Details
                      </Link>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
