import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ProductVisual from "../../components/public-marketplace/ProductVisual";
import { getProductCoverImage } from "./productImages";
import EmptyState from "../../components/common/EmptyState";
import { getProducts, getProductFilterOptions } from "../../services/productApi";

const PAGE_SIZE = 12;
const SORT_VALUES = {
  NAME_ASC: "product_name",
  NAME_DESC: "-product_name",
  PART_NUMBER: "part_number",
};

export default function Marketplace() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const category = searchParams.get("category") || "ALL";
  const manufacturer = searchParams.get("manufacturer") || "ALL";
  const sort = searchParams.get("sort") || "NAME_ASC";
  const requestedPage = Number(searchParams.get("page"));
  const page =
    Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ total_items: 0, total_pages: 0, page: 1 });
  const [options, setOptions] = useState({ categories: [], manufacturers: [] });
  const [loading, setLoading] = useState(true);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [error, setError] = useState("");
  const [optionsError, setOptionsError] = useState("");

  // Load filter options with async/await
  useEffect(() => {
    const controller = new AbortController();

    async function fetchOptions() {
      try {
        const data = await getProductFilterOptions({ signal: controller.signal });
        if (!controller.signal.aborted) setOptions(data);
      } catch (err) {
        if (!controller.signal.aborted) setOptionsError(err.message);
      } finally {
        if (!controller.signal.aborted) setOptionsLoading(false);
      }
    }

    fetchOptions();
    return () => controller.abort();
  }, []);

  // Load products catalog with async/await
  useEffect(() => {
    const controller = new AbortController();
    const filter = [];
    if (category !== "ALL") {
      filter.push({ key: "category_name", operator: "=", value: category });
    }
    if (manufacturer !== "ALL") {
      filter.push({ key: "manufacturer", operator: "=", value: manufacturer });
    }

    async function fetchProducts() {
      setLoading(true);
      setError("");
      try {
        const response = await getProducts({
          q: query,
          filter,
          sort: SORT_VALUES[sort] || "product_name",
          page,
          perPage: PAGE_SIZE,
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        setProducts(response.data);
        setMeta(response.meta);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err.message);
        setProducts([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    fetchProducts();
    return () => controller.abort();
  }, [query, category, manufacturer, sort, page]);

  function updateParams(changes) {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(changes)) {
      if (!value || value === "ALL" || value === "NAME_ASC") {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    }
    setSearchParams(next);
  }

  function handleSearch(event) {
    event.preventDefault();
    const value = String(new FormData(event.currentTarget).get("search") || "").trim();
    updateParams({ q: value, page: 1 });
  }

  function handleFilterChange(key, value) {
    updateParams({ [key]: value, page: 1 });
  }

  function resetFilters() {
    setSearchParams({});
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-100 uppercase tracking-wider">
            B2B Parts Catalog
          </span>
          <span className="text-xs text-slate-400">AeroRUL Aviation Exchange</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Aviation Parts Marketplace
        </h1>
        <p className="mt-1 text-sm text-slate-500 max-w-2xl">
          Discover certified turbine assemblies, avionics instruments, hydraulic actuators, and hardware spares from approved suppliers.
        </p>
      </div>

      {/* Search and Filters Panel */}
      <section
        aria-label="Product search and filters"
        className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs mb-8"
      >
        <form role="search" onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <label htmlFor="product-search" className="sr-only">
            Search products
          </label>
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              id="product-search"
              key={query}
              name="search"
              type="search"
              defaultValue={query}
              placeholder="Search by part number, turbine type, or description..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0B1F3A] focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-lg text-xs font-bold bg-[#0B1F3A] text-white hover:bg-slate-800 transition-colors shadow-xs shrink-0"
          >
            Search Catalog
          </button>
        </form>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pt-4 border-t border-slate-100">
          <div>
            <label htmlFor="category" className="block text-xs font-semibold text-slate-700 mb-1">
              Category
            </label>
            <select
              id="category"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-800 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0B1F3A]"
              value={category}
              disabled={optionsLoading || Boolean(optionsError)}
              onChange={(e) => handleFilterChange("category", e.target.value)}
            >
              <option value="ALL">All Categories</option>
              {category !== "ALL" && !options.categories.includes(category) && (
                <option value={category}>{category}</option>
              )}
              {options.categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="manufacturer" className="block text-xs font-semibold text-slate-700 mb-1">
              Manufacturer
            </label>
            <select
              id="manufacturer"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-800 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0B1F3A]"
              value={manufacturer}
              disabled={optionsLoading || Boolean(optionsError)}
              onChange={(e) => handleFilterChange("manufacturer", e.target.value)}
            >
              <option value="ALL">All Manufacturers</option>
              {manufacturer !== "ALL" && !options.manufacturers.includes(manufacturer) && (
                <option value={manufacturer}>{manufacturer}</option>
              )}
              {options.manufacturers.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="sort" className="block text-xs font-semibold text-slate-700 mb-1">
              Sort By
            </label>
            <select
              id="sort"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-800 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0B1F3A]"
              value={sort}
              onChange={(e) => handleFilterChange("sort", e.target.value)}
            >
              <option value="NAME_ASC">Name: A to Z</option>
              <option value="NAME_DESC">Name: Z to A</option>
              <option value="PART_NUMBER">Part Number</option>
            </select>
          </div>
        </div>

        {optionsError && (
          <p role="alert" className="mt-3 text-xs text-red-600">
            Unable to load filter options: {optionsError}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={resetFilters}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            Reset Filters
          </button>
          {!loading && !error && (
            <span className="text-xs font-semibold text-slate-600">
              {meta.total_items} {meta.total_items === 1 ? "part found" : "parts found"}
            </span>
          )}
        </div>
      </section>

      {/* Loading State */}
      {loading && (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-full border-3 border-slate-200 border-t-[#0B1F3A] animate-spin" />
          <p className="mt-4 text-xs font-semibold text-slate-600">
            Querying Aviation Parts Catalog...
          </p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div role="alert" className="bg-white rounded-xl border border-red-200 p-6 text-center max-w-lg mx-auto">
          <p className="font-bold text-red-700 text-sm">Unable to Load Products</p>
          <p className="mt-1 text-xs text-slate-500">{error}</p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-4 px-4 py-2 bg-[#0B1F3A] text-white rounded-lg text-xs font-bold hover:bg-slate-800"
          >
            Clear Filters &amp; Retry
          </button>
        </div>
      )}

      {/* Product Results Grid */}
      {!loading && !error && (
        <>
          {products.length === 0 ? (
            <EmptyState
              title="No matching parts found"
              description="No aviation components match your current query or filter selection."
              action={
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-4 py-2 bg-[#0B1F3A] text-white rounded-lg text-xs font-bold hover:bg-slate-800"
                >
                  Clear All Filters
                </button>
              }
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => {
                const coverImage = getProductCoverImage(product);
                const detailUrl = `/marketplace/products/${encodeURIComponent(product.product_id)}`;

                return (
                  <article
                    key={product.product_id}
                    className="group bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden"
                  >
                    <div>
                      {/* 1. Large category-representative product image (approx 16:10) */}
                      <Link
                        to={detailUrl}
                        className="block relative aspect-[16/10] w-full overflow-hidden bg-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#0B1F3A] focus:ring-inset"
                        tabIndex={-1}
                        aria-hidden="true"
                      >
                        {coverImage?.src ? (
                          <img
                            src={coverImage.src}
                            alt={coverImage.alt || product.product_name || "Aviation part"}
                            loading="lazy"
                            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center p-4">
                            <ProductVisual product={product} size="md" />
                          </div>
                        )}

                        {/* Subtle Representative Image Disclaimer Badge */}
                        <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-900/70 text-slate-200 backdrop-blur-xs tracking-wide pointer-events-none select-none">
                          Representative image
                        </span>
                      </Link>

                      {/* Card Body */}
                      <div className="p-5 flex flex-col">
                        {/* 2. Small category badge and part number */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span
                            className="font-mono text-xs font-semibold text-slate-500 truncate"
                            title={product.part_number || "P/N N/A"}
                          >
                            {product.part_number ? `P/N: ${product.part_number}` : "P/N N/A"}
                          </span>
                          {product.category_name && (
                            <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded border border-sky-100/80 shrink-0 uppercase tracking-wider">
                              {product.category_name}
                            </span>
                          )}
                        </div>

                        {/* 3. Product name as the main heading */}
                        <h2 className="text-base font-bold text-slate-900 line-clamp-2 group-hover:text-sky-700 transition-colors">
                          <Link to={detailUrl}>
                            {product.product_name || product.name || "Aviation Component"}
                          </Link>
                        </h2>

                        {/* 4. OEM / Manufacturer */}
                        <p className="mt-1 text-xs text-slate-500 font-medium">
                          OEM:{" "}
                          <span className="text-slate-700 font-semibold">
                            {product.manufacturer || "Certified Aerospace OEM"}
                          </span>
                        </p>

                        {/* 5. Brief description, max 2-3 visible lines */}
                        <p className="mt-2.5 text-xs text-slate-600 line-clamp-2 sm:line-clamp-3 leading-relaxed">
                          {product.description ||
                            "Certified aerospace replacement component with traceable airworthiness documentation."}
                        </p>
                      </div>
                    </div>

                    {/* 6. Clear View Product Details Action */}
                    <div className="px-5 pb-5 pt-0">
                      <Link
                        to={detailUrl}
                        className="w-full inline-flex items-center justify-center py-2.5 px-4 rounded-xl text-xs font-bold bg-[#0B1F3A] text-white hover:bg-slate-800 active:bg-slate-900 transition-colors shadow-xs group/btn"
                      >
                        <span>View Product Details</span>
                        <svg
                          className="w-3.5 h-3.5 ml-1.5 transform group-hover/btn:translate-x-0.5 transition-transform"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {meta.total_pages > 1 && (
            <nav
              aria-label="Product pagination"
              className="mt-10 flex flex-wrap items-center justify-center gap-3 pt-6 border-t border-slate-200"
            >
              <button
                type="button"
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors"
                disabled={loading || page <= 1}
                onClick={() => updateParams({ page: page - 1 })}
              >
                &larr; Previous
              </button>
              <span className="text-xs font-mono text-slate-500 px-2">
                Page {meta.page} of {meta.total_pages}
              </span>
              <button
                type="button"
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors"
                disabled={loading || page >= meta.total_pages}
                onClick={() => updateParams({ page: page + 1 })}
              >
                Next &rarr;
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
