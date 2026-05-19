import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { PlusIcon, TrashIcon, PencilIcon, AcademicCapIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useModalEscape } from '../../components/ui/useModalEscape';
import toast from 'react-hot-toast';
import { TableSkeletonRows } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';

interface Training {
  id: string;
  type: string;
  title: string;
  date: string;
  location?: string;
  start_time?: string;
  end_time?: string;
  duration_hours?: number;
  trainer?: string;
  observations?: string;
  participant_count: number;
  participants?: Array<{ id: string; name: string }>;
}

const TYPE_COLORS: Record<string, string> = {
  INTRA: 'badge-blue',
  INTERNE: 'badge-green',
  AOC: 'badge-yellow',
  GROUPE: 'badge-purple',
};

export default function TrainingsPage() {
  const { user } = useAuthStore();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Training | null>(null);

  const canManage = ['DRH', 'MANAGER'].includes(user?.role || '');

  const fetchTrainings = () => {
    setLoading(true);
    api.get('/trainings', { params: { year } })
      .then(res => setTrainings(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTrainings(); }, [year]);

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette formation ?')) return;
    await api.delete(`/trainings/${id}`);
    toast.success('Formation supprimée');
    fetchTrainings();
  };

  const totalHours = trainings.reduce((sum, t) => sum + (parseFloat(String(t.duration_hours)) || 0), 0);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Formations</h2>
          <p className="text-gray-500 text-sm mt-1">{trainings.length} formation(s) — {totalHours.toFixed(0)}h au total</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={year} onChange={e => setYear(parseInt(e.target.value))} className="input w-28">
            {Array.from({ length: new Date().getFullYear() - 2022 + 1 }, (_, i) => 2022 + i).map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {canManage && (
            <button onClick={() => { setEditing(null); setShowModal(true); }} className="btn-primary">
              <PlusIcon className="w-4 h-4" /> Nouvelle formation
            </button>
          )}
        </div>
      </div>

      {/* Stats par type */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {['INTRA', 'INTERNE', 'AOC', 'GROUPE'].map(type => {
          const count = trainings.filter(t => t.type === type).length;
          const hours = trainings.filter(t => t.type === type).reduce((s, t) => s + (parseFloat(String(t.duration_hours)) || 0), 0);
          return (
            <div key={type} className="card text-center p-4">
              <span className={`badge ${TYPE_COLORS[type] || 'badge-gray'} mb-2`}>{type}</span>
              <p className="text-xl font-bold text-gray-800">{count}</p>
              <p className="text-xs text-gray-400">{hours.toFixed(0)}h</p>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Thème / Formation</th>
              <th>Date</th>
              <th>Lieu</th>
              <th>Durée</th>
              <th>Formateur</th>
              <th>Participants</th>
              {canManage && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeletonRows cols={8} rows={5} />
            ) : trainings.length === 0 ? (
              <tr><td colSpan={8}>
                <EmptyState
                  icon={AcademicCapIcon}
                  title="Aucune formation enregistrée"
                  description={`Aucune session de formation pour l'année ${year}`}
                  action={canManage ? { label: '+ Nouvelle formation', onClick: () => setShowModal(true) } : undefined}
                />
              </td></tr>
            ) : trainings.map(t => (
              <tr key={t.id}>
                <td><span className={`badge text-xs ${TYPE_COLORS[t.type] || 'badge-gray'}`}>{t.type}</span></td>
                <td className="font-medium text-gray-800 max-w-xs truncate">{t.title}</td>
                <td className="text-sm">{new Date(t.date).toLocaleDateString('fr-FR')}</td>
                <td className="text-sm text-gray-600">{t.location || '—'}</td>
                <td className="text-sm">{t.duration_hours ? `${t.duration_hours}h` : '—'}</td>
                <td className="text-sm text-gray-600">{t.trainer || '—'}</td>
                <td>
                  <span className="badge badge-gray">{t.participant_count} pers.</span>
                </td>
                {canManage && (
                  <td>
                    <div className="flex gap-1">
                      <button
                        onClick={() => { setEditing(t); setShowModal(true); }}
                        className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          {trainings.length > 0 && (
            <tfoot>
              <tr className="bg-gray-50 font-semibold">
                <td colSpan={4} className="px-4 py-2 text-right text-sm text-gray-700">Total heures:</td>
                <td className="px-4 py-2 text-sm text-brand-700">{totalHours.toFixed(0)}h</td>
                <td colSpan={canManage ? 3 : 2} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <TrainingModal
          training={editing}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchTrainings(); }}
        />
      )}
    </div>
  );
}

function TrainingModal({ training, onClose, onSaved }: {
  training: Training | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  useModalEscape(onClose);
  const [form, setForm] = useState({
    type: training?.type || 'INTRA',
    title: training?.title || '',
    date: training?.date ? training.date.split('T')[0] : '',
    location: training?.location || '',
    start_time: training?.start_time || '',
    end_time: training?.end_time || '',
    duration_hours: training?.duration_hours || '',
    trainer: training?.trainer || '',
    observations: training?.observations || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.title || !form.date) {
      toast.error('Thème et date requis');
      return;
    }
    setSaving(true);
    try {
      if (training) {
        await api.put(`/trainings/${training.id}`, form);
        toast.success('Formation mise à jour');
      } else {
        await api.post('/trainings', form);
        toast.success('Formation créée');
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="training-modal-title">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h3 id="training-modal-title" className="text-lg font-semibold text-gray-800">
            {training ? 'Modifier la formation' : 'Nouvelle formation'}
          </h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100" aria-label="Fermer"><XMarkIcon className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          <div>
            <label className="label">Type *</label>
            <select className="input" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
              {['INTRA', 'INTERNE', 'AOC', 'GROUPE'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Thème / Titre *</label>
            <input className="input" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Nom de la formation" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date *</label>
              <input type="date" className="input" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
            </div>
            <div>
              <label className="label">Lieu</label>
              <input className="input" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="Salle A, Hôtel..." />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Heure début</label>
              <input type="time" className="input" value={form.start_time} onChange={e => setForm(p => ({ ...p, start_time: e.target.value }))} />
            </div>
            <div>
              <label className="label">Heure fin</label>
              <input type="time" className="input" value={form.end_time} onChange={e => setForm(p => ({ ...p, end_time: e.target.value }))} />
            </div>
            <div>
              <label className="label">Durée (h)</label>
              <input type="number" className="input" value={form.duration_hours} onChange={e => setForm(p => ({ ...p, duration_hours: e.target.value }))} min="0" step="0.5" />
            </div>
          </div>
          <div>
            <label className="label">Formateur</label>
            <input className="input" value={form.trainer} onChange={e => setForm(p => ({ ...p, trainer: e.target.value }))} placeholder="Nom du formateur" />
          </div>
          <div>
            <label className="label">Observations</label>
            <textarea className="input h-20 resize-none" value={form.observations} onChange={e => setForm(p => ({ ...p, observations: e.target.value }))} />
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
