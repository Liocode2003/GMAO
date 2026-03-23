import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import {
  Employee, SalaryHistory, Leave, LeaveBalance,
  SERVICE_LINE_LABELS, GRADE_LABELS, CONTRACT_LABELS, FUNCTION_LABELS, MARITAL_STATUS_LABELS,
  LEAVE_STATUS_LABELS, ABSENCE_SUBTYPE_LABELS,
} from '../../types';
import { useAuthStore } from '../../store/authStore';
import {
  ArrowLeftIcon, PencilIcon, NoSymbolIcon, ClockIcon,
  UserIcon, BriefcaseIcon, AcademicCapIcon, CurrencyDollarIcon,
  DocumentArrowDownIcon, CalendarDaysIcon, PlusIcon, CheckIcon, XMarkIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface HistoryEntry {
  id: string;
  field_name: string;
  old_value: string;
  new_value: string;
  changed_by_name: string;
  created_at: string;
}

const Field = ({ label, value, sensitive }: { label: string; value?: React.ReactNode; sensitive?: boolean }) => (
  <div className="py-2 border-b border-gray-50 last:border-0">
    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
    <p className={`text-sm mt-0.5 font-medium ${sensitive ? 'text-amber-700' : 'text-gray-800'}`}>
      {value ?? <span className="text-gray-300 font-normal">—</span>}
    </p>
  </div>
);

export default function EmployeeDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuthStore();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [salaryHistory, setSalaryHistory] = useState<SalaryHistory[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'history' | 'salary' | 'leaves'>('info');
  const [loading, setLoading] = useState(true);
  const [deactivating, setDeactivating] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [exitDate, setExitDate] = useState(new Date().toISOString().split('T')[0]);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    type: 'PLANIFIE', absence_subtype: '', start_date: '', end_date: '', notes: '',
  });
  const [submittingLeave, setSubmittingLeave] = useState(false);

  const canManage = ['DRH', 'DIRECTION_GENERALE'].includes(user?.role || '');
  const canViewSalary = ['DRH', 'DIRECTION_GENERALE', 'ASSOCIE'].includes(user?.role || '');
  const canManageLeaves = ['DRH', 'DIRECTION_GENERALE', 'MANAGER'].includes(user?.role || '');

  const loadLeaves = async () => {
    const year = new Date().getFullYear();
    const [leavesRes, balRes] = await Promise.all([
      api.get(`/leaves/employee/${id}?year=${year}`),
      api.get(`/leaves/employee/${id}/balance?year=${year}`),
    ]);
    setLeaves((leavesRes as { data: Leave[] }).data);
    setLeaveBalance((balRes as { data: LeaveBalance }).data);
  };

  useEffect(() => {
    const requests: Promise<unknown>[] = [
      api.get(`/employees/${id}`),
      canManage ? api.get(`/employees/${id}/history`) : Promise.resolve({ data: [] }),
      canViewSalary ? api.get(`/employees/${id}/salary-history`) : Promise.resolve({ data: [] }),
    ];

    Promise.all(requests).then(([empRes, histRes, salaryRes]) => {
      setEmployee((empRes as { data: Employee }).data);
      setHistory((histRes as { data: HistoryEntry[] }).data);
      setSalaryHistory((salaryRes as { data: SalaryHistory[] }).data);
    }).finally(() => setLoading(false));

    loadLeaves();
  }, [id, canManage, canViewSalary]);

  const handleSubmitLeave = async () => {
    if (!leaveForm.start_date || !leaveForm.end_date) {
      toast.error('Dates obligatoires'); return;
    }
    setSubmittingLeave(true);
    try {
      await api.post(`/leaves/employee/${id}`, leaveForm);
      toast.success('Congé enregistré');
      setShowLeaveForm(false);
      setLeaveForm({ type: 'PLANIFIE', absence_subtype: '', start_date: '', end_date: '', notes: '' });
      await loadLeaves();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || 'Erreur lors de l\'enregistrement');
    } finally {
      setSubmittingLeave(false);
    }
  };

  const handleApproveLeave = async (leaveId: string, status: 'APPROUVE' | 'REFUSE') => {
    try {
      await api.patch(`/leaves/${leaveId}/approve`, { status });
      toast.success(status === 'APPROUVE' ? 'Congé approuvé' : 'Congé refusé');
      await loadLeaves();
    } catch {
      toast.error('Erreur');
    }
  };

  const handleDeleteLeave = async (leaveId: string) => {
    try {
      await api.delete(`/leaves/${leaveId}`);
      toast.success('Congé supprimé');
      await loadLeaves();
    } catch {
      toast.error('Erreur');
    }
  };

  const handleDeactivate = async () => {
    setDeactivating(true);
    try {
      await api.patch(`/employees/${id}/deactivate`, { exit_date: exitDate });
      toast.success('Collaborateur désactivé');
      setEmployee(prev => prev ? { ...prev, status: 'INACTIF', exit_date: exitDate } : prev);
      setShowDeactivateModal(false);
    } finally {
      setDeactivating(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      const res = await api.get(`/employees/${id}/export/pdf`, { responseType: 'blob' });
      const blob = new Blob([res.data as BlobPart], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `fiche_${employee?.matricule || id}.pdf`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      toast.error('Erreur lors de l\'export PDF');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" />
    </div>
  );

  if (!employee) return <div className="text-center py-12 text-gray-500">Collaborateur non trouvé</div>;

  const tabs = [
    { id: 'info', icon: UserIcon, label: 'Informations' },
    { id: 'history', icon: ClockIcon, label: 'Historique' },
    ...(canViewSalary ? [{ id: 'salary', icon: CurrencyDollarIcon, label: 'Salaires' }] : []),
    { id: 'leaves', icon: CalendarDaysIcon, label: 'Congés' },
  ];

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="btn-secondary p-2">
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {employee.last_name} {employee.first_name}
            </h2>
            <p className="text-gray-500 text-sm font-mono">{employee.matricule}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <button onClick={handleExportPDF} className="btn-secondary gap-2 text-sm">
            <DocumentArrowDownIcon className="w-4 h-4" />
            PDF
          </button>
          {canManage && (
            <>
              <button onClick={() => navigate(`/personnel/${id}/modifier`)} className="btn-secondary gap-2">
                <PencilIcon className="w-4 h-4" /> Modifier
              </button>
              {employee.status === 'ACTIF' && (
                <button onClick={() => setShowDeactivateModal(true)} className="btn-danger gap-2">
                  <NoSymbolIcon className="w-4 h-4" /> Désactiver
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Status banner */}
      {employee.status === 'INACTIF' && (
        <div className="mb-4 p-3 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-600 flex items-center gap-2">
          <NoSymbolIcon className="w-4 h-4 text-gray-400" />
          Ce collaborateur est inactif depuis le {employee.exit_date ? new Date(employee.exit_date).toLocaleDateString('fr-FR') : '—'}
        </div>
      )}

      {/* Summary card */}
      <div className="card mb-6 bg-gradient-to-r from-navy-800 to-navy-900 text-white">
        <div className="flex items-start gap-4">
          {/* Photo ou initiales */}
          {employee.photo_url ? (
            <img
              src={employee.photo_url}
              alt={`${employee.first_name} ${employee.last_name}`}
              className="w-16 h-16 rounded-2xl object-cover flex-shrink-0 border-2 border-white/20"
            />
          ) : (
            <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
              {employee.first_name[0]}{employee.last_name[0]}
            </div>
          )}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-blue-300 text-xs">Grade</p>
              <p className="font-semibold text-sm">{GRADE_LABELS[employee.grade] || employee.grade}</p>
            </div>
            <div>
              <p className="text-blue-300 text-xs">Ligne de service</p>
              <p className="font-semibold text-sm">{SERVICE_LINE_LABELS[employee.service_line] || employee.service_line}</p>
            </div>
            <div>
              <p className="text-blue-300 text-xs">Contrat</p>
              <p className="font-semibold text-sm">{CONTRACT_LABELS[employee.contract_type] || employee.contract_type}</p>
            </div>
            <div>
              <p className="text-blue-300 text-xs">Ancienneté</p>
              <p className="font-semibold text-sm">{employee.seniority?.label || '—'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Onglet Informations */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Identité */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <UserIcon className="w-4 h-4 text-gray-400" />
              <h3 className="font-semibold text-gray-700">Identité</h3>
            </div>
            <Field label="Nom complet" value={`${employee.last_name} ${employee.first_name}`} />
            <Field label="Genre" value={employee.gender === 'M' ? 'Masculin' : 'Féminin'} />
            <Field label="Date de naissance" value={employee.birth_date ? new Date(employee.birth_date).toLocaleDateString('fr-FR') : undefined} />
            <Field label="Âge" value={employee.age ? `${employee.age} ans` : undefined} />
            <Field label="Email" value={employee.email} />
            <Field label="Téléphone" value={employee.phone} />
            <Field
              label="Situation matrimoniale"
              value={employee.marital_status ? MARITAL_STATUS_LABELS[employee.marital_status] || employee.marital_status : 'Célibataire'}
            />
            {employee.marital_status === 'MARIE' && (
              <>
                <Field label="Conjoint(e)" value={employee.spouse_name} />
                <Field label="Tél. conjoint(e)" value={employee.spouse_phone} />
              </>
            )}
            <Field label="Nombre d'enfants" value={employee.children_count != null ? String(employee.children_count) : '0'} />
          </div>

          {/* Poste */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <BriefcaseIcon className="w-4 h-4 text-gray-400" />
              <h3 className="font-semibold text-gray-700">Poste & Contrat</h3>
            </div>
            <Field label="Fonction" value={FUNCTION_LABELS[employee.function] || employee.function} />
            <Field label="Département" value={employee.department} />
            <Field label="Ligne de service" value={SERVICE_LINE_LABELS[employee.service_line]} />
            <Field label="Grade" value={GRADE_LABELS[employee.grade]} />
            <Field label="Type de contrat" value={CONTRACT_LABELS[employee.contract_type]} />
            <Field label="Saison" value={employee.season ? `${employee.season}` : undefined} />
            <Field label="Date d'entrée" value={new Date(employee.entry_date).toLocaleDateString('fr-FR')} />
            {employee.exit_date && <Field label="Date de sortie" value={new Date(employee.exit_date).toLocaleDateString('fr-FR')} />}
            <Field label="Statut" value={
              <span className={`badge ${employee.status === 'ACTIF' ? 'badge-green' : 'badge-gray'}`}>
                {employee.status}
              </span>
            } />
            {employee.manager_name && <Field label="Supérieur hiérarchique" value={employee.manager_name} />}
            {canViewSalary && employee.salary && (
              <Field label="Salaire actuel" value={new Intl.NumberFormat('fr-FR').format(employee.salary) + ' FCFA'} sensitive />
            )}
            <Field label="Expatrié" value={employee.is_expatriate ? 'Oui' : 'Non'} />
          </div>

          {/* Diplômes */}
          <div className="card md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <AcademicCapIcon className="w-4 h-4 text-gray-400" />
              <h3 className="font-semibold text-gray-700">Diplômes professionnels</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {employee.has_dec_french && <span className="badge badge-blue">DEC Français</span>}
              {employee.has_decofi && <span className="badge badge-blue">DECOFI</span>}
              {employee.has_other_dec && <span className="badge badge-blue">Autre DEC</span>}
              {employee.has_cisa && <span className="badge badge-green">CISA</span>}
              {employee.has_cfa && <span className="badge badge-green">CFA</span>}
              {!employee.has_dec_french && !employee.has_decofi && !employee.has_other_dec && !employee.has_cisa && !employee.has_cfa && (
                <p className="text-gray-400 text-sm">Aucun diplôme professionnel enregistré</p>
              )}
            </div>
          </div>

          {/* Notes */}
          {employee.notes && (
            <div className="card md:col-span-2">
              <h3 className="font-semibold text-gray-700 mb-2">Notes</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{employee.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Onglet Historique modifications */}
      {activeTab === 'history' && (
        <div className="card">
          <h3 className="font-semibold text-gray-700 mb-4">Historique des modifications</h3>
          {history.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Aucune modification enregistrée</p>
          ) : (
            <div className="space-y-3">
              {history.map((h) => (
                <div key={h.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-gray-800 capitalize">
                        {h.field_name.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-gray-400 flex-shrink-0">
                        {new Date(h.created_at).toLocaleString('fr-FR')}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      <span className="line-through text-red-400">{h.old_value || '—'}</span>
                      {' → '}
                      <span className="text-green-600 font-medium">{h.new_value || '—'}</span>
                    </p>
                    {h.changed_by_name && (
                      <p className="text-xs text-gray-400 mt-0.5">Par : {h.changed_by_name}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Onglet Historique salaires */}
      {activeTab === 'salary' && canViewSalary && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <CurrencyDollarIcon className="w-4 h-4 text-amber-500" />
            <h3 className="font-semibold text-gray-700">Historique des salaires</h3>
            <span className="text-xs text-gray-400 ml-1">— Confidentiel</span>
          </div>
          {salaryHistory.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Aucun historique de salaire</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Date d'effet</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 uppercase">Ancien salaire</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 uppercase">Nouveau salaire</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Modifié par</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {salaryHistory.map((s, idx) => (
                    <tr key={s.id} className={`border-b border-gray-50 ${idx === 0 ? 'bg-amber-50' : ''}`}>
                      <td className="py-3 px-3 text-gray-700 font-medium">
                        {new Date(s.effective_date).toLocaleDateString('fr-FR')}
                        {idx === 0 && <span className="ml-2 text-xs bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded">actuel</span>}
                      </td>
                      <td className="py-3 px-3 text-right text-gray-500">
                        {s.old_salary ? new Intl.NumberFormat('fr-FR').format(s.old_salary) + ' FCFA' : '—'}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-amber-700">
                        {new Intl.NumberFormat('fr-FR').format(s.new_salary)} FCFA
                        {s.old_salary && s.new_salary > s.old_salary && (
                          <span className="ml-1 text-xs text-green-600">
                            +{new Intl.NumberFormat('fr-FR').format(s.new_salary - s.old_salary)}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-gray-500 text-xs">{s.created_by_name || '—'}</td>
                      <td className="py-3 px-3 text-gray-400 text-xs">{s.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Onglet Congés */}
      {activeTab === 'leaves' && (
        <div className="space-y-4">
          {/* Solde */}
          {leaveBalance && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="card text-center">
                <p className="text-3xl font-bold text-brand-600">{leaveBalance.balance}</p>
                <p className="text-xs text-gray-500 mt-1">Solde disponible</p>
              </div>
              <div className="card text-center">
                <p className="text-3xl font-bold text-gray-700">{leaveBalance.days_taken}</p>
                <p className="text-xs text-gray-500 mt-1">Jours pris</p>
              </div>
              <div className="card text-center">
                <p className="text-3xl font-bold text-orange-500">{leaveBalance.days_unplanned}</p>
                <p className="text-xs text-gray-500 mt-1">Imprévus</p>
              </div>
              <div className={`card text-center ${leaveBalance.carry_over >= 0 ? '' : 'bg-red-50'}`}>
                <p className={`text-3xl font-bold ${leaveBalance.carry_over >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {leaveBalance.carry_over >= 0 ? '+' : ''}{leaveBalance.carry_over}
                </p>
                <p className="text-xs text-gray-500 mt-1">Report N-1</p>
              </div>
            </div>
          )}

          {/* Barre de progression */}
          {leaveBalance && (
            <div className="card">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Consommation annuelle</span>
                <span>{leaveBalance.days_taken} / {leaveBalance.annual_allowance + leaveBalance.carry_over} jours</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-brand-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (leaveBalance.days_taken / Math.max(leaveBalance.annual_allowance + leaveBalance.carry_over, 1)) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Bouton ajouter */}
          {canManageLeaves && (
            <div className="flex justify-end">
              <button onClick={() => setShowLeaveForm(true)} className="btn-primary gap-2 text-sm">
                <PlusIcon className="w-4 h-4" /> Ajouter un congé
              </button>
            </div>
          )}

          {/* Formulaire ajout */}
          {showLeaveForm && (
            <div className="card border-2 border-brand-200">
              <h4 className="font-semibold text-gray-700 mb-4">Nouveau congé / absence</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Type</label>
                  <select className="input" value={leaveForm.type}
                    onChange={e => setLeaveForm(f => ({ ...f, type: e.target.value }))}>
                    <option value="PLANIFIE">Congé planifié</option>
                    <option value="IMPRÉVU">Imprévu</option>
                  </select>
                </div>
                {leaveForm.type === 'IMPRÉVU' && (
                  <div>
                    <label className="label">Motif</label>
                    <select className="input" value={leaveForm.absence_subtype}
                      onChange={e => setLeaveForm(f => ({ ...f, absence_subtype: e.target.value }))}>
                      <option value="">— Sélectionner —</option>
                      <option value="MALADIE">Maladie</option>
                      <option value="DECES_FAMILLE">Décès famille</option>
                      <option value="URGENCE">Urgence</option>
                      <option value="AUTRE">Autre</option>
                    </select>
                  </div>
                )}
                <div>
                  <label className="label">Date début</label>
                  <input type="date" className="input" value={leaveForm.start_date}
                    onChange={e => setLeaveForm(f => ({ ...f, start_date: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Date fin</label>
                  <input type="date" className="input" value={leaveForm.end_date}
                    onChange={e => setLeaveForm(f => ({ ...f, end_date: e.target.value }))} />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Commentaire</label>
                  <input type="text" className="input" placeholder="Optionnel" value={leaveForm.notes}
                    onChange={e => setLeaveForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-2 mt-4 justify-end">
                <button onClick={() => setShowLeaveForm(false)} className="btn-secondary text-sm">Annuler</button>
                <button onClick={handleSubmitLeave} disabled={submittingLeave} className="btn-primary text-sm">
                  {submittingLeave ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </div>
          )}

          {/* Historique */}
          <div className="card">
            <h4 className="font-semibold text-gray-700 mb-4">Historique {new Date().getFullYear()}</h4>
            {leaves.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Aucun congé enregistré</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Début</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Fin</th>
                      <th className="text-center py-2 px-3 text-xs font-medium text-gray-500 uppercase">Jours</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Statut</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Commentaire</th>
                      {canManageLeaves && <th className="py-2 px-3" />}
                    </tr>
                  </thead>
                  <tbody>
                    {leaves.map(l => (
                      <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-2.5 px-3 text-gray-700">{new Date(l.start_date).toLocaleDateString('fr-FR')}</td>
                        <td className="py-2.5 px-3 text-gray-700">{new Date(l.end_date).toLocaleDateString('fr-FR')}</td>
                        <td className="py-2.5 px-3 text-center font-semibold text-gray-800">{l.days}</td>
                        <td className="py-2.5 px-3">
                          {l.type === 'PLANIFIE' ? (
                            <span className="badge badge-blue">Planifié</span>
                          ) : (
                            <span className="badge badge-orange">
                              {l.absence_subtype ? ABSENCE_SUBTYPE_LABELS[l.absence_subtype as keyof typeof ABSENCE_SUBTYPE_LABELS] || l.absence_subtype : 'Imprévu'}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`badge ${
                            l.status === 'APPROUVE' ? 'badge-green' :
                            l.status === 'REFUSE' ? 'badge-red' : 'badge-yellow'
                          }`}>
                            {LEAVE_STATUS_LABELS[l.status]}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-gray-400 text-xs">{l.notes || '—'}</td>
                        {canManageLeaves && (
                          <td className="py-2.5 px-3">
                            <div className="flex gap-1">
                              {l.status === 'EN_ATTENTE' && (
                                <>
                                  <button onClick={() => handleApproveLeave(l.id, 'APPROUVE')}
                                    className="p-1 text-green-600 hover:bg-green-50 rounded" title="Approuver">
                                    <CheckIcon className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => handleApproveLeave(l.id, 'REFUSE')}
                                    className="p-1 text-red-500 hover:bg-red-50 rounded" title="Refuser">
                                    <XMarkIcon className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              <button onClick={() => handleDeleteLeave(l.id)}
                                className="p-1 text-gray-400 hover:bg-gray-100 rounded" title="Supprimer">
                                <XMarkIcon className="w-3.5 h-3.5" />
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
        </div>
      )}

      {/* Deactivate Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Désactiver le collaborateur</h3>
            <p className="text-sm text-gray-500 mb-4">
              Cette action désactivera le compte de {employee.first_name} {employee.last_name}.
              Le collaborateur ne sera pas supprimé.
            </p>
            <div className="mb-4">
              <label className="label">Date de sortie</label>
              <input type="date" className="input" value={exitDate} onChange={(e) => setExitDate(e.target.value)} />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowDeactivateModal(false)} className="btn-secondary">Annuler</button>
              <button onClick={handleDeactivate} disabled={deactivating} className="btn-danger">
                {deactivating ? 'Traitement...' : 'Désactiver'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
