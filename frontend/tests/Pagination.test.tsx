import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Pagination } from "../src/components/Pagination";

describe("Pagination", () => {
  it("renders nothing when everything fits on one page", () => {
    const { container } = render(<Pagination page={1} pageSize={25} total={10} onPageChange={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the current range and disables Previous on the first page", () => {
    render(<Pagination page={1} pageSize={25} total={60} onPageChange={vi.fn()} />);
    expect(screen.getByText("Showing 1–25 of 60")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
  });

  it("disables Next on the last page", () => {
    render(<Pagination page={3} pageSize={25} total={60} onPageChange={vi.fn()} />);
    expect(screen.getByText("Showing 51–60 of 60")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("calls onPageChange with the next page number", async () => {
    const onPageChange = vi.fn();
    render(<Pagination page={1} pageSize={25} total={60} onPageChange={onPageChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});
