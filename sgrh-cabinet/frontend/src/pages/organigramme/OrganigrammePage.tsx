import { useState, useEffect, useRef, useCallback } from 'react';
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
  manager_id: string | null;
  photo_url: string | null;
  children?: EmployeeNode[];
}

const SL: Record<string, { color: string; light: string; text: string; label: string }> = {
  AUDIT_ASSURANCE:     { color: '#6366f1', light: '#eef2ff', text: '#4338ca', label: 'Audit & Assurance' },
  CONSULTING_FA:       { color: '#8b5cf6', light: '#f5f3ff', text: '#6d28d9', label: 'Consulting & FA' },
  OUTSOURCING:         { color: '#14b8a6', light: '#f0fdfa', text: '#0f766e', label: 'Outsourcing' },
  ADMINISTRATION:      { color: '#94a3b8', light: '#f8fafc', text: '#475569', label: 'Administration' },
  JURIDIQUE_FISCALITE: { color: '#f59e0b', light: '#fffbeb', text: '#b45309', label: 'Tax & Legal' },
};

const FUNC: Record<string, string> = {
  AUDITEUR: 'Auditeur', JURISTE_FISCALISTE: 'Juriste Fiscaliste',
  INFORMATICIEN: 'Informaticien', MANAGER_PRINCIPAL: 'Manager Principal',
  ASSOCIE: 'Associé', DIRECTEUR: 'Directeur',
  ASSISTANT_DIRECTION: 'Assist. Direction', SECRETAIRE: 'Secrétaire', CHAUFFEUR: 'Chauffeur',
};

function buildTree(list: EmployeeNode[]): EmployeeNode[] {
  const map: Record<string, EmployeeNode> = {};
  list.forEach(e => { map[e.id] = { ...e, children: [] }; });
  const roots: EmployeeNode[] = [];
  list.forEach(e => {
    if (e.manager_id && map[e.manager_id]) map[e.manager_id].children!.push(map[e.id]);
    else roots.push(map[e.id]);
  });
  return roots;
}

