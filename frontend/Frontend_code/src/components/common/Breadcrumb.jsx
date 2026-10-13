import { Link } from "react-router-dom";

export default function Breadcrumb({ items }) {
  return (
    <nav className="mb-4 flex items-center gap-1.5 text-sm text-neutral-500">
      {items.map((item, idx) => (
        <span key={idx} className="flex items-center gap-1.5">
          {item.to ? (
            <Link to={item.to} className="hover:text-primary-700">{item.label}</Link>
          ) : (
            <span className="text-primary-800">{item.label}</span>
          )}
          {idx < items.length - 1 && <span>/</span>}
        </span>
      ))}
    </nav>
  );
}
