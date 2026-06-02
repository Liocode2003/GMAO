import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { PlusIcon, PencilIcon, TrashIcon, StarIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useModalEscape } from '../../components/ui/useModalEscape';
import SortTh from '../../components/ui/SortTh';
import PaginationBar from '../../components/ui/PaginationBar';
import toast from 'react-hot-toast';
import { TableSkeletonRows } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';

interface Evaluation {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_function: string;
  employee_service_line: string;
  evaluator_name: string;
  year: number;
  period: string;
  status: string;
  overall_score: number | null;
  objectives_score: number | null;
  skills_score: number | null;
  behavior_score: number | null;
  comments: string | null;
  objectives: string | null;
  strengths: string | null;
  improvements: string | null;
  created_at: string;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  function: string;
  service_line: string;
}

const PERIOD_LABELS: Record<string, string> = {
  ANNUEL:    'Annuel',
  MI_PERIODE: 'Mi-période',
};

const STATUS_COLORS: Record<string, string> = {
  EN_COURS: 'badge-yellow',
  TERMINE:  'badge-green',
};

const STATUS_LABELS: Record<string, string> = {
  EN_COURS: 'En cours',
  TERMINE:  'Terminé',
};

const LIMIT = 20;

export default function EvaluationsPage() {
  const { user } = useAuthStore();
  const [evaluations, setEvaluations]       = useState<Evaluation[]>([]);
  const [allEvaluations, setAllEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading]               = useState(true);
  const [year, setYear]                     = useState(new Date().getFullYear());
  const [period, setPeriod]                 = useState('');
  const [showModal, setShowModal]           = useState(false);
  const [editing, setEditing]               = useState<Evaluation | null>(null);

  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]           = useState(0);
  const [sort, setSort]             = useState('created_at');
  const [order, setOrder]           = useState<'asc' | 'desc'>('desc');

  const canManage = ['DRH', 'MANAGER'].includes(user?.role || '');

  const fetchAllEvaluations = useCallback(() => {
    api.get('/evaluations', { params: { year, ...(period && { period }), limit: 500 } })
      .then(res => setAllEvaluations(res.data.evaluations || []));
  }, [year, period]);

  const fetchEvaluations = useCallback(() => {
    setLoading(true);
    api.get('/evaluations', { params: { year, ...(period && { period }), page, limit: LIMIT, sort, order } })
      .then(res => {
        setEvaluations(res.data.evaluations || []);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
      })
      .finally(() => setLoading(false));
  }, [year, period, page, sort, order]);

  useEffect(() => { fetchAllEvaluations(); }, [fetchAllEvaluations]);
  useEffect(() => { fetchEvaluations(); }, [fetchEvaluations]);

  const handleSort = (col: string) => {
    if (sort === col) setOrder(o => o === 'asc' ? 'desc' : 'asc');
    else { setSort(col); setOrder('desc'); }
    setPage(1);
  };

  const handleFilterChange = (newYear: number, newPeriod: string) => {
    setYear(newYear);
    setPeriod(newPeriod);
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette évaluation ?')) return;
    await api.delete(`/evaluations/${id}`);
    toast.success('Évaluation supprimée');
    fetchAllEvaluations();
    fetchEvaluations();
  };

  const avgScore = allEvaluations
    .filter(e => e.overall_score !== null)
    .reduce((sum, e, _, arr) => sum + (e.overall_score! / arr.length), 0);

  const terminated = allEvaluations.filter(e => e.status === 'TERMINE').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Évaluations</h2>
          <p className="text-gray-500 text-sm mt-1">
            {total} évaluation(s) — {terminated} terminée(s)
            {allEvaluations.filter(e => e.overall_score !== null).length > 0 && ` — Moyenne: ${avgScore.toFixed(1)}/20`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select value={period} onChange={e => handleFilterChange(year, e.target.value)} className="input w-36">
            <option value="">Toutes périodes</option>
            <option value="ANNUEL">Annuel</option>
            <option value="MI_PERIODE">Mi-période</option>
          </select>
          <select value={year} onChange={e => handleFilterChange(parseInt(e.target.value), period)} className="input w-24">
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          {canManage && (
            <button onClick={() => { setEditing(null); setShowModal(true); }} className="btn-primary">
              <PlusIcon className="w-4 h-4" /> Nouvelle évaluation
            </button>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {['EN_COURS', 'TERMINE'].map(s => {
          const count = allEvaluations.filter(e => e.status === s).length;
          return (
            <div key={s} className="card text-center p-4">
              <span className={`badge ${STATUS_COLORS[s]} mb-2`}>{STATUS_LABELS[s]}</span>
              <p className="text-2xl font-bold text-gray-800">{count}</p>
            </div>
          );
        })}
        <div className="card text-center p-4">
          <div className="flex items-center justify-center gap-1 mb-2">
            <StarIcon className="w-4 h-4 text-yellow-500" />
            <span className="text-xs font-semibold text-yellow-600">Moyenne</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {allEvaluations.filter(e => e.overall_score !== null).length > 0 ? `${avgScore.toFixed(1)}` : '—'}
          </p>
          <p className="text-xs text-gray-400">/20</p>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {loading ? (
          <div className="py-8 text-center text-sm text-gray-400">Chargement...</div>
        ) : evaluations.length === 0 ? (
          <EmptyState
            icon={StarIcon}
            title="Aucune évaluation"
            description={`Aucune évaluation enregistrée pour ${year}`}
            action={canManage ? { label: '+ Créer une évaluation', onClick: () => { setEditing(null); setShowModal(true); } } : undefined}
          />
        ) : evaluations.map(ev => {
          const scoreColor = ev.overall_score === null ? 'text-gray-400' :
            ev.overall_score >= 16 ? 'text-green-600' :
            ev.overall_score >= 12 ? 'text-blue-600' :
            ev.overall_score >= 8 ? 'text-yellow-600' : 'text-red-600';
          return (
            <div key={ev.id} className="card p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-gray-800 text-sm">{ev.employee_name}</p>
                  <p className="text-xs text-gray-400">{ev.employee_service_line?.replace(/_/g, ' ')}</p>
                </div>
                <div className="flex items-center gap-2">
                  {ev.overall_score !== null && (
                    <span className={`text-base font-bold ${scoreColor}`}>{ev.overall_score}/20</span>
                  )}
                  {canManage && (
                    <div className="flex gap-1">
                      <button onClick={() => { setEditing(ev); setShowModal(true); }}
                        className="p-1.5 text-gray-400 hover:text-amber-600 rounded"><PencilIcon className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(ev.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded"><TrashIcon className="w-4 h-4" /></button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className={`badge ${STATUS_COLORS[ev.status] || 'badge-gray'}`}>{STATUS_LABELS[ev.status] || ev.status}</span>
                <span className="badge badge-blue">{PERIOD_LABELS[ev.period] || ev.period}</span>
                <span className="text-gray-500">{ev.year}</span>
              </div>
            </div>
          );
        })}
        <PaginationBar page={page} totalPages={totalPages} total={total} limit={LIMIT} onPage={setPage} />
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block table-container">
        <table className="table">
          <thead>
            <tr>
              <SortTh col="employee_name" label="Collaborateur"  current={sort} order={order} onSort={handleSort} />
              <th>Période</th>
              <th>Statut</th>
              <th className="text-center">Objectifs</th>
              <th className="text-center">Compétences</th>
              <th className="text-center">Comportement</th>
              <SortTh col="overall_score" label="Note globale" current={sort} order={order} onSort={handleSort} />
              {canManage && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeletonRows cols={canManage ? 8 : 7} rows={5} />
            ) : evaluations.length === 0 ? (
              <tr><td colSpan={canManage ? 8 : 7}>
                <EmptyState
                  icon={StarIcon}
                  title="Aucune évaluation"
                  description={`Aucune évaluation enregistrée pour ${year}`}
                  action={canManage ? { label: '+ Créer une évaluation', onClick: () => { setEditing(null); setShowModal(true); } } : undefined}
                />
              </td></tr>
            ) : evaluations.map(ev => {
              const scoreColor = ev.overall_score === null ? 'text-gray-400' :
                ev.overall_score >= 16 ? 'text-green-600' :
                ev.overall_score >= 12 ? 'text-blue-600' :
                ev.overall_score >= 8 ? 'text-yellow-600' : 'text-red-600';
              return (
                <tr key={ev.id}>
                  <td>
                    <p className="font-medium text-gray-800">{ev.employee_name}</p>
                    <p className="text-xs text-gray-400">{ev.employee_service_line?.replace(/_/g, ' ')}</p>
                  </td>
                  <td><span className="badge badge-blue">{PERIOD_LABELS[ev.period] || ev.period}</span></td>
                  <td><span className={`badge ${STATUS_COLORS[ev.status] || 'badge-gray'}`}>{STATUS_LABELS[ev.status] || ev.status}</span></td>
                  <td className="text-center text-sm font-medium">{ev.objectives_score !== null ? `${ev.objectives_score}/20` : '—'}</td>
                  <td className="text-center text-sm font-medium">{ev.skills_score !== null ? `${ev.skills_score}/20` : '—'}</td>
                  <td className="text-center text-sm font-medium">{ev.behavior_score !== null ? `${ev.behavior_score}/20` : '—'}</td>
                  <td className="text-center">
                    {ev.overall_score !== null ? (
                      <span className={`text-lg font-bold ${scoreColor}`}>{ev.overall_score}/20</span>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  {canManage && (
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditing(ev); setShowModal(true); }}
                          className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded">
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(ev.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        <PaginationBar page={page} totalPages={totalPages} total={total} limit={LIMIT} onPage={setPage} />
      </div>

      {showModal && (
        <EvaluationModal
          evaluation={editing}
          year={year}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchAllEvaluations(); fetchEvaluations(); }}
        />
      )}
    </div>
  );
}

function EvaluationModal({ evaluation, year, onClose, onSaved }: {
  evaluation: Evaluation | null;
  year: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  useModalEscape(onClose);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [form, setForm] = useState({
    employee_id:      evaluation?.employee_id || '',
    year:             evaluation?.year || year,
    period:           evaluation?.period || 'ANNUEL',
    status:           evaluation?.status || 'EN_COURS',
    objectives_score: evaluation?.objectives_score ?? '',
    skills_score:     evaluation?.skills_score ?? '',
    behavior_score:   evaluation?.behavior_score ?? '',
    comments:         evaluation?.comments || '',
    objectives:       evaluation?.objectives || '',
    strengths:        evaluation?.strengths || '',
    improvements:     evaluation?.improvements || '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/employees', { params: { limit: 200, status: 'ACTIF' } })
      .then(res => setEmployees(res.data.data || []));
  }, []);

  const handleSave = async () => {
    if (!form.employee_id) { toast.error('Collaborateur requis'); return; }
    setSaving(true);
    try {
      if (evaluation) {
        await api.put(`/evaluations/${evaluation.id}`, form);
        toast.success('Évaluation mise à jour');
      } else {
        await api.post('/evaluations', form);
        toast.success('Évaluation créée');
      }
      onSaved();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const scoreField = (label: string, key: 'objectives_score' | 'skills_score' | 'behavior_score') => (
    <div>
      <label className="label">{label} <span className="text-gray-400 font-normal">(0-20)</span></label>
      <input
        type="number" min={0} max={20} step={0.5} className="input"
        value={form[key] as string | number}
        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
        placeholder="—"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="eval-modal-title">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl animate-fade-in max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h3 id="eval-modal-title" className="text-lg font-semibold text-gray-800">
            {evaluation ? 'Modifier l\'évaluation' : 'Nouvelle évaluation'}
          </h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100" aria-label="Fermer">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Collaborateur *</label>
              <select className="input" value={form.employee_id}
                onChange={e => setForm(p => ({ ...p, employee_id: e.target.value }))}>
                <option value="">— Sélectionner —</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Année</label>
              <select className="input" value={form.year}
                onChange={e => setForm(p => ({ ...p, year: parseInt(e.target.value) }))}>
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Période</label>
              <select className="input" value={form.period}
                onChange={e => setForm(p => ({ ...p, period: e.target.value }))}>
                <option value="ANNUEL">Annuel</option>
                <option value="MI_PERIODE">Mi-période</option>
              </select>
            </div>
            <div>
              <label className="label">Statut</label>
              <select className="input" value={form.status}
                onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                <option value="EN_COURS">En cours</option>
                <option value="TERMINE">Terminé</option>
              </select>
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-semibold text-gray-600 mb-3">Notes (sur 20)</p>
            <div className="grid grid-cols-3 gap-3">
              {scoreField('Objectifs', 'objectives_score')}
              {scoreField('Compétences', 'skills_score')}
              {scoreField('Comportement', 'behavior_score')}
            </div>
            {form.objectives_score !== '' && form.skills_score !== '' && form.behavior_score !== '' && (
              <p className="text-sm text-gray-500 mt-2">
                Note globale calculée : <strong className="text-brand-700">
                  {((parseFloat(String(form.objectives_score)) + parseFloat(String(form.skills_score)) + parseFloat(String(form.behavior_score))) / 3).toFixed(2)}/20
                </strong>
              </p>
            )}
          </div>

          <div>
            <label className="label">Objectifs fixés</label>
            <textarea className="input h-20 resize-none" value={form.objectives}
              onChange={e => setForm(p => ({ ...p, objectives: e.target.value }))} placeholder="Objectifs du collaborateur pour la période..." />
          </div>
          <div>
            <label className="label">Points forts</label>
            <textarea className="input h-20 resize-none" value={form.strengths}
              onChange={e => setForm(p => ({ ...p, strengths: e.target.value }))} placeholder="Points forts du collaborateur..." />
          </div>
          <div>
            <label className="label">Axes d'amélioration</label>
            <textarea className="input h-20 resize-none" value={form.improvements}
              onChange={e => setForm(p => ({ ...p, improvements: e.target.value }))} placeholder="Points à améliorer..." />
          </div>
          <div>
            <label className="label">Commentaires</label>
            <textarea className="input h-20 resize-none" value={form.comments}
              onChange={e => setForm(p => ({ ...p, comments: e.target.value }))} placeholder="Commentaires généraux..." />
          </div>
        </div>
        <div className="flex gap-3 justify-end px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button onClick={onClose} className="btn-secondary">Annuler</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}
