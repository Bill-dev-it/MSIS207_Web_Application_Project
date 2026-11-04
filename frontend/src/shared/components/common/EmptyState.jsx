export default function EmptyState({ title, description, action }) {
  return (
    <section role="status" className="card px-5 py-10 text-center sm:px-8">
      <h2 className="text-lg font-semibold text-primary-800">{title}</h2>
      {description && <p className="mx-auto mt-2 max-w-lg text-sm text-neutral-500">{description}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </section>
  );
}
