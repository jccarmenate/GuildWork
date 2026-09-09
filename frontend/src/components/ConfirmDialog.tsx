import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// A minimal, accessible confirmation dialog for destructive actions — never
// fire a delete straight from the triggering click. Traps focus, closes on
// Escape or a backdrop click, and returns focus to whatever opened it.
export function ConfirmDialog({ open, title, description, confirmLabel, isPending, onConfirm, onCancel }: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onCancel();
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>('button, [href], input, [tabindex]:not([tabindex="-1"])');
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused.current?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  // Portaled to document.body: BugRow renders this from inside a <tbody>,
  // where a fixed-position <div> child would be invalid HTML (browsers
  // silently hoist it out during parsing, which desyncs the real DOM from
  // React's tree). A portal also sidesteps clipping from any ancestor's
  // overflow/transform.
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
      <div className="absolute inset-0 animate-fade-in bg-ink/40" onClick={onCancel} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className="animate-dialog-in relative w-full max-w-sm overflow-hidden rounded-lg border border-line bg-surface shadow-lg"
      >
        <div className="h-1.5 bg-red-600" />
        <div className="p-6">
          <div className="mb-3 flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50">
              <AlertTriangle className="h-4.5 w-4.5 text-red-600" />
            </div>
            <h2 id="confirm-dialog-title" className="font-display text-lg font-semibold text-ink">
              {title}
            </h2>
          </div>
          <p id="confirm-dialog-description" className="mb-5 text-sm text-ink-600">
            {description}
          </p>
          <div className="flex justify-end gap-2">
            <button
              ref={cancelRef}
              type="button"
              onClick={onCancel}
              className="rounded-md border border-line px-3 py-2 text-sm font-medium text-ink-600 transition-colors duration-150 hover:bg-parchment"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isPending}
              className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white transition-[background-color,transform] duration-150 hover:scale-[1.02] hover:bg-red-700 active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100"
            >
              {isPending ? "Deleting…" : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
