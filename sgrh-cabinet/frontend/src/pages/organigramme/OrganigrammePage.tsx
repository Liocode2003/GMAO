import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Link } from 'react-router-dom';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  function: string;
  service_line: string;
  grade: string;
  photo_url: string | null;
}

// ── Niveaux hiérarchiques ────────────────────────────────────────────────────

const TIERS: { id: string; label: string; grades: string[] }[] = [
  {
    id: 'direction',
    label: 'Direction',
    grades: ['ASSOCIE', 'DIRECTEUR'],
  },
  {
    id: 'management',
    label: 'Management',
    grades: ['SENIOR_MANAGER_3', 'SENIOR_MANAGER_2', 'SENIOR_MANAGER_1', 'ASSISTANT_MANAGER_3', 'ASSISTANT_MANAGER_2', 'ASSISTANT_MANAGER_1', 'CONSULTANT'],
  },
  {
    id: 'seniors',
    label: 'Séniors',
    grades: ['SENIOR_3', 'SENIOR_2', 'SENIOR_1'],
  },
  {
    id: 'assistants',
    label: 'Assistants',
    grades: ['ASSISTANT_CONFIRME', 'ASSISTANT_DEBUTANT', 'JUNIOR'],
  },
];

const GRADE_ORDER: Record<string, number> = {
  ASSOCIE: 0, DIRECTEUR: 1,
  SENIOR_MANAGER_3: 2, SENIOR_MANAGER_2: 3, SENIOR_MANAGER_1: 4,
  ASSISTANT_MANAGER_3: 5, ASSISTANT_MANAGER_2: 6, ASSISTANT_MANAGER_1: 7,
  CONSULTANT: 8,
  SENIOR_3: 9, SENIOR_2: 10, SENIOR_1: 11,
  ASSISTANT_CONFIRME: 12, ASSISTANT_DEBUTANT: 13, JUNIOR: 14,
};

const GRADE_LABELS: Record<string, string> = {
  ASSOCIE: 'Associé',
  DIRECTEUR: 'Directeur',
  SENIOR_MANAGER_3: 'Senior Manager 3',
  SENIOR_MANAGER_2: 'Senior Manager 2',
  SENIOR_MANAGER_1: 'Senior Manager 1',
  ASSISTANT_MANAGER_3: 'Manager 3',
  ASSISTANT_MANAGER_2: 'Manager 2',
  ASSISTANT_MANAGER_1: 'Manager 1',
  CONSULTANT: 'Senior Consultant',
  SENIOR_3: 'Sénior 3',
  SENIOR_2: 'Sénior 2',
  SENIOR_1: 'Sénior 1',
  ASSISTANT_CONFIRME: 'Assistant confirmé',
  ASSISTANT_DEBUTANT: 'Assistant débutant',
  JUNIOR: 'Junior',
};

// ── Couleurs par département ─────────────────────────────────────────────────

