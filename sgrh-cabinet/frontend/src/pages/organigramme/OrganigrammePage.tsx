import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';

interface EmployeeNode {
  id: string;
  first_name: string;
  last_name: string;
  function: string;
  grade: string;
  service_line: string;
  manager_id: string | null;
  photo_url: string | null;
  position_title?: string | null;
  children?: EmployeeNode[];
}

// ── Couleurs par service line ──────────────────────────────────────────────────
const SL: Record<string, { color: string; label: string }> = {
  AUDIT_ASSURANCE:     { color: '#0284c7', label: 'Audit & Assurance' },
  CONSULTING_FA:       { color: '#7c3aed', label: 'Consulting & FA' },
  OUTSOURCING:         { color: '#0d9488', label: 'Outsourcing' },
  ADMINISTRATION:      { color: '#475569', label: 'Administration' },
  JURIDIQUE_FISCALITE: { color: '#b45309', label: 'Tax & Legal' },
};

// ── Couleur de fond de carte selon grade ──────────────────────────────────────
function cardColor(grade: string, service_line: string): { bg: string; text: string; nameBg: string } {
  const sl = SL[service_line]?.color ?? '#475569';
  if (['ASSOCIE'].includes(grade))
    return { bg: '#1d4ed8', text: '#fff', nameBg: '#eff6ff' };
  if (['DIRECTEUR'].includes(grade))
    return { bg: sl, text: '#fff', nameBg: '#f0f9ff' };
  if (['SENIOR_MANAGER_1','SENIOR_MANAGER_2','SENIOR_MANAGER_3'].includes(grade))
    return { bg: '#0369a1', text: '#fff', nameBg: '#f0f9ff' };
  if (['ASSISTANT_MANAGER_1','ASSISTANT_MANAGER_2','ASSISTANT_MANAGER_3'].includes(grade))
    return { bg: '#0e7490', text: '#fff', nameBg: '#ecfeff' };
  return { bg: '#1e293b', text: '#fff', nameBg: '#f8fafc' };
}

// ── Libellé du poste ──────────────────────────────────────────────────────────
const GRADE_LABELS: Record<string, string> = {
  ASSISTANT_DEBUTANT:  'Assistant',
  ASSISTANT_CONFIRME:  'Assistant Confirmé',
  JUNIOR:              'Junior',
  SENIOR_1:            'Senior',
  SENIOR_2:            'Senior 2',
  SENIOR_3:            'Senior 3',
  CONSULTANT:          'Consultant',
  ASSISTANT_MANAGER_1: 'Manager',
  ASSISTANT_MANAGER_2: 'Manager 2',
  ASSISTANT_MANAGER_3: 'Manager 3',
  SENIOR_MANAGER_1:    'Senior Manager',
  SENIOR_MANAGER_2:    'Senior Manager 2',
  SENIOR_MANAGER_3:    'Senior Manager 3',
  DIRECTEUR:           'Directeur',
  ASSOCIE:             'Associé',
};

const SL_SHORT: Record<string, string> = {
  AUDIT_ASSURANCE:     'Audit',
  CONSULTING_FA:       'Consulting',
  OUTSOURCING:         'AOS',
  ADMINISTRATION:      'Admin.',
  JURIDIQUE_FISCALITE: 'Tax & Légal',
};

function cardTitle(emp: EmployeeNode): string {
  if (emp.position_title) return emp.position_title;
  const base = GRADE_LABELS[emp.grade] ?? emp.grade?.replace(/_/g, ' ') ?? '—';
  const dept = SL_SHORT[emp.service_line] ?? '';
  if (['ASSOCIE','DIRECTEUR','SENIOR_MANAGER_1','SENIOR_MANAGER_2','SENIOR_MANAGER_3'].includes(emp.grade) && dept)
    return `${base} ${dept}`;
  return base;
}

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

