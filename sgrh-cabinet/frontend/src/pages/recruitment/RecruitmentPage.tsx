import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import {
  PlusIcon, PencilIcon, TrashIcon, UserGroupIcon, XMarkIcon,
} from '@heroicons/react/24/outline';
import SortTh from '../../components/ui/SortTh';
import PaginationBar from '../../components/ui/PaginationBar';
import toast from 'react-hot-toast';
import { PageSpinner } from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { useModalEscape } from '../../components/ui/useModalEscape';

interface Candidate {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  position: string;
  status: CandidateStatus;
  source: string | null;
  notes: string | null;
  interview_date: string | null;
  salary_expected: number | null;
  created_by_name: string | null;
  created_at: string;
}

type CandidateStatus = 'NOUVEAU' | 'EN_COURS' | 'ENTRETIEN' | 'OFFRE' | 'EMBAUCHE' | 'REFUSE';

const STATUS_CONFIG: Record<CandidateStatus, { label: string; color: string; bg: string; border: string; badge: string }> = {
  NOUVEAU:   { label: 'Nouveau',   color: 'text-gray-700',   bg: 'bg-gray-50',    border: 'border-gray-200',   badge: 'badge-gray' },
  EN_COURS:  { label: 'En cours',  color: 'text-blue-700',   bg: 'bg-blue-50',    border: 'border-blue-200',   badge: 'badge-blue' },
  ENTRETIEN: { label: 'Entretien', color: 'text-yellow-700', bg: 'bg-yellow-50',  border: 'border-yellow-200', badge: 'badge-yellow' },
  OFFRE:     { label: 'Offre',     color: 'text-purple-700', bg: 'bg-purple-50',  border: 'border-purple-200', badge: 'badge-purple' },
  EMBAUCHE:  { label: 'Embauché',  color: 'text-green-700',  bg: 'bg-green-50',   border: 'border-green-200',  badge: 'badge-green' },
  REFUSE:    { label: 'Refusé',    color: 'text-red-700',    bg: 'bg-red-50',     border: 'border-red-200',    badge: 'badge-red' },
};

