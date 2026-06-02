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

// ── Couleurs par département ──────────────────────────────────────────────────
const SL: Record<string, { bar: string; bg: string; text: string; badge: string; label: string }> = {
  AUDIT_ASSURANCE:     { bar: 'bg-blue-700',   bg: 'bg-blue-50',   text: 'text-blue-800',   badge: 'bg-blue-100 text-blue-700 border-blue-200',   label: 'Audit & Assurance' },
  CONSULTING_FA:       { bar: 'bg-violet-600',  bg: 'bg-violet-50',  text: 'text-violet-800',  badge: 'bg-violet-100 text-violet-700 border-violet-200',  label: 'Consulting & FA' },
  OUTSOURCING:         { bar: 'bg-emerald-600', bg: 'bg-emerald-50', text: 'text-emerald-800', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Outsourcing' },
  ADMINISTRATION:      { bar: 'bg-slate-500',   bg: 'bg-slate-50',   text: 'text-slate-700',   badge: 'bg-slate-100 text-slate-600 border-slate-200',   label: 'Administration' },
  JURIDIQUE_FISCALITE: { bar: 'bg-amber-500',   bg: 'bg-amber-50',   text: 'text-amber-800',   badge: 'bg-amber-100 text-amber-700 border-amber-200',   label: 'Tax & Legal' },
};

const GRADE: Record<string, string> = {
  ASSISTANT_DEBUTANT: 'Assistant débutant', ASSISTANT_CONFIRME: 'Assistant confirmé',
  JUNIOR: 'Junior', SENIOR_1: 'Sénior 1', SENIOR_2: 'Sénior 2', SENIOR_3: 'Sénior 3',
  CONSULTANT: 'Consultant', ASSISTANT_MANAGER_1: 'Manager 1', ASSISTANT_MANAGER_2: 'Manager 2',
  ASSISTANT_MANAGER_3: 'Manager 3', SENIOR_MANAGER_1: 'Sén. Manager 1',
  SENIOR_MANAGER_2: 'Sén. Manager 2', SENIOR_MANAGER_3: 'Sén. Manager 3',
  DIRECTEUR: 'Directeur', ASSOCIE: 'Associé',
};

const FUNC: Record<string, string> = {
  AUDITEUR: 'Auditeur', JURISTE_FISCALISTE: 'Juriste Fiscaliste', INFORMATICIEN: 'Informaticien',
  MANAGER_PRINCIPAL: 'Manager Principal', ASSOCIE: 'Associé', DIRECTEUR: 'Directeur',
  ASSISTANT_DIRECTION: 'Assist. Direction', SECRETAIRE: 'Secrétaire', CHAUFFEUR: 'Chauffeur',
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
    emp.first_name.toLowerCase().includes(q) || emp.last_name.toLowerCase().includes(q)
  );

  return (
    <Link to={`/personnel/${emp.id}`} className="block group" onClick={e => e.stopPropagation()}>
      <div className={`
        relative bg-white rounded-2xl border transition-all duration-200 w-44 overflow-hidden
        group-hover:shadow-lg group-hover:-translate-y-0.5
        ${match
          ? 'border-amber-400 shadow-amber-100 shadow-md ring-2 ring-amber-300 ring-offset-1'
          : 'border-gray-100 shadow-sm'
        }
      `}>
        {/* Bande couleur département */}
        <div className={`h-2 ${cfg.bar}`} />

        <div className="px-3 pt-3 pb-3 text-center">
          {/* Avatar */}
          <div className={`
            w-14 h-14 rounded-full mx-auto mb-2.5 border-2 overflow-hidden
            flex items-center justify-center text-sm font-bold select-none
            ${cfg.bg} ${cfg.text} border-white shadow
          `}>
            {emp.photo_url ? (
              <img src={emp.photo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-base">{emp.first_name[0]}{emp.last_name[0]}</span>
            )}
          </div>

          {/* Nom */}
          <p className="text-xs font-bold text-gray-800 leading-tight truncate max-w-full">
            {emp.last_name} {emp.first_name}
          </p>

          {/* Fonction */}
          <p className="text-[10px] text-gray-500 mt-0.5 truncate">
            {FUNC[emp.function] || emp.function?.replace(/_/g, ' ') || '—'}
          </p>

          {/* Grade */}
          <p className="text-[9px] text-gray-400 mt-0.5 truncate italic">
            {GRADE[emp.grade] || emp.grade || '—'}
          </p>

          {/* Badge département */}
          <span className={`inline-block mt-2 text-[9px] px-2 py-0.5 rounded-full font-semibold border ${cfg.badge}`}>
            {cfg.label}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── Rendu récursif des nœuds ──────────────────────────────────────────────────
function renderNode(node: EmployeeNode, search: string): JSX.Element {
  if (!node.children || node.children.length === 0) {
    return (
      <TreeNode key={node.id} label={<OrgCard emp={node} search={search} />} />
    );
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
  const [loading, setLoading]     = useState(true);
  const [filterSL, setFilterSL]   = useState('');
  const [search, setSearch]       = useState('');
  const [zoom, setZoom]           = useState(0.8);
  const containerRef              = useRef<HTMLDivElement>(null);

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

  // Zoom à la molette
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.min(Math.max(z - e.deltaY * 0.0008, 0.25), 2));
  };

  const filtered = filterSL ? employees.filter(e => e.service_line === filterSL) : employees;
  const tree     = buildTree(filtered);

  return (
    <div className="flex flex-col gap-4 animate-fade-in" style={{ height: 'calc(100vh - 100px)' }}>

      {/* ── Barre d'outils ── */}
      <div className="flex items-center justify-between flex-wrap gap-3 flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Organigramme</h2>
          <p className="text-gray-500 text-sm mt-0.5">{filtered.length} collaborateurs actifs</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Recherche */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Rechercher un nom…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input pl-8 w-48 text-sm"
            />
          </div>

          {/* Filtre département */}
          <select
            value={filterSL}
            onChange={e => setFilterSL(e.target.value)}
            className="input w-48 text-sm"
          >
            <option value="">Tous les départements</option>
            {Object.entries(SL).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>

          {/* Contrôles zoom */}
          <div className="flex items-center gap-0.5 bg-white border border-gray-200 rounded-xl px-1 shadow-sm">
            <button
              onClick={() => setZoom(z => Math.max(z - 0.1, 0.25))}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
              title="Réduire"
            >
              <MinusIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom(0.8)}
              className="text-xs font-mono text-gray-600 px-2 hover:text-brand-600 min-w-[46px] text-center transition-colors"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={() => setZoom(z => Math.min(z + 0.1, 2))}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
              title="Agrandir"
            >
              <PlusIcon className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-gray-200 mx-0.5" />
            <button
              onClick={() => { setZoom(0.8); setSearch(''); setFilterSL(''); }}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              title="Réinitialiser"
            >
              <ArrowPathIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Arbre ── */}
      <div
        ref={containerRef}
        className="flex-1 bg-gradient-to-br from-slate-50 to-gray-100 rounded-2xl border border-gray-200 overflow-auto shadow-inner"
        onWheel={onWheel}
      >
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full" />
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
              padding: '48px 64px',
              transition: 'transform 0.12s ease',
              display: 'inline-block',
              minWidth: '100%',
            }}
          >
            {tree.map(root => (
              <div key={root.id} style={{ marginBottom: 48 }}>
                <Tree
                  label={<OrgCard emp={root} search={search} />}
                  lineWidth="2px"
                  lineColor="#CBD5E1"
                  lineBorderRadius="10px"
                  lineHeight="40px"
                >
                  {root.children?.map(child => renderNode(child, search))}
                </Tree>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Légende interactive ── */}
      <div className="flex flex-wrap gap-2 flex-shrink-0">
        {Object.entries(SL).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setFilterSL(filterSL === key ? '' : key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${cfg.badge} ${
              filterSL === key ? 'ring-2 ring-offset-1 ring-gray-400 shadow' : 'opacity-60 hover:opacity-100'
            }`}
          >
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.bar}`} />
            {cfg.label}
          </button>
        ))}
        {(filterSL || search) && (
          <button
            onClick={() => { setFilterSL(''); setSearch(''); }}
            className="px-3 py-1.5 rounded-full text-[11px] font-semibold border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors"
          >
            × Effacer filtres
          </button>
        )}
      </div>
    </div>
  );
}
