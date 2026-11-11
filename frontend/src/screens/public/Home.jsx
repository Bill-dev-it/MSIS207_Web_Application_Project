import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ProductVisual from "../../components/public-marketplace/ProductVisual";
import { getProducts } from "../../services/productApi";
import heroBgImg from "./AeroRUL_Background.png";

const CATEGORY_CARDS = [
  {
    key: "engine-parts",
    name: "Engine Parts",
    category: "Engine",
    description: "Compressor modules, oil filters, fuel nozzles & internal components.",
  },
  {
    key: "turbine-blades",
    name: "Replacement Engines",
    category: "Replacement Engines",
    description: "Complete certified turbofan powerplant assemblies including CFM56 series.",
  },
  {
    key: "avionics",
    name: "Avionics & Flight Systems",
    category: "Avionics",
    description: "Cockpit instruments, navigation systems, flight directors & electronic modules.",
  },
  {
    key: "electrical",
    name: "Electrical Systems",
    category: "Electrical",
    description: "Power distribution units, generators, circuit breakers & wiring harnesses.",
  },
  {
    key: "hydraulics",
    name: "Hydraulics & Actuation",
    category: "Hydraulics",
    description: "Actuator cylinders, valves, pumps & high-pressure fluid lines.",
  },
  {
    key: "landing-gear",
    name: "Landing Gear",
    category: "LandingGear",
    description: "Oleo shock struts, torque scissor links, wheel rims & brake units.",
  },
  {
    key: "fasteners",
    name: "Fasteners & Hardware",
    category: "Fasteners",
    description: "Titanium hex bolts, castellated nuts, flush rivets & precision pins.",
  },
  {
    key: "cabin",
    name: "Cabin Components",
    category: "Cabin",
    description: "Cabin environmental control panels, air filters & interior equipment.",
  },
  {
    key: "access-panels",
    name: "Structural Parts & Panels",
    category: "Structure",
    description: "Airframe structural brackets, composite inspection access panels & covers.",
  },
];

const WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Fleet Operating Cycles",
    description:
      "Monitor powerplant operating hours and telemetry cycles recorded for registered aircraft engines.",
  },
  {
    step: "02",
    title: "AI-Assisted RUL Forecast",
    description:
      "Inspect Remaining Useful Life (RUL) advisory forecasts to anticipate scheduled overhaul shop visits.",
  },
  {
    step: "03",
    title: "Matched Procurement",
    description:
      "Source compatible replacement parts and turbine assemblies directly from verified aviation suppliers.",
  },
];

