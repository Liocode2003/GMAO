import { useState, useEffect } from 'react';
import api from '../../services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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
    const colors: Record<string, string> = {
      READ: 'badge-blue',
      CREATE: 'badge-green',
      UPDATE: 'badge-yellow',
      DELETE: 'badge-red',
    };
    return <span className={`badge text-xs ${colors[action] || 'badge-gray'}`}>{action}</span>;
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Journal d'audit</h2>
        <p className="text-gray-500 text-sm">Traçabilité des accès aux données sensibles</p>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Date/Heure</th>
              <th>Utilisateur</th>
              <th>Action</th>
              <th>Ressource</th>
              <th>Champ accédé</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8">Chargement...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">Aucun log enregistré</td></tr>
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
                  {log.field_accessed && (
                    <span className="badge badge-yellow text-xs">{log.field_accessed}</span>
                  )}
                </td>
                <td className="text-xs text-gray-400 font-mono">{log.ip_address || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-sm disabled:opacity-40">
          Précédent
        </button>
        <span className="text-sm text-gray-500">Page {page}</span>
        <button onClick={() => setPage(p => p + 1)} disabled={logs.length < 50} className="btn-secondary text-sm disabled:opacity-40">
          Suivant
        </button>
      </div>
    </div>
  );
}
