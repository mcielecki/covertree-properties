interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-4 text-sm">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="btn btn-secondary"
      >
        Previous
      </button>
      <span className="text-slate tabular-nums">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="btn btn-secondary"
      >
        Next
      </button>
    </nav>
  );
}
