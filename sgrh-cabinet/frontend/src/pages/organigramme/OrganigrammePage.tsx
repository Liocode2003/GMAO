import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { UserIcon, PencilIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

interface EmployeeNode {
  id: string;
  first_name: string;
  last_name: string;
  function: string;
  service_line: string;
  grade: string;
  manager_id: string | null;
  photo_url: string | null;
  children?: EmployeeNode[];
}

interface EditModal {
  emp: EmployeeNode;
  newManagerId: string;
}

const SERVICE_LINE_COLORS: Record<string, string> = {
  AUDIT_ASSURANCE:    'bg-blue-100 text-blue-700 border-blue-200',
  CONSULTING_FA:      'bg-purple-100 text-purple-700 border-purple-200',
  OUTSOURCING:        'bg-green-100 text-green-700 border-green-200',
  ADMINISTRATION:     'bg-gray-100 text-gray-700 border-gray-200',
  JURIDIQUE_FISCALITE:'bg-amber-100 text-amber-700 border-amber-200',
};

const SERVICE_LABELS: Record<string, string> = {
  AUDIT_ASSURANCE:    'Audit',
  CONSULTING_FA:      'Consulting',
  OUTSOURCING:        'Outsourcing',
  ADMINISTRATION:     'Admin',
  JURIDIQUE_FISCALITE:'Juridique',
};

function buildTree(employees: EmployeeNode[]): EmployeeNode[] {
  const map: Record<string, EmployeeNode> = {};
  employees.forEach(e => { map[e.id] = { ...e, children: [] }; });
  const roots: EmployeeNode[] = [];
  employees.forEach(e => {
    if (e.manager_id && map[e.manager_id]) {
      map[e.manager_id].children!.push(map[e.id]);
    } else {
      roots.push(map[e.id]);
    }
  });
  return roots;
}

function EmployeeCard({
  emp, depth, canEdit, onEdit,
}: {
  emp: EmployeeNode;
  depth: number;
  canEdit: boolean;
  onEdit: (emp: EmployeeNode) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = (emp.children?.length || 0) > 0;
  const colorClass = SERVICE_LINE_COLORS[emp.service_line] || 'bg-gray-100 text-gray-700 border-gray-200';

  return (
    <div className="flex flex-col items-center">
      <div className={`relative border-2 rounded-xl p-3 bg-white shadow-sm w-44 text-center transition-all hover:shadow-md group ${
        depth === 0 ? 'border-brand-400 shadow-brand-100' : 'border-gray-200'
      }`}>
        {/* Bouton modifier (DRH uniquement) */}
        {canEdit && (
          <button
            onClick={() => onEdit(emp)}
            title="Modifier le manager"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-full bg-gray-100 hover:bg-brand-100 flex items-center justify-center text-gray-400 hover:text-brand-600"
          >
            <PencilIcon className="w-3 h-3" />
          </button>
        )}

        {/* Avatar */}
        <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center overflow-hidden border-2 ${
          depth === 0 ? 'border-brand-400' : 'border-gray-200'
        }`}>
          {emp.photo_url ? (
            <img src={emp.photo_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full flex items-center justify-center text-lg font-bold ${
              depth === 0 ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {emp.first_name[0]}{emp.last_name[0]}
            </div>
          )}
        </div>

        <Link to={`/personnel/${emp.id}`}
          className="text-sm font-semibold text-gray-800 hover:text-brand-600 leading-tight block">
          {emp.first_name} {emp.last_name}
        </Link>
        <p className="text-xs text-gray-500 mt-0.5 leading-tight">
          {emp.function?.replace(/_/g, ' ')}
        </p>
        <span className={`inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full border font-medium ${colorClass}`}>
          {SERVICE_LABELS[emp.service_line] || emp.service_line}
        </span>

        {hasChildren && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center text-gray-500 hover:border-brand-400 hover:text-brand-600 text-xs font-bold z-10"
          >
            {expanded ? '−' : `+${emp.children!.length}`}
          </button>
        )}
      </div>

      {hasChildren && expanded && (
        <div className="mt-6 flex flex-col items-center">
          <div className="w-0.5 h-6 bg-gray-300" />
          {(emp.children?.length || 0) > 1 ? (
            <div className="relative flex items-start justify-center">
              <div className="absolute top-0 left-[calc(50%-0.5px)] w-0.5 h-3 bg-gray-300" />
              <div className="flex gap-6 mt-3">
                {emp.children!.map(child => (
                  <div key={child.id} className="flex flex-col items-center">
                    <div className="w-0.5 h-3 bg-gray-300" />
                    <EmployeeCard emp={child} depth={depth + 1} canEdit={canEdit} onEdit={onEdit} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmployeeCard emp={emp.children![0]} depth={depth + 1} canEdit={canEdit} onEdit={onEdit} />
          )}
        </div>
      )}
    </div>
  );
}

export default function OrganigrammePage() {
  const { user } = useAuthStore();
  const canEdit = user?.role === 'DRH' || user?.role === 'DIRECTION_GENERALE';

  const [employees, setEmployees] = useState<EmployeeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSL, setFilterSL] = useState('');
  const [modal, setModal] = useState<EditModal | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/employees', { params: { limit: 500, status: 'ACTIF' } });
      setEmployees((res.data.data || []).map((e: EmployeeNode) => ({
        id: e.id, first_name: e.first_name, last_name: e.last_name,
        function: e.function, service_line: e.service_line, grade: e.grade,
        manager_id: e.manager_id, photo_url: e.photo_url,
      })));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const openEdit = (emp: EmployeeNode) => {
    setModal({ emp, newManagerId: emp.manager_id || '' });
    setSaveError('');
  };

  const handleSave = async () => {
    if (!modal) return;
    setSaving(true);
    setSaveError('');
    try {
      await api.put(`/employees/${modal.emp.id}`, {
        manager_id: modal.newManagerId || null,
      });
      setModal(null);
      await fetchEmployees();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setSaveError(msg || 'Erreur lors de la sauvegarde.');
    } finally { setSaving(false); }
  };

  const filtered = filterSL ? employees.filter(e => e.service_line === filterSL) : employees;
  const tree = buildTree(filtered);

  // Candidats manager disponibles (tous sauf l'employé lui-même)
  const managerOptions = modal
    ? employees.filter(e => e.id !== modal.emp.id)
    : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Organigramme</h2>
          <p className="text-gray-500 text-sm mt-1">{filtered.length} collaborateurs actifs</p>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <p className="text-xs text-gray-400 italic">Survolez une carte pour modifier le manager</p>
          )}
          <select value={filterSL} onChange={e => setFilterSL(e.target.value)} className="input w-48">
            <option value="">Toutes les lignes</option>
            <option value="AUDIT_ASSURANCE">Audit & Assurance</option>
            <option value="CONSULTING_FA">Consulting & FA</option>
            <option value="OUTSOURCING">Outsourcing</option>
            <option value="ADMINISTRATION">Administration</option>
            <option value="JURIDIQUE_FISCALITE">Juridique & Fiscalité</option>
          </select>
        </div>
      </div>

      {/* Arbre */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" />
        </div>
      ) : tree.length === 0 ? (
        <div className="flex flex-col items-center py-20 gap-3 text-gray-400">
          <UserIcon className="w-12 h-12" />
          <p>Aucun collaborateur trouvé</p>
        </div>
      ) : (
        <div className="overflow-auto">
          <div className="flex flex-wrap gap-12 justify-start p-8 min-w-max">
            {tree.map(root => (
              <EmployeeCard key={root.id} emp={root} depth={0} canEdit={canEdit} onEdit={openEdit} />
            ))}
          </div>
        </div>
      )}

      {/* Légende */}
      <div className="flex flex-wrap gap-3 text-xs">
        {Object.entries(SERVICE_LABELS).map(([key, label]) => (
          <span key={key} className={`px-3 py-1 rounded-full border font-medium ${SERVICE_LINE_COLORS[key]}`}>
            {label}
          </span>
        ))}
      </div>

      {/* Modal modifier manager */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Modifier le manager</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {modal.emp.first_name} {modal.emp.last_name}
                </p>
              </div>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label">Manager direct</label>
                <select
                  value={modal.newManagerId}
                  onChange={e => setModal(m => m ? { ...m, newManagerId: e.target.value } : m)}
                  className="input w-full"
                >
                  <option value="">— Aucun manager (racine) —</option>
                  {managerOptions.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.first_name} {e.last_name} — {e.function?.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>
              {saveError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {saveError}
                </p>
              )}
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setModal(null)} className="btn-secondary text-sm" disabled={saving}>
                Annuler
              </button>
              <button onClick={handleSave} disabled={saving} className="btn-primary text-sm flex items-center gap-2">
                {saving
                  ? <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  : <CheckIcon className="w-4 h-4" />
                }
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
