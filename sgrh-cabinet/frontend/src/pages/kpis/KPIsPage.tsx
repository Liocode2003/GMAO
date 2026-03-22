import { useState, useEffect } from 'react';
import api from '../../services/api';
import { KPIData, SERVICE_LINE_LABELS, GRADE_LABELS } from '../../types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts';

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

const KPICard = ({ label, value, color = 'text-gray-800', unit }: {
  label: string; value: string | number; color?: string; unit?: string;
}) => (
  <div className="card text-center">
    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
    <p className={`text-2xl font-bold ${color}`}>{value}{unit && <span className="text-sm font-normal text-gray-400 ml-1">{unit}</span>}</p>
  </div>
);

export default function KPIsPage() {
  const [data, setData] = useState<KPIData | null>(null);
  const [monthlyData, setMonthlyData] = useState<{ month: number; entries: number; exits: number; trainingHours: number }[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/kpis', { params: { year } }),
      api.get('/kpis/monthly', { params: { year } }),
    ]).then(([kpiRes, monthlyRes]) => {
      setData(kpiRes.data);
      setMonthlyData(monthlyRes.data.monthly);
    }).finally(() => setLoading(false));
  }, [year]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" />
    </div>
  );

  if (!data) return null;

  const movementsChart = monthlyData.map(m => ({
    name: MONTHS[m.month - 1],
    Entrées: m.entries,
    Sorties: m.exits,
  }));

  const trainingChart = monthlyData.map(m => ({
    name: MONTHS[m.month - 1],
    Heures: m.trainingHours,
  }));

  // Par grade chart
  const gradeChart = data.byGrade
    .filter(g => parseInt(g.count) > 0)
    .map(g => ({
      name: GRADE_LABELS[g.grade as keyof typeof GRADE_LABELS] || g.grade,
      count: parseInt(g.count),
    }))
    .sort((a, b) => b.count - a.count);

  const turnoverRate = data.turnover.entries && parseInt(data.headcount.total) > 0
    ? ((parseInt(data.turnover.exits) / parseInt(data.headcount.total)) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">KPIs & Statistiques</h2>
          <p className="text-gray-500 text-sm">Indicateurs clés de performance</p>
        </div>
        <select
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value))}
          className="input w-32"
        >
          {[2022, 2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Effectifs globaux */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Effectifs globaux</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <KPICard label="Total actif" value={data.headcount.total} color="text-brand-700" />
          <KPICard label="CDI" value={data.headcount.cdi} />
          <KPICard label="CDD" value={data.headcount.cdd} />
          <KPICard label="Stagiaires" value={data.headcount.stagiaires} />
          <KPICard label="Hommes" value={data.headcount.hommes} color="text-blue-700" />
          <KPICard label="Femmes" value={data.headcount.femmes} color="text-pink-600" />
        </div>
      </div>

      {/* Mouvements & Formation */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPICard label="Entrées YTD" value={data.movements.entries} color="text-green-700" />
        <KPICard label="Sorties YTD" value={data.movements.exits} color="text-red-600" />
        <KPICard label="Taux attrition" value={`${turnoverRate}%`} color={parseFloat(turnoverRate) > 15 ? 'text-red-600' : 'text-green-700'} />
        <KPICard label="Mobilités" value={data.mobilitiesCount} />
      </div>

      {/* Formation */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Formation</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {data.trainings.map(t => (
            <KPICard
              key={t.type}
              label={`Formation ${t.type}`}
              value={parseFloat(t.total_hours).toFixed(0)}
              unit="h"
            />
          ))}
          <KPICard
            label="Total heures"
            value={data.totalTrainingHours.toFixed(0)}
            unit="h"
            color={data.totalTrainingHours >= (data.targets['TRAINING_HOURS'] || 200) ? 'text-green-700' : 'text-amber-600'}
          />
        </div>
        {data.targets['TRAINING_HOURS'] && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Progression formation ({data.totalTrainingHours.toFixed(0)}h / {data.targets['TRAINING_HOURS']}h)</span>
              <span>{Math.min(100, Math.round(data.totalTrainingHours / data.targets['TRAINING_HOURS'] * 100))}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-600 rounded-full transition-all"
                style={{ width: `${Math.min(100, data.totalTrainingHours / data.targets['TRAINING_HOURS'] * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mouvements mensuels */}
        <div className="card">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Mouvements mensuels {year}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={movementsChart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Entrées" fill="#059669" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Sorties" fill="#dc2626" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Heures de formation */}
        <div className="card">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Heures de formation mensuelles</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trainingChart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="Heures" stroke="#1d4ed8" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Par grade */}
      <div className="card">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Effectif par grade</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={gradeChart} layout="vertical" margin={{ top: 0, right: 20, left: 130, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={130} />
            <Tooltip />
            <Bar dataKey="count" fill="#1d4ed8" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Diplômes */}
      <div className="card">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Diplômes professionnels</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <KPICard label="DEC Français" value={data.diplomas.dec_french} color="text-brand-700" />
          <KPICard label="DECOFI" value={data.diplomas.decofi} color="text-brand-700" />
          <KPICard label="Autre DEC" value={data.diplomas.other_dec} />
          <KPICard label="CISA" value={data.diplomas.cisa} color="text-green-700" />
          <KPICard label="CFA" value={data.diplomas.cfa} color="text-green-700" />
        </div>
      </div>

      {/* Effectifs par ligne de service */}
      <div className="card overflow-x-auto">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Effectif par ligne de service</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Ligne de service</th>
              {['ASSOCIE', 'DIRECTEUR', 'SENIOR_MANAGER_1', 'ASSISTANT_MANAGER_1', 'SENIOR_1', 'JUNIOR', 'ASSISTANT_DEBUTANT'].map(g => (
                <th key={g}>{GRADE_LABELS[g as keyof typeof GRADE_LABELS] || g}</th>
              ))}
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(SERVICE_LINE_LABELS).map(([sl, label]) => {
              const grades = ['ASSOCIE', 'DIRECTEUR', 'SENIOR_MANAGER_1', 'ASSISTANT_MANAGER_1', 'SENIOR_1', 'JUNIOR', 'ASSISTANT_DEBUTANT'];
              const counts = grades.map(g =>
                parseInt(data.byServiceAndGrade.find(r => r.service_line === sl && r.grade === g)?.count || '0')
              );
              const total = counts.reduce((a, b) => a + b, 0);
              if (total === 0) return null;
              return (
                <tr key={sl}>
                  <td className="font-medium">{label}</td>
                  {counts.map((c, i) => <td key={i} className="text-center">{c || '—'}</td>)}
                  <td className="text-center font-semibold text-brand-700">{total}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
