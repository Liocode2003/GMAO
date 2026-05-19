/** Barre de skeleton générique */
export function SkeletonBar({ w = 'w-full', h = 'h-4', className = '' }: { w?: string; h?: string; className?: string }) {
  return <div className={`${w} ${h} bg-gray-200 rounded animate-pulse ${className}`} />;
}

/** Ligne de table skeleton */
export function TableSkeletonRows({ cols, rows = 6 }: { cols: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-gray-100">
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div
                className="h-4 bg-gray-200 rounded animate-pulse"
                style={{ width: `${60 + ((i * 13 + j * 17) % 35)}%`, animationDelay: `${i * 60}ms` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/** Skeleton carte KPI */
export function KPICardSkeleton() {
  return (
    <div className="card text-center space-y-2">
      <div className="h-3 w-20 bg-gray-200 rounded animate-pulse mx-auto" />
      <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mx-auto" />
    </div>
  );
}
