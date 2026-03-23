import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Employee, PaginatedResponse, ImportRow, SERVICE_LINE_LABELS, GRADE_LABELS, CONTRACT_LABELS } from '../../types';
import { useAuthStore } from '../../store/authStore';
import {
  PlusIcon, MagnifyingGlassIcon, FunnelIcon,
  EyeIcon, PencilIcon, XMarkIcon,
  ArrowUpTrayIcon, DocumentArrowDownIcon, TableCellsIcon,
  CheckCircleIcon, ExclamationCircleIcon, XCircleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const StatusBadge = ({ status }: { status: string }) => (
  <span className={`badge ${status === 'ACTIF' ? 'badge-green' : 'badge-gray'}`}>
    {status}
  </span>
);

const GenderBadge = ({ gender }: { gender: string }) => (
  <span className={`badge ${gender === 'M' ? 'badge-blue' : 'badge-purple'}`}>
    {gender === 'M' ? 'Homme' : 'Femme'}
  </span>
);

// Colonnes dans l'ordre du cahier des charges
const IMPORT_COLUMNS_DISPLAY = [
  'Matricule', 'Nom', 'Prénoms', 'Sexe', 'Date de naissance',
  'Situation matrimoniale', 'Nom conjoint', 'Tél conjoint', 'Nb enfants',
  'Email', 'Téléphone', 'Fonction', 'Grade', 'Ligne de service',
  "Type de contrat", "Date d'entrée", 'Date de sortie', 'Expatrié', 'Salaire',
];

// ============================================================
// Modal Import Excel
// ============================================================
function ImportModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload');
  const [parsing, setParsing] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [result, setResult] = useState<{ imported: number; failed: number; failedRows?: { matricule: unknown; error: string }[] } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [unknownColumns, setUnknownColumns] = useState<string[]>([]);

  const handleDownloadTemplate = () => {
    window.open('/api/employees/import/template', '_blank');
  };

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.xlsx')) {
      toast.error('Seuls les fichiers .xlsx sont acceptés');
      return;
    }
    setParsing(true);
    setUnknownColumns([]);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post('/employees/import/parse', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setRows(data.rows);
      if (data.unknownColumns?.length) setUnknownColumns(data.unknownColumns);
      setStep('preview');
    } catch {
      // handled by interceptor
    } finally {
      setParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleConfirm = async () => {
    const validRows = rows.filter(r => r.errors.length === 0);
    if (validRows.length === 0) { toast.error('Aucune ligne valide à importer'); return; }
    setExecuting(true);
    try {
      const { data } = await api.post('/employees/import/execute', { rows: validRows });
      setResult(data);
      setStep('done');
      if (data.imported > 0) onSuccess();
    } catch {
      // handled by interceptor
    } finally {
      setExecuting(false);
    }
  };

  const validCount = rows.filter(r => r.errors.length === 0).length;
  const errorCount = rows.filter(r => r.errors.length > 0).length;
  const allErrors = rows.filter(r => r.errors.length > 0).flatMap(r => r.errors);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Import Excel des collaborateurs</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {step === 'upload' && 'Sélectionnez un fichier .xlsx'}
              {step === 'preview' && `${rows.length} ligne(s) détectée(s) — ${validCount} valide(s), ${errorCount} en erreur`}
              {step === 'done' && 'Rapport d\'import'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Corps */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* Étape 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-5">
              <div
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
                  dragOver ? 'border-brand-400 bg-brand-50' : 'border-gray-300 hover:border-brand-300 hover:bg-gray-50'
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <ArrowUpTrayIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">Glisser-déposer un fichier .xlsx ici</p>
                <p className="text-gray-400 text-sm mt-1">ou cliquez pour sélectionner</p>
                <input ref={fileInputRef} type="file" accept=".xlsx" className="hidden"
                  onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
              </div>
              {parsing && (
                <div className="flex items-center justify-center gap-2 text-gray-500">
                  <div className="animate-spin w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full" />
                  Analyse en cours...
                </div>
              )}

              {/* Colonnes attendues */}
              <div className="p-4 bg-blue-50 rounded-xl">
                <p className="text-sm font-semibold text-blue-800 mb-3">
                  Colonnes attendues dans le fichier (dans cet ordre) :
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {IMPORT_COLUMNS_DISPLAY.map((col, i) => (
                    <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded font-mono">
                      {col}
                    </span>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-blue-200 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-blue-700">
                  <span>• Sexe : M ou F</span>
                  <span>• Situation matrimoniale : Célibataire / Marié(e) / Divorcé(e) / Veuf/Veuve</span>
                  <span>• Type de contrat : CDI / CDD / Stage / Consultant / Freelance</span>
                  <span>• Expatrié : Oui ou Non</span>
                  <span>• Dates : format JJ/MM/AAAA</span>
                  <span>• Grade / Ligne de service / Fonction : voir feuille 2 du modèle</span>
                </div>
              </div>

              {/* Bouton modèle */}
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2 text-sm text-brand-700 hover:text-brand-800 font-medium border border-brand-200 hover:border-brand-400 bg-brand-50 hover:bg-brand-100 px-4 py-2 rounded-lg transition-colors"
              >
                <DocumentArrowDownIcon className="w-4 h-4" />
                Télécharger le fichier modèle (.xlsx)
              </button>
            </div>
          )}

          {/* Étape 2: Aperçu */}
          {step === 'preview' && (
            <div className="space-y-4">
              {/* Résumé */}
              <div className="flex gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-sm text-gray-700 bg-gray-100 px-3 py-2 rounded-lg">
                  <TableCellsIcon className="w-4 h-4" />
                  {rows.length} ligne(s) au total
                </div>
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                  <CheckCircleIcon className="w-4 h-4" />
                  {validCount} valide(s) — seront importées
                </div>
                {errorCount > 0 && (
                  <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 px-3 py-2 rounded-lg">
                    <XCircleIcon className="w-4 h-4" />
                    {errorCount} en erreur — ignorées
                  </div>
                )}
              </div>

              {/* Avertissement colonnes inconnues */}
              {unknownColumns.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex gap-2 text-sm text-amber-800">
                  <ExclamationCircleIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Colonnes non reconnues (ignorées) : <strong>{unknownColumns.join(', ')}</strong></span>
                </div>
              )}

              {/* Tableau aperçu */}
              <div className="overflow-x-auto border border-gray-200 rounded-xl">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-gray-500 font-medium whitespace-nowrap">#</th>
                      <th className="px-3 py-2 text-left text-gray-500 font-medium whitespace-nowrap">Matricule</th>
                      <th className="px-3 py-2 text-left text-gray-500 font-medium whitespace-nowrap">Nom</th>
                      <th className="px-3 py-2 text-left text-gray-500 font-medium whitespace-nowrap">Prénoms</th>
                      <th className="px-3 py-2 text-left text-gray-500 font-medium whitespace-nowrap">Fonction</th>
                      <th className="px-3 py-2 text-left text-gray-500 font-medium whitespace-nowrap">Grade</th>
                      <th className="px-3 py-2 text-left text-gray-500 font-medium whitespace-nowrap">Ligne de service</th>
                      <th className="px-3 py-2 text-left text-gray-500 font-medium whitespace-nowrap">Contrat</th>
                      <th className="px-3 py-2 text-left text-gray-500 font-medium whitespace-nowrap">Date d'entrée</th>
                      <th className="px-3 py-2 text-left text-gray-500 font-medium whitespace-nowrap">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.rowIndex} className={`border-t border-gray-100 ${row.errors.length > 0 ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                        <td className="px-3 py-2 text-gray-400">{row.rowIndex}</td>
                        <td className="px-3 py-2 font-mono text-gray-800">{String(row.data.matricule || '—')}</td>
                        <td className="px-3 py-2">{String(row.data.last_name || '—')}</td>
                        <td className="px-3 py-2">{String(row.data.first_name || '—')}</td>
                        <td className="px-3 py-2">{String(row.data.function || '—')}</td>
                        <td className="px-3 py-2">{String(row.data.grade || '—')}</td>
                        <td className="px-3 py-2">{String(row.data.service_line || '—')}</td>
                        <td className="px-3 py-2">{String(row.data.contract_type || '—')}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{String(row.data.entry_date || '—')}</td>
                        <td className="px-3 py-2">
                          {row.errors.length === 0 ? (
                            <span className="flex items-center gap-1 text-green-700 font-medium">
                              <CheckCircleIcon className="w-3 h-3" /> OK
                            </span>
                          ) : (
                            <span
                              className="flex items-center gap-1 text-red-600 cursor-help"
                              title={row.errors.join('\n')}
                            >
                              <ExclamationCircleIcon className="w-3 h-3" />
                              {row.errors.length} erreur(s)
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Détail erreurs */}
              {errorCount > 0 && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                  <p className="text-sm font-semibold text-red-800 mb-2">
                    Détail des erreurs ({allErrors.length} au total) :
                  </p>
                  <ul className="text-xs text-red-700 space-y-1 list-disc list-inside max-h-40 overflow-y-auto">
                    {allErrors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                  {validCount > 0 && (
                    <p className="mt-3 text-xs text-red-600 font-medium">
                      Les {validCount} ligne(s) valides seront tout de même importées.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Étape 3: Rapport d'import */}
          {step === 'done' && result && (
            <div className="space-y-4">
              <div className="text-center py-6">
                <CheckCircleIcon className="w-14 h-14 text-green-500 mx-auto mb-3" />
                <p className="text-xl font-semibold text-gray-800 mb-1">Import terminé</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-green-700">{result.imported}</p>
                  <p className="text-sm text-green-600 mt-1">collaborateur(s) importé(s)</p>
                </div>
                <div className={`rounded-xl p-4 text-center ${result.failed > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                  <p className={`text-3xl font-bold ${result.failed > 0 ? 'text-red-600' : 'text-gray-400'}`}>{result.failed}</p>
                  <p className={`text-sm mt-1 ${result.failed > 0 ? 'text-red-500' : 'text-gray-400'}`}>ligne(s) en échec</p>
                </div>
              </div>
              {result.failedRows && result.failedRows.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                  <p className="text-sm font-semibold text-red-800 mb-2">Détail des échecs :</p>
                  <ul className="text-xs text-red-700 space-y-1 list-disc list-inside">
                    {result.failedRows.map((f, i) => (
                      <li key={i}>Matricule {String(f.matricule)} — {f.error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between gap-3 p-6 border-t border-gray-100">
          <div>
            {step === 'upload' && (
              <button type="button" onClick={handleDownloadTemplate}
                className="flex items-center gap-2 text-xs text-gray-500 hover:text-brand-700 transition-colors">
                <DocumentArrowDownIcon className="w-4 h-4" />
                Fichier modèle
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary">
              {step === 'done' ? 'Fermer' : 'Annuler'}
            </button>
            {step === 'preview' && validCount > 0 && (
              <button onClick={handleConfirm} disabled={executing} className="btn-primary gap-2">
                {executing ? (
                  <><div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Import...</>
                ) : (
                  <><CheckCircleIcon className="w-4 h-4" /> Importer {validCount} collaborateur(s)</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Page principale
// ============================================================
export default function EmployeesPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    service_line: '',
    grade: '',
    contract_type: '',
    status: 'ACTIF',
    gender: '',
    has_email: '',
    season: '',
  });

  const canManage = ['DRH', 'DIRECTION_GENERALE'].includes(user?.role || '');

  const fetchEmployees = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      const { data } = await api.get<PaginatedResponse<Employee>>('/employees', { params });
      setEmployees(data.data);
      setPagination(data.pagination);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(() => fetchEmployees(1), 300);
    return () => clearTimeout(timer);
  }, [fetchEmployees]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const buildExportParams = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    return params.toString();
  };

  const downloadBlob = async (url: string, filename: string) => {
    try {
      const res = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([res.data as BlobPart]);
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      toast.error('Erreur lors de l\'export');
    }
  };

  const handleExportExcel = () => {
    downloadBlob(`/employees/export/excel?${buildExportParams()}`, `collaborateurs_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportPDF = () => {
    downloadBlob(`/employees/export/pdf?${buildExportParams()}`, `collaborateurs_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Personnel</h2>
          <p className="text-gray-500 text-sm">{pagination.total} collaborateur(s) trouvé(s)</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Boutons export */}
          <button onClick={handleExportExcel} className="btn-secondary gap-2 text-sm">
            <TableCellsIcon className="w-4 h-4 text-green-600" />
            Excel
          </button>
          <button onClick={handleExportPDF} className="btn-secondary gap-2 text-sm">
            <DocumentArrowDownIcon className="w-4 h-4 text-red-500" />
            PDF
          </button>
          {canManage && (
            <>
              <button onClick={() => setShowImport(true)} className="btn-secondary gap-2 text-sm">
                <ArrowUpTrayIcon className="w-4 h-4" />
                Importer
              </button>
              <button onClick={() => navigate('/personnel/nouveau')} className="btn-primary gap-2">
                <PlusIcon className="w-4 h-4" />
                Nouveau
              </button>
            </>
          )}
        </div>
      </div>

      {/* Search & Filters bar */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, prénom, matricule, email..."
              className="input pl-9"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary gap-2 ${showFilters ? 'bg-brand-50 border-brand-300 text-brand-700' : ''}`}
          >
            <FunnelIcon className="w-4 h-4" />
            Filtres
            {Object.values(filters).filter(Boolean).length > 1 && (
              <span className="bg-brand-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {Object.values(filters).filter(Boolean).length - 1}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4 pt-4 border-t border-gray-100">
            <select className="input text-sm" value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
              <option value="">Tous les statuts</option>
              <option value="ACTIF">Actif</option>
              <option value="INACTIF">Inactif</option>
            </select>
            <select className="input text-sm" value={filters.service_line} onChange={(e) => handleFilterChange('service_line', e.target.value)}>
              <option value="">Toutes les lignes</option>
              {Object.entries(SERVICE_LINE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select className="input text-sm" value={filters.grade} onChange={(e) => handleFilterChange('grade', e.target.value)}>
              <option value="">Tous les grades</option>
              {Object.entries(GRADE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select className="input text-sm" value={filters.contract_type} onChange={(e) => handleFilterChange('contract_type', e.target.value)}>
              <option value="">Tous les contrats</option>
              {Object.entries(CONTRACT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select className="input text-sm" value={filters.gender} onChange={(e) => handleFilterChange('gender', e.target.value)}>
              <option value="">Tous genres</option>
              <option value="M">Homme</option>
              <option value="F">Femme</option>
            </select>
            <select className="input text-sm" value={filters.has_email} onChange={(e) => handleFilterChange('has_email', e.target.value)}>
              <option value="">Email / Sans email</option>
              <option value="true">Avec email</option>
              <option value="false">Sans email</option>
            </select>
            <button
              onClick={() => setFilters({ search: '', service_line: '', grade: '', contract_type: '', status: '', gender: '', has_email: '', season: '' })}
              className="col-span-full btn-secondary text-sm text-red-600 hover:bg-red-50 border-red-200 gap-1"
            >
              <XMarkIcon className="w-4 h-4" />
              Réinitialiser les filtres
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Matricule</th>
              <th>Nom & Prénom</th>
              <th>Genre</th>
              <th>Fonction</th>
              <th>Ligne de service</th>
              <th>Grade</th>
              <th>Contrat</th>
              <th>Ancienneté</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="text-center py-12">
                  <div className="inline-block animate-spin w-6 h-6 border-3 border-brand-600 border-t-transparent rounded-full" />
                </td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-12 text-gray-400">
                  Aucun collaborateur trouvé
                </td>
              </tr>
            ) : employees.map((emp) => (
              <tr key={emp.id}>
                <td>
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
                    {emp.matricule}
                  </span>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    {emp.photo_url ? (
                      <img src={emp.photo_url} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${emp.gender === 'M' ? 'bg-blue-500' : 'bg-purple-500'}`}>
                        {emp.first_name[0]}{emp.last_name[0]}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-800">{emp.last_name} {emp.first_name}</p>
                      {emp.email && <p className="text-xs text-gray-400">{emp.email}</p>}
                    </div>
                  </div>
                </td>
                <td><GenderBadge gender={emp.gender} /></td>
                <td className="text-sm text-gray-600">{emp.function.replace(/_/g, ' ')}</td>
                <td className="text-sm">{SERVICE_LINE_LABELS[emp.service_line] || emp.service_line}</td>
                <td>
                  <span className="badge badge-blue text-xs">{GRADE_LABELS[emp.grade] || emp.grade}</span>
                </td>
                <td>
                  <span className={`badge text-xs ${
                    emp.contract_type === 'CDI' ? 'badge-green'
                    : emp.contract_type === 'CDD' ? 'badge-yellow'
                    : emp.contract_type === 'STAGE' ? 'badge-purple'
                    : 'badge-gray'
                  }`}>
                    {CONTRACT_LABELS[emp.contract_type] || emp.contract_type}
                  </span>
                </td>
                <td className="text-xs text-gray-600">{emp.seniority ? emp.seniority.label : '—'}</td>
                <td><StatusBadge status={emp.status} /></td>
                <td>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => navigate(`/personnel/${emp.id}`)}
                      className="p-1.5 text-gray-400 hover:text-brand-700 hover:bg-brand-50 rounded"
                      title="Voir"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>
                    {canManage && (
                      <button
                        onClick={() => navigate(`/personnel/${emp.id}/modifier`)}
                        className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded"
                        title="Modifier"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {pagination.page} sur {pagination.totalPages} — {pagination.total} résultats
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchEmployees(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="btn-secondary text-sm disabled:opacity-40"
            >
              Précédent
            </button>
            <button
              onClick={() => fetchEmployees(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="btn-secondary text-sm disabled:opacity-40"
            >
              Suivant
            </button>
          </div>
        </div>
      )}

      {/* Modal Import */}
      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onSuccess={() => { fetchEmployees(1); setShowImport(false); }}
        />
      )}
    </div>
  );
}
