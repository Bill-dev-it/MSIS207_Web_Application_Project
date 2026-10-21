import { Link, useNavigate } from "react-router-dom";
const featuredCategories = [
  {
    id: "engine",
    name: "Engine",
    description: "Engine parts and components.",
  },
  {
    id: "avionics",
    name: "Avionics",
    description: "Aircraft electronic systems.",
  },
  {
    id: "electrical",
    name: "Electrical",
    description: "Electrical parts and systems.",
  },
  {
    id: "hydraulics",
    name: "Hydraulics",
    description: "Hydraulic system components.",
  },
  {
    id: "landing-gear",
    name: "LandingGear",
    description: "Landing gear components.",
  },
  {
    id: "replacement-engines",
    name: "Replacement Engines",
    description: "Replacement engine catalog.",
  },
];

const benefits = [
  {
    title: "Aviation-Focused Marketplace",
    description:
      "Explore aircraft engine parts and components from multiple suppliers in one platform.",
  },
  {
    title: "Compatibility-Aware Discovery",
    description:
      "Support product selection using engine model and part compatibility information.",
  },
  {
    title: "AI-Assisted Maintenance Planning",
    description:
      "Use RUL predictions to support maintenance planning and replacement recommendations.",
  },
];

const steps = [
  {
    number: "01",
    title: "Discover Parts",
    description:
      "Search the catalog by part number, product name, or engine model.",
  },
  {
    number: "02",
    title: "Review Listings",
    description:
      "Compare compatible products, supplier offers, and availability.",
  },
  {
    number: "03",
    title: "Procure",
    description:
      "Add selected products to the cart and complete the B2B ordering process.",
  },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="bg-neutral-50">
      {/* Hero */}
      <section
        aria-labelledby="hero-heading"
        className="bg-primary-50"
      >
        <div className="container-page py-20 md:py-28">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent-600">
              AI-Enhanced Aviation Marketplace
            </p>

            <h1
              id="hero-heading"
              className="mt-4 text-4xl font-bold leading-tight tracking-tight text-primary-800 md:text-5xl"
            >
              Aircraft Parts Procurement,
              <span className="block text-primary-600">
                Powered by Intelligence.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-neutral-500">
              Discover aviation engine parts, connect with
              suppliers, and support maintenance planning
              through RUL-based replacement recommendations.
            </p>

            <form
              role="search"
              aria-label="Marketplace search"
              className="mt-8 flex flex-col gap-3 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                const query = String(formData.get("q") ?? "").trim();

                navigate(
                  query
                    ? `/marketplace?q=${encodeURIComponent(query)}`
                    : "/marketplace"
                );
              }}
            >
              <label htmlFor="home-search" className="sr-only">
                Search aviation parts
              </label>

              <input
                id="home-search"
                name="q"
                type="search"
                placeholder="Search by part number, product or engine model"
                className="input min-w-0 flex-1"
              />

              <button type="submit" className="btn btn-primary">
                Search Parts
              </button>
            </form>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/marketplace" className="btn btn-primary">
                Explore Marketplace
              </Link>

              <a
                href="#how-it-works"
                className="btn btn-secondary"
              >
                How It Works
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section
        aria-labelledby="categories-heading"
        className="container-page py-16 md:py-20"
      >
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent-600">
            Parts Catalog
          </p>

          <h2
            id="categories-heading"
            className="mt-3 text-3xl font-bold tracking-tight text-primary-800"
          >
            Explore Aviation Parts Categories
          </h2>

          <p className="mt-4 text-neutral-500">
            Discover engine parts, aircraft components, and
            replacement engines across the marketplace.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featuredCategories.map((category, index) => (
            <article
              key={category.id}
              className="card p-6 transition-shadow hover:shadow-md"
            >
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-primary-50 text-sm font-semibold text-primary-700">
                {String(index + 1).padStart(2, "0")}
              </div>

              <h3 className="text-lg font-semibold text-primary-800">
                {category.name}
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                {category.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Value Proposition */}
      <section
        aria-labelledby="benefits-heading"
        className="bg-white py-16 md:py-20"
      >
        <div className="container-page">
          <div className="mb-8 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent-600">
              Why AeroRUL
            </p>

            <h2
              id="benefits-heading"
              className="mt-3 text-3xl font-bold text-primary-800"
            >
              One Platform for Smarter Aviation Procurement
            </h2>

            <p className="mt-4 text-neutral-500">
              Bringing parts discovery and AI-assisted
              maintenance planning into a shared B2B workflow.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {benefits.map((benefit) => (
              <article
                key={benefit.title}
                className="card p-6"
              >
                <div className="mb-5 h-1 w-12 rounded-full bg-accent" />

                <h3 className="text-lg font-semibold text-primary-800">
                  {benefit.title}
                </h3>

                <p className="mt-3 text-sm leading-relaxed text-neutral-500">
                  {benefit.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        aria-labelledby="how-it-works-heading"
        className="container-page scroll-mt-20 py-16 md:py-20"
      >
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent-600">
            Getting Started
          </p>

          <h2
            id="how-it-works-heading"
            className="mt-3 text-3xl font-bold text-primary-800"
          >
            How AeroRUL Works
          </h2>

          <p className="mt-4 text-neutral-500">
            A straightforward procurement workflow,
            supported by aviation-specific product data.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {steps.map((step) => (
            <article
              key={step.number}
              className="card p-6"
            >
              <span className="font-mono text-2xl font-bold text-accent-600">
                {step.number}
              </span>

              <h3 className="mt-4 text-lg font-semibold text-primary-800">
                {step.title}
              </h3>

              <p className="mt-3 text-sm leading-relaxed text-neutral-500">
                {step.description}
              </p>
            </article>
          ))}
        </div>

        <p className="mt-8 text-sm text-neutral-500">
          RUL-based recommendations are research/demo
          decision support, not certified aircraft
          maintenance instructions.
        </p>
      </section>
    </div>
  );
}
