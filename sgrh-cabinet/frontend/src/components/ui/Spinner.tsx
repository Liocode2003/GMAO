interface SpinnerProps { size?: 'sm' | 'md' | 'lg'; className?: string; }

export default function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const s = size === 'sm' ? 'w-4 h-4 border-2' : size === 'lg' ? 'w-10 h-10 border-4' : 'w-7 h-7 border-[3px]';
  return (
    <div className={`${s} border-brand-200 border-t-brand-600 rounded-full animate-spin ${className}`} />
  );
}

export function PageSpinner() {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <Spinner size="lg" />
      <p className="text-sm text-gray-400 animate-pulse">Chargement…</p>
    </div>
  );
}
