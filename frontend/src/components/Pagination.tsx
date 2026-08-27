interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="mt-3 flex items-center justify-between text-sm text-ink-500">
      <span className="tabular-nums">
        Showing {start}–{end} of {total}
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink-600 transition-colors duration-150 hover:bg-parchment-dark disabled:opacity-40 disabled:hover:bg-transparent"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink-600 transition-colors duration-150 hover:bg-parchment-dark disabled:opacity-40 disabled:hover:bg-transparent"
        >
          Next
        </button>
      </div>
    </div>
  );
}
