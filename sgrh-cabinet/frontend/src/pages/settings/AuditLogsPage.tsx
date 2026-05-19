import { useState, useEffect } from 'react';
import api from '../../services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ClipboardDocumentListIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { TableSkeletonRows } from '../../components/ui/Skeleton';
import { TableEmptyRow } from '../../components/ui/EmptyState';
import PageHeader from '../../components/ui/PageHeader';

interface AuditLog {
  id: string;
  user_email: string;
  user_name?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  field_accessed?: string;
  ip_address?: string;
  created_at: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    api.get('/users/audit-logs', { params: { page, limit: 50 } })
      .then(res => setLogs(res.data))
      .finally(() => setLoading(false));
  }, [page]);

  const actionBadge = (action: string) => {
    const map: Record<string, string> = {
      READ: 'badge-blue', CREATE: 'badge-green', UPDATE: 'badge-yellow', DELETE: 'badge-red',
    };
    return <span className={`badge text-xs ${map[action] || 'badge-gray'}`}>{action}</span>;
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Journal d'audit" subtitle="Traçabilité complète des accès aux données sensibles" />

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Date / Heure</th>
              <th>Utilisateur</th>
              <th>Action</th>
              <th>Ressource</th>
              <th>Champ</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeletonRows cols={6} rows={8} />
            ) : logs.length === 0 ? (
              <TableEmptyRow cols={6} icon={ClipboardDocumentListIcon} title="Aucun log enregistré" />
            ) : logs.map(log => (
              <tr key={log.id}>
                <td className="text-xs text-gray-500 whitespace-nowrap">
                  {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: fr })}
                </td>
                <td>
                  <p className="text-sm font-medium">{log.user_name || '—'}</p>
                  <p className="text-xs text-gray-400">{log.user_email}</p>
                </td>
                <td>{actionBadge(log.action)}</td>
                <td className="text-sm">
                  <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{log.resource_type}</span>
                  {log.resource_id && <span className="text-xs text-gray-400 ml-1">#{log.resource_id.substring(0, 8)}</span>}
                </td>
                <td>
                  {log.field_accessed && <span className="badge badge-yellow text-xs">{log.field_accessed}</span>}
                </td>
                <td className="text-xs text-gray-400 font-mono">{log.ip_address || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
          className="btn-secondary text-sm gap-1.5 disabled:opacity-40">
          <ChevronLeftIcon className="w-4 h-4" /> Précédent
        </button>
        <span className="text-sm text-gray-500 px-2">Page {page}</span>
        <button onClick={() => setPage(p => p + 1)} disabled={logs.length < 50}
          className="btn-secondary text-sm gap-1.5 disabled:opacity-40">
          Suivant <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
