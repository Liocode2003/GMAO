import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import {
  DocumentArrowDownIcon, PlusIcon, PencilIcon, CheckCircleIcon, TrashIcon,
  CalculatorIcon, DocumentTextIcon, ChevronLeftIcon, ChevronRightIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { TableSkeletonRows } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import { useModalEscape } from '../../components/ui/useModalEscape';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Payslip {
  id: string;
  employee_id: string;
  period_year: number;
  period_month: number;
  gross_salary: string;
  net_salary: string;
  igr: string;
  status: 'BROUILLON' | 'PUBLIE';
  matricule: string;
  first_name: string;
  last_name: string;
  grade: string;
  service_line: string;
  created_at: string;
}

interface Employee { id: string; matricule: string; first_name: string; last_name: string; salary?: string; children_count?: number; marital_status?: string; }

interface CalcResult {
  gross_salary: number;
  cnss_employee: number;
  amo_employee: number;
  cimr_employee: number;
  professional_deduction: number;
  net_taxable_monthly: number;
  family_charge_deduction: number;
  igr: number;
  net_salary: number;
  cnss_employer: number;
  amo_employer: number;
  cimr_employer: number;
}

const MONTHS = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

const fmt = (n: string | number) =>
  Number(n).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── Composant principal ──────────────────────────────────────────────────────

export default function PayslipsPage() {
  const { user } = useAuthStore();
  const isDRH = user?.role === 'DRH';

  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Payslip | null>(null);

  const fetchPayslips = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { year: String(filterYear) };
      if (filterMonth) params.month = String(filterMonth);
      const { data } = await api.get('/payslips', { params });
      setPayslips(Array.isArray(data) ? data : []);
    } catch {
      setPayslips([]);
    } finally {
      setLoading(false);
    }
  }, [filterYear, filterMonth]);

  useEffect(() => { fetchPayslips(); }, [fetchPayslips]);

  const handlePublish = async (id: string) => {
    if (!confirm('Publier ce bulletin ? Les collaborateurs pourront le télécharger.')) return;
    await api.patch(`/payslips/${id}/publish`);
    toast.success('Bulletin publié');
    fetchPayslips();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce brouillon ?')) return;
    await api.delete(`/payslips/${id}`);
    toast.success('Brouillon supprimé');
    fetchPayslips();
  };

  const handleDownload = async (id: string, fname: string) => {
    const res = await api.get(`/payslips/${id}/pdf`, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url; a.download = fname || 'bulletin.pdf'; a.click();
    URL.revokeObjectURL(url);
  };

  const years = Array.from({ length: new Date().getFullYear() - 2022 + 1 }, (_, i) => 2022 + i);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Paie</h2>
          <p className="text-gray-500 text-sm">Gestion des bulletins de paie — CNSS · IUTS</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={filterYear} onChange={e => setFilterYear(+e.target.value)} className="input w-28">
            {years.map(y => <option key={y}>{y}</option>)}
          </select>
          <select value={filterMonth} onChange={e => setFilterMonth(+e.target.value)} className="input w-36">
            <option value={0}>Tous les mois</option>
            {MONTHS.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
          {isDRH && (
            <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary gap-2">
              <PlusIcon className="w-4 h-4" /> Nouveau bulletin
            </button>
          )}
        </div>
      </div>

      {/* Bulletins */}
      <div className="card overflow-x-auto p-0">
          <table className="table">
            <thead>
              <tr>
                <th>Collaborateur</th>
                <th>Période</th>
                <th className="text-right">Brut</th>
                <th className="text-right">Net</th>
                <th className="text-right">IUTS</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonRows cols={7} rows={5} />
              ) : payslips.length === 0 ? (
                <tr><td colSpan={7}>
                  <EmptyState
                    icon={DocumentTextIcon}
                    title="Aucun bulletin pour cette période"
                    description="Sélectionnez une autre période ou créez un nouveau bulletin"
                    action={isDRH ? { label: '+ Nouveau bulletin', onClick: () => { setEditing(null); setShowForm(true); } } : undefined}
                  />
                </td></tr>
              ) : payslips.map(ps => (
                <tr key={ps.id}>
                  <td>
                    <div className="font-medium text-gray-800">{ps.last_name} {ps.first_name}</div>
                    <div className="text-xs text-gray-500">{ps.matricule} — {ps.service_line}</div>
                  </td>
                  <td className="font-medium">{MONTHS[ps.period_month]} {ps.period_year}</td>
                  <td className="text-right font-mono text-sm">{fmt(ps.gross_salary)}</td>
                  <td className="text-right font-mono text-sm font-semibold text-brand-700">{fmt(ps.net_salary)}</td>
                  <td className="text-right font-mono text-sm text-red-600">{fmt(ps.igr)}</td>
                  <td>
                    <span className={`badge ${ps.status === 'PUBLIE' ? 'badge-green' : 'badge-gray'}`}>
                      {ps.status === 'PUBLIE' ? 'Publié' : 'Brouillon'}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleDownload(ps.id, `bulletin_${ps.matricule}_${ps.period_year}_${String(ps.period_month).padStart(2,'0')}.pdf`)}
                        className="p-1.5 text-gray-400 hover:text-brand-700 hover:bg-brand-50 rounded"
                        title="Télécharger PDF"
                      >
                        <DocumentArrowDownIcon className="w-4 h-4" />
                      </button>
                      {isDRH && ps.status === 'BROUILLON' && (
                        <>
                          <button onClick={() => { setEditing(ps); setShowForm(true); }}
                            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded" title="Modifier">
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button onClick={() => handlePublish(ps.id)}
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded" title="Publier">
                            <CheckCircleIcon className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(ps.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Supprimer">
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      </div>

      {showForm && isDRH && (
        <PayslipModal
          editing={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); fetchPayslips(); }}
        />
      )}
    </div>
  );
}

// ─── Modal Formulaire — Stepper 3 étapes ─────────────────────────────────────

const STEPPER_LABELS = ['Identification', 'Rémunérations', 'Déductions & Calcul'];

function PayslipModal({ editing, onClose, onSaved }: { editing: Payslip | null; onClose: () => void; onSaved: () => void; }) {
  useModalEscape(onClose);
  const [step, setStep] = useState(0);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [saving, setSaving] = useState(false);
  const [calc, setCalc] = useState<CalcResult | null>(null);
  const [calculating, setCalculating] = useState(false);

  const [form, setForm] = useState({
    employee_id: editing?.employee_id || '',
    period_year: editing?.period_year || new Date().getFullYear(),
    period_month: editing?.period_month || new Date().getMonth() + 1,
    base_salary: '',
    transport_allowance: '0',
    meal_allowance: '0',
    overtime_pay: '0',
    prime_label: '',
    prime_amount: '0',
    other_earnings_label: '',
    other_earnings_amount: '0',
    cimr_rate: '0',
    family_charges: '0',
    advance_amount: '0',
    other_deduction_label: '',
    other_deduction_amount: '0',
  });

  useEffect(() => {
    api.get('/employees', { params: { limit: 500, status: 'ACTIF' } })
      .then(r => {
        const list = r.data?.data ?? r.data?.employees ?? r.data;
        setEmployees(Array.isArray(list) ? list : []);
      })
      .catch(() => setEmployees([]));
  }, []);

  useEffect(() => {
    if (!form.employee_id) return;
    const emp = employees.find(e => e.id === form.employee_id);
    if (emp?.salary) setForm(f => ({ ...f, base_salary: String(parseFloat(emp.salary!)) }));
    if (emp?.children_count !== undefined) {
      const charges = emp.children_count + (emp.marital_status === 'MARIE' ? 1 : 0);
      setForm(f => ({ ...f, family_charges: String(charges) }));
    }
  }, [form.employee_id, employees]);

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const canNext = () => {
    if (step === 0) return !!form.employee_id;
    if (step === 1) return !!form.base_salary && parseFloat(form.base_salary) > 0;
    return true;
  };

  const handleCompute = async () => {
    setCalculating(true);
    try {
      const { data } = await api.post('/payslips/preview', form);
      setCalc(data);
    } finally {
      setCalculating(false);
    }
  };

  const handleSave = async () => {
    if (!form.employee_id || !form.base_salary) { toast.error('Employé et salaire de base requis'); return; }
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/payslips/${editing.id}`, form);
        toast.success('Bulletin mis à jour');
      } else {
        await api.post('/payslips', form);
        toast.success('Bulletin créé (brouillon)');
      }
      onSaved();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      toast.error(e?.response?.data?.error || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog" aria-modal="true" aria-labelledby="payslip-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-fade-in flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h3 id="payslip-modal-title" className="text-lg font-semibold text-gray-800">
            {editing ? 'Modifier le bulletin' : 'Nouveau bulletin de paie'}
          </h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100" aria-label="Fermer">✕</button>
        </div>

        {/* Stepper */}
        <div className="px-6 pt-4 flex-shrink-0">
          <div className="flex items-center gap-0">
            {STEPPER_LABELS.map((label, i) => (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    i < step ? 'bg-green-500 text-white' : i === step ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-400'
                  }`}>
                    {i < step ? <CheckCircleIcon className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-brand-600' : i < step ? 'text-green-600' : 'text-gray-400'}`}>
                    {label}
                  </span>
                </div>
                {i < STEPPER_LABELS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-3 ${i < step ? 'bg-green-400' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Étape 1 : Identification */}
          {step === 0 && (
            <div className="space-y-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Collaborateur & période</p>
              <div>
                <label className="label" htmlFor="ps-employee">Employé *</label>
                <select id="ps-employee" className="input" value={form.employee_id} onChange={f('employee_id')} disabled={!!editing}>
                  <option value="">— Sélectionner un collaborateur —</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.last_name} {e.first_name} ({e.matricule})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label" htmlFor="ps-month">Mois *</label>
                  <select id="ps-month" className="input" value={form.period_month} onChange={f('period_month')} disabled={!!editing}>
                    {MONTHS.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="ps-year">Année *</label>
                  <select id="ps-year" className="input" value={form.period_year} onChange={f('period_year')} disabled={!!editing}>
                    {[2023, 2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Étape 2 : Rémunérations */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Éléments de rémunération (FCFA)</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="label" htmlFor="ps-base">Salaire de base *</label>
                  <input id="ps-base" type="number" className="input" placeholder="0.00" step="0.01" min="0" value={form.base_salary} onChange={f('base_salary')} />
                </div>
                <div>
                  <label className="label">Ind. transport</label>
                  <input type="number" className="input" placeholder="0.00" step="0.01" min="0" value={form.transport_allowance} onChange={f('transport_allowance')} />
                </div>
                <div>
                  <label className="label">Ind. repas</label>
                  <input type="number" className="input" placeholder="0.00" step="0.01" min="0" value={form.meal_allowance} onChange={f('meal_allowance')} />
                </div>
                <div>
                  <label className="label">Heures supp.</label>
                  <input type="number" className="input" placeholder="0.00" step="0.01" min="0" value={form.overtime_pay} onChange={f('overtime_pay')} />
                </div>
                <div>
                  <label className="label">Prime (montant)</label>
                  <input type="number" className="input" placeholder="0.00" step="0.01" min="0" value={form.prime_amount} onChange={f('prime_amount')} />
                </div>
                <div>
                  <label className="label">Prime (libellé)</label>
                  <input type="text" className="input" placeholder="Ex: Prime objectif" value={form.prime_label} onChange={f('prime_label')} />
                </div>
                <div>
                  <label className="label">Autre gain (montant)</label>
                  <input type="number" className="input" placeholder="0.00" step="0.01" min="0" value={form.other_earnings_amount} onChange={f('other_earnings_amount')} />
                </div>
                <div>
                  <label className="label">Autre gain (libellé)</label>
                  <input type="text" className="input" placeholder="Ex: Bonus annuel" value={form.other_earnings_label} onChange={f('other_earnings_label')} />
                </div>
              </div>
            </div>
          )}

          {/* Étape 3 : Déductions & Calcul */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Paramètres de paie & retenues</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="label">Taux CIMR (%)</label>
                  <input type="number" className="input" placeholder="0" step="0.5" min="0" max="10" value={form.cimr_rate} onChange={f('cimr_rate')} />
                </div>
                <div>
                  <label className="label">Charges de famille</label>
                  <input type="number" className="input" placeholder="0" step="1" min="0" max="6" value={form.family_charges} onChange={f('family_charges')} />
                  <p className="text-xs text-gray-400 mt-0.5">Conjoints + enfants</p>
                </div>
                <div>
                  <label className="label">Avance sur salaire</label>
                  <input type="number" className="input" placeholder="0.00" step="0.01" min="0" value={form.advance_amount} onChange={f('advance_amount')} />
                </div>
                <div>
                  <label className="label">Autre retenue (montant)</label>
                  <input type="number" className="input" placeholder="0.00" step="0.01" min="0" value={form.other_deduction_amount} onChange={f('other_deduction_amount')} />
                </div>
                <div className="col-span-2 sm:col-span-4">
                  <label className="label">Autre retenue (libellé)</label>
                  <input type="text" className="input" placeholder="Ex: Saisie sur salaire" value={form.other_deduction_label} onChange={f('other_deduction_label')} />
                </div>
              </div>

              <button onClick={handleCompute} disabled={calculating} className="btn-secondary gap-2 w-full justify-center">
                <CalculatorIcon className="w-4 h-4" />
                {calculating ? 'Calcul en cours...' : 'Calculer la paie'}
              </button>

              {calc && (
                <div className="bg-gradient-to-br from-navy-800 to-brand-700 rounded-xl p-4 text-white">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-3">Résultat du calcul</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-3">
                    <CalcCard label="Salaire brut" value={fmt(calc.gross_salary)} />
                    <CalcCard label="CNSS (5,5%)" value={`− ${fmt(calc.cnss_employee)}`} red />
                    <CalcCard label="IUTS" value={`− ${fmt(calc.igr)}`} red />
                    {calc.cimr_employee > 0 && <CalcCard label="CIMR salarié" value={`− ${fmt(calc.cimr_employee)}`} red />}
                    <CalcCard label="Base imposable" value={fmt(calc.net_taxable_monthly)} small />
                    <CalcCard label="Déd. prof. (20%)" value={fmt(calc.professional_deduction)} small />
                    <CalcCard label="Déd. famille" value={`${fmt(calc.family_charge_deduction)}/mois`} small />
                  </div>
                  <div className="border-t border-white/20 pt-3 flex items-center justify-between">
                    <span className="text-sm text-white/80">NET À PAYER</span>
                    <span className="text-2xl font-bold">{fmt(calc.net_salary)} FCFA</span>
                  </div>
                  <p className="text-xs text-white/50 mt-2">
                    Charges patronales : {fmt(calc.cnss_employer + calc.cimr_employer)} FCFA
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={step === 0 ? onClose : () => setStep(s => s - 1)}
            className="btn-secondary gap-1.5"
          >
            {step === 0 ? 'Annuler' : <><ChevronLeftIcon className="w-4 h-4" /> Retour</>}
          </button>
          {step < 2 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!canNext()} className="btn-primary gap-1.5">
              Suivant <ChevronRightIcon className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSave} disabled={saving || !form.base_salary || !form.employee_id} className="btn-primary">
              {saving ? 'Enregistrement...' : 'Enregistrer (brouillon)'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CalcCard({ label, value, red, small }: { label: string; value: string; red?: boolean; small?: boolean }) {
  return (
    <div className="bg-white/10 rounded-lg p-2">
      <p className={`${small ? 'text-[10px]' : 'text-xs'} text-white/60`}>{label}</p>
      <p className={`font-semibold ${small ? 'text-xs' : 'text-sm'} ${red ? 'text-red-300' : 'text-white'}`}>{value}</p>
    </div>
  );
}
