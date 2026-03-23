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

// ============================================================
// Modal Import Excel
// ============================================================
function ImportModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload');
  const [parsing, setParsing] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [result, setResult] = useState<{ imported: number; failed: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.xlsx')) {
      toast.error('Seuls les fichiers .xlsx sont acceptés');
      return;
    }
    setParsing(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post('/employees/import/parse', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setRows(data.rows);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Import Excel des collaborateurs</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {step === 'upload' && 'Sélectionnez un fichier .xlsx'}
              {step === 'preview' && `${rows.length} ligne(s) — ${validCount} valide(s), ${errorCount} erreur(s)`}
              {step === 'done' && 'Import terminé'}
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
            <div>
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
                <div className="mt-4 flex items-center justify-center gap-2 text-gray-500">
                  <div className="animate-spin w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full" />
                  Analyse en cours...
                </div>
              )}
              {/* Template colonnes */}
              <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                <p className="text-sm font-medium text-blue-800 mb-2">Colonnes attendues dans le fichier :</p>
                <p className="text-xs text-blue-700">
                  Matricule · Nom · Prénoms · Sexe · Date de naissance · Email · Téléphone · Fonction · Ligne de service · Grade · Type de contrat · Date d'entrée · Date de sortie · Salaire · Département · Expatrié · Situation matrimoniale · Nom conjoint · Tél conjoint · Nb enfants
                </p>
              </div>
            </div>
          )}

          {/* Étape 2: Aperçu */}
          {step === 'preview' && (
            <div>
              {/* Résumé */}
              <div className="flex gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                  <CheckCircleIcon className="w-4 h-4" />
                  {validCount} ligne(s) valide(s)
                </div>
                {errorCount > 0 && (
                  <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 px-3 py-2 rounded-lg">
                    <XCircleIcon className="w-4 h-4" />
                    {errorCount} ligne(s) en erreur
                  </div>
                )}
              </div>

              {/* Tableau aperçu */}
              <div className="overflow-x-auto border border-gray-200 rounded-xl">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-gray-500">Ligne</th>
                      <th className="px-3 py-2 text-left text-gray-500">Matricule</th>
                      <th className="px-3 py-2 text-left text-gray-500">Nom</th>
                      <th className="px-3 py-2 text-left text-gray-500">Prénoms</th>
                      <th className="px-3 py-2 text-left text-gray-500">Fonction</th>
                      <th className="px-3 py-2 text-left text-gray-500">Grade</th>
                      <th className="px-3 py-2 text-left text-gray-500">Contrat</th>
                      <th className="px-3 py-2 text-left text-gray-500">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.rowIndex} className={`border-t border-gray-100 ${row.errors.length > 0 ? 'bg-red-50' : ''}`}>
                        <td className="px-3 py-2 text-gray-400">{row.rowIndex}</td>
                        <td className="px-3 py-2 font-mono">{String(row.data.matricule || '')}</td>
                        <td className="px-3 py-2">{String(row.data.last_name || '')}</td>
                        <td className="px-3 py-2">{String(row.data.first_name || '')}</td>
                        <td className="px-3 py-2">{String(row.data.function || '')}</td>
                        <td className="px-3 py-2">{String(row.data.grade || '')}</td>
                        <td className="px-3 py-2">{String(row.data.contract_type || '')}</td>
                        <td className="px-3 py-2">
                          {row.errors.length === 0 ? (
                            <span className="flex items-center gap-1 text-green-700">
                              <CheckCircleIcon className="w-3 h-3" /> OK
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-red-600" title={row.errors.join('\n')}>
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
                <div className="mt-4 p-4 bg-red-50 rounded-xl">
                  <p className="text-sm font-medium text-red-800 mb-2">Détail des erreurs :</p>
                  <ul className="text-xs text-red-700 space-y-1 list-disc list-inside">
                    {rows.filter(r => r.errors.length > 0).flatMap(r => r.errors).slice(0, 10).map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Étape 3: Résultat */}
          {step === 'done' && result && (
            <div className="text-center py-8">
              <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-xl font-semibold text-gray-800 mb-2">Import terminé</p>
              <p className="text-green-700 font-medium">{result.imported} collaborateur(s) importé(s)</p>
              {result.failed > 0 && (
                <p className="text-red-600 text-sm mt-1">{result.failed} ligne(s) en échec</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
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

  const handleExportExcel = () => {
    window.open(`/api/employees/export/excel?${buildExportParams()}`, '_blank');
  };

  const handleExportPDF = () => {
    window.open(`/api/employees/export/pdf?${buildExportParams()}`, '_blank');
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