// ── Carte ─────────────────────────────────────────────────────────────────────
function OrgCard({ emp, search }: { emp: EmployeeNode; search: string }) {
  const cfg = SL[emp.service_line] ?? SL.ADMINISTRATION;
  const q = search.trim().toLowerCase();
  const match = q.length >= 2 && (
    emp.first_name.toLowerCase().includes(q) || emp.last_name.toLowerCase().includes(q)
  );

  return (
    <Link to={`/personnel/${emp.id}`} className="block group" onClick={e => e.stopPropagation()}>
      <div
        style={{
          width: 144,
          background: '#ffffff',
          borderRadius: 12,
          border: match ? '2px solid #fbbf24' : '1.5px solid #e5e7eb',
          boxShadow: match
            ? '0 0 0 3px #fef3c7, 0 4px 16px rgba(0,0,0,0.1)'
            : '0 1px 3px rgba(0,0,0,0.05), 0 4px 14px rgba(0,0,0,0.07)',
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        }}
        className="group-hover:-translate-y-1 group-hover:shadow-xl"
      >
        <div style={{ height: 3, background: cfg.color }} />
        <div style={{ padding: '12px 10px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%', overflow: 'hidden',
            background: cfg.light, color: cfg.text,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, flexShrink: 0,
          }}>
            {emp.photo_url
              ? <img src={emp.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : `${emp.first_name[0]}${emp.last_name[0]}`
            }
          </div>
          <div style={{ textAlign: 'center', width: '100%' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#111827', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {emp.last_name}
            </p>
            <p style={{ fontSize: 10, color: '#6b7280', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {emp.first_name}
            </p>
          </div>
          <p style={{ fontSize: 9, color: '#9ca3af', width: '100%', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {FUNC[emp.function] ?? emp.function?.replace(/_/g, ' ') ?? '—'}
          </p>
        </div>
      </div>
    </Link>
  );
}

// ── Arbre ─────────────────────────────────────────────────────────────────────
const LINE = '#e2e8f0';
const V = 24;
const H = 22;

function OrgNode({ node, search }: { node: EmployeeNode; search: string }) {
  const children = node.children ?? [];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <OrgCard emp={node} search={search} />
      {children.length > 0 && (
        <>
          <div style={{ width: 1, height: V, background: LINE }} />
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            {children.map((child, i) => {
              const first = i === 0;
              const last  = i === children.length - 1;
              const only  = children.length === 1;
              return (
                <div key={child.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingLeft: H, paddingRight: H, position: 'relative' }}>
                  {!only && (
                    <div style={{ position: 'absolute', top: 0, height: 1, background: LINE, left: first ? '50%' : 0, right: last ? '50%' : 0 }} />
                  )}
                  <div style={{ width: 1, height: V, background: LINE }} />
                  <OrgNode node={child} search={search} />
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function OrganigrammePage() {
  const [employees, setEmployees] = useState<EmployeeNode[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filterSL, setFilterSL]   = useState('');
  const [search, setSearch]       = useState('');
  const [zoom, setZoom]           = useState(1);

  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef     = useRef<HTMLDivElement>(null);
  const zoomRef      = useRef(1);
  zoomRef.current    = zoom;

  useEffect(() => {
    api.get('/employees', { params: { limit: 500, status: 'ACTIF' } })
      .then(res => setEmployees(
        (res.data.data || []).map((e: EmployeeNode) => ({
          id: e.id, first_name: e.first_name, last_name: e.last_name,
          function: e.function, service_line: e.service_line,
          manager_id: e.manager_id, photo_url: e.photo_url,
        }))
      ))
      .finally(() => setLoading(false));
  }, []);

  // ── Auto-fit : calcule le zoom pour que tout tienne dans le conteneur ────────
  const autoFit = useCallback(() => {
    const container = containerRef.current;
    const inner     = innerRef.current;
    if (!container || !inner) return;

    // Avec "zoom" CSS, offsetWidth/Height reflètent la taille zoomée.
    // On revient à 1 pour mesurer la taille naturelle.
    const cur = zoomRef.current;
    const naturalW = inner.offsetWidth  / cur;
    const naturalH = inner.offsetHeight / cur;

    const cw = container.clientWidth  - 40;
    const ch = container.clientHeight - 40;

    const fit = Math.min(cw / naturalW, ch / naturalH);
    setZoom(Math.max(Math.min(fit, 1), 0.15));
  }, []);

  // Déclenche l'auto-fit après le rendu des données ou du filtre
  useEffect(() => {
    if (loading) return;
    const id = requestAnimationFrame(() => requestAnimationFrame(autoFit));
    return () => cancelAnimationFrame(id);
  }, [loading, employees, filterSL, autoFit]);

  const reset = () => {
    setSearch('');
    setFilterSL('');
    requestAnimationFrame(() => requestAnimationFrame(autoFit));
  };

  const filtered = filterSL ? employees.filter(e => e.service_line === filterSL) : employees;
  const tree     = buildTree(filtered);

  return (
    <div className="flex flex-col gap-4 animate-fade-in" style={{ height: 'calc(100vh - 100px)' }}>

      {/* Toolbar */}
      <div className="flex items-start justify-between gap-4 flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Organigramme</h2>
          <p className="text-sm text-gray-400 mt-0.5">{filtered.length} collaborateurs actifs</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
            <input type="text" placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} className="input pl-8 w-44 text-sm" />
          </div>
          <select value={filterSL} onChange={e => setFilterSL(e.target.value)} className="input w-44 text-sm">
            <option value="">Tous les départements</option>
            {Object.entries(SL).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <div className="flex items-center gap-0.5 bg-white border border-gray-200 rounded-xl px-1 h-9 shadow-sm">
            <button onClick={() => setZoom(z => Math.max(+(z - 0.1).toFixed(2), 0.15))} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"><MinusIcon className="w-3.5 h-3.5" /></button>
            <button onClick={autoFit} className="text-xs font-mono text-gray-500 w-11 text-center hover:text-brand-600 transition-colors" title="Ajuster à l'écran">
              {Math.round(zoom * 100)}%
            </button>
            <button onClick={() => setZoom(z => Math.min(+(z + 0.1).toFixed(2), 2))} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"><PlusIcon className="w-3.5 h-3.5" /></button>
            <div className="w-px h-4 bg-gray-200 mx-0.5" />
            <button onClick={reset} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Réinitialiser"><ArrowPathIcon className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      </div>

      {/* Zone d'affichage */}
      <div
        ref={containerRef}
        className="flex-1 rounded-2xl border border-gray-200 overflow-auto shadow-sm"
        style={{ background: '#fafafa' }}
        onWheel={e => {
          e.preventDefault();
          setZoom(z => Math.min(Math.max(+(z - e.deltaY * 0.001).toFixed(3), 0.15), 2));
        }}
      >
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tree.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-gray-400">Aucun collaborateur trouvé</div>
        ) : (
          // "zoom" CSS affecte la mise en page → les scrollbars s'adaptent à la taille réelle affichée
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 64px 64px' }}>
            <div
              ref={innerRef}
              style={{
                zoom: zoom,
                transition: 'zoom 0.12s ease',
              }}
            >
              {tree.map((root, i) => (
                <div key={root.id} style={{ marginBottom: i < tree.length - 1 ? 72 : 0 }}>
                  <OrgNode node={root} search={search} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Légende */}
      <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
        {Object.entries(SL).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setFilterSL(filterSL === key ? '' : key)}
            style={filterSL === key ? { background: cfg.color, borderColor: cfg.color, color: '#fff' } : {}}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all duration-150 ${filterSL === key ? '' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700'}`}
          >
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: filterSL === key ? '#fff' : cfg.color }} />
            {cfg.label}
          </button>
        ))}
        {(filterSL || search) && (
          <button onClick={reset} className="px-2.5 py-1 rounded-full text-[11px] font-medium border border-gray-200 text-gray-400 hover:text-gray-600 bg-white transition-all">× Effacer</button>
        )}
      </div>
    </div>
  );
}
