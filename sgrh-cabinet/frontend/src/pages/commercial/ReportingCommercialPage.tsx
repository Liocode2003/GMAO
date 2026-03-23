import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  TrophyIcon,
  XCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import {
  CommercialSubmission,
  CommercialStats,
  SubmissionType,
  SubmissionStatus,
  ServiceLine,
  SERVICE_LINE_LABELS,
  SUBMISSION_STATUS_LABELS,
} from '../../types';

// Rôles qui peuvent écrire
const CAN_WRITE = ['DRH', 'DIRECTION_GENERALE', 'ASSOCIE', 'MANAGER'];
// Rôles qui voient les montants
const CAN_VIEW_AMOUNTS = ['DRH', 'DIRECTION_GENERALE', 'ASSOCIE'];

const SERVICE_LINES: ServiceLine[] = [
  'AUDIT_ASSURANCE', 'CONSULTING_FA', 'OUTSOURCING', 'ADMINISTRATION', 'JURIDIQUE_FISCALITE',
];

const TABS: { type: SubmissionType; label: string }[] = [
  { type: 'AMI', label: "Avis à Manifestation d'Intérêt (AMI)" },
  { type: 'APPEL_OFFRE', label: "Appels d'offre" },
];

interface FormData {
  type: SubmissionType;
  reference: string;
  title: string;
  client: string;
  submission_date: string;
  service_line: ServiceLine;
  responsible_employee_id: string;
  status: SubmissionStatus;
  contract_amount: string;
  contract_start_date: string;
  contract_end_date: string;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
}

const StatusBadge = ({ status }: { status: SubmissionStatus }) => {
  const styles: Record<SubmissionStatus, string> = {
    EN_COURS: 'bg-blue-100 text-blue-800',
    GAGNE:    'bg-green-100 text-green-800',
    PERDU:    'bg-red-100 text-red-800',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {SUBMISSION_STATUS_LABELS[status]}
    </span>
  );
};

