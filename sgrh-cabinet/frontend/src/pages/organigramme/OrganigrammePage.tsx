import { useState, useEffect } from 'react';
import api from '../../services/api';
import { UserIcon } from '@heroicons/react/24/outline';
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

function EmployeeCard({ emp, depth }: { emp: EmployeeNode; depth: number }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = (emp.children?.length || 0) > 0;
  const colorClass = SERVICE_LINE_COLORS[emp.service_line] || 'bg-gray-100 text-gray-700 border-gray-200';

  return (
    <div className="flex flex-col items-center">
      {/* Card */}
      <div className={`relative border-2 rounded-xl p-3 bg-white shadow-sm w-40 text-center transition-all hover:shadow-md ${
        depth === 0 ? 'border-brand-400 shadow-brand-100' : 'border-gray-200'
      }`}>
        {/* Avatar */}
        <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center overflow-hidden border-2 ${
          depth === 0 ? 'border-brand-400' : 'border-gray-200'
        }`}>
          {emp.photo_url ? (
            <img src={`/api/employees/${emp.id}/photo/file/${emp.photo_url}`}
              alt="" className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full flex items-center justify-center text-lg font-bold ${
              depth === 0 ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {emp.first_name[0]}{emp.last_name[0]}
            </div>
          )}
        </div>
        {/* Name */}
        <Link to={`/personnel/${emp.id}`}
          className="text-sm font-semibold text-gray-800 hover:text-brand-600 leading-tight block">
          {emp.first_name} {emp.last_name}
        </Link>
        {/* Function */}
        <p className="text-xs text-gray-500 mt-0.5 leading-tight">
          {emp.function?.replace(/_/g, ' ')}
        </p>
        {/* Service line */}
        <span className={`inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full border font-medium ${colorClass}`}>
          {SERVICE_LABELS[emp.service_line] || emp.service_line}
        </span>

        {/* Expand/collapse */}
        {hasChildren && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center text-gray-500 hover:border-brand-400 hover:text-brand-600 text-xs font-bold z-10"
          >
            {expanded ? '−' : '+'}
          </button>
        )}
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div className="mt-6 flex flex-col items-center">
          {/* Vertical line */}
          <div className="w-0.5 h-6 bg-gray-300" />
          {/* Horizontal line across children */}
          {(emp.children?.length || 0) > 1 && (
            <div className="relative flex items-start justify-center">
              <div className="absolute top-0 left-[calc(50%-0.5px)] w-0.5 h-3 bg-gray-300" />
              <div className="flex gap-6 mt-3">
                {emp.children!.map((child, i) => (
                  <div key={child.id} className="flex flex-col items-center">
                    <div className="w-0.5 h-3 bg-gray-300 mb-0" />
                    <EmployeeCard emp={child} depth={depth + 1} />
                  </div>
                ))}
              </div>
            </div>
          )}
          {(emp.children?.length || 0) === 1 && (
            <EmployeeCard emp={emp.children![0]} depth={depth + 1} />
          )}
        </div>
      )}
    </div>
  );
}

export default function OrganigrammePage() {
  const [employees, setEmployees] = useState<EmployeeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSL, setFilterSL] = useState('');

  useEffect(() => {
    api.get('/employees', { params: { limit: 500, status: 'ACTIF' } })
      .then(res => {
        const emps: EmployeeNode[] = (res.data.data || []).map((e: EmployeeNode) => ({
          id: e.id,
          first_name: e.first_name,
          last_name: e.last_name,
          function: e.function,
          service_line: e.service_line,
          grade: e.grade,
          manager_id: e.manager_id,
          photo_url: e.photo_url,
        }));
        setEmployees(emps);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = filterSL ? employees.filter(e => e.service_line === filterSL) : employees;
  const tree = buildTree(filtered);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Organigramme</h2>
          <p className="text-gray-500 text-sm mt-1">{filtered.length} collaborateurs actifs</p>
        </div>
        <select value={filterSL} onChange={e => setFilterSL(e.target.value)} className="input w-48">
          <option value="">Toutes les lignes</option>
          <option value="AUDIT_ASSURANCE">Audit & Assurance</option>
          <option value="CONSULTING_FA">Consulting & FA</option>
          <option value="OUTSOURCING">Outsourcing</option>
          <option value="ADMINISTRATION">Administration</option>
          <option value="JURIDIQUE_FISCALITE">Juridique & Fiscalité</option>
        </select>
      </div>

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
              <EmployeeCard key={root.id} emp={root} depth={0} />
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {Object.entries(SERVICE_LABELS).map(([key, label]) => (
          <span key={key} className={`px-3 py-1 rounded-full border font-medium ${SERVICE_LINE_COLORS[key]}`}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
