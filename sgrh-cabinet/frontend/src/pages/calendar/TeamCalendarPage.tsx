import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import {
  ChevronLeftIcon, ChevronRightIcon, PlusIcon, CheckIcon, XMarkIcon,
  ClockIcon, AcademicCapIcon, ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CalendarEvent {
  id: string;
  event_type: 'CONGE' | 'FORMATION' | 'FIN_CONTRAT';
  title: string;
  start_date: string;
  end_date: string;
  employee_id: string | null;
  employee_name: string | null;
  service_line: string | null;
  status: string;
  // CONGE
  days?: number;
  leave_type?: string;
  notes?: string;
  // FORMATION
  participant_count?: number;
  participant_ids?: string[];
  training_type?: string;
  location?: string;
  duration_hours?: number;
  // FIN_CONTRAT
  contract_type?: string;
}

interface PendingLeave {
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
  OUTSOURCING:         'bg-teal-500',
  ADMINISTRATION:      'bg-gray-500',
  JURIDIQUE_FISCALITE: 'bg-amber-500',
};

const SL_LABELS: Record<string, string> = {
  AUDIT_ASSURANCE:     'Audit & Assurance',
  CONSULTING_FA:       'Consulting & FA',
  OUTSOURCING:         'Outsourcing',
  ADMINISTRATION:      'Administration',
  JURIDIQUE_FISCALITE: 'Tax & Legal',
};

const SL_PENDING_COLORS: Record<string, string> = {
  AUDIT_ASSURANCE:     'bg-blue-100 text-blue-800 border border-blue-400 border-dashed',
  CONSULTING_FA:       'bg-purple-100 text-purple-800 border border-purple-400 border-dashed',
  OUTSOURCING:         'bg-teal-100 text-teal-800 border border-teal-400 border-dashed',
  ADMINISTRATION:      'bg-gray-100 text-gray-700 border border-gray-400 border-dashed',
  JURIDIQUE_FISCALITE: 'bg-amber-100 text-amber-800 border border-amber-400 border-dashed',
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

function eventChipClass(ev: CalendarEvent): string {
  if (ev.event_type === 'FORMATION') return 'bg-indigo-500 text-white';
  if (ev.event_type === 'FIN_CONTRAT') return 'bg-red-500 text-white';
  if (ev.status === 'EN_ATTENTE')
    return SL_PENDING_COLORS[ev.service_line || ''] || 'bg-gray-100 border border-gray-400 border-dashed text-gray-700';
  return `${SL_COLORS[ev.service_line || ''] || 'bg-brand-500'} text-white`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function TeamCalendarPage() {
  const { user } = useAuthStore();
  const isDRH      = user?.role === 'DRH' || user?.role === 'DIRECTION_GENERALE';
  const isManager  = user?.role === 'MANAGER';
  const canCreate  = isDRH || isManager;

  const today = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const [events, setEvents]               = useState<CalendarEvent[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<PendingLeave[]>([]);
  const [employees, setEmployees]         = useState<Employee[]>([]);
  const [loading, setLoading]             = useState(true);

  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterSL, setFilterSL]             = useState('');
  const [filterStatus, setFilterStatus]     = useState<'ALL' | 'APPROUVE' | 'EN_ATTENTE'>('ALL');
  const [showTypes, setShowTypes]           = useState<Set<string>>(
    new Set(['CONGE', 'FORMATION', 'FIN_CONTRAT'])
  );

  const [showModal, setShowModal]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [approving, setApproving]   = useState<string | null>(null);
  const [form, setForm] = useState<NewLeaveForm>({
    employee_id: '', type: 'PLANIFIE', start_date: '', end_date: '', notes: '',
  });
  const [formError, setFormError] = useState('');

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const startDate = toDateStr(year, month, 1);
      const endDate   = toDateStr(year, month, getDaysInMonth(year, month));

      const [empRes, eventsRes] = await Promise.all([
        api.get('/employees', { params: { limit: 500, status: 'ACTIF' } }),
        api.get('/calendar/events', { params: { startDate, endDate } }),
      ]);

      setEmployees((empRes.data.data || []).map((e: Employee) => ({
        id: e.id, first_name: e.first_name, last_name: e.last_name,
        service_line: e.service_line || '', status: e.status,
        email: e.email, manager_id: e.manager_id,
      })));
      setEvents(eventsRes.data || []);

      if (isDRH) {
        try {
          const pendRes = await api.get('/leaves/pending');
          setPendingLeaves(pendRes.data || []);
        } catch { /* no-op */ }
      }
    } catch { /* no-op */ }
    finally { setLoading(false); }
  }, [year, month, isDRH]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Calendar helpers ────────────────────────────────────────────────────────

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay    = getFirstDayOfMonth(year, month);
  const totalCells  = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const todayStr    = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  const getEventsForDay = (day: number): CalendarEvent[] => {
    const d = toDateStr(year, month, day);
    return events.filter(ev => {
      if (!showTypes.has(ev.event_type)) return false;
      if (d < ev.start_date || d > ev.end_date) return false;
      if (filterEmployee) {
        if (ev.event_type === 'FORMATION') {
          if (!(ev.participant_ids || []).includes(filterEmployee)) return false;
        } else {
          if (ev.employee_id !== filterEmployee) return false;
        }
      }
      if (filterSL && ev.service_line && ev.service_line !== filterSL) return false;
      if (filterStatus !== 'ALL' && ev.event_type === 'CONGE' && ev.status !== filterStatus) return false;
      return true;
    });
  };

  // ── Type toggle ────────────────────────────────────────────────────────────

  const toggleType = (t: string) =>
    setShowTypes(prev => {
      const s = new Set(prev);
      s.has(t) ? s.delete(t) : s.add(t);
      return s;
    });

  // ── Navigation ─────────────────────────────────────────────────────────────

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  // ── Approve / Reject ───────────────────────────────────────────────────────

  const handleApprove = async (leaveId: string, status: 'APPROUVE' | 'REFUSE') => {
    setApproving(leaveId);
    try { await api.patch(`/leaves/${leaveId}/approve`, { status }); await fetchData(); }
    catch { /* no-op */ }
    finally { setApproving(null); }
  };

  // ── Create leave ───────────────────────────────────────────────────────────

  const resetForm = () => { setForm({ employee_id: '', type: 'PLANIFIE', start_date: '', end_date: '', notes: '' }); setFormError(''); };

  const handleSubmit = async () => {
    if (!form.employee_id || !form.start_date || !form.end_date) {
      setFormError('Collaborateur, date début et date fin sont obligatoires.'); return;
    }
    if (form.end_date < form.start_date) {
      setFormError('La date de fin doit être après la date de début.'); return;
    }
    setSubmitting(true); setFormError('');
    try {
      await api.post(`/leaves/employee/${form.employee_id}`, {
        type: form.type, start_date: form.start_date, end_date: form.end_date,
        notes: form.notes || undefined,
      });
      setShowModal(false); resetForm(); await fetchData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setFormError(msg || 'Erreur lors de la création.');
    } finally { setSubmitting(false); }
  };

  // ── Selectable employees for modal ─────────────────────────────────────────

  const managerEmployeeId = isManager ? employees.find(e => e.email === user?.email)?.id ?? null : null;
  const selectableEmployees = employees.filter(e => {
    if (e.status !== 'ACTIF') return false;
    if (isManager && managerEmployeeId) return e.manager_id === managerEmployeeId;
    return true;
  });

  // ── Stats ──────────────────────────────────────────────────────────────────

  const conges    = events.filter(e => e.event_type === 'CONGE');
  const formations = events.filter(e => e.event_type === 'FORMATION');
  const finContrats = events.filter(e => e.event_type === 'FIN_CONTRAT');
  const pendingCount = isDRH ? pendingLeaves.length : conges.filter(e => e.status === 'EN_ATTENTE').length;

  const serviceLinesInUse = [...new Set(employees.map(e => e.service_line).filter(Boolean))];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Calendrier équipe</h2>
          <p className="text-gray-500 text-sm mt-1">
            {conges.filter(e => e.status === 'APPROUVE').length} congé(s) approuvé(s)
            {pendingCount > 0 && <span className="ml-2 text-amber-600 font-medium">· {pendingCount} en attente</span>}
            {formations.length > 0 && <span className="ml-2 text-indigo-600">· {formations.length} formation(s)</span>}
            {finContrats.length > 0 && <span className="ml-2 text-red-600">· {finContrats.length} fin(s) de contrat</span>}
          </p>
        </div>
        {canCreate && (
          <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary flex items-center gap-1.5 text-sm">
            <PlusIcon className="w-4 h-4" /> Nouvelle demande
          </button>
        )}
      </div>

      {/* ── Type toggles ── */}
      <div className="flex flex-wrap gap-2">
        {([
          { key: 'CONGE',      label: 'Congés',           color: 'bg-blue-500' },
          { key: 'FORMATION',  label: 'Formations',        color: 'bg-indigo-500' },
          { key: 'FIN_CONTRAT',label: 'Fins de contrat',  color: 'bg-red-500' },
        ] as const).map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => toggleType(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
              ${showTypes.has(key) ? `${color} text-white border-transparent` : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}
          >
            <span className={`w-2 h-2 rounded-full ${showTypes.has(key) ? 'bg-white/70' : color}`} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-2">
        <select value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)} className="input w-48 text-sm">
          <option value="">Tous les collaborateurs</option>
          {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
        </select>
        <select value={filterSL} onChange={e => setFilterSL(e.target.value)} className="input w-44 text-sm">
          <option value="">Toutes les lignes</option>
          {serviceLinesInUse.map(sl => <option key={sl} value={sl}>{SL_LABELS[sl] || sl.replace(/_/g, ' ')}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as typeof filterStatus)} className="input w-40 text-sm">
          <option value="ALL">Tous les statuts</option>
          <option value="APPROUVE">Approuvés</option>
          <option value="EN_ATTENTE">En attente</option>
        </select>
      </div>

      {/* ── Calendar card ── */}
      <div className="card">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-5">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-gray-800">{MONTHS[month]}</h3>
            <select value={year} onChange={e => setYear(Number(e.target.value))} className="input w-24 text-center font-semibold text-gray-700 py-1">
              {Array.from({ length: 5 }, (_, i) => today.getFullYear() - 2 + i).map(y => <option key={y} value={y}>{y}</option>)}
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

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: totalCells }, (_, i) => {
              const day = i - firstDay + 1;
              const isCurrentMonth = day >= 1 && day <= daysInMonth;
              const dateStr  = isCurrentMonth ? toDateStr(year, month, day) : '';
              const isToday  = dateStr === todayStr;
              const isWeekend = (i % 7) >= 5;
              const dayEvents = isCurrentMonth ? getEventsForDay(day) : [];

              return (
                <div key={i} className={`min-h-[80px] rounded-lg p-1.5 border transition-colors
                  ${!isCurrentMonth ? 'bg-gray-50 border-transparent' :
                    isToday ? 'bg-brand-50 border-brand-200' :
                    isWeekend ? 'bg-gray-50 border-gray-100' :
                    'bg-white border-gray-100 hover:border-gray-200'}`}>
                  {isCurrentMonth && (
                    <>
                      <p className={`text-xs font-semibold mb-1 ${isToday ? 'text-brand-600' : isWeekend ? 'text-gray-400' : 'text-gray-600'}`}>
                        {day}
                      </p>
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 3).map(ev => {
                          const chip = eventChipClass(ev);
                          const label = ev.event_type === 'FORMATION'
                            ? ev.title
                            : ev.employee_name?.split(' ')[0] ?? ev.title;
                          const tooltipParts = [
                            ev.employee_name || ev.title,
                            ev.event_type === 'CONGE'      ? `Congé ${ev.leave_type === 'PLANIFIE' ? 'planifié' : 'imprévu'} (${ev.days}j)` : null,
                            ev.event_type === 'FORMATION'  ? `Formation ${ev.training_type} — ${ev.participant_count} participant(s)` : null,
                            ev.event_type === 'FIN_CONTRAT'? `Fin de contrat (${ev.contract_type})` : null,
                            ev.status === 'EN_ATTENTE' ? '⏳ En attente' : null,
                          ].filter(Boolean).join(' · ');

                          const content = (
                            <span className={`flex items-center gap-0.5 text-xs truncate px-1 py-0.5 rounded font-medium transition-opacity hover:opacity-80 ${chip}`}
                              title={tooltipParts}>
                              {ev.event_type === 'FORMATION'   && <AcademicCapIcon className="w-2.5 h-2.5 flex-shrink-0" />}
                              {ev.event_type === 'FIN_CONTRAT' && <ExclamationTriangleIcon className="w-2.5 h-2.5 flex-shrink-0" />}
                              {ev.status === 'EN_ATTENTE'      && <ClockIcon className="w-2.5 h-2.5 flex-shrink-0" />}
                              <span className="truncate">{label}</span>
                            </span>
                          );

                          return ev.employee_id ? (
                            <Link key={ev.id} to={`/personnel/${ev.employee_id}`} className="block" onClick={e => e.stopPropagation()}>
                              {content}
                            </Link>
                          ) : (
                            <div key={ev.id}>{content}</div>
                          );
                        })}
                        {dayEvents.length > 3 && (
                          <p className="text-xs text-gray-400 text-center">+{dayEvents.length - 3}</p>
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
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100 flex-wrap text-xs text-gray-500">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-blue-500" />Congé approuvé</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-blue-100 border border-blue-400 border-dashed" />Congé en attente</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-indigo-500" /><AcademicCapIcon className="w-3 h-3" />Formation</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-500" /><ExclamationTriangleIcon className="w-3 h-3" />Fin de contrat</div>
        </div>
      </div>

      {/* ── Pending leaves (DRH) ── */}
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
                  <button onClick={() => handleApprove(l.id, 'APPROUVE')} disabled={approving === l.id}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
                    {approving === l.id
                      ? <div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                      : <CheckIcon className="w-3.5 h-3.5" />}
                    Approuver
                  </button>
                  <button onClick={() => handleApprove(l.id, 'REFUSE')} disabled={approving === l.id}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
                    <XMarkIcon className="w-3.5 h-3.5" /> Refuser
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Monthly list ── */}
      {events.length > 0 && (
        <div className="card">
          <h3 className="text-base font-semibold text-gray-800 mb-4">
            Événements — {MONTHS[month]} {year}
          </h3>
          <div className="space-y-2">
            {[...events]
              .filter(ev => showTypes.has(ev.event_type))
              .filter(ev => !filterEmployee || ev.employee_id === filterEmployee ||
                (ev.event_type === 'FORMATION' && (ev.participant_ids || []).includes(filterEmployee)))
              .filter(ev => !filterSL || !ev.service_line || ev.service_line === filterSL)
              .filter(ev => filterStatus === 'ALL' || ev.event_type !== 'CONGE' || ev.status === filterStatus)
              .sort((a, b) => a.start_date.localeCompare(b.start_date))
              .map(ev => (
                <div key={ev.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      ev.event_type === 'FORMATION'   ? 'bg-indigo-500' :
                      ev.event_type === 'FIN_CONTRAT' ? 'bg-red-500' :
                      ev.status === 'EN_ATTENTE'      ? 'bg-amber-400' : 'bg-green-500'
                    }`} />
                    <div>
                      {ev.employee_id ? (
                        <Link to={`/personnel/${ev.employee_id}`} className="text-sm font-medium text-gray-800 hover:text-brand-600">
                          {ev.employee_name || ev.title}
                        </Link>
                      ) : (
                        <p className="text-sm font-medium text-gray-800">{ev.title}</p>
                      )}
                      <p className="text-xs text-gray-400">
                        {new Date(ev.start_date + 'T12:00:00').toLocaleDateString('fr-FR')}
                        {ev.start_date !== ev.end_date && ` → ${new Date(ev.end_date + 'T12:00:00').toLocaleDateString('fr-FR')}`}
                        {ev.event_type === 'FORMATION' && ev.location && ` · ${ev.location}`}
                        {ev.event_type === 'FORMATION' && ev.duration_hours && ` · ${ev.duration_hours}h`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {ev.event_type === 'CONGE' && (
                      <>
                        <span className={`badge text-xs ${ev.leave_type === 'PLANIFIE' ? 'badge-blue' : 'badge-orange'}`}>
                          {ev.leave_type === 'PLANIFIE' ? 'Planifié' : 'Imprévu'}
                        </span>
                        <span className={`badge text-xs ${ev.status === 'APPROUVE' ? 'badge-green' : 'badge-yellow'}`}>
                          {ev.status === 'APPROUVE' ? 'Approuvé' : 'En attente'}
                        </span>
                        <span className="text-sm font-semibold text-gray-700">{ev.days}j</span>
                      </>
                    )}
                    {ev.event_type === 'FORMATION' && (
                      <>
                        <span className="badge badge-purple text-xs">{ev.training_type}</span>
                        {ev.participant_count !== undefined && ev.participant_count > 0 && (
                          <span className="text-xs text-gray-500">{ev.participant_count} participant(s)</span>
                        )}
                      </>
                    )}
                    {ev.event_type === 'FIN_CONTRAT' && (
                      <span className="badge badge-red text-xs">{ev.contract_type}</span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── Create leave modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">Nouvelle demande de congé</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label">Collaborateur *</label>
                <select value={form.employee_id} onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))} className="input w-full">
                  <option value="">Sélectionner un collaborateur</option>
                  {selectableEmployees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Type *</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as 'PLANIFIE' | 'IMPRÉVU' }))} className="input w-full">
                  <option value="PLANIFIE">Planifié (→ en attente d'approbation)</option>
                  <option value="IMPRÉVU">Imprévu (→ approuvé automatiquement)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Date début *</label>
                  <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className="input w-full" />
                </div>
                <div>
                  <label className="label">Date fin *</label>
                  <input type="date" value={form.end_date} min={form.start_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} className="input w-full" />
                </div>
              </div>
              <div>
                <label className="label">Motif / Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="input w-full h-20 resize-none" placeholder="Optionnel" />
              </div>
              {formError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</p>}
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => { setShowModal(false); resetForm(); }} className="btn-secondary text-sm" disabled={submitting}>Annuler</button>
              <button onClick={handleSubmit} disabled={submitting} className="btn-primary text-sm flex items-center gap-2">
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
