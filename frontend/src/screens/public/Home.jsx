const portals = [
  {
    name: "Buyer",
    description: "Browse the marketplace and manage procurement.",
  },
  {
    name: "Supplier",
    description: "Manage listings, inventory, and supplier orders.",
  },
  {
    name: "Admin",
    description: "Oversee marketplace operations.",
  },
];

export default function Home() {
  return (
    <main className="container-page py-12">
      <section className="card p-8 md:p-12">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">
          Aviation parts marketplace
        </p>
        <h1 className="mt-3 text-3xl font-bold text-primary-800 md:text-4xl">
          Welcome to AeroRUL
        </h1>
        <p className="mt-4 max-w-2xl text-neutral-500">
          A shared workspace for buyers, suppliers, and administrators.
          Choose a portal to explore the frontend foundation.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {portals.map(({ name, description }) => (
            <article key={name} className="rounded-xl border border-neutral-200 p-5">
              <h2 className="font-semibold text-primary-800">{name}</h2>
              <p className="mt-2 text-sm text-neutral-500">{description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