// ── Carte style "boîte titre + nom" ───────────────────────────────────────────
function OrgCard({ emp, search }: { emp: EmployeeNode; search: string }) {
  const c = cardColor(emp.grade, emp.service_line);
  const title = cardTitle(emp);
  const q = search.trim().toLowerCase();
  const match = q.length >= 2 && (
    emp.first_name.toLowerCase().includes(q) || emp.last_name.toLowerCase().includes(q)
  );

  return (
    <Link to={`/personnel/${emp.id}`} className="block group" onClick={e => e.stopPropagation()}>
      <div style={{
        width: 148,
        borderRadius: 8,
        overflow: 'hidden',
        boxShadow: match
          ? '0 0 0 3px #fbbf24, 0 4px 16px rgba(0,0,0,0.15)'
          : '0 2px 8px rgba(0,0,0,0.12)',
        border: match ? '2px solid #fbbf24' : '1.5px solid rgba(0,0,0,0.08)',
        transition: 'transform 0.15s, box-shadow 0.15s',
        cursor: 'pointer',
      }} className="group-hover:-translate-y-1 group-hover:shadow-lg">
        {/* Titre du poste — fond coloré */}
        <div style={{
          background: c.bg,
          color: c.text,
          padding: '7px 8px',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: 10.5, fontWeight: 700, lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {title}
          </p>
        </div>
        {/* Nom — fond clair */}
        <div style={{
          background: c.nameBg,
          padding: '6px 8px',
          textAlign: 'center',
          borderTop: `1px solid ${c.bg}22`,
        }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: '#111827', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {emp.first_name[0]}. {emp.last_name}
          </p>
        </div>
      </div>
    </Link>
  );
}

// ── Arbre ─────────────────────────────────────────────────────────────────────
const LINE = '#cbd5e1';
const V = 20;
const H = 16;

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
  const [zoom, setZoom]           = useState(0.55);

  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef     = useRef<HTMLDivElement>(null);
  const zoomRef      = useRef(1);
  zoomRef.current    = zoom;

  const autoFit = useCallback(() => {
    const container = containerRef.current;
    const inner     = innerRef.current;
    if (!container || !inner) return;
    const cur      = zoomRef.current;
    const naturalW = inner.offsetWidth  / cur;
    const naturalH = inner.offsetHeight / cur;
    const cw = container.clientWidth  - 40;
    const ch = container.clientHeight - 40;
    const fit = Math.min(cw / naturalW, ch / naturalH);
    setZoom(Math.max(Math.min(fit, 1), 0.15));
  }, []);

  useEffect(() => {
    api.get('/employees', { params: { limit: 500, status: 'ACTIF' } })
      .then(res => setEmployees(
        (res.data.data || []).map((e: EmployeeNode) => ({
          id: e.id, first_name: e.first_name, last_name: e.last_name,
          function: e.function, grade: e.grade,
          service_line: e.service_line, manager_id: e.manager_id,
          photo_url: e.photo_url, position_title: e.position_title,
        }))
      ))
      .finally(() => setLoading(false));
  }, []);

  // Auto-fit once after data loads and DOM renders
  useEffect(() => {
    if (employees.length === 0) return;
    requestAnimationFrame(() => requestAnimationFrame(autoFit));
  }, [employees, autoFit]);

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
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-2 h-9 shadow-sm">
            <span className="text-xs font-mono text-gray-400 w-11 text-center select-none">
              {Math.round(zoom * 100)}%
            </span>
            <div className="w-px h-4 bg-gray-200" />
            <button onClick={reset} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Réinitialiser">
              <ArrowPathIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Zone d'affichage */}
      <div
        ref={containerRef}
        className="flex-1 rounded-2xl border border-gray-200 overflow-auto shadow-sm"
        style={{ background: '#f8fafc' }}
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
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 64px 64px' }}>
            <div ref={innerRef} style={{ zoom, transition: 'zoom 0.12s ease' }}>
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

      {/* Légende des niveaux */}
      <div className="flex items-center gap-3 flex-wrap flex-shrink-0 border-t pt-2">
        {[
          { bg: '#1d4ed8', label: 'Associé' },
          { bg: '#0284c7', label: 'Directeur' },
          { bg: '#0369a1', label: 'Senior Manager' },
          { bg: '#0e7490', label: 'Manager' },
          { bg: '#1e293b', label: 'Collaborateur' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded" style={{ background: l.bg }} />
            <span className="text-[11px] text-gray-500">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
