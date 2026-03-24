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
  BriefcaseIcon,
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

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      const params = buildParams(activeTab);
      const response = await api.get(`/commercial/export/${format}`, {
        params,
        responseType: 'blob',
      });
      const ext = format === 'excel' ? 'xlsx' : 'pdf';
      const mimeType = format === 'excel'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/pdf';
      const blob = new Blob([response.data], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporting_commercial_${activeTab.toLowerCase()}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Erreur lors de l\'export');
    }
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
            className="input text-sm py-1.5 w-auto"
          >
            <option value="">Tous les statuts</option>
            <option value="EN_COURS">En cours</option>
            <option value="GAGNE">Gagné</option>
            <option value="PERDU">Perdu</option>
          </select>

          <select
            value={filterServiceLine}
            onChange={e => setFilterServiceLine(e.target.value)}
            className="input text-sm py-1.5 w-auto"
          >
            <option value="">Toutes les lignes</option>
            {SERVICE_LINES.map(sl => (
              <option key={sl} value={sl}>{SERVICE_LINE_LABELS[sl]}</option>
            ))}
          </select>

          <select
            value={filterYear}
            onChange={e => { setFilterYear(e.target.value); setFilterQuarter(''); setFilterMonth(''); }}
            className="input text-sm py-1.5 w-auto"
          >
            <option value="">Toutes les années</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          {filterYear && (
            <>
              <select
                value={filterQuarter}
                onChange={e => { setFilterQuarter(e.target.value); setFilterMonth(''); }}
                className="input text-sm py-1.5 w-auto"
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
                  className="input text-sm py-1.5 w-auto"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 max-h-[92vh] flex flex-col">

            {/* Header coloré */}
            <div className="flex items-center justify-between px-6 py-5 bg-navy-800 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-brand-600 rounded-lg flex items-center justify-center">
                  <BriefcaseIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">
                    {editItem ? 'Modifier la soumission' : 'Nouvelle soumission'}
                  </h3>
                  <p className="text-xs text-white/50">Remplissez tous les champs obligatoires *</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="text-white/40 hover:text-white transition-colors">
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto flex-1">
              <div className="p-6 space-y-6">

                {/* Section 1 — Identification */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Identification du dossier
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Type *</label>
                      <select {...register('type', { required: true })} className="input">
                        <option value="AMI">AMI — Avis à Manifestation d'Intérêt</option>
                        <option value="APPEL_OFFRE">Appel d'offre</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Numéro de référence *</label>
                      <input
                        {...register('reference', { required: 'Champ obligatoire' })}
                        className="input"
                        placeholder="Ex : AMI-2024-001"
                      />
                      {errors.reference && <p className="text-red-500 text-xs mt-1">{errors.reference.message}</p>}
                    </div>
                    <div className="sm:col-span-2">
                      <label className="label">Objet / Intitulé du dossier *</label>
                      <input
                        {...register('title', { required: 'Champ obligatoire' })}
                        className="input"
                        placeholder="Intitulé complet du marché ou de la mission"
                      />
                      {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
                    </div>
                  </div>
                </div>

                <hr className="border-gray-100" />

                {/* Section 2 — Client & Dates */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Client & Soumission
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Client / Organisme *</label>
                      <input
                        {...register('client', { required: 'Champ obligatoire' })}
                        className="input"
                        placeholder="Nom de l'organisme"
                      />
                      {errors.client && <p className="text-red-500 text-xs mt-1">{errors.client.message}</p>}
                    </div>
                    <div>
                      <label className="label">Date de soumission *</label>
                      <input
                        type="date"
                        {...register('submission_date', { required: 'Champ obligatoire' })}
                        className="input"
                      />
                      {errors.submission_date && <p className="text-red-500 text-xs mt-1">{errors.submission_date.message}</p>}
                    </div>
                  </div>
                </div>

                <hr className="border-gray-100" />

                {/* Section 3 — Affectation */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Affectation interne
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Ligne de service *</label>
                      <select {...register('service_line', { required: 'Champ obligatoire' })} className="input">
                        <option value="">— Sélectionner —</option>
                        {SERVICE_LINES.map(sl => (
                          <option key={sl} value={sl}>{SERVICE_LINE_LABELS[sl]}</option>
                        ))}
                      </select>
                      {errors.service_line && <p className="text-red-500 text-xs mt-1">{errors.service_line.message}</p>}
                    </div>
                    <div>
                      <label className="label">Responsable du dossier</label>
                      <select {...register('responsible_employee_id')} className="input">
                        <option value="">— Non assigné —</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.id}>
                            {emp.first_name} {emp.last_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <hr className="border-gray-100" />

                {/* Section 4 — Statut */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Résultat
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    {(['EN_COURS', 'GAGNE', 'PERDU'] as SubmissionStatus[]).map(s => {
                      const checked = watchStatus === s;
                      const styles = {
                        EN_COURS: checked ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-gray-200 text-gray-600 hover:border-blue-300',
                        GAGNE:    checked ? 'border-green-500 bg-green-50 text-green-800' : 'border-gray-200 text-gray-600 hover:border-green-300',
                        PERDU:    checked ? 'border-red-400 bg-red-50 text-red-800' : 'border-gray-200 text-gray-600 hover:border-red-300',
                      };
                      const labels = { EN_COURS: 'En cours', GAGNE: 'Gagné (Win)', PERDU: 'Perdu (Loss)' };
                      const icons = {
                        EN_COURS: <ClockIcon className="w-4 h-4" />,
                        GAGNE: <TrophyIcon className="w-4 h-4" />,
                        PERDU: <XCircleIcon className="w-4 h-4" />,
                      };
                      return (
                        <label
                          key={s}
                          className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all font-medium text-sm ${styles[s]}`}
                        >
                          <input type="radio" value={s} {...register('status')} className="hidden" />
                          {icons[s]}
                          {labels[s]}
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Section Win — conditionnelle */}
                {watchStatus === 'GAGNE' && (
                  <div className="rounded-xl border-2 border-green-200 bg-green-50 p-5 space-y-4">
                    <div className="flex items-center gap-2 mb-1">
                      <TrophyIcon className="w-4 h-4 text-green-600" />
                      <p className="text-sm font-semibold text-green-800">Détails du contrat gagné</p>
                    </div>
                    <div>
                      <label className="label">Montant du contrat (FCFA) *</label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        {...register('contract_amount', {
                          required: watchStatus === 'GAGNE' ? 'Obligatoire si statut Gagné' : false,
                        })}
                        className="input"
                        placeholder="Ex : 15 000 000"
                      />
                      {errors.contract_amount && <p className="text-red-500 text-xs mt-1">{errors.contract_amount.message}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">Date de début *</label>
                        <input
                          type="date"
                          {...register('contract_start_date', {
                            required: watchStatus === 'GAGNE' ? 'Obligatoire si statut Gagné' : false,
                          })}
                          className="input"
                        />
                        {errors.contract_start_date && <p className="text-red-500 text-xs mt-1">{errors.contract_start_date.message}</p>}
                      </div>
                      <div>
                        <label className="label">Date de fin *</label>
                        <input
                          type="date"
                          {...register('contract_end_date', {
                            required: watchStatus === 'GAGNE' ? 'Obligatoire si statut Gagné' : false,
                          })}
                          className="input"
                        />
                        {errors.contract_end_date && <p className="text-red-500 text-xs mt-1">{errors.contract_end_date.message}</p>}
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                >
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  {editItem ? 'Enregistrer les modifications' : 'Créer la soumission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
