import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { PlusIcon, PencilIcon, TrashIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface Candidate {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  position: string;
  department: string | null;
  status: CandidateStatus;
  source: string | null;
  notes: string | null;
  interview_date: string | null;
  salary_expected: number | null;
  created_by_name: string | null;
  created_at: string;
}

type CandidateStatus = 'NOUVEAU' | 'EN_COURS' | 'ENTRETIEN' | 'OFFRE' | 'EMBAUCHE' | 'REFUSE';

const STATUS_CONFIG: Record<CandidateStatus, { label: string; color: string; bg: string; border: string }> = {
  NOUVEAU:   { label: 'Nouveau',   color: 'text-gray-700',  bg: 'bg-gray-50',   border: 'border-gray-200' },
  EN_COURS:  { label: 'En cours',  color: 'text-blue-700',  bg: 'bg-blue-50',   border: 'border-blue-200' },
  ENTRETIEN: { label: 'Entretien', color: 'text-yellow-700',bg: 'bg-yellow-50', border: 'border-yellow-200' },
  OFFRE:     { label: 'Offre',     color: 'text-purple-700',bg: 'bg-purple-50', border: 'border-purple-200' },
  EMBAUCHE:  { label: 'Embauché',  color: 'text-green-700', bg: 'bg-green-50',  border: 'border-green-200' },
  REFUSE:    { label: 'Refusé',    color: 'text-red-700',   bg: 'bg-red-50',    border: 'border-red-200' },
};

const PIPELINE_STAGES: CandidateStatus[] = ['NOUVEAU', 'EN_COURS', 'ENTRETIEN', 'OFFRE', 'EMBAUCHE'];

export default function RecruitmentPage() {
  const { user } = useAuthStore();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Candidate | null>(null);
  const [filterStatus, setFilterStatus] = useState('');

  const canManage = ['DRH', 'DIRECTION_GENERALE', 'MANAGER'].includes(user?.role || '');

  const fetchCandidates = () => {
    setLoading(true);
    api.get('/recruitment', { params: filterStatus ? { status: filterStatus } : {} })
      .then(res => setCandidates(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCandidates(); }, [filterStatus]);

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

  const total = candidates.length;
  const hired = candidates.filter(c => c.status === 'EMBAUCHE').length;
  const refused = candidates.filter(c => c.status === 'REFUSE').length;
  const inProgress = candidates.filter(c => !['EMBAUCHE', 'REFUSE'].includes(c.status)).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Recrutement</h2>
          <p className="text-gray-500 text-sm mt-1">
            {total} candidat(s) — {inProgress} en cours — {hired} embauché(s) — {refused} refusé(s)
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button onClick={() => setView('kanban')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${view === 'kanban' ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              Kanban
            </button>
            <button onClick={() => setView('list')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${view === 'list' ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              Liste
            </button>
          </div>
          {canManage && (
            <button onClick={() => { setEditing(null); setShowModal(true); }} className="btn-primary">
              <PlusIcon className="w-4 h-4" /> Ajouter candidat
            </button>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {(Object.keys(STATUS_CONFIG) as CandidateStatus[]).map(s => {
          const count = candidates.filter(c => c.status === s).length;
          const cfg = STATUS_CONFIG[s];
          return (
            <button key={s} onClick={() => setFilterStatus(filterStatus === s ? '' : s)}
              className={`card p-3 text-center cursor-pointer transition-all hover:shadow-md border-2 ${filterStatus === s ? cfg.border : 'border-transparent'}`}>
              <p className="text-xl font-bold text-gray-800">{count}</p>
              <p className={`text-xs font-medium mt-0.5 ${cfg.color}`}>{cfg.label}</p>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" />
        </div>
      ) : view === 'kanban' ? (
        /* KANBAN */
        <div className="flex gap-4 overflow-x-auto pb-4">
          {PIPELINE_STAGES.map(stage => {
            const stageCandidates = candidates.filter(c => c.status === stage);
            const cfg = STATUS_CONFIG[stage];
            return (
              <div key={stage} className={`flex-shrink-0 w-64 rounded-xl ${cfg.bg} border ${cfg.border} p-3`}>
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
                          {c.department && <p className="text-xs text-gray-400 truncate">{c.department}</p>}
                        </div>
                        {canManage && (
                          <div className="flex gap-1 flex-shrink-0">
                            <button onClick={() => { setEditing(c); setShowModal(true); }}
                              className="p-1 text-gray-400 hover:text-amber-600 rounded">
                              <PencilIcon className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDelete(c.id)}
                              className="p-1 text-gray-400 hover:text-red-600 rounded">
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
                          <select value={c.status} onChange={e => handleStatusChange(c.id, e.target.value as CandidateStatus)}
                            className="w-full text-xs rounded px-1.5 py-1 border border-gray-200 bg-gray-50 text-gray-600">
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
          <div className={`flex-shrink-0 w-64 rounded-xl ${STATUS_CONFIG.REFUSE.bg} border ${STATUS_CONFIG.REFUSE.border} p-3`}>
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
                      <select value={c.status} onChange={e => handleStatusChange(c.id, e.target.value as CandidateStatus)}
                        className="w-full text-xs rounded px-1.5 py-1 border border-gray-200 bg-gray-50 text-gray-600">
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
        /* LIST VIEW */
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Candidat</th>
                <th>Poste</th>
                <th>Statut</th>
                <th>Source</th>
                <th>Entretien</th>
                <th>Salaire souhaité</th>
                {canManage && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {candidates.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="flex flex-col items-center py-16 gap-2">
                      <UserGroupIcon className="w-10 h-10 text-gray-200" />
                      <p className="text-gray-500">Aucun candidat</p>
                    </div>
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
                    {c.department && <p className="text-xs text-gray-400">{c.department}</p>}
                  </td>
                  <td>
                    <span className={`badge text-xs ${
                      c.status === 'EMBAUCHE' ? 'badge-green' :
                      c.status === 'REFUSE' ? 'badge-red' :
                      c.status === 'ENTRETIEN' ? 'badge-yellow' :
                      c.status === 'OFFRE' ? 'badge-purple' :
                      'badge-gray'
                    }`}>{STATUS_CONFIG[c.status]?.label}</span>
                  </td>
                  <td className="text-sm text-gray-500">{c.source || '—'}</td>
                  <td className="text-sm">{c.interview_date ? new Date(c.interview_date).toLocaleDateString('fr-FR') : '—'}</td>
                  <td className="text-sm">{c.salary_expected ? `${c.salary_expected.toLocaleString('fr-FR')} FCFA` : '—'}</td>
                  {canManage && (
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditing(c); setShowModal(true); }}
                          className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded">
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(c.id)}
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

function CandidateModal({ candidate, onClose, onSaved }: {
  candidate: Candidate | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    first_name: candidate?.first_name || '',
    last_name: candidate?.last_name || '',
    email: candidate?.email || '',
    phone: candidate?.phone || '',
    position: candidate?.position || '',
    department: candidate?.department || '',
    status: candidate?.status || 'NOUVEAU',
    source: candidate?.source || '',
    notes: candidate?.notes || '',
    interview_date: candidate?.interview_date ? candidate.interview_date.split('T')[0] : '',
    salary_expected: candidate?.salary_expected || '',
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-800 mb-5">
          {candidate ? 'Modifier le candidat' : 'Nouveau candidat'}
        </h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Prénom *</label>
              <input className="input" value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Nom *</label>
              <input className="input" value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Poste visé *</label>
            <input className="input" value={form.position} onChange={e => setForm(p => ({ ...p, position: e.target.value }))} placeholder="Ex: Auditeur Senior" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <label className="label">Téléphone</label>
              <input className="input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Département</label>
              <input className="input" value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} placeholder="Audit & Assurance" />
            </div>
            <div>
              <label className="label">Source</label>
              <input className="input" value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))} placeholder="LinkedIn, Recommandation..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Statut</label>
              <select className="input" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as CandidateStatus }))}>
                {(Object.keys(STATUS_CONFIG) as CandidateStatus[]).map(s => (
                  <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Date entretien</label>
              <input type="date" className="input" value={form.interview_date} onChange={e => setForm(p => ({ ...p, interview_date: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Salaire souhaité (FCFA)</label>
            <input type="number" className="input" value={form.salary_expected}
              onChange={e => setForm(p => ({ ...p, salary_expected: e.target.value }))} min={0} />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input h-20 resize-none" value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Observations, impressions..." />
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-5">
          <button onClick={onClose} className="btn-secondary">Annuler</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}
