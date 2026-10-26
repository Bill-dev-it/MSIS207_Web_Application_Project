export default function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-widest text-accent-600">{eyebrow}</p>}
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-primary-800 sm:text-3xl">{title}</h1>
        {description && <p className="mt-3 text-sm leading-relaxed text-neutral-500 sm:text-base">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
