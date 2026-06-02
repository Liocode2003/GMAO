import { useState, useEffect, useRef } from 'react';
import { Tree, TreeNode } from 'react-organizational-chart';
import { Link } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  MinusIcon,
  PlusIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import api from '../../services/api';

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

// ── Palette département ──────────────────────────────────────────────────────
const SL: Record<string, { accent: string; avatar: string; text: string; dot: string; label: string }> = {
  AUDIT_ASSURANCE:     { accent: 'bg-indigo-500',  avatar: 'bg-indigo-100 text-indigo-700',  text: 'text-indigo-600',  dot: 'bg-indigo-500',  label: 'Audit & Assurance' },
  CONSULTING_FA:       { accent: 'bg-violet-500',  avatar: 'bg-violet-100 text-violet-700',  text: 'text-violet-600',  dot: 'bg-violet-500',  label: 'Consulting & FA' },
  OUTSOURCING:         { accent: 'bg-teal-500',    avatar: 'bg-teal-100 text-teal-700',      text: 'text-teal-600',    dot: 'bg-teal-500',    label: 'Outsourcing' },
  ADMINISTRATION:      { accent: 'bg-slate-400',   avatar: 'bg-slate-100 text-slate-600',    text: 'text-slate-500',   dot: 'bg-slate-400',   label: 'Administration' },
  JURIDIQUE_FISCALITE: { accent: 'bg-amber-500',   avatar: 'bg-amber-100 text-amber-700',    text: 'text-amber-600',   dot: 'bg-amber-500',   label: 'Tax & Legal' },
};

const FUNC: Record<string, string> = {
  AUDITEUR: 'Auditeur',
  JURISTE_FISCALISTE: 'Juriste Fiscaliste',
  INFORMATICIEN: 'Informaticien',
  MANAGER_PRINCIPAL: 'Manager Principal',
  ASSOCIE: 'Associé',
  DIRECTEUR: 'Directeur',
  ASSISTANT_DIRECTION: 'Assist. Direction',
  SECRETAIRE: 'Secrétaire',
  CHAUFFEUR: 'Chauffeur',
};

// ── Construction de l'arbre ───────────────────────────────────────────────────
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

