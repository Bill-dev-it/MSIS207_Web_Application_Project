import { Link } from "react-router-dom";

export default function AuthScreenFrame({ eyebrow, title, description, children }) {
  return (
    <div className="container-page py-8 sm:py-12">
      <section className="card mx-auto max-w-xl space-y-5 p-5 sm:p-8" aria-labelledby="auth-screen-title">
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-primary-700">{eyebrow}</p>
          <h1 id="auth-screen-title" className="text-2xl font-bold tracking-tight text-primary-800 sm:text-3xl">{title}</h1>
          {description && <p className="text-sm leading-6 text-neutral-600">{description}</p>}
        </div>
        {children}
        <p className="border-t border-neutral-200 pt-4 text-sm text-neutral-600">
          <Link className="font-semibold text-primary-700 underline underline-offset-2" to="/marketplace">Return to Marketplace</Link>
        </p>
      </section>
    </div>
  );
}