const PIPELINE_STAGES: CandidateStatus[] = ['NOUVEAU', 'EN_COURS', 'ENTRETIEN', 'OFFRE', 'EMBAUCHE'];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RecruitmentPage() {
  const { user } = useAuthStore();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Candidate | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  // For kanban we need all candidates — use a separate allCandidates state
  const [allCandidates, setAllCandidates] = useState<Candidate[]>([]);

  const canManage = user?.role === 'DRH';
  const LIMIT = 20;

  const fetchCandidates = useCallback(() => {
    setLoading(true);
    const params: Record<string, string | number> = {};
    if (filterStatus) params.status = filterStatus;
    if (view === 'list') {
      params.page = page;
      params.limit = LIMIT;
      params.sort = sort;
      params.order = sortOrder;
    } else {
      params.limit = 500; // kanban: all
    }
    api.get('/recruitment', { params })
      .then(res => {
        const d = res.data;
        if (d.candidates) {
          setCandidates(d.candidates);
          setAllCandidates(d.candidates);
          setTotal(d.total);
          setTotalPages(d.totalPages);
        } else {
          // fallback for kanban (all)
          setCandidates(Array.isArray(d) ? d : d.candidates || []);
          setAllCandidates(Array.isArray(d) ? d : d.candidates || []);
          setTotal(Array.isArray(d) ? d.length : d.total || 0);
          setTotalPages(1);
        }
      })
      .finally(() => setLoading(false));
  }, [filterStatus, view, page, sort, sortOrder]);

  useEffect(() => { setPage(1); }, [filterStatus, view, sort, sortOrder]);
  useEffect(() => { fetchCandidates(); }, [fetchCandidates]);

  const handleSort = (field: string) => {
    if (sort === field) setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    else { setSort(field); setSortOrder('asc'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce candidat ?')) return;
    await api.delete(`/recruitment/${id}`);
    toast.success('Candidat supprimé');
    fetchCandidates();
  };

  const handleStatusChange = async (id: string, status: CandidateStatus) => {
    await api.put(`/recruitment/${id}`, { status });
    fetchCandidates();
  };

  const hired = allCandidates.filter(c => c.status === 'EMBAUCHE').length;
  const refused = allCandidates.filter(c => c.status === 'REFUSE').length;
  const inProgress = allCandidates.filter(c => !['EMBAUCHE', 'REFUSE'].includes(c.status)).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Recrutement</h2>
          <p className="text-gray-500 text-sm mt-1">
            {total} candidat(s) — {inProgress} en cours — {hired} embauché(s) — {refused} refusé(s)
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden" role="group" aria-label="Mode d'affichage">
            <button
              onClick={() => setView('kanban')}
              aria-pressed={view === 'kanban'}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${view === 'kanban' ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              Kanban
            </button>
            <button
              onClick={() => setView('list')}
              aria-pressed={view === 'list'}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${view === 'list' ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              Liste
            </button>
          </div>
          {canManage && (
            <button onClick={() => { setEditing(null); setShowModal(true); }} className="btn-primary gap-2">
              <PlusIcon className="w-4 h-4" /> Ajouter candidat
            </button>
          )}
        </div>
      </div>

      {/* Stats bar — uses allCandidates for counts */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3" role="list" aria-label="Filtres par statut">
        {(Object.keys(STATUS_CONFIG) as CandidateStatus[]).map(s => {
          const count = allCandidates.filter(c => c.status === s).length;
          const cfg = STATUS_CONFIG[s];
          return (
            <button
              key={s}
              role="listitem"
              onClick={() => setFilterStatus(filterStatus === s ? '' : s)}
              aria-pressed={filterStatus === s}
              className={`card p-3 text-center cursor-pointer transition-all hover:shadow-md border-2 ${filterStatus === s ? cfg.border : 'border-transparent'}`}>
              <p className="text-xl font-bold text-gray-800">{count}</p>
              <p className={`text-xs font-medium mt-0.5 ${cfg.color}`}>{cfg.label}</p>
            </button>
          );
        })}
      </div>

      {loading ? (
        <PageSpinner />
      ) : view === 'kanban' ? (
        /* ── KANBAN ── */
        <div className="flex gap-4 overflow-x-auto pb-4" role="region" aria-label="Pipeline de recrutement">
          {PIPELINE_STAGES.map(stage => {
            const stageCandidates = candidates.filter(c => c.status === stage);
            const cfg = STATUS_CONFIG[stage];
            return (
              <div key={stage} className={`flex-shrink-0 w-64 rounded-xl ${cfg.bg} border ${cfg.border} p-3`} role="group" aria-label={`Colonne ${cfg.label}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-bold uppercase tracking-wide ${cfg.color}`}>{cfg.label}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                    {stageCandidates.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {stageCandidates.map(c => (
                    <div key={c.id} className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{c.first_name} {c.last_name}</p>
                          <p className="text-xs text-gray-500 truncate">{c.position}</p>
                
                        </div>
                        {canManage && (
                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              onClick={() => { setEditing(c); setShowModal(true); }}
                              className="p-1 text-gray-400 hover:text-amber-600 rounded"
                              aria-label={`Modifier ${c.first_name} ${c.last_name}`}>
                              <PencilIcon className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(c.id)}
                              className="p-1 text-gray-400 hover:text-red-600 rounded"
                              aria-label={`Supprimer ${c.first_name} ${c.last_name}`}>
                              <TrashIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                      {c.source && <p className="text-xs text-gray-400 mt-1">📌 {c.source}</p>}
                      {c.interview_date && (
                        <p className="text-xs text-blue-600 mt-1">
                          🗓 {new Date(c.interview_date).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                      {canManage && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <select
                            value={c.status}
                            onChange={e => handleStatusChange(c.id, e.target.value as CandidateStatus)}
                            className="w-full text-xs rounded px-1.5 py-1 border border-gray-200 bg-gray-50 text-gray-600"
                            aria-label={`Changer le statut de ${c.first_name} ${c.last_name}`}>
                            {(Object.keys(STATUS_CONFIG) as CandidateStatus[]).map(s => (
                              <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  ))}
                  {stageCandidates.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-4">Aucun candidat</p>
                  )}
                </div>
              </div>
            );
          })}
          {/* Refusés */}
          <div className={`flex-shrink-0 w-64 rounded-xl ${STATUS_CONFIG.REFUSE.bg} border ${STATUS_CONFIG.REFUSE.border} p-3`} role="group" aria-label="Colonne Refusés">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wide text-red-600">Refusés</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
                {candidates.filter(c => c.status === 'REFUSE').length}
              </span>
            </div>
            <div className="space-y-2">
              {candidates.filter(c => c.status === 'REFUSE').map(c => (
                <div key={c.id} className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 opacity-60">
                  <p className="text-sm font-semibold text-gray-700 truncate">{c.first_name} {c.last_name}</p>
                  <p className="text-xs text-gray-400 truncate">{c.position}</p>
                  {canManage && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <select
                        value={c.status}
                        onChange={e => handleStatusChange(c.id, e.target.value as CandidateStatus)}
                        className="w-full text-xs rounded px-1.5 py-1 border border-gray-200 bg-gray-50 text-gray-600"
                        aria-label={`Changer le statut de ${c.first_name} ${c.last_name}`}>
                        {(Object.keys(STATUS_CONFIG) as CandidateStatus[]).map(s => (
                          <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              ))}
              {candidates.filter(c => c.status === 'REFUSE').length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">Aucun candidat</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ── LIST VIEW ── */
        <div className="card p-0 overflow-hidden">
          {/* Mobile cards (sm:hidden) */}
          <div className="sm:hidden divide-y divide-gray-100">
            {candidates.length === 0 ? (
              <EmptyState
                icon={UserGroupIcon}
                title="Aucun candidat"
                description="Aucun candidat ne correspond à la sélection"
                action={canManage ? { label: '+ Ajouter candidat', onClick: () => setShowModal(true) } : undefined}
              />
            ) : candidates.map(c => {
              const cfg = STATUS_CONFIG[c.status];
              return (
                <div key={c.id} className="p-4 flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-full ${cfg.bg} flex items-center justify-center flex-shrink-0 border ${cfg.border}`}>
                    <span className={`text-sm font-bold ${cfg.color}`}>{c.first_name[0]}{c.last_name[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-gray-800 text-sm">{c.first_name} {c.last_name}</p>
                      <span className={`badge text-xs ${cfg.badge}`}>{cfg.label}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{c.position}</p>
                    {c.interview_date && (
                      <p className="text-xs text-blue-600 mt-1">
                        Entretien : {new Date(c.interview_date).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                  {canManage && (
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => { setEditing(c); setShowModal(true); }}
                        aria-label="Modifier" className="p-1.5 text-gray-400 hover:text-amber-600 rounded">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(c.id)}
                        aria-label="Supprimer" className="p-1.5 text-gray-400 hover:text-red-600 rounded">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop table (hidden sm:block) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <SortTh label="Candidat" col="last_name" current={sort} order={sortOrder} onSort={handleSort} />
                  <SortTh label="Poste" col="position" current={sort} order={sortOrder} onSort={handleSort} />
                  <th>Statut</th>
                  <th>Source</th>
                  <SortTh label="Entretien" col="interview_date" current={sort} order={sortOrder} onSort={handleSort} />
                  <SortTh label="Salaire souhaité" col="salary_expected" current={sort} order={sortOrder} onSort={handleSort} />
                  {canManage && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {candidates.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState
                        icon={UserGroupIcon}
                        title="Aucun candidat"
                        description="Aucun candidat ne correspond à la sélection"
                        action={canManage ? { label: '+ Ajouter candidat', onClick: () => setShowModal(true) } : undefined}
                      />
                    </td>
                  </tr>
                ) : candidates.map(c => (
                  <tr key={c.id}>
                    <td>
                      <p className="font-medium text-gray-800">{c.first_name} {c.last_name}</p>
                      {c.email && <p className="text-xs text-gray-400">{c.email}</p>}
                    </td>
                    <td>
                      <p className="text-sm text-gray-700">{c.position}</p>
                    </td>
                    <td>
                      <span className={`badge text-xs ${STATUS_CONFIG[c.status]?.badge}`}>
                        {STATUS_CONFIG[c.status]?.label}
                      </span>
                    </td>
                    <td className="text-sm text-gray-500">{c.source || '—'}</td>
                    <td className="text-sm">{c.interview_date ? new Date(c.interview_date).toLocaleDateString('fr-FR') : '—'}</td>
                    <td className="text-sm">{c.salary_expected ? `${c.salary_expected.toLocaleString('fr-FR')} FCFA` : '—'}</td>
                    {canManage && (
                      <td>
                        <div className="flex gap-1">
                          <button
                            onClick={() => { setEditing(c); setShowModal(true); }}
                            aria-label={`Modifier ${c.first_name} ${c.last_name}`}
                            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded">
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            aria-label={`Supprimer ${c.first_name} ${c.last_name}`}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <PaginationBar page={page} totalPages={totalPages} total={total} limit={LIMIT} onPage={setPage} />
        </div>
      )}

      {showModal && (
        <CandidateModal
          candidate={editing}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchCandidates(); }}
        />
      )}
    </div>
  );
}

// ─── Modal Candidat ───────────────────────────────────────────────────────────

function CandidateModal({ candidate, onClose, onSaved }: {
  candidate: Candidate | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  useModalEscape(onClose);
  const [form, setForm] = useState({
    first_name: candidate?.first_name || '',
    last_name: candidate?.last_name || '',
    email: candidate?.email || '',
    phone: candidate?.phone || '',
    position: candidate?.position || '',
    status: candidate?.status || 'NOUVEAU',
    source: candidate?.source || '',
    notes: candidate?.notes || '',
    interview_date: candidate?.interview_date ? candidate.interview_date.split('T')[0] : '',
    salary_expected: candidate?.salary_expected?.toString() || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.first_name || !form.last_name || !form.position) {
      toast.error('Prénom, nom et poste requis'); return;
    }
    setSaving(true);
    try {
      if (candidate) {
        await api.put(`/recruitment/${candidate.id}`, form);
        toast.success('Candidat mis à jour');
      } else {
        await api.post('/recruitment', form);
        toast.success('Candidat ajouté');
      }
      onSaved();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="candidate-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h3 id="candidate-modal-title" className="text-lg font-semibold text-gray-800">
            {candidate ? 'Modifier le candidat' : 'Nouveau candidat'}
          </h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100" aria-label="Fermer">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="c-firstname">Prénom *</label>
              <input id="c-firstname" className="input" value={form.first_name} onChange={f('first_name')} aria-required="true" />
            </div>
            <div>
              <label className="label" htmlFor="c-lastname">Nom *</label>
              <input id="c-lastname" className="input" value={form.last_name} onChange={f('last_name')} aria-required="true" />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="c-position">Poste visé *</label>
            <input id="c-position" className="input" value={form.position} onChange={f('position')} placeholder="Ex: Auditeur Senior" aria-required="true" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="c-email">Email</label>
              <input id="c-email" type="email" className="input" value={form.email} onChange={f('email')} />
            </div>
            <div>
              <label className="label" htmlFor="c-phone">Téléphone</label>
              <input id="c-phone" className="input" value={form.phone} onChange={f('phone')} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="c-source">Source</label>
            <input id="c-source" className="input" value={form.source} onChange={f('source')} placeholder="LinkedIn, Recommandation..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="c-status">Statut</label>
              <select id="c-status" className="input" value={form.status} onChange={f('status')}>
                {(Object.keys(STATUS_CONFIG) as CandidateStatus[]).map(s => (
                  <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="c-interview">Date entretien</label>
              <input id="c-interview" type="date" className="input" value={form.interview_date} onChange={f('interview_date')} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="c-salary">Salaire souhaité (FCFA)</label>
            <input id="c-salary" type="number" className="input" value={form.salary_expected} onChange={f('salary_expected')} min={0} />
          </div>
          <div>
            <label className="label" htmlFor="c-notes">Notes</label>
            <textarea id="c-notes" className="input h-20 resize-none" value={form.notes} onChange={f('notes')} placeholder="Observations, impressions..." />
          </div>
        </div>

        {/* Footer */}
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