// ── Carte employé ─────────────────────────────────────────────────────────────
function OrgCard({ emp, search }: { emp: EmployeeNode; search: string }) {
  const cfg = SL[emp.service_line] || SL.ADMINISTRATION;
  const q = search.trim().toLowerCase();
  const match = q.length >= 2 && (
    emp.first_name.toLowerCase().includes(q) ||
    emp.last_name.toLowerCase().includes(q)
  );

  return (
    <Link to={`/personnel/${emp.id}`} className="block group" onClick={e => e.stopPropagation()}>
      <div
        className={`
          w-[136px] bg-white rounded-xl overflow-hidden select-none
          transition-all duration-200 ease-out
          group-hover:-translate-y-1 group-hover:shadow-xl
          ${match
            ? 'ring-2 ring-amber-400 ring-offset-2 shadow-lg'
            : 'border border-gray-200/80 shadow-md'
          }
        `}
      >
        {/* Accent top */}
        <div className={`h-[3px] ${cfg.accent}`} />

        <div className="flex flex-col items-center px-3 pt-3 pb-3 gap-1.5">
          {/* Avatar */}
          <div
            className={`
              w-11 h-11 rounded-full flex items-center justify-center
              text-[13px] font-bold overflow-hidden flex-shrink-0
              ${cfg.avatar}
            `}
          >
            {emp.photo_url ? (
              <img src={emp.photo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span>{emp.first_name[0]}{emp.last_name[0]}</span>
            )}
          </div>

          {/* Identité */}
          <div className="text-center w-full">
            <p className="text-[11px] font-semibold text-gray-900 leading-tight truncate">
              {emp.last_name}
            </p>
            <p className="text-[10px] text-gray-500 leading-tight truncate">
              {emp.first_name}
            </p>
          </div>

          {/* Fonction */}
          <p className="text-[9px] text-gray-400 truncate w-full text-center leading-tight">
            {FUNC[emp.function] ?? emp.function?.replace(/_/g, ' ') ?? '—'}
          </p>
        </div>
      </div>
    </Link>
  );
}

// ── Rendu récursif ────────────────────────────────────────────────────────────
function renderNode(node: EmployeeNode, search: string): JSX.Element {
  if (!node.children?.length) {
    return <TreeNode key={node.id} label={<OrgCard emp={node} search={search} />} />;
  }
  return (
    <TreeNode key={node.id} label={<OrgCard emp={node} search={search} />}>
      {node.children.map(child => renderNode(child, search))}
    </TreeNode>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function OrganigrammePage() {
  const [employees, setEmployees] = useState<EmployeeNode[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filterSL, setFilterSL] = useState('');
  const [search, setSearch]     = useState('');
  const [zoom, setZoom]         = useState(0.85);
  const containerRef            = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get('/employees', { params: { limit: 500, status: 'ACTIF' } })
      .then(res => {
        setEmployees((res.data.data || []).map((e: EmployeeNode) => ({
          id: e.id, first_name: e.first_name, last_name: e.last_name,
          function: e.function, service_line: e.service_line, grade: e.grade,
          manager_id: e.manager_id, photo_url: e.photo_url,
        })));
      })
      .finally(() => setLoading(false));
  }, []);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.min(Math.max(z - e.deltaY * 0.001, 0.2), 2));
  };

  const reset = () => { setZoom(0.85); setSearch(''); setFilterSL(''); };

  const filtered = filterSL ? employees.filter(e => e.service_line === filterSL) : employees;
  const tree     = buildTree(filtered);

  return (
    <div className="flex flex-col gap-4 animate-fade-in" style={{ height: 'calc(100vh - 100px)' }}>

      {/* ── Barre d'outils ── */}
      <div className="flex items-start justify-between gap-4 flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Organigramme</h2>
          <p className="text-sm text-gray-400 mt-0.5">{filtered.length} collaborateurs actifs</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Recherche */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
            <input
              type="text"
              placeholder="Rechercher…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input pl-8 w-44 text-sm"
            />
          </div>

          {/* Filtre département */}
          <select
            value={filterSL}
            onChange={e => setFilterSL(e.target.value)}
            className="input w-44 text-sm"
          >
            <option value="">Tous les départements</option>
            {Object.entries(SL).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>

          {/* Zoom */}
          <div className="flex items-center gap-0.5 bg-white border border-gray-200 rounded-xl px-1 h-9 shadow-sm">
            <button
              onClick={() => setZoom(z => Math.max(z - 0.1, 0.2))}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              title="Zoom arrière"
            >
              <MinusIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(0.85)}
              className="text-xs font-mono text-gray-500 w-11 text-center hover:text-brand-600 transition-colors"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={() => setZoom(z => Math.min(z + 0.1, 2))}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              title="Zoom avant"
            >
              <PlusIcon className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-4 bg-gray-200 mx-0.5" />
            <button
              onClick={reset}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              title="Réinitialiser"
            >
              <ArrowPathIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Arbre ── */}
      <div
        ref={containerRef}
        className="flex-1 bg-white rounded-2xl border border-gray-200 overflow-auto shadow-sm"
        onWheel={onWheel}
      >
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tree.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
            <p className="text-sm">Aucun collaborateur trouvé</p>
          </div>
        ) : (
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top center',
              padding: '48px 80px 64px',
              transition: 'transform 0.1s ease',
              display: 'inline-block',
              minWidth: '100%',
            }}
          >
            {tree.map((root, i) => (
              <div key={root.id} style={{ marginBottom: i < tree.length - 1 ? 56 : 0 }}>
                <Tree
                  label={<OrgCard emp={root} search={search} />}
                  lineWidth="1.5px"
                  lineColor="#CBD5E1"
                  lineBorderRadius="8px"
                  lineHeight="36px"
                >
                  {root.children?.map(child => renderNode(child, search))}
                </Tree>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Légende ── */}
      <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
        {Object.entries(SL).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setFilterSL(filterSL === key ? '' : key)}
            className={`
              flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium
              border transition-all duration-150
              ${filterSL === key
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700'
              }
            `}
          >
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
            {cfg.label}
          </button>
        ))}
        {(filterSL || search) && (
          <button
            onClick={reset}
            className="px-2.5 py-1 rounded-full text-[11px] font-medium border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-400 bg-white transition-all"
          >
            × Effacer
          </button>
        )}
      </div>

    </div>
  );
}
