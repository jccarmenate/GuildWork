import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDialog } from "../src/components/ConfirmDialog";

function renderDialog(overrides: Partial<React.ComponentProps<typeof ConfirmDialog>> = {}) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  const utils = render(
    <ConfirmDialog
      open
      title="Delete this bug?"
      description="This can’t be undone."
      confirmLabel="Delete bug"
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...overrides}
    />
  );
  return { ...utils, onConfirm, onCancel };
}

describe("ConfirmDialog", () => {
  it("renders nothing when closed", () => {
    render(
      <ConfirmDialog
        open={false}
        title="Delete this bug?"
        description="This can’t be undone."
        confirmLabel="Delete bug"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("shows the title, description, and confirm label when open", () => {
    renderDialog();
    expect(screen.getByRole("alertdialog", { name: "Delete this bug?" })).toBeInTheDocument();
    expect(screen.getByText("This can’t be undone.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete bug" })).toBeInTheDocument();
  });

  it("focuses the Cancel button on open, not the destructive action", () => {
    renderDialog();
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
  });

  it("calls onConfirm when the confirm button is clicked", async () => {
    const user = userEvent.setup();
    const { onConfirm } = renderDialog();
    await user.click(screen.getByRole("button", { name: "Delete bug" }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("calls onCancel when the Cancel button is clicked", async () => {
    const user = userEvent.setup();
    const { onCancel } = renderDialog();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("calls onCancel when Escape is pressed", async () => {
    const user = userEvent.setup();
    const { onCancel } = renderDialog();
    await user.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("calls onCancel when the backdrop is clicked", async () => {
    // ConfirmDialog portals into document.body (not RTL's default container),
    // since BugRow renders it from inside a <tbody> where a fixed-position
    // <div> child would otherwise be invalid HTML.
    const user = userEvent.setup();
    const { onCancel } = renderDialog();
    const backdrop = document.body.querySelector('[aria-hidden="true"]');
    expect(backdrop).not.toBeNull();
    await user.click(backdrop as Element);
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("disables the confirm button and shows a pending label while isPending", () => {
    renderDialog({ isPending: true });
    const button = screen.getByRole("button", { name: "Deleting…" });
    expect(button).toBeDisabled();
  });
});
