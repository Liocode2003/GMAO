import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, CheckIcon, XMarkIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

// ─── Types ───────────────────────────────────────────────────────────────────

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
  notes?: string;
  created_by_name?: string;
  manager_name?: string;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  service_line: string;
  status: string;
  email?: string;
  manager_id?: string | null;
}

interface NewLeaveForm {
  employee_id: string;
  type: 'PLANIFIE' | 'IMPRÉVU';
  start_date: string;
  end_date: string;
  notes: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

const SL_COLORS: Record<string, string> = {
  AUDIT_ASSURANCE:     'bg-blue-500',
  CONSULTING_FA:       'bg-purple-500',
  OUTSOURCING:         'bg-green-500',
  ADMINISTRATION:      'bg-gray-500',
  JURIDIQUE_FISCALITE: 'bg-amber-500',
};

const SL_PENDING_COLORS: Record<string, string> = {
  AUDIT_ASSURANCE:     'bg-blue-200 text-blue-800 border border-blue-400 border-dashed',
  CONSULTING_FA:       'bg-purple-200 text-purple-800 border border-purple-400 border-dashed',
  OUTSOURCING:         'bg-green-200 text-green-800 border border-green-400 border-dashed',
  ADMINISTRATION:      'bg-gray-200 text-gray-800 border border-gray-400 border-dashed',
  JURIDIQUE_FISCALITE: 'bg-amber-200 text-amber-800 border border-amber-400 border-dashed',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function TeamCalendarPage() {
  const { user } = useAuthStore();
  const isDRH = user?.role === 'DRH' || user?.role === 'DIRECTION_GENERALE';
  const isManager = user?.role === 'MANAGER';
  const canCreate = isDRH || isManager;

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<Leave[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterSL, setFilterSL] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'APPROUVE' | 'EN_ATTENTE'>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [approving, setApproving] = useState<string | null>(null);
  const [form, setForm] = useState<NewLeaveForm>({
    employee_id: '', type: 'PLANIFIE', start_date: '', end_date: '', notes: '',
  });
  const [formError, setFormError] = useState('');

  // ── Fetch data ──────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const empRes = await api.get('/employees', { params: { limit: 500, status: 'ACTIF' } });
      const allEmps: Employee[] = (empRes.data.data || []).map((e: Employee) => ({
        id: e.id, first_name: e.first_name, last_name: e.last_name,
        service_line: e.service_line || '', status: e.status,
        email: e.email, manager_id: e.manager_id,
      }));
      setEmployees(allEmps);

      const startDate = toDateStr(year, month, 1);
      const lastDay = getDaysInMonth(year, month);
      const endDate = toDateStr(year, month, lastDay);

      const allLeaves: Leave[] = [];
      await Promise.all(allEmps.slice(0, 50).map(async emp => {
        try {
          const lRes = await api.get(`/leaves/employee/${emp.id}`, { params: { year } });
          const empLeaves: Leave[] = (lRes.data || [])
            .filter((l: Leave) => l.status === 'APPROUVE' || l.status === 'EN_ATTENTE')
            .filter((l: Leave) => {
              const ls = new Date(l.start_date);
              const le = new Date(l.end_date);
              return ls <= new Date(endDate) && le >= new Date(startDate);
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

      if (isDRH) {
        try {
          const pendRes = await api.get('/leaves/pending');
          setPendingLeaves(pendRes.data || []);
        } catch { /* no-op */ }
      }
    } catch { /* handled */ }
    finally { setLoading(false); }
  }, [year, month, isDRH]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Calendar helpers ────────────────────────────────────────────────────────

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  const getLeavesForDay = (day: number) => {
    const d = new Date(toDateStr(year, month, day));
    return leaves.filter(l => {
      const start = new Date(l.start_date);
      const end = new Date(l.end_date);
      if (d < start || d > end) return false;
      if (filterEmployee && l.employee_id !== filterEmployee) return false;
      if (filterSL && l.service_line !== filterSL) return false;
      if (filterStatus !== 'ALL' && l.status !== filterStatus) return false;
      return true;
    });
  };

  // ── Navigation ──────────────────────────────────────────────────────────────

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  // ── Approve / Reject ────────────────────────────────────────────────────────

  const handleApprove = async (leaveId: string, status: 'APPROUVE' | 'REFUSE') => {
    setApproving(leaveId);
    try {
      await api.patch(`/leaves/${leaveId}/approve`, { status });
      await fetchData();
    } catch { /* handled */ }
    finally { setApproving(null); }
  };

  // ── Create leave ────────────────────────────────────────────────────────────

  const resetForm = () => {
    setForm({ employee_id: '', type: 'PLANIFIE', start_date: '', end_date: '', notes: '' });
    setFormError('');
  };

  const handleSubmit = async () => {
    if (!form.employee_id || !form.start_date || !form.end_date) {
      setFormError('Collaborateur, date début et date fin sont obligatoires.');
      return;
    }
    if (form.end_date < form.start_date) {
      setFormError('La date de fin doit être après la date de début.');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      await api.post(`/leaves/employee/${form.employee_id}`, {
        type: form.type,
        start_date: form.start_date,
        end_date: form.end_date,
        notes: form.notes || undefined,
      });
      setShowModal(false);
      resetForm();
      await fetchData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setFormError(msg || 'Erreur lors de la création de la demande.');
    } finally { setSubmitting(false); }
  };

  // ── Dropdown employee list (filtered for managers) ──────────────────────────
  // For managers: find their own employee record by email, then show only direct reports
  const managerEmployeeId = isManager
    ? employees.find(e => e.email === user?.email)?.id ?? null
    : null;

  const selectableEmployees = employees.filter(e => {
    if (e.status !== 'ACTIF') return false;
    if (isManager && managerEmployeeId) return e.manager_id === managerEmployeeId;
    return true;
  });

  // ── Stats ───────────────────────────────────────────────────────────────────

  const approvedCount = leaves.filter(l => l.status === 'APPROUVE').length;
  const pendingCount = isDRH ? pendingLeaves.length : leaves.filter(l => l.status === 'EN_ATTENTE').length;

  // ── Unique service lines ────────────────────────────────────────────────────

  const serviceLinesInUse = [...new Set(employees.map(e => e.service_line).filter(Boolean))];

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Calendrier des congés</h2>
          <p className="text-gray-500 text-sm mt-1">
            {approvedCount} approuvé(s)
            {pendingCount > 0 && <span className="ml-2 text-amber-600 font-medium">· {pendingCount} en attente</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {canCreate && (
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="btn-primary flex items-center gap-1.5 text-sm"
            >
              <PlusIcon className="w-4 h-4" />
              Nouvelle demande
            </button>
          )}
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-2">
        <select value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)} className="input w-48 text-sm">
          <option value="">Tous les collaborateurs</option>
          {employees.map(e => (
            <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>
          ))}
        </select>
        <select value={filterSL} onChange={e => setFilterSL(e.target.value)} className="input w-48 text-sm">
          <option value="">Toutes les lignes</option>
          {serviceLinesInUse.map(sl => (
            <option key={sl} value={sl}>{sl.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as typeof filterStatus)} className="input w-40 text-sm">
          <option value="ALL">Tous les statuts</option>
          <option value="APPROUVE">Approuvés</option>
          <option value="EN_ATTENTE">En attente</option>
        </select>
      </div>

      {/* ── Calendar card ── */}
      <div className="card">
        {/* Month/Year navigation */}
        <div className="flex items-center justify-between mb-5">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-gray-800">{MONTHS[month]}</h3>
            <select
              value={year}
              onChange={e => setYear(Number(e.target.value))}
              className="input w-24 text-center font-semibold text-gray-700 py-1"
            >
              {Array.from({ length: 5 }, (_, i) => today.getFullYear() - 2 + i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
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
              const dateStr = isCurrentMonth ? toDateStr(year, month, day) : '';
              const isToday = dateStr === todayStr;
              const isWeekend = (i % 7) >= 5;
              const dayLeaves = isCurrentMonth ? getLeavesForDay(day) : [];

              return (
                <div key={i}
                  className={`min-h-[80px] rounded-lg p-1.5 border transition-colors
                    ${!isCurrentMonth ? 'bg-gray-50 border-transparent' :
                      isToday ? 'bg-brand-50 border-brand-200' :
                      isWeekend ? 'bg-gray-50 border-gray-100' :
                      'bg-white border-gray-100 hover:border-gray-200'}
                  `}
                >
                  {isCurrentMonth && (
                    <>
                      <p className={`text-xs font-semibold mb-1 ${isToday ? 'text-brand-600' : isWeekend ? 'text-gray-400' : 'text-gray-600'}`}>
                        {day}
                      </p>
                      <div className="space-y-0.5">
                        {dayLeaves.slice(0, 3).map(l => {
                          const isPending = l.status === 'EN_ATTENTE';
                          const colorClass = isPending
                            ? (SL_PENDING_COLORS[l.service_line] || 'bg-gray-100 border border-gray-300 border-dashed text-gray-600')
                            : (SL_COLORS[l.service_line] || 'bg-brand-500');
                          return (
                            <Link key={l.id} to={`/personnel/${l.employee_id}`}
                              className={`block text-xs truncate px-1 py-0.5 rounded font-medium transition-colors
                                ${isPending ? colorClass : `${colorClass} text-white hover:opacity-80`}`}
                              title={`${l.employee_name} — ${l.type === 'PLANIFIE' ? 'Planifié' : 'Imprévu'} (${l.days}j) — ${isPending ? 'En attente' : 'Approuvé'}`}
                            >
                              {isPending && <ClockIcon className="w-2.5 h-2.5 inline mr-0.5 -mt-0.5" />}
                              {l.employee_name.split(' ')[0]}
                            </Link>
                          );
                        })}
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

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className="w-3 h-3 rounded bg-blue-500" />
            Approuvé
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className="w-3 h-3 rounded bg-blue-200 border border-blue-400 border-dashed" />
            En attente
          </div>
        </div>
      </div>

      {/* ── Pending leaves section (DRH only) ── */}
      {isDRH && pendingLeaves.length > 0 && (
        <div className="card border-l-4 border-l-amber-400">
          <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <ClockIcon className="w-5 h-5 text-amber-500" />
            Demandes en attente ({pendingLeaves.length})
          </h3>
          <div className="space-y-3">
            {pendingLeaves.map(l => (
              <div key={l.id} className="flex items-center justify-between py-3 px-3 bg-amber-50 rounded-lg border border-amber-100">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-800">{l.employee_name}</span>
                    <span className={`badge text-xs ${l.type === 'PLANIFIE' ? 'badge-blue' : 'badge-orange'}`}>
                      {l.type === 'PLANIFIE' ? 'Planifié' : 'Imprévu'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(l.start_date + 'T12:00:00').toLocaleDateString('fr-FR')} → {new Date(l.end_date + 'T12:00:00').toLocaleDateString('fr-FR')}
                    {' '}· {l.days} j
                    {l.manager_name && <span className="ml-2 text-gray-400">Soumis par {l.manager_name}</span>}
                  </p>
                  {l.notes && <p className="text-xs text-gray-400 mt-0.5 italic">"{l.notes}"</p>}
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  <button
                    onClick={() => handleApprove(l.id, 'APPROUVE')}
                    disabled={approving === l.id}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {approving === l.id ? <div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" /> : <CheckIcon className="w-3.5 h-3.5" />}
                    Approuver
                  </button>
                  <button
                    onClick={() => handleApprove(l.id, 'REFUSE')}
                    disabled={approving === l.id}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    <XMarkIcon className="w-3.5 h-3.5" />
                    Refuser
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Monthly leave list ── */}
      {leaves.length > 0 && (
        <div className="card">
          <h3 className="text-base font-semibold text-gray-800 mb-4">
            Congés — {MONTHS[month]} {year}
          </h3>
          <div className="space-y-2">
            {[...leaves]
              .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
              .filter(l => !filterEmployee || l.employee_id === filterEmployee)
              .filter(l => filterStatus === 'ALL' || l.status === filterStatus)
              .map(l => (
                <div key={l.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${l.status === 'EN_ATTENTE' ? 'bg-amber-400' : 'bg-green-500'}`} />
                    <div>
                      <Link to={`/personnel/${l.employee_id}`}
                        className="text-sm font-medium text-gray-800 hover:text-brand-600">
                        {l.employee_name}
                      </Link>
                      <p className="text-xs text-gray-400">
                        {new Date(l.start_date + 'T12:00:00').toLocaleDateString('fr-FR')} → {new Date(l.end_date + 'T12:00:00').toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge text-xs ${l.type === 'PLANIFIE' ? 'badge-blue' : 'badge-orange'}`}>
                      {l.type === 'PLANIFIE' ? 'Planifié' : 'Imprévu'}
                    </span>
                    <span className={`badge text-xs ${l.status === 'APPROUVE' ? 'badge-green' : 'badge-yellow'}`}>
                      {l.status === 'APPROUVE' ? 'Approuvé' : 'En attente'}
                    </span>
                    <span className="text-sm font-semibold text-gray-700">{l.days}j</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── Create leave modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">Nouvelle demande de congé</h3>
              <p className="text-xs text-gray-400 mt-1">
                {isDRH ? 'La demande sera soumise pour approbation.' : 'Soumettez une demande pour vos collaborateurs directs.'}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label">Collaborateur *</label>
                <select
                  value={form.employee_id}
                  onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))}
                  className="input w-full"
                >
                  <option value="">Sélectionner un collaborateur</option>
                  {selectableEmployees.map(e => (
                    <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Type *</label>
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value as 'PLANIFIE' | 'IMPRÉVU' }))}
                  className="input w-full"
                >
                  <option value="PLANIFIE">Planifié (→ en attente d'approbation)</option>
                  <option value="IMPRÉVU">Imprévu (→ approuvé automatiquement)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Date début *</label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="label">Date fin *</label>
                  <input
                    type="date"
                    value={form.end_date}
                    min={form.start_date}
                    onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                    className="input w-full"
                  />
                </div>
              </div>
              <div>
                <label className="label">Motif / Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="input w-full h-20 resize-none"
                  placeholder="Optionnel"
                />
              </div>
              {formError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</p>
              )}
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="btn-secondary text-sm"
                disabled={submitting}
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="btn-primary text-sm flex items-center gap-2"
              >
                {submitting && <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />}
                Soumettre la demande
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
