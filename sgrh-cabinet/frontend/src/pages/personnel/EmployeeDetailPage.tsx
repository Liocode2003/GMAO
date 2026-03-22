import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { Employee, SERVICE_LINE_LABELS, GRADE_LABELS, CONTRACT_LABELS, FUNCTION_LABELS } from '../../types';
import { useAuthStore } from '../../store/authStore';
import {
  ArrowLeftIcon, PencilIcon, NoSymbolIcon, ClockIcon,
  UserIcon, BriefcaseIcon, AcademicCapIcon,
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
  const [activeTab, setActiveTab] = useState<'info' | 'history'>('info');
  const [loading, setLoading] = useState(true);
  const [deactivating, setDeactivating] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [exitDate, setExitDate] = useState(new Date().toISOString().split('T')[0]);

  const canManage = ['DRH', 'DIRECTION_GENERALE'].includes(user?.role || '');
  const canViewSalary = ['DRH', 'DIRECTION_GENERALE', 'ASSOCIE'].includes(user?.role || '');

  useEffect(() => {
    Promise.all([
      api.get(`/employees/${id}`),
      canManage ? api.get(`/employees/${id}/history`) : Promise.resolve({ data: [] }),
    ]).then(([empRes, histRes]) => {
      setEmployee(empRes.data);
      setHistory(histRes.data);
    }).finally(() => setLoading(false));
  }, [id, canManage]);

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

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" />
    </div>
  );

  if (!employee) return <div className="text-center py-12 text-gray-500">Collaborateur non trouvé</div>;

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
        {canManage && (
          <div className="flex gap-2">
            <button onClick={() => navigate(`/personnel/${id}/modifier`)} className="btn-secondary gap-2">
              <PencilIcon className="w-4 h-4" /> Modifier
            </button>
            {employee.status === 'ACTIF' && (
              <button onClick={() => setShowDeactivateModal(true)} className="btn-danger gap-2">
                <NoSymbolIcon className="w-4 h-4" /> Désactiver
              </button>
            )}
          </div>
        )}
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
          <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {employee.first_name[0]}{employee.last_name[0]}
          </div>
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
        {[
          { id: 'info', icon: UserIcon, label: 'Informations' },
          { id: 'history', icon: ClockIcon, label: 'Historique' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'info' | 'history')}
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
            {canViewSalary && employee.salary && (
              <Field label="Salaire" value={new Intl.NumberFormat('fr-FR').format(employee.salary) + ' FCFA'} sensitive />
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
                      <p className="text-xs text-gray-400 mt-0.5">Par: {h.changed_by_name}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
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
