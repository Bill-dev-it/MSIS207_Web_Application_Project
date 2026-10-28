
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/common/EmptyState";
import {
  getProducts,
  getProductFilterOptions,
} from "../../services/productApi";

const PAGE_SIZE = 12;

export default function Marketplace() {
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get("q") || "";
  const category = searchParams.get("category") || "ALL";
  const manufacturer = searchParams.get("manufacturer") || "ALL";
  const sort = searchParams.get("sort") || "NAME_ASC";
  const requestedPage = Number(searchParams.get("page"));
  const page =
    Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1;

  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({
    total_items: 0,
    total_pages: 0,
    page: 1,
  });
  const [options, setOptions] = useState({
    categories: [],
    manufacturers: [],
  });
  const [loading, setLoading] = useState(true);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [error, setError] = useState("");
  const [optionsError, setOptionsError] = useState("");

  // Load filter options independently from paginated products.
  useEffect(() => {
    const controller = new AbortController();

    getProductFilterOptions({ signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) {
          setOptions(data);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setOptionsError(err.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setOptionsLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  // Reload the current page whenever search, filters or sorting change.
  useEffect(() => {
    const controller = new AbortController();
    const filter = [];

    if (category !== "ALL") {
      filter.push({
        key: "category_name",
        operator: "=",
        value: category,
      });
    }

    if (manufacturer !== "ALL") {
      filter.push({
        key: "manufacturer",
        operator: "=",
        value: manufacturer,
      });
    }

    const sortMap = {
      NAME_ASC: "product_name",
      NAME_DESC: "-product_name",
      PART_NUMBER: "part_number",
    };

    setLoading(true);
    setError("");

    getProducts({
      q: query,
      filter,
      sort: sortMap[sort] || "product_name",
      page,
      perPage: PAGE_SIZE,
      signal: controller.signal,
    })
      .then((response) => {
        if (!controller.signal.aborted) {
          setProducts(response.data);
          setMeta(response.meta);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError(err.message);
          setProducts([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [query, category, manufacturer, sort, page]);

  function updateParams(changes) {
    const next = new URLSearchParams(searchParams);

    Object.entries(changes).forEach(([key, value]) => {
      if (!value || value === "ALL" || value === "NAME_ASC") {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    });

    setSearchParams(next);
  }

  function handleSearch(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const value = String(formData.get("search") || "").trim();

    updateParams({ q: value, page: 1 });
  }

  function handleFilterChange(key, value) {
    updateParams({ [key]: value, page: 1 });
  }

  function resetFilters() {
    setSearchParams({});
  }

  return (
    <div className="container-page py-8 sm:py-12">
      <PageHeader
        eyebrow="Aviation Parts Catalog"
        title="Marketplace"
        description="Explore aviation parts and components from the AeroRUL catalog."
      />

      {/* Search and filters */}
      <section
        aria-label="Product search and filters"
        className="card mb-8 p-4 sm:p-6"
      >
        <form
          role="search"
          onSubmit={handleSearch}
          className="flex flex-col gap-3 sm:flex-row"
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
            placeholder="Search products or part numbers"
            className="input min-w-0 flex-1"
          />

          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="category" className="label">
              Category
            </label>
            <select
              id="category"
              className="input"
              value={category}
              disabled={optionsLoading || Boolean(optionsError)}
              onChange={(e) =>
                handleFilterChange("category", e.target.value)
              }
            >
              <option value="ALL">All categories</option>
              {options.categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="manufacturer" className="label">
              Manufacturer
            </label>
            <select
              id="manufacturer"
              className="input"
              value={manufacturer}
              disabled={optionsLoading || Boolean(optionsError)}
              onChange={(e) =>
                handleFilterChange("manufacturer", e.target.value)
              }
            >
              <option value="ALL">All manufacturers</option>
              {options.manufacturers.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="sort" className="label">
              Sort by
            </label>
            <select
              id="sort"
              className="input"
              value={sort}
              onChange={(e) =>
                handleFilterChange("sort", e.target.value)
              }
            >
              <option value="NAME_ASC">Name: A–Z</option>
              <option value="NAME_DESC">Name: Z–A</option>
              <option value="PART_NUMBER">Part Number</option>
            </select>
          </div>
        </div>

        {optionsError && (
          <p role="alert" className="mt-3 text-sm text-red-600">
            Unable to load filter options: {optionsError}
          </p>
        )}

        <button
          type="button"
          onClick={resetFilters}
          className="btn btn-secondary mt-4"
        >
          Clear Filters
        </button>
      </section>

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
        </div>
      )}

      {!loading && !error && (
        <>
          <p role="status" className="mb-5 text-sm text-neutral-500">
            {meta.total_items} products found
          </p>

          {products.length === 0 ? (
            <EmptyState
              title="No matching products"
              description="Try another search term or clear your filters."
              action={
                <button
                  type="button"
                  onClick={resetFilters}
                  className="btn btn-secondary"
                >
                  Clear Filters
                </button>
              }
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
              <article
                  key={product.product_id}
                  className="card flex flex-col p-5 sm:p-6"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 font-bold text-primary-700">
                    AR
                  </div>

                  <p className="break-all font-mono text-xs text-neutral-500">
                    {product.part_number || "N/A"}
                  </p>

                  <h2 className="mt-2 text-lg font-semibold text-primary-800">
                    {product.product_name || product.name}
                  </h2>

                  <p className="mt-2 text-xs text-accent-600">
                    {product.category_name || "Uncategorized"}
                  </p>

                  <p className="mt-1 text-xs text-neutral-500">
                    {product.manufacturer || "Manufacturer unavailable"}
                  </p>

                  <p className="mt-4 flex-1 text-sm text-neutral-500">
                    {product.description || "No description available."}
                  </p>

                  <Link
                    to={`/marketplace/products/${product.product_id}`}
                    className="btn btn-secondary mt-5"
                  >
                    View Details
                  </Link>
                </article>
              ))}
            </div>
          )}

          {meta.total_pages > 1 && (
            <nav
              aria-label="Product pagination"
              className="mt-8 flex flex-wrap items-center justify-center gap-4"
            >
              <button
                type="button"
                className="btn btn-secondary"
                disabled={loading || page <= 1}
                onClick={() => updateParams({ page: page - 1 })}
              >
                Previous
              </button>

              <span className="text-sm text-neutral-500">
                Page {meta.page} of {meta.total_pages}
              </span>

              <button
                type="button"
                className="btn btn-secondary"
                disabled={loading || page >= meta.total_pages}
                onClick={() => updateParams({ page: page + 1 })}
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
