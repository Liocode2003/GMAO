import { useState, useEffect } from 'react';
import api from '../../services/api';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

interface Leave {
  id: string;
  employee_id: string;
  employee_name: string;
  service_line: string;
  type: string;
  start_date: string;
  end_date: string;
  days: number;
  status: string;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  service_line: string;
}

const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

const SL_COLORS: Record<string, string> = {
  AUDIT_ASSURANCE:     'bg-blue-400',
  CONSULTING_FA:       'bg-purple-400',
  OUTSOURCING:         'bg-green-400',
  ADMINISTRATION:      'bg-gray-400',
  JURIDIQUE_FISCALITE: 'bg-amber-400',
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1; // Monday = 0
}

export default function TeamCalendarPage() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterSL, setFilterSL] = useState('');

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await api.get('/employees', { params: { limit: 500, status: 'ACTIF' } });
      const emps: Employee[] = (res.data.data || []).map((e: { id: string; first_name: string; last_name: string; service_line: string }) => ({
        id: e.id,
        first_name: e.first_name,
        last_name: e.last_name,
        service_line: e.service_line || '',
      }));
      setEmployees(emps);

      // Fetch all leaves for all employees this month
      const allLeaves: Leave[] = [];
      const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const lastDay = getDaysInMonth(year, month);
      const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${lastDay}`;

      await Promise.all(emps.slice(0, 50).map(async emp => {
        try {
          const lRes = await api.get(`/leaves/employee/${emp.id}`, { params: { year } });
          const empLeaves: Leave[] = (lRes.data || [])
            .filter((l: Leave) => l.status === 'APPROUVE')
            .filter((l: Leave) => {
              const ls = new Date(l.start_date);
              const le = new Date(l.end_date);
              const ms = new Date(startDate);
              const me = new Date(endDate);
              return ls <= me && le >= ms;
            })
            .map((l: Leave) => ({
              ...l,
              employee_name: `${emp.first_name} ${emp.last_name}`,
              service_line: emp.service_line,
            }));
          allLeaves.push(...empLeaves);
        } catch { /* skip */ }
      }));

      setLeaves(allLeaves);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeaves(); }, [year, month]);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  // For each day, get leaves covering it
  const getLeavesForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const d = new Date(dateStr);
    return leaves.filter(l => {
      const start = new Date(l.start_date);
      const end = new Date(l.end_date);
      return d >= start && d <= end;
    }).filter(l => {
      if (filterEmployee && l.employee_id !== filterEmployee) return false;
      if (filterSL && l.service_line !== filterSL) return false;
      return true;
    });
  };

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Calendrier Équipe</h2>
          <p className="text-gray-500 text-sm mt-1">Congés approuvés — {leaves.length} congé(s) ce mois</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)} className="input w-44">
            <option value="">Tous les collaborateurs</option>
            {employees.map(e => (
              <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Month navigation */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <h3 className="text-xl font-bold text-gray-800">
            {MONTHS[month]} {year}
          </h3>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
            <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-6 h-6 border-4 border-brand-600 border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: totalCells }, (_, i) => {
              const day = i - firstDay + 1;
              const isCurrentMonth = day >= 1 && day <= daysInMonth;
              const dateStr = isCurrentMonth
                ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                : '';
              const isToday = dateStr === todayStr;
              const isWeekend = (i % 7) >= 5;
              const dayLeaves = isCurrentMonth ? getLeavesForDay(day) : [];

              return (
                <div key={i}
                  className={`min-h-[80px] rounded-lg p-1.5 border transition-colors
                    ${!isCurrentMonth ? 'bg-gray-50 border-transparent' : isToday ? 'bg-brand-50 border-brand-200' : isWeekend ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-100 hover:border-gray-200'}
                  `}
                >
                  {isCurrentMonth && (
                    <>
                      <p className={`text-xs font-semibold mb-1 ${isToday ? 'text-brand-600' : isWeekend ? 'text-gray-400' : 'text-gray-600'}`}>
                        {day}
                      </p>
                      <div className="space-y-0.5">
                        {dayLeaves.slice(0, 3).map(l => (
                          <Link key={l.id} to={`/personnel/${l.employee_id}`}
                            className="block text-xs truncate px-1 py-0.5 rounded font-medium text-white bg-brand-500 hover:bg-brand-600 transition-colors"
                            title={`${l.employee_name} — ${l.type === 'PLANIFIE' ? 'Planifié' : 'Imprévu'} (${l.days}j)`}>
                            {l.employee_name.split(' ')[0]}
                          </Link>
                        ))}
                        {dayLeaves.length > 3 && (
                          <p className="text-xs text-gray-400 text-center">+{dayLeaves.length - 3}</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Monthly leave list */}
      {leaves.length > 0 && (
        <div className="card">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Congés approuvés — {MONTHS[month]} {year}</h3>
          <div className="space-y-2">
            {leaves
              .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
              .filter(l => !filterEmployee || l.employee_id === filterEmployee)
              .map(l => (
                <div key={l.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />
                    <div>
                      <Link to={`/personnel/${l.employee_id}`}
                        className="text-sm font-medium text-gray-800 hover:text-brand-600">
                        {l.employee_name}
                      </Link>
                      <p className="text-xs text-gray-400">
                        {new Date(l.start_date).toLocaleDateString('fr-FR')} → {new Date(l.end_date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge text-xs ${l.type === 'PLANIFIE' ? 'badge-blue' : 'badge-orange'}`}>
                      {l.type === 'PLANIFIE' ? 'Planifié' : 'Imprévu'}
                    </span>
                    <span className="text-sm font-semibold text-gray-700">{l.days}j</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
