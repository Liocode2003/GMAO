import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import api from '../../services/api';
import { DashboardData, SERVICE_LINE_LABELS } from '../../types';
import {
  UsersIcon,
  EnvelopeIcon,
  CakeIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const COLORS = ['#1d4ed8', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777'];

const StatCard = ({ title, value, icon: Icon, color, subtitle }: {
  title: string; value: string | number; icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string; subtitle?: string;
}) => (
  <div className="card flex items-center gap-4">
    <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/kpis/dashboard')
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" />
    </div>
  );

  if (!data) return null;

  const serviceLinesChart = data.byServiceLine.map(sl => ({
    name: SERVICE_LINE_LABELS[sl.service_line as keyof typeof SERVICE_LINE_LABELS] || sl.service_line,
    count: parseInt(sl.count),
  }));

  const genderChart = data.byGender.map(g => ({
    name: g.gender === 'M' ? 'Hommes' : 'Femmes',
    value: parseInt(g.count),
    percentage: g.percentage,
  }));

  const ageChart = data.byAgeGroup.map(ag => ({
    name: ag.age_group === 'moins_25' ? '<25 ans'
      : ag.age_group === '25_35' ? '25-35 ans'
      : ag.age_group === '36_45' ? '36-45 ans'
      : '>45 ans',
    count: parseInt(ag.count),
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page title */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Tableau de bord</h2>
        <p className="text-gray-500 text-sm mt-1">
          {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Effectif actif"
          value={data.totalActive}
          icon={UsersIcon}
          color="bg-brand-700"
          subtitle="Collaborateurs actifs"
        />
        <StatCard
          title="Avec email"
          value={data.withEmail}
          icon={EnvelopeIcon}
          color="bg-cyan-600"
          subtitle={`${Math.round(data.withEmail / data.totalActive * 100)}% de l'effectif`}
        />
        <StatCard
          title="Anniversaires ce mois"
          value={data.birthdaysThisMonth.length}
          icon={CakeIcon}
          color="bg-purple-600"
        />
        <StatCard
          title="Contrats à renouveler"
          value={data.contractsToRenew.length}
          icon={ExclamationTriangleIcon}
          color={data.contractsToRenew.length > 0 ? 'bg-amber-500' : 'bg-green-600'}
          subtitle="Dans les 30 prochains jours"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By service line */}
        <div className="card">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Effectif par ligne de service</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={serviceLinesChart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* By gender */}
        <div className="card">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Répartition Hommes / Femmes</h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={genderChart} cx="50%" cy="45%" innerRadius={60} outerRadius={90}
                  paddingAngle={5} dataKey="value" label={false} labelLine={false}
                >
                  {genderChart.map((entry, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number, name: string) => [`${v} (${genderChart.find(g => g.name === name) ? ((genderChart.find(g => g.name === name)!.value / genderChart.reduce((a, b) => a + b.value, 0)) * 100).toFixed(1) : 0}%)`, name]} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Age groups + Contract types */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Age groups */}
        <div className="card">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Répartition par tranche d'âge</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ageChart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#0891b2" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Contract types */}
        <div className="card">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Types de contrats</h3>
          <div className="space-y-3">
            {data.byContractType.map((ct, i) => {
              const pct = Math.round(parseInt(ct.count) / data.totalActive * 100);
              return (
                <div key={ct.contract_type}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{ct.contract_type}</span>
                    <span className="text-gray-500">{ct.count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: COLORS[i] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Anniversaires du mois */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <CakeIcon className="w-5 h-5 text-purple-600" />
            <h3 className="text-base font-semibold text-gray-800">Anniversaires du mois</h3>
          </div>
          {data.birthdaysThisMonth.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">Aucun anniversaire ce mois</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {data.birthdaysThisMonth.map((emp) => (
                <div key={emp.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 text-xs font-bold">
                      {emp.first_name[0]}{emp.last_name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{emp.first_name} {emp.last_name}</p>
                      <p className="text-xs text-gray-500">{emp.upcoming_age} ans</p>
                    </div>
                  </div>
                  <span className="badge badge-purple">{emp.birth_day_month}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contrats à renouveler */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-semibold text-gray-800">Contrats à renouveler</h3>
          </div>
          {data.contractsToRenew.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">Aucun contrat à renouveler ce mois</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {data.contractsToRenew.map((emp) => (
                <div key={emp.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{emp.first_name} {emp.last_name}</p>
                    <p className="text-xs text-gray-500">{emp.matricule} — {emp.contract_type}</p>
                  </div>
                  <div className="text-right">
                    <span className={`badge ${emp.days_remaining <= 15 ? 'badge-red' : 'badge-yellow'}`}>
                      {emp.days_remaining}j
                    </span>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(emp.exit_date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
