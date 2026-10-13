const TONES = {
  neutral: "bg-neutral-200 text-primary-800",
  success: "bg-success/10 text-success",
  warning: "bg-warning/20 text-[#7A5B00]",
  critical: "bg-critical/10 text-critical",
  accent: "bg-accent-50 text-accent",
};

export default function Badge({ tone = "neutral", children }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[tone]}`}>
      {children}
    </span>
  );
}