const DEPT_COLORS: Record<string, { card: string; badge: string; dot: string }> = {
  AUDIT_ASSURANCE:     { card: 'border-blue-300 hover:border-blue-400',   badge: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500'   },
  CONSULTING_FA:       { card: 'border-purple-300 hover:border-purple-400', badge: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
  OUTSOURCING:         { card: 'border-green-300 hover:border-green-400',  badge: 'bg-green-100 text-green-700',  dot: 'bg-green-500'  },
  JURIDIQUE_FISCALITE: { card: 'border-amber-300 hover:border-amber-400',  badge: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-500'  },
  ADMINISTRATION:      { card: 'border-gray-300 hover:border-gray-400',    badge: 'bg-gray-100 text-gray-600',    dot: 'bg-gray-400'   },
};

const DEPT_LABELS: Record<string, string> = {
  AUDIT_ASSURANCE: 'Audit',
  CONSULTING_FA: 'Consulting',
  OUTSOURCING: 'Outsourcing',
  JURIDIQUE_FISCALITE: 'Tax & Legal',
  ADMINISTRATION: 'Admin',
};

// ── Carte employé ────────────────────────────────────────────────────────────

function EmployeeCard({ emp, large = false }: { emp: Employee; large?: boolean }) {
  const dc = DEPT_COLORS[emp.service_line] || DEPT_COLORS.ADMINISTRATION;
  const isDirection = emp.grade === 'ASSOCIE' || emp.grade === 'DIRECTEUR';

  return (
    <Link
      to={`/personnel/${emp.id}`}
      className={`group flex flex-col items-center text-center bg-white rounded-xl border-2 shadow-sm hover:shadow-md transition-all ${dc.card} ${
        large ? 'w-44 p-4' : 'w-36 p-3'
      } ${isDirection ? 'shadow-md' : ''}`}
    >
      {/* Avatar */}
      <div className={`rounded-full flex items-center justify-center font-bold overflow-hidden flex-shrink-0 ${
        large ? 'w-14 h-14 text-base mb-2' : 'w-10 h-10 text-xs mb-1.5'
      } ${isDirection ? 'bg-brand-600 text-white border-2 border-brand-700' : 'bg-gray-100 text-gray-600 border-2 border-gray-200'}`}>
        {emp.photo_url
          ? <img src={emp.photo_url} alt="" className="w-full h-full object-cover" />
          : `${emp.first_name[0]}${emp.last_name[0]}`}
      </div>

      {/* Nom */}
      <p className={`font-semibold text-gray-800 group-hover:text-brand-700 leading-tight ${large ? 'text-sm' : 'text-xs'}`}>
        {emp.last_name}
      </p>
      <p className={`text-gray-500 leading-tight ${large ? 'text-xs' : 'text-[10px]'}`}>
        {emp.first_name}
      </p>

      {/* Grade */}
      <span className={`mt-1.5 px-2 py-0.5 rounded-full font-medium ${dc.badge} ${large ? 'text-xs' : 'text-[10px]'}`}>
        {GRADE_LABELS[emp.grade] ?? emp.grade}
      </span>

      {/* Département */}
      <span className={`flex items-center gap-1 mt-1 text-gray-400 ${large ? 'text-xs' : 'text-[10px]'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dc.dot}`} />
        {DEPT_LABELS[emp.service_line] ?? emp.service_line}
      </span>
    </Link>
  );
}

// ── Niveau hiérarchique ──────────────────────────────────────────────────────

function TierRow({
  tier,
  employees,
  isFirst,
  filterDept,
}: {
  tier: typeof TIERS[number];
  employees: Employee[];
  isFirst: boolean;
  filterDept: string;
}) {
  const filtered = filterDept ? employees.filter(e => e.service_line === filterDept) : employees;
  const sorted = [...filtered].sort(
    (a, b) => (GRADE_ORDER[a.grade] ?? 99) - (GRADE_ORDER[b.grade] ?? 99)
  );

  if (sorted.length === 0) return null;

  const isDirection = tier.id === 'direction';

  return (
    <div className="flex flex-col items-center w-full">
      {/* Connecteur vertical entrant (sauf premier) */}
      {!isFirst && (
        <div className="w-px h-8 bg-gray-300" />
      )}

      {/* Label du niveau */}
      <div className="flex items-center gap-3 mb-4 w-full max-w-4xl">
        <div className="flex-1 h-px bg-gray-200" />
        <span className={`text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full ${
          isDirection ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-500'
        }`}>
          {tier.label} · {sorted.length}
        </span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Cartes */}
      <div className="flex flex-wrap justify-center gap-4">
        {sorted.map(emp => (
          <EmployeeCard key={emp.id} emp={emp} large={isDirection} />
        ))}
      </div>

      {/* Connecteur vertical sortant */}
      <div className="w-px h-8 bg-gray-300 mt-4" />
    </div>
  );
}

// ── Page principale ──────────────────────────────────────────────────────────

const DEPT_FILTER_OPTIONS = [
  { value: '', label: 'Tous les départements' },
  { value: 'AUDIT_ASSURANCE',    label: 'Audit & Assurance' },
  { value: 'CONSULTING_FA',      label: 'Consulting & FA' },
  { value: 'OUTSOURCING',        label: 'Outsourcing' },
  { value: 'JURIDIQUE_FISCALITE',label: 'Tax & Legal' },
  { value: 'ADMINISTRATION',     label: 'Administration' },
];

export default function OrganigrammePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDept, setFilterDept] = useState('');

  useEffect(() => {
    api.get('/employees', { params: { limit: 500, status: 'ACTIF' } })
      .then(res => setEmployees(res.data.data || []))
      .finally(() => setLoading(false));
  }, []);

  const visible = filterDept ? employees.filter(e => e.service_line === filterDept) : employees;

  const getForTier = (tier: typeof TIERS[number]) =>
    visible.filter(e => tier.grades.includes(e.grade));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Organigramme</h2>
          <p className="text-gray-500 text-sm mt-1">{visible.length} collaborateur{visible.length > 1 ? 's' : ''} actif{visible.length > 1 ? 's' : ''}</p>
        </div>
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="input w-52">
          {DEPT_FILTER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Légende */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(DEPT_LABELS).map(([key, label]) => (
          <span key={key} className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full ${DEPT_COLORS[key]?.badge}`}>
            <span className={`w-2 h-2 rounded-full ${DEPT_COLORS[key]?.dot}`} />
            {label}
          </span>
        ))}
      </div>

      {/* Organigramme */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="flex flex-col items-center py-6 overflow-x-auto">
          {TIERS.map((tier, i) => {
            const emps = getForTier(tier);
            if (emps.length === 0) return null;
            return (
              <TierRow
                key={tier.id}
                tier={tier}
                employees={emps}
                isFirst={i === 0 || TIERS.slice(0, i).every(t => getForTier(t).length === 0)}
                filterDept={filterDept}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