export default function ReportingCommercialPage() {
  const { user } = useAuthStore();
  const canWrite = CAN_WRITE.includes(user?.role || '');
  const canViewAmounts = CAN_VIEW_AMOUNTS.includes(user?.role || '');

  const [activeTab, setActiveTab] = useState<SubmissionType>('AMI');
  const [submissions, setSubmissions] = useState<CommercialSubmission[]>([]);
  const [stats, setStats] = useState<Record<string, CommercialStats>>({});
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<CommercialSubmission | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterServiceLine, setFilterServiceLine] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterQuarter, setFilterQuarter] = useState('');

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>();
  const watchStatus = watch('status');

  const buildParams = useCallback((type: SubmissionType) => {
    const p: Record<string, string> = { type };
    if (filterStatus) p.status = filterStatus;
    if (filterServiceLine) p.service_line = filterServiceLine;
    if (filterYear) p.year = filterYear;
    if (filterMonth) p.month = filterMonth;
    if (filterQuarter) p.quarter = filterQuarter;
    return p;
  }, [filterStatus, filterServiceLine, filterYear, filterMonth, filterQuarter]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = buildParams(activeTab);
      const [subRes, statsRes] = await Promise.all([
        api.get('/commercial', { params }),
        api.get('/commercial/stats', { params: buildParams(activeTab) }),
      ]);
      setSubmissions(subRes.data);
      setStats(statsRes.data);
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [activeTab, buildParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    api.get('/employees', { params: { status: 'ACTIF', limit: 200 } })
      .then(res => setEmployees(res.data.data || res.data))
      .catch(() => {});
  }, []);

  const openCreate = () => {
    setEditItem(null);
    reset({
      type: activeTab,
      reference: '',
      title: '',
      client: '',
      submission_date: '',
      service_line: '' as ServiceLine,
      responsible_employee_id: '',
      status: 'EN_COURS',
      contract_amount: '',
      contract_start_date: '',
      contract_end_date: '',
    });
    setShowModal(true);
  };

  const openEdit = (item: CommercialSubmission) => {
    setEditItem(item);
    reset({
      type: item.type,
      reference: item.reference,
      title: item.title,
      client: item.client,
      submission_date: item.submission_date?.substring(0, 10) || '',
      service_line: item.service_line,
      responsible_employee_id: item.responsible_employee_id || '',
      status: item.status,
      contract_amount: item.contract_amount != null ? String(item.contract_amount) : '',
      contract_start_date: item.contract_start_date?.substring(0, 10) || '',
      contract_end_date: item.contract_end_date?.substring(0, 10) || '',
    });
    setShowModal(true);
  };

  const onSubmit = async (data: FormData) => {
    const payload = {
      ...data,
      contract_amount: data.status === 'GAGNE' && data.contract_amount ? parseFloat(data.contract_amount) : null,
      contract_start_date: data.status === 'GAGNE' ? data.contract_start_date : null,
      contract_end_date: data.status === 'GAGNE' ? data.contract_end_date : null,
      responsible_employee_id: data.responsible_employee_id || null,
    };

    try {
      if (editItem) {
        await api.put(`/commercial/${editItem.id}`, payload);
        toast.success('Soumission mise à jour');
      } else {
        await api.post('/commercial', payload);
        toast.success('Soumission créée');
      }
      setShowModal(false);
      fetchData();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Erreur';
      toast.error(message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette soumission ?')) return;
    try {
      await api.delete(`/commercial/${id}`);
      toast.success('Soumission supprimée');
      fetchData();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleExport = (format: 'excel' | 'pdf') => {
    const params = new URLSearchParams(buildParams(activeTab) as Record<string, string>);
    const url = `/api/commercial/export/${format}?${params.toString()}`;
    window.open(url, '_blank');
  };

  const tabStats = stats[activeTab];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Reporting Commercial</h2>
          <p className="text-gray-500 text-sm mt-1">Suivi des AMI et Appels d'offre</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('excel')}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700"
          >
            <ArrowDownTrayIcon className="w-4 h-4 text-green-600" />
            Excel
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700"
          >
            <ArrowDownTrayIcon className="w-4 h-4 text-red-600" />
            PDF
          </button>
          {canWrite && (
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-brand-700 text-white rounded-lg hover:bg-brand-800"
            >
              <PlusIcon className="w-4 h-4" />
              Nouvelle soumission
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-0">
          {TABS.map(tab => (
            <button
              key={tab.type}
              onClick={() => setActiveTab(tab.type)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.type
                  ? 'border-brand-700 text-brand-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* KPI Indicators */}
      {tabStats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="card text-center">
            <div className="flex items-center justify-center mb-1">
              <ChartBarIcon className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{tabStats.total}</p>
            <p className="text-xs text-gray-500 mt-0.5">Total soumissions</p>
          </div>
          <div className="card text-center">
            <div className="flex items-center justify-center mb-1">
              <TrophyIcon className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-600">{tabStats.wins}</p>
            <p className="text-xs text-gray-500 mt-0.5">Wins</p>
          </div>
          <div className="card text-center">
            <div className="flex items-center justify-center mb-1">
              <XCircleIcon className="w-5 h-5 text-red-400" />
            </div>
            <p className="text-2xl font-bold text-red-600">{tabStats.losses}</p>
            <p className="text-xs text-gray-500 mt-0.5">Pertes</p>
          </div>
          <div className="card text-center">
            <div className="flex items-center justify-center mb-1">
              <ClockIcon className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-blue-600">{tabStats.success_rate}%</p>
            <p className="text-xs text-gray-500 mt-0.5">Taux de réussite</p>
          </div>
          {canViewAmounts && (
            <div className="card text-center">
              <div className="flex items-center justify-center mb-1">
                <CurrencyDollarIcon className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-lg font-bold text-amber-600">
                {tabStats.total_amount > 0
                  ? new Intl.NumberFormat('fr-FR').format(tabStats.total_amount)
                  : '0'} FCFA
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Montant total gagné</p>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-3">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="input-field text-sm py-1.5 w-auto"
          >
            <option value="">Tous les statuts</option>
            <option value="EN_COURS">En cours</option>
            <option value="GAGNE">Gagné</option>
            <option value="PERDU">Perdu</option>
          </select>

          <select
            value={filterServiceLine}
            onChange={e => setFilterServiceLine(e.target.value)}
            className="input-field text-sm py-1.5 w-auto"
          >
            <option value="">Toutes les lignes</option>
            {SERVICE_LINES.map(sl => (
              <option key={sl} value={sl}>{SERVICE_LINE_LABELS[sl]}</option>
            ))}
          </select>

          <select
            value={filterYear}
            onChange={e => { setFilterYear(e.target.value); setFilterQuarter(''); setFilterMonth(''); }}
            className="input-field text-sm py-1.5 w-auto"
          >
            <option value="">Toutes les années</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          {filterYear && (
            <>
              <select
                value={filterQuarter}
                onChange={e => { setFilterQuarter(e.target.value); setFilterMonth(''); }}
                className="input-field text-sm py-1.5 w-auto"
              >
                <option value="">Tous les trimestres</option>
                <option value="1">T1 (Jan–Mar)</option>
                <option value="2">T2 (Avr–Jun)</option>
                <option value="3">T3 (Jul–Sep)</option>
                <option value="4">T4 (Oct–Déc)</option>
              </select>

              {!filterQuarter && (
                <select
                  value={filterMonth}
                  onChange={e => setFilterMonth(e.target.value)}
                  className="input-field text-sm py-1.5 w-auto"
                >
                  <option value="">Tous les mois</option>
                  {['Janvier','Février','Mars','Avril','Mai','Juin',
                    'Juillet','Août','Septembre','Octobre','Novembre','Décembre'
                  ].map((m, i) => (
                    <option key={i+1} value={i+1}>{m}</option>
                  ))}
                </select>
              )}
            </>
          )}

          {(filterStatus || filterServiceLine || filterYear) && (
            <button
              onClick={() => { setFilterStatus(''); setFilterServiceLine(''); setFilterYear(''); setFilterMonth(''); setFilterQuarter(''); }}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin w-6 h-6 border-4 border-brand-600 border-t-transparent rounded-full" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <ChartBarIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Aucune soumission trouvée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Référence</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Objet / Intitulé</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date soumission</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ligne de service</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Responsable</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                  {canViewAmounts && (
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Montant (FCFA)</th>
                  )}
                  {canWrite && (
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{sub.reference}</td>
                    <td className="px-4 py-3 font-medium text-gray-800 max-w-xs truncate" title={sub.title}>{sub.title}</td>
                    <td className="px-4 py-3 text-gray-600">{sub.client}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {sub.submission_date ? new Date(sub.submission_date).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {SERVICE_LINE_LABELS[sub.service_line] || sub.service_line}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{sub.responsible_name || '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={sub.status} /></td>
                    {canViewAmounts && (
                      <td className="px-4 py-3 text-right font-medium text-gray-800 whitespace-nowrap">
                        {sub.status === 'GAGNE' && sub.contract_amount != null
                          ? new Intl.NumberFormat('fr-FR').format(sub.contract_amount)
                          : '—'}
                      </td>
                    )}
                    {canWrite && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(sub)}
                            className="text-brand-600 hover:text-brand-800"
                            title="Modifier"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(sub.id)}
                            className="text-red-400 hover:text-red-600"
                            title="Supprimer"
                          >
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
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">
                {editItem ? 'Modifier la soumission' : 'Nouvelle soumission'}
              </h3>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
              {/* Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-field">Type *</label>
                  <select {...register('type', { required: true })} className="input-field">
                    <option value="AMI">AMI</option>
                    <option value="APPEL_OFFRE">Appel d'offre</option>
                  </select>
                </div>
                <div>
                  <label className="label-field">Numéro de référence *</label>
                  <input
                    {...register('reference', { required: 'Champ obligatoire' })}
                    className="input-field"
                    placeholder="Ex: AMI-2024-001"
                  />
                  {errors.reference && <p className="text-red-500 text-xs mt-1">{errors.reference.message}</p>}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="label-field">Objet / Intitulé du dossier *</label>
                <input
                  {...register('title', { required: 'Champ obligatoire' })}
                  className="input-field"
                  placeholder="Intitulé complet du dossier"
                />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
              </div>

              {/* Client + Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-field">Client / Organisme *</label>
                  <input
                    {...register('client', { required: 'Champ obligatoire' })}
                    className="input-field"
                    placeholder="Nom du client"
                  />
                  {errors.client && <p className="text-red-500 text-xs mt-1">{errors.client.message}</p>}
                </div>
                <div>
                  <label className="label-field">Date de soumission *</label>
                  <input
                    type="date"
                    {...register('submission_date', { required: 'Champ obligatoire' })}
                    className="input-field"
                  />
                  {errors.submission_date && <p className="text-red-500 text-xs mt-1">{errors.submission_date.message}</p>}
                </div>
              </div>

              {/* Service line + Responsible */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-field">Ligne de service *</label>
                  <select {...register('service_line', { required: 'Champ obligatoire' })} className="input-field">
                    <option value="">— Choisir —</option>
                    {SERVICE_LINES.map(sl => (
                      <option key={sl} value={sl}>{SERVICE_LINE_LABELS[sl]}</option>
                    ))}
                  </select>
                  {errors.service_line && <p className="text-red-500 text-xs mt-1">{errors.service_line.message}</p>}
                </div>
                <div>
                  <label className="label-field">Responsable du dossier</label>
                  <select {...register('responsible_employee_id')} className="input-field">
                    <option value="">— Non assigné —</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Statut */}
              <div>
                <label className="label-field">Statut *</label>
                <select {...register('status', { required: true })} className="input-field">
                  <option value="EN_COURS">En cours</option>
                  <option value="GAGNE">Gagné (Win)</option>
                  <option value="PERDU">Perdu (Loss)</option>
                </select>
              </div>

              {/* Win fields */}
              {watchStatus === 'GAGNE' && (
                <div className="p-4 bg-green-50 rounded-xl border border-green-200 space-y-4">
                  <p className="text-sm font-semibold text-green-800">Informations du contrat gagné</p>
                  <div>
                    <label className="label-field">Montant du contrat (FCFA) *</label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      {...register('contract_amount', {
                        required: watchStatus === 'GAGNE' ? 'Obligatoire si statut Gagné' : false,
                      })}
                      className="input-field"
                      placeholder="Ex: 15000000"
                    />
                    {errors.contract_amount && <p className="text-red-500 text-xs mt-1">{errors.contract_amount.message}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label-field">Date de début *</label>
                      <input
                        type="date"
                        {...register('contract_start_date', {
                          required: watchStatus === 'GAGNE' ? 'Obligatoire si statut Gagné' : false,
                        })}
                        className="input-field"
                      />
                      {errors.contract_start_date && <p className="text-red-500 text-xs mt-1">{errors.contract_start_date.message}</p>}
                    </div>
                    <div>
                      <label className="label-field">Date de fin *</label>
                      <input
                        type="date"
                        {...register('contract_end_date', {
                          required: watchStatus === 'GAGNE' ? 'Obligatoire si statut Gagné' : false,
                        })}
                        className="input-field"
                      />
                      {errors.contract_end_date && <p className="text-red-500 text-xs mt-1">{errors.contract_end_date.message}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-brand-700 text-white rounded-lg hover:bg-brand-800"
                >
                  {editItem ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
