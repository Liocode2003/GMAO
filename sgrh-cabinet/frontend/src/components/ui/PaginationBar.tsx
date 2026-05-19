import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export interface PaginationBarProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPage: (p: number) => void;
  className?: string;
}

export default function PaginationBar({ page, totalPages, total, limit, onPage, className }: PaginationBarProps) {
  if (totalPages <= 1) return null;

  const from = Math.min((page - 1) * limit + 1, total);
  const to   = Math.min(page * limit, total);

  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
    if (totalPages <= 7) return i + 1;
    if (i < 3) return i + 1;
    if (i >= 4) return totalPages - 6 + i;
    return page;
  });

  return (
    <div className={`flex items-center justify-between px-4 py-3 border-t border-gray-100 ${className ?? ''}`}>
      <span className="text-sm text-gray-500">{from}–{to} sur {total}</span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Page précédente"
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </button>
        {pages.map(p => (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={`w-8 h-8 text-sm rounded font-medium transition-colors ${
              p === page ? 'bg-brand-600 text-white' : 'hover:bg-gray-100 text-gray-600'
            }`}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Page suivante"
        >
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
