import { ChevronUpIcon, ChevronDownIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline';

export interface SortThProps {
  col: string;
  label: string;
  current: string;
  order: 'asc' | 'desc';
  onSort: (col: string) => void;
  className?: string;
}

export default function SortTh({ col, label, current, order, onSort, className }: SortThProps) {
  const active = current === col;
  return (
    <th
      className={`cursor-pointer select-none group hover:bg-gray-100 transition-colors ${className ?? ''}`}
      onClick={() => onSort(col)}
      aria-sort={active ? (order === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <span className="flex items-center gap-1">
        {label}
        {active
          ? order === 'asc'
            ? <ChevronUpIcon   className="w-3 h-3 text-brand-600 flex-shrink-0" />
            : <ChevronDownIcon className="w-3 h-3 text-brand-600 flex-shrink-0" />
          : <ChevronUpDownIcon className="w-3 h-3 text-gray-300 group-hover:text-gray-400 flex-shrink-0" />}
      </span>
    </th>
  );
}
