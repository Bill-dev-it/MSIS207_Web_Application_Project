import Badge from "../common/Badge";

const TONE_BY_URGENCY = {
  Normal: "success",
  Monitor: "warning",
  Plan: "warning",
  "Replace Soon": "critical",
  LOW: "success",
  MEDIUM: "warning",
  HIGH: "critical",
};

export default function UrgencyBadge({ urgency }) {
  return <Badge tone={TONE_BY_URGENCY[urgency] || "neutral"}>{urgency}</Badge>;
}
