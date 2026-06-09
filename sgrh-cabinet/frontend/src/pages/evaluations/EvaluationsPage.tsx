import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import {
  PlusIcon, PencilIcon, TrashIcon, StarIcon, XMarkIcon,
  ArrowDownTrayIcon, CloudArrowUpIcon, DocumentIcon,
} from '@heroicons/react/24/outline';
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
  employee_service_line: string;
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
  document_path: string | null;
  document_name: string | null;
  created_at: string;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
}

const PERIOD_LABELS: Record<string, string> = {
  ANNUEL:    'Annuel',
  MI_PERIODE: 'Mi-période',
  PROBATOIRE: 'Probatoire',
};

const STATUS_COLORS: Record<string, string> = {
  BROUILLON: 'badge-gray',
  EN_COURS:  'badge-yellow',
  TERMINE:   'badge-green',
};

const STATUS_LABELS: Record<string, string> = {
  BROUILLON: 'Brouillon',
  EN_COURS:  'En cours',
  TERMINE:   'Terminé',
};

const LIMIT = 20;

export default function EvaluationsPage() {
  const { user }  = useAuthStore();
  const [evaluations, setEvaluations]       = useState<Evaluation[]>([]);
  const [allEvaluations, setAllEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading]               = useState(true);
  const [year, setYear]     = useState(new Date().getFullYear());
  const [period, setPeriod] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]           = useState(0);
  const [sort, setSort]   = useState('created_at');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState<Evaluation | null>(null);

  // Document upload
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<string | null>(null);
  const [uploading, setUploading]       = useState<string | null>(null);

  const canManage = ['DRH', 'MANAGER'].includes(user?.role || '');

  const fetchAll = useCallback(() => {
    api.get('/evaluations', { params: { year, ...(period && { period }), ...(status && { status }), limit: 500 } })
      .then(res => setAllEvaluations(res.data.evaluations || []));
  }, [year, period, status]);

  const fetchPage = useCallback(() => {
    setLoading(true);
    api.get('/evaluations', { params: { year, ...(period && { period }), ...(status && { status }), page, limit: LIMIT, sort, order } })
      .then(res => {
        setEvaluations(res.data.evaluations || []);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
      })
      .finally(() => setLoading(false));
  }, [year, period, status, page, sort, order]);

  useEffect(() => { fetchAll(); },  [fetchAll]);
  useEffect(() => { fetchPage(); }, [fetchPage]);

  const refresh = () => { fetchAll(); fetchPage(); };

  const handleSort = (col: string) => {
    if (sort === col) setOrder(o => o === 'asc' ? 'desc' : 'asc');
    else { setSort(col); setOrder('desc'); }
    setPage(1);
  };

  const handleFilter = (y: number, p: string, s: string) => {
    setYear(y); setPeriod(p); setStatus(s); setPage(1);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette évaluation ?')) return;
    await api.delete(`/evaluations/${id}`);
    toast.success('Évaluation supprimée');
    refresh();
  };

  // ── Document handlers ─────────────────────────────────────────────────────
  const triggerUpload = (evalId: string) => {
    setUploadTarget(evalId);
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTarget) return;
    const fd = new FormData();
    fd.append('file', file);
    setUploading(uploadTarget);
    try {
      await api.post(`/evaluations/${uploadTarget}/document`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Document uploadé');
      refresh();
    } catch {
      toast.error('Erreur lors de l\'upload');
    } finally {
      setUploading(null);
      setUploadTarget(null);
      e.target.value = '';
    }
  };

  const handleDownload = async (ev: Evaluation) => {
    try {
      const res = await api.get(`/evaluations/${ev.id}/document`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = ev.document_name || 'evaluation';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Erreur téléchargement');
    }
  };

  const handleDeleteDoc = async (evalId: string) => {
    if (!confirm('Supprimer le document attaché ?')) return;
    await api.delete(`/evaluations/${evalId}/document`);
    toast.success('Document supprimé');
    refresh();
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const withScore = allEvaluations.filter(e => e.overall_score !== null);
  const avgScore  = withScore.length > 0
    ? withScore.reduce((s, e) => s + e.overall_score!, 0) / withScore.length
    : null;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" className="hidden"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        onChange={handleFileSelected} />

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Évaluations</h2>
          <p className="text-gray-500 text-sm mt-1">
            {total} évaluation(s) — {allEvaluations.filter(e => e.status === 'TERMINE').length} terminée(s)
            {avgScore !== null && ` — Moyenne : ${avgScore.toFixed(1)}/20`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={period} onChange={e => handleFilter(year, e.target.value, status)} className="input w-36 text-sm">
            <option value="">Toutes périodes</option>
            <option value="ANNUEL">Annuel</option>
            <option value="MI_PERIODE">Mi-période</option>
            <option value="PROBATOIRE">Probatoire</option>
          </select>
          <select value={status} onChange={e => handleFilter(year, period, e.target.value)} className="input w-36 text-sm">
            <option value="">Tous statuts</option>
            <option value="BROUILLON">Brouillon</option>
            <option value="EN_COURS">En cours</option>
            <option value="TERMINE">Terminé</option>
          </select>
          <select value={year} onChange={e => handleFilter(parseInt(e.target.value), period, status)} className="input w-24 text-sm">
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          {canManage && (
            <button onClick={() => { setEditing(null); setShowModal(true); }} className="btn-primary">
              <PlusIcon className="w-4 h-4" /> Nouvelle
            </button>
          )}
        </div>
      </div>

      {/* ── Stats cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['BROUILLON', 'EN_COURS', 'TERMINE'] as const).map(s => (
          <div key={s}
            onClick={() => handleFilter(year, period, status === s ? '' : s)}
            className={`card text-center p-4 cursor-pointer transition-all hover:shadow-md ${status === s ? 'ring-2 ring-brand-500' : ''}`}>
            <span className={`badge ${STATUS_COLORS[s]} mb-2`}>{STATUS_LABELS[s]}</span>
            <p className="text-2xl font-bold text-gray-800">{allEvaluations.filter(e => e.status === s).length}</p>
          </div>
        ))}
        <div className="card text-center p-4">
          <div className="flex items-center justify-center gap-1 mb-2">
            <StarIcon className="w-4 h-4 text-yellow-500" />
            <span className="text-xs font-semibold text-yellow-600">Moyenne</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{avgScore !== null ? avgScore.toFixed(1) : '—'}</p>
          <p className="text-xs text-gray-400">/20</p>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <SortTh col="employee_name" label="Collaborateur" current={sort} order={order} onSort={handleSort} />
              <SortTh col="year"          label="Année"         current={sort} order={order} onSort={handleSort} />
              <th>Période</th>
              <th>Statut</th>
              <th>Document</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeletonRows cols={6} rows={6} />
            ) : evaluations.length === 0 ? (
              <tr><td colSpan={6}>
                <EmptyState
                  icon={StarIcon}
                  title="Aucune évaluation"
                  description={`Aucune évaluation pour ${year}${period ? ` · ${PERIOD_LABELS[period]}` : ''}${status ? ` · ${STATUS_LABELS[status]}` : ''}`}
                  action={canManage ? { label: '+ Créer une évaluation', onClick: () => { setEditing(null); setShowModal(true); } } : undefined}
                />
              </td></tr>
            ) : evaluations.map(ev => (
              <tr key={ev.id}>
                {/* Collaborateur */}
                <td>
                  <p className="font-medium text-gray-800 text-sm">{ev.employee_name}</p>
                  <p className="text-xs text-gray-400">{ev.employee_service_line?.replace(/_/g, ' ')}</p>
                </td>

                {/* Année */}
                <td className="text-sm text-gray-700 font-medium">{ev.year}</td>

                {/* Période */}
                <td>
                  <span className="badge badge-blue">{PERIOD_LABELS[ev.period] || ev.period}</span>
                </td>

                {/* Statut */}
                <td>
                  <span className={`badge ${STATUS_COLORS[ev.status] || 'badge-gray'}`}>
                    {STATUS_LABELS[ev.status] || ev.status}
                  </span>
                </td>

                {/* Document */}
                <td>
                  {ev.document_name ? (
                    <div className="flex items-center gap-1 min-w-0">
                      <DocumentIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-xs text-gray-600 truncate max-w-[120px]" title={ev.document_name}>
                        {ev.document_name}
                      </span>
                      <button onClick={() => handleDownload(ev)} title="Télécharger"
                        className="p-1 text-blue-500 hover:text-blue-700 rounded flex-shrink-0">
                        <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                      </button>
                      {canManage && (
                        <button onClick={() => handleDeleteDoc(ev.id)} title="Supprimer le document"
                          className="p-1 text-gray-300 hover:text-red-500 rounded flex-shrink-0">
                          <XMarkIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ) : canManage ? (
                    <button
                      onClick={() => triggerUpload(ev.id)}
                      disabled={uploading === ev.id}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors disabled:opacity-50"
                    >
                      <CloudArrowUpIcon className="w-4 h-4" />
                      {uploading === ev.id ? 'Upload...' : 'Importer'}
                    </button>
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </td>

                {/* Actions */}
                <td>
                  <div className="flex gap-1">
                    {canManage && (
                      <button onClick={() => { setEditing(ev); setShowModal(true); }}
                        className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded" title="Modifier">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                    )}
                    {user?.role === 'DRH' && (
                      <button onClick={() => handleDelete(ev.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Supprimer">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <PaginationBar page={page} totalPages={totalPages} total={total} limit={LIMIT} onPage={setPage} />
      </div>

      {showModal && (
        <EvaluationModal
          evaluation={editing}
          year={year}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); refresh(); }}
        />
      )}
    </div>
  );
}

// ── Modal création / modification ─────────────────────────────────────────────
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
  const [docName, setDocName]     = useState<string | null>(evaluation?.document_name || null);
  const [uploading, setUploading] = useState(false);
  const modalFileRef = useRef<HTMLInputElement>(null);

  const handleModalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !evaluation) return;
    const fd = new FormData();
    fd.append('file', file);
    setUploading(true);
    try {
      await api.post(`/evaluations/${evaluation.id}/document`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setDocName(file.name);
      toast.success('Document uploadé');
    } catch {
      toast.error('Erreur upload');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleModalDeleteDoc = async () => {
    if (!evaluation || !confirm('Supprimer le document ?')) return;
    await api.delete(`/evaluations/${evaluation.id}/document`);
    setDocName(null);
    toast.success('Document supprimé');
  };

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

  const auto = [form.objectives_score, form.skills_score, form.behavior_score]
    .every(v => v !== '' && v !== null && v !== undefined);
  const autoScore = auto
    ? ((parseFloat(String(form.objectives_score)) + parseFloat(String(form.skills_score)) + parseFloat(String(form.behavior_score))) / 3).toFixed(2)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl animate-fade-in max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-800">
            {evaluation ? 'Modifier l\'évaluation' : 'Nouvelle évaluation'}
          </h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Collaborateur */}
          <div>
            <label className="label">Collaborateur *</label>
            <select className="input" value={form.employee_id}
              onChange={e => setForm(p => ({ ...p, employee_id: e.target.value }))}>
              <option value="">— Sélectionner —</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>
              ))}
            </select>
          </div>

          {/* Année / Période / Statut */}
          <div className="grid grid-cols-3 gap-3">
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
                <option value="PROBATOIRE">Probatoire</option>
              </select>
            </div>
            <div>
              <label className="label">Statut</label>
              <select className="input" value={form.status}
                onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                <option value="BROUILLON">Brouillon</option>
                <option value="EN_COURS">En cours</option>
                <option value="TERMINE">Terminé</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="border-t pt-4">
            <p className="text-sm font-semibold text-gray-600 mb-3">Notes <span className="font-normal text-gray-400">(sur 20)</span></p>
            <div className="grid grid-cols-3 gap-3">
              {([
                ['Objectifs', 'objectives_score'],
                ['Compétences', 'skills_score'],
                ['Comportement', 'behavior_score'],
              ] as const).map(([label, key]) => (
                <div key={key}>
                  <label className="label">{label}</label>
                  <input type="number" min={0} max={20} step={0.5} className="input"
                    value={form[key] as string | number}
                    onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                    placeholder="—" />
                </div>
              ))}
            </div>
            {autoScore && (
              <p className="text-sm text-gray-500 mt-2">
                Note globale calculée : <strong className="text-brand-700">{autoScore}/20</strong>
              </p>
            )}
          </div>

          {/* Textes */}
          {([
            ['Objectifs fixés', 'objectives', 'Objectifs du collaborateur pour la période...'],
            ['Points forts', 'strengths', 'Points forts identifiés...'],
            ["Axes d'amélioration", 'improvements', 'Axes à développer...'],
            ['Commentaires', 'comments', 'Commentaires généraux...'],
          ] as const).map(([label, key, ph]) => (
            <div key={key}>
              <label className="label">{label}</label>
              <textarea className="input h-16 resize-none text-sm" value={form[key]}
                onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                placeholder={ph} />
            </div>
          ))}
        </div>

        {/* Document — uniquement en mode édition */}
        {evaluation && (
          <div className="px-6 pb-4 border-t pt-4 flex-shrink-0">
            <input ref={modalFileRef} type="file" className="hidden"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={handleModalUpload} />
            <p className="text-sm font-semibold text-gray-600 mb-2">Document attaché</p>
            {docName ? (
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                <DocumentIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-700 truncate flex-1">{docName}</span>
                <button onClick={() => { const a = document.createElement('a'); a.href = `/api/evaluations/${evaluation.id}/document`; a.click(); }}
                  className="p-1 text-blue-500 hover:text-blue-700" title="Télécharger">
                  <ArrowDownTrayIcon className="w-4 h-4" />
                </button>
                <button onClick={handleModalDeleteDoc}
                  className="p-1 text-gray-300 hover:text-red-500" title="Supprimer">
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button onClick={() => modalFileRef.current?.click()} disabled={uploading}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-blue-600 hover:bg-blue-50 border border-dashed border-gray-300 hover:border-blue-400 rounded-lg px-4 py-2 w-full justify-center transition-colors disabled:opacity-50">
                <CloudArrowUpIcon className="w-5 h-5" />
                {uploading ? 'Upload en cours...' : 'Importer un document (PDF, Word, image)'}
              </button>
            )}
          </div>
        )}

        <div className="flex gap-3 justify-end px-6 py-4 border-t flex-shrink-0">
          <button onClick={onClose} className="btn-secondary">Annuler</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}