export default function Home() {
  const navigate = useNavigate();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function loadFeatured() {
      setLoadingFeatured(true);
      try {
        const response = await getProducts({
          perPage: 4,
          signal: controller.signal,
        });
        if (!controller.signal.aborted && Array.isArray(response?.data)) {
          setFeaturedProducts(response.data);
        }
      } catch {
        // Silently tolerate abort or catalog availability issues on Home screen
      } finally {
        if (!controller.signal.aborted) {
          setLoadingFeatured(false);
        }
      }
    }

    loadFeatured();
    return () => controller.abort();
  }, []);

  function handleSearch(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const query = String(formData.get("q") ?? "").trim();
    navigate(
      query ? `/marketplace?q=${encodeURIComponent(query)}` : "/marketplace"
    );
  }

  return (
    <div className="bg-[#F8FAFC]">
      {/* 1. Hero Section (Aviation Background Image + Dark Overlay + Editorial Layout) */}
      <section
        aria-labelledby="hero-heading"
        className="relative bg-[#0B1F3A] bg-cover bg-center bg-no-repeat min-h-[420px] md:min-h-[520px] flex items-center overflow-hidden border-b border-slate-300"
        style={{ backgroundImage: `url(${heroBgImg})` }}
      >
        {/* Dark Navy/Black Gradient Overlay for Maximum Readability */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-[#050F20]/90 via-[#0B1F3A]/75 to-[#0B1F3A]/55"
          aria-hidden="true"
        />

        {/* Hero Content Container (Layered above overlay) */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-3xl">
            {/* AI-Enhanced Marketplace Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-md text-sky-200 border border-white/20 mb-6 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#2D9CDB] animate-pulse" />
              AI-Enhanced Aviation Marketplace
            </div>

            {/* Headline (34-40px on mobile, ~56px on desktop) */}
            <h1
              id="hero-heading"
              className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] font-extrabold tracking-tight text-white leading-[1.12]"
            >
              Aircraft Parts Procurement,{" "}
              <span className="text-[#38BDF8] block sm:inline">
                Powered by Intelligence.
              </span>
            </h1>

            {/* Supporting Description (~650-700px, soft white) */}
            <p className="mt-6 text-base sm:text-lg text-slate-200 leading-relaxed max-w-2xl drop-shadow-xs">
              Discover aircraft engine parts, connect with verified suppliers, and support maintenance planning through RUL-based replacement recommendations.
            </p>

            {/* Working Search Bar */}
            <form
              role="search"
              aria-label="Marketplace search"
              onSubmit={handleSearch}
              className="mt-8 flex flex-col sm:flex-row gap-3 max-w-xl"
            >
              <label htmlFor="home-search" className="sr-only">
                Search aviation parts
              </label>
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  id="home-search"
                  name="q"
                  type="search"
                  placeholder="Search by part number, turbine, or model..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/20 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#2D9CDB] shadow-lg"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 rounded-xl font-bold text-sm bg-[#2D9CDB] text-white hover:bg-[#2589C2] transition-colors shadow-md shrink-0 cursor-pointer"
              >
                Search Parts
              </button>
            </form>

            {/* CTA Navigation Actions */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                to="/marketplace"
                className="px-5 py-2.5 rounded-xl font-bold text-xs text-[#0B1F3A] bg-white hover:bg-slate-100 transition-colors shadow-xs"
              >
                Explore Catalog &rarr;
              </Link>
              <a
                href="#how-it-works"
                className="px-5 py-2.5 rounded-xl font-semibold text-xs text-slate-200 hover:text-white border border-white/25 hover:bg-white/10 transition-colors backdrop-blur-xs"
              >
                How RUL Procurement Works
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Visual Category Grid Section (Aligned with Actual Catalog Categories) */}
      <section aria-labelledby="categories-heading" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs font-bold uppercase tracking-wider text-sky-700">
            Aviation Component Catalog
          </p>
          <h2
            id="categories-heading"
            className="mt-2 text-3xl font-extrabold tracking-tight text-[#0B1F3A]"
          >
            Explore Certified Aircraft Categories
          </h2>
          <p className="mt-3 text-sm text-slate-600">
            Source compatible replacement components, sensors, and structural assemblies mapped to aircraft powerplant types.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {CATEGORY_CARDS.map((cat) => (
            <Link
              key={cat.category}
              to={`/marketplace?category=${encodeURIComponent(cat.category)}`}
              className="group bg-white rounded-xl border border-slate-200 p-6 shadow-xs hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <ProductVisual categoryKey={cat.key} size="sm" />
                  <span className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 group-hover:bg-[#0B1F3A] group-hover:text-white flex items-center justify-center transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
                  {cat.name}
                </h3>
                <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                  {cat.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-sky-700">
                <span>Browse Category</span>
                <span>&rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Featured Parts from Actual Catalog */}
      <section aria-labelledby="featured-heading" className="bg-white border-y border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-sky-700">
                Catalog Highlights
              </p>
              <h2
                id="featured-heading"
                className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0B1F3A]"
              >
                Featured Aviation Spares
              </h2>
            </div>
            <Link
              to="/marketplace"
              className="text-xs font-bold text-sky-700 hover:text-sky-900 transition-colors"
            >
              View All Parts in Marketplace &rarr;
            </Link>
          </div>

          {loadingFeatured ? (
            <div className="py-12 text-center text-sm text-slate-500">
              Loading featured catalog products...
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              Explore the full marketplace catalog to view available supplier inventory.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <article
                  key={product.product_id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="w-full flex justify-center py-2 mb-3 bg-slate-50/60 rounded-lg">
                      <ProductVisual product={product} size="md" />
                    </div>
                    <p className="font-mono text-xs text-slate-400 font-semibold truncate">
                      {product.part_number || "P/N N/A"}
                    </p>
                    <h3 className="mt-1.5 text-sm font-bold text-slate-900 line-clamp-2">
                      {product.product_name || product.name}
                    </h3>
                    <p className="mt-1 text-xs text-sky-700 font-medium">
                      {product.category_name || "Aircraft Part"}
                    </p>
                    <p className="mt-2 text-xs text-slate-500 line-clamp-2">
                      {product.description || "Certified replacement spare."}
                    </p>
                  </div>

                  <Link
                    to={`/marketplace/products/${encodeURIComponent(product.product_id)}`}
                    className="mt-4 w-full py-2 px-3 text-center rounded-lg text-xs font-bold bg-[#0B1F3A] text-white hover:bg-slate-800 transition-colors"
                  >
                    View Details
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. RUL-Assisted Workflow (How AeroRUL Works) */}
      <section id="how-it-works" aria-labelledby="workflow-heading" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs font-bold uppercase tracking-wider text-sky-700">
            Intelligent Procurement
          </p>
          <h2
            id="workflow-heading"
            className="mt-2 text-3xl font-extrabold tracking-tight text-[#0B1F3A]"
          >
            How the RUL-Assisted Workflow Works
          </h2>
          <p className="mt-3 text-sm text-slate-600">
            Bridging aircraft telemetry insights with commercial B2B procurement to reduce unscheduled AOG downtime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {WORKFLOW_STEPS.map((step) => (
            <article
              key={step.step}
              className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs relative"
            >
              <span className="font-mono text-3xl font-black text-slate-200 block mb-3">
                {step.step}
              </span>
              <h3 className="text-base font-bold text-[#0B1F3A]">
                {step.title}
              </h3>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                {step.description}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-10 p-4 rounded-xl bg-slate-100/80 border border-slate-200 text-center max-w-2xl mx-auto text-xs text-slate-500">
          <strong>Academic Safety Disclaimer:</strong> AeroRUL Remaining Useful Life (RUL) predictions and maintenance recommendations provide computational decision-support demonstrations only, and do not substitute certified powerplant engineering directives or OEM documentation.
        </div>
      </section>
    </div>
  );
}
