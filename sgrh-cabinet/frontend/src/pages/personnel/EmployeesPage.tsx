import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Employee, PaginatedResponse, SERVICE_LINE_LABELS, GRADE_LABELS, CONTRACT_LABELS } from '../../types';
import { useAuthStore } from '../../store/authStore';
import {
  PlusIcon, MagnifyingGlassIcon, FunnelIcon,
  EyeIcon, PencilIcon, XMarkIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

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

export default function EmployeesPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

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

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Personnel</h2>
          <p className="text-gray-500 text-sm">{pagination.total} collaborateur(s) trouvé(s)</p>
        </div>
        {canManage && (
          <button onClick={() => navigate('/personnel/nouveau')} className="btn-primary">
            <PlusIcon className="w-4 h-4" />
            Nouveau collaborateur
          </button>
        )}
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

        {/* Advanced filters */}
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
                  <div>
                    <p className="font-medium text-gray-800">{emp.last_name} {emp.first_name}</p>
                    {emp.email && <p className="text-xs text-gray-400">{emp.email}</p>}
                  </div>
                </td>
                <td><GenderBadge gender={emp.gender} /></td>
                <td className="text-sm text-gray-600">{emp.function.replace(/_/g, ' ')}</td>
                <td className="text-sm">
                  {SERVICE_LINE_LABELS[emp.service_line] || emp.service_line}
                </td>
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
                <td className="text-xs text-gray-600">
                  {emp.seniority ? emp.seniority.label : '—'}
                </td>
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
    </div>
  );
}
