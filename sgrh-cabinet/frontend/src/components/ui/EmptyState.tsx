import type { ComponentType, SVGProps } from 'react';

interface EmptyStateProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  compact?: boolean;
}

export default function EmptyState({ icon: Icon, title, description, action, compact }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-8 px-4' : 'py-16 px-8'}`}>
      <div className={`${compact ? 'w-12 h-12' : 'w-16 h-16'} bg-gray-100 rounded-2xl flex items-center justify-center mb-4`}>
        <Icon className={`${compact ? 'w-6 h-6' : 'w-8 h-8'} text-gray-400`} />
      </div>
      <p className={`font-semibold text-gray-600 ${compact ? 'text-sm' : 'text-base'}`}>{title}</p>
      {description && (
        <p className={`text-gray-400 mt-1 max-w-xs ${compact ? 'text-xs' : 'text-sm'}`}>{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 btn-primary text-sm"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

/** Version inline dans une cellule de tableau */
export function TableEmptyRow({ cols, icon: Icon, title }: { cols: number; icon: ComponentType<SVGProps<SVGSVGElement>>; title: string }) {
  return (
    <tr>
      <td colSpan={cols}>
        <EmptyState icon={Icon} title={title} compact />
      </td>
    </tr>
  );
}
