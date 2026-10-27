import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "../components/ui/StatusBadge";
import { ModerationFilterBar } from "../components/moderation/ModerationFilterBar";

describe("UI Components & Design System", () => {
  it("renders urgency badges with proper indicators", () => {
    const { rerender } = render(<StatusBadge status="PRIORITIZE" type="urgency" />);
    expect(screen.getByText("PRIORITIZE")).toBeInTheDocument();

    rerender(<StatusBadge status="PREPARE" type="urgency" />);
    expect(screen.getByText("PREPARE")).toBeInTheDocument();

    rerender(<StatusBadge status="NORMAL" type="urgency" />);
    expect(screen.getByText("NORMAL")).toBeInTheDocument();

    rerender(<StatusBadge status="MONITOR" type="urgency" />);
    expect(screen.getByText("MONITOR")).toBeInTheDocument();
  });

  it("renders order statuses accurately", () => {
    const { rerender } = render(<StatusBadge status="CONFIRMED" type="order" />);
    expect(screen.getByText("CONFIRMED")).toBeInTheDocument();

    rerender(<StatusBadge status="DELIVERED" type="order" />);
    expect(screen.getByText("DELIVERED")).toBeInTheDocument();
  });

  it("renders ModerationFilterBar with status options and total item count", () => {
    render(
      <ModerationFilterBar
        activeStatus="DRAFT"
        onStatusChange={() => {}}
        searchQuery=""
        onSearchChange={() => {}}
        totalCount={42}
      />
    );

    expect(screen.getByText("Pending Review")).toBeInTheDocument();
    expect(screen.getByText("Approved & Live")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search part/i)).toBeInTheDocument();
  });
});
