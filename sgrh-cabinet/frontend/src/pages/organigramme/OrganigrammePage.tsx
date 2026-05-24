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

const GRADE_ORDER: Record<string, number> = {
  ASSOCIE: 0,
  DIRECTEUR: 1,
  SENIOR_MANAGER_3: 2,
  SENIOR_MANAGER_2: 3,
  SENIOR_MANAGER_1: 4,
  ASSISTANT_MANAGER_3: 5,
  ASSISTANT_MANAGER_2: 6,
  ASSISTANT_MANAGER_1: 7,
  CONSULTANT: 8,
  SENIOR_3: 9,
  SENIOR_2: 10,
  SENIOR_1: 11,
  ASSISTANT_CONFIRME: 12,
  ASSISTANT_DEBUTANT: 13,
  JUNIOR: 14,
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

const GRADE_TIER: Record<string, { bg: string; text: string; border: string }> = {
  ASSOCIE:             { bg: 'bg-brand-600', text: 'text-white',        border: 'border-brand-700' },
  DIRECTEUR:           { bg: 'bg-brand-500', text: 'text-white',        border: 'border-brand-600' },
  SENIOR_MANAGER_3:    { bg: 'bg-brand-100', text: 'text-brand-800',    border: 'border-brand-300' },
  SENIOR_MANAGER_2:    { bg: 'bg-brand-100', text: 'text-brand-800',    border: 'border-brand-300' },
  SENIOR_MANAGER_1:    { bg: 'bg-brand-100', text: 'text-brand-800',    border: 'border-brand-300' },
  ASSISTANT_MANAGER_3: { bg: 'bg-blue-50',   text: 'text-blue-800',     border: 'border-blue-200'  },
  ASSISTANT_MANAGER_2: { bg: 'bg-blue-50',   text: 'text-blue-800',     border: 'border-blue-200'  },
  ASSISTANT_MANAGER_1: { bg: 'bg-blue-50',   text: 'text-blue-800',     border: 'border-blue-200'  },
  CONSULTANT:          { bg: 'bg-violet-50', text: 'text-violet-800',   border: 'border-violet-200'},
  SENIOR_3:            { bg: 'bg-gray-50',   text: 'text-gray-700',     border: 'border-gray-200'  },
  SENIOR_2:            { bg: 'bg-gray-50',   text: 'text-gray-700',     border: 'border-gray-200'  },
  SENIOR_1:            { bg: 'bg-gray-50',   text: 'text-gray-700',     border: 'border-gray-200'  },
  ASSISTANT_CONFIRME:  { bg: 'bg-gray-50',   text: 'text-gray-600',     border: 'border-gray-200'  },
  ASSISTANT_DEBUTANT:  { bg: 'bg-gray-50',   text: 'text-gray-600',     border: 'border-gray-200'  },
  JUNIOR:              { bg: 'bg-gray-50',   text: 'text-gray-600',     border: 'border-gray-200'  },
};

const DEPARTMENTS = [
  { key: 'AUDIT_ASSURANCE',    label: 'Audit & Assurance',   accent: 'border-t-blue-500',   badge: 'bg-blue-500'   },
  { key: 'CONSULTING_FA',      label: 'Consulting & FA',     accent: 'border-t-purple-500', badge: 'bg-purple-500' },
  { key: 'OUTSOURCING',        label: 'Outsourcing',         accent: 'border-t-green-500',  badge: 'bg-green-500'  },
  { key: 'JURIDIQUE_FISCALITE',label: 'Tax & Legal',         accent: 'border-t-amber-500',  badge: 'bg-amber-500'  },
  { key: 'ADMINISTRATION',     label: 'Administration',      accent: 'border-t-gray-400',   badge: 'bg-gray-400'   },
];

function EmployeeCard({ emp }: { emp: Employee }) {
  const tier = GRADE_TIER[emp.grade] || GRADE_TIER.JUNIOR;
  const isLeader = emp.grade === 'ASSOCIE' || emp.grade === 'DIRECTEUR';

  return (
    <Link
      to={`/personnel/${emp.id}`}
      className={`flex items-center gap-3 p-3 rounded-lg border transition-all hover:shadow-md group ${
        isLeader
          ? 'bg-brand-50 border-brand-200 hover:border-brand-400'
          : 'bg-white border-gray-100 hover:border-gray-300'
      }`}
    >
      {/* Avatar */}
      <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold border-2 overflow-hidden ${
        isLeader ? 'border-brand-400 bg-brand-600 text-white' : 'border-gray-200 bg-gray-100 text-gray-600'
      }`}>
        {emp.photo_url ? (
          <img src={emp.photo_url} alt="" className="w-full h-full object-cover" />
        ) : (
          `${emp.first_name[0]}${emp.last_name[0]}`
        )}
      </div>

      {/* Infos */}
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold leading-tight truncate group-hover:text-brand-700 ${
          isLeader ? 'text-brand-800' : 'text-gray-800'
        }`}>
          {emp.last_name} {emp.first_name}
        </p>
        <span className={`inline-block mt-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded border ${tier.bg} ${tier.text} ${tier.border}`}>
          {GRADE_LABELS[emp.grade] ?? emp.grade}
        </span>
      </div>
    </Link>
  );
}

function DepartmentColumn({
  dept,
  employees,
}: {
  dept: typeof DEPARTMENTS[number];
  employees: Employee[];
}) {
  const sorted = [...employees].sort(
    (a, b) => (GRADE_ORDER[a.grade] ?? 99) - (GRADE_ORDER[b.grade] ?? 99)
  );

  return (
    <div className={`flex flex-col rounded-xl border-2 border-t-4 border-gray-100 bg-gray-50 min-w-[240px] flex-1 ${dept.accent}`}>
      {/* En-tête colonne */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${dept.badge}`} />
          <h3 className="font-semibold text-gray-800 text-sm">{dept.label}</h3>
        </div>
        <p className="text-xs text-gray-400 mt-0.5 pl-4">{sorted.length} collaborateur{sorted.length > 1 ? 's' : ''}</p>
      </div>

      {/* Cartes */}
      <div className="p-3 space-y-2 flex-1">
        {sorted.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">—</p>
        ) : (
          sorted.map(emp => <EmployeeCard key={emp.id} emp={emp} />)
        )}
      </div>
    </div>
  );
}

export default function OrganigrammePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDept, setFilterDept] = useState('');

  useEffect(() => {
    api.get('/employees', { params: { limit: 500, status: 'ACTIF' } })
      .then(res => setEmployees(res.data.data || []))
      .finally(() => setLoading(false));
  }, []);

  const visibleDepts = filterDept
    ? DEPARTMENTS.filter(d => d.key === filterDept)
    : DEPARTMENTS;

  const byDept = (key: string) =>
    employees.filter(e => e.service_line === key);

  const total = filterDept
    ? byDept(filterDept).length
    : employees.length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Organigramme</h2>
          <p className="text-gray-500 text-sm mt-1">{total} collaborateur{total > 1 ? 's' : ''} actif{total > 1 ? 's' : ''}</p>
        </div>
        <select
          value={filterDept}
          onChange={e => setFilterDept(e.target.value)}
          className="input w-52"
        >
          <option value="">Tous les départements</option>
          {DEPARTMENTS.map(d => (
            <option key={d.key} value={d.key}>{d.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {visibleDepts.map(dept => (
            <DepartmentColumn
              key={dept.key}
              dept={dept}
              employees={byDept(dept.key)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
