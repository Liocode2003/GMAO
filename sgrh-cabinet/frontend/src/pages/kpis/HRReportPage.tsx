import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import api from '../../services/api';
import { HRReportData, SERVICE_LINE_LABELS, DEPARTURE_REASON_LABELS, DepartureReason } from '../../types';
import {
  UsersIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon,
  ChartBarIcon, UserGroupIcon, ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { PageSpinner } from '../../components/ui/Spinner';
import ChartTooltip from '../../components/ui/ChartTooltip';

const MONTHS = [
  '', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const COLORS = ['#1d4ed8', '#db2777', '#059669', '#d97706', '#7c3aed'];

function DeltaBadge({ delta }: { delta: number }) {
  if (delta === 0) return <span className="text-xs text-gray-400">=</span>;
  const up = delta > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${up ? 'text-green-600' : 'text-red-500'}`}>
      {up ? <ArrowTrendingUpIcon className="w-3 h-3" /> : <ArrowTrendingDownIcon className="w-3 h-3" />}
      {up ? '+' : ''}{delta}
    </span>
  );
}

function TurnoverCard({
  title, data, formula,
}: {
  title: string;
  data: { current: HRReportData['turnover']['global']['current']; prev: HRReportData['turnover']['global']['prev'] };
  formula: string;
}) {
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b">{title}</h3>
      <div className="grid grid-cols-2 gap-4">
        {([['current', 'Période actuelle'], ['prev', 'Période précédente']] as const).map(([key, label]) => {
          const d = data[key];
          return (
            <div key={key} className={`rounded-xl p-3 ${key === 'current' ? 'bg-blue-50' : 'bg-gray-50'}`}>
              <p className="text-xs font-medium text-gray-500 mb-2">{label}</p>
              <p className="text-2xl font-bold text-gray-800">{d.rate}%</p>
              <div className="mt-2 space-y-1 text-xs text-gray-600">
                <div className="flex justify-between"><span>Départs</span><span className="font-medium">{d.departures}</span></div>
                <div className="flex justify-between"><span>Eff. moyen</span><span className="font-medium">{d.avgHead}</span></div>
                <div className="flex justify-between text-gray-400"><span>{formula}</span></div>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-400 mt-3">
        Formule : départs ÷ effectif moyen × 100 &nbsp;|&nbsp; effectif moyen = (début + fin) ÷ 2
      </p>
    </div>
  );
}

export default function HRReportPage() {
  const currentYear  = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [year, setYear]       = useState(currentYear);
  const [month, setMonth]     = useState(currentMonth);
  const [data, setData]       = useState<HRReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const res = await api.post('/reports/generate', { year, month });
      const { filename } = res.data;
      const dl = await api.get(`/reports/download/${filename}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([dl.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }));
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Rapport Excel téléchargé');
    } catch {
      toast.error('Erreur lors de la génération');
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    api.get('/kpis/hr-report', { params: { year, month } })
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [year, month]);

  const periodLabel     = data ? `Fin ${MONTHS[data.period.month]} ${data.period.year}` : '';
  const prevPeriodLabel = data ? `Fin ${MONTHS[data.prevPeriod.month]} ${data.prevPeriod.year}` : '';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Rapport RH</h2>
          <p className="text-gray-500 text-sm mt-0.5">Indicateurs clés — comparaison deux périodes</p>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={handleExportExcel}
            disabled={exporting}
            className="btn-secondary flex items-center gap-1.5 text-sm py-1.5 disabled:opacity-50"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            {exporting ? 'Export...' : 'Excel'}
          </button>
          <select
            className="input text-sm py-1.5"
            value={month}
            onChange={e => setMonth(parseInt(e.target.value))}
          >
            {MONTHS.slice(1).map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            className="input text-sm py-1.5"
            value={year}
            onChange={e => setYear(parseInt(e.target.value))}
          >
            {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && <PageSpinner />}

      {!loading && data && (
        <>
          {/* ── 1. EFFECTIF TOTAL ── */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <UsersIcon className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-semibold text-gray-800">Effectif total (hors stagiaires école)</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">{periodLabel}</p>
                <p className="text-3xl font-bold text-blue-700">{data.headcount.current}</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">{prevPeriodLabel}</p>
                <p className="text-3xl font-bold text-gray-600">{data.headcount.prev}</p>
              </div>
              <div className="text-center p-4 bg-white border rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Évolution</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <p className="text-2xl font-bold">
                    {data.headcount.delta > 0 ? '+' : ''}{data.headcount.delta}
                  </p>
                  <DeltaBadge delta={data.headcount.delta} />
                </div>
              </div>
            </div>
          </div>

          {/* ── 2. RÉPARTITION H/F ── */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <UserGroupIcon className="w-5 h-5 text-pink-600" />
              <h3 className="text-base font-semibold text-gray-800">Répartition Hommes / Femmes</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {([['current', periodLabel], ['prev', prevPeriodLabel]] as const).map(([key, label]) => {
                const g = data.gender[key];
                const total = g.M + g.F;
                const pctM = total > 0 ? Math.round(g.M / total * 100) : 0;
                const pctF = total > 0 ? Math.round(g.F / total * 100) : 0;
                return (
                  <div key={key}>
                    <p className="text-sm font-medium text-gray-600 mb-2">{label}</p>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-xl font-bold text-blue-700">{g.M}</p>
                        <p className="text-xs text-gray-500">Hommes ({pctM}%)</p>
                      </div>
                      <div className="text-center p-3 bg-pink-50 rounded-lg">
                        <p className="text-xl font-bold text-pink-600">{g.F}</p>
                        <p className="text-xs text-gray-500">Femmes ({pctF}%)</p>
                      </div>
                    </div>
                    <div className="h-3 rounded-full overflow-hidden bg-gray-100 flex">
                      <div className="h-full bg-blue-500 transition-all" style={{ width: `${pctM}%` }} />
                      <div className="h-full bg-pink-400 transition-all" style={{ width: `${pctF}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── 3. EFFECTIFS PAR DÉPARTEMENT ── */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <ChartBarIcon className="w-5 h-5 text-green-600" />
              <h3 className="text-base font-semibold text-gray-800">Effectifs par ligne de service</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-gray-500 font-medium">Département</th>
                    <th className="text-right py-2 text-blue-600 font-medium">{periodLabel}</th>
                    <th className="text-right py-2 text-gray-500 font-medium">{prevPeriodLabel}</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Évol.</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const allLines = new Set([
                      ...data.byDepartment.current.map(d => d.service_line),
                      ...data.byDepartment.prev.map(d => d.service_line),
                    ]);
                    return [...allLines].map(sl => {
                      const cur  = data.byDepartment.current.find(d => d.service_line === sl)?.count ?? 0;
                      const prev = data.byDepartment.prev.find(d => d.service_line === sl)?.count ?? 0;
                      const delta = cur - prev;
                      return (
                        <tr key={sl} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-2 font-medium text-gray-700">
                            {SERVICE_LINE_LABELS[sl as keyof typeof SERVICE_LINE_LABELS] || sl}
                          </td>
                          <td className="py-2 text-right font-bold text-blue-700">{cur}</td>
                          <td className="py-2 text-right text-gray-500">{prev}</td>
                          <td className="py-2 text-right">
                            <DeltaBadge delta={delta} />
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── 4. TRANCHES D'ÂGE (période courante) ── */}
          <div className="card">
            <h3 className="text-base font-semibold text-gray-800 mb-1">
              Répartition par tranche d'âge — {periodLabel}
            </h3>
            <p className="text-xs text-gray-400 mb-4">Effectif total (hors stagiaires)</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={['< 30 ans', '30-39 ans', '40-49 ans', '50 ans et +'].map(label => ({
                  name: label,
                  count: data.ageGroups.find(a => a.label === label)?.count ?? 0,
                }))}
                margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ── 5 & 6. TURN OVER GLOBAL ── */}
          <TurnoverCard
            title="Turn Over Global (hors stagiaires école)"
            data={data.turnover.global}
            formula={`${data.turnover.global.current.departures} ÷ ${data.turnover.global.current.avgHead} × 100`}
          />

          {/* ── 7 & 8. TURN OVER FONCTIONNEL ── */}
          <TurnoverCard
            title="Turn Over Fonctionnel (CDI / CDD uniquement)"
            data={data.turnover.functional}
            formula={`${data.turnover.functional.current.departures} ÷ ${data.turnover.functional.current.avgHead} × 100`}
          />

          {/* ── 9. MOTIFS DE DÉPART ── */}
          <div className="card">
            <h3 className="text-base font-semibold text-gray-800 mb-4">
              Motifs de départ
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {([['current', periodLabel], ['prev', prevPeriodLabel]] as const).map(([key, label]) => {
                const reasons = data.departureReasons[key];
                const total   = reasons.reduce((s, r) => s + r.count, 0);
                if (total === 0) {
                  return (
                    <div key={key}>
                      <p className="text-sm font-medium text-gray-600 mb-3">{label}</p>
                      <p className="text-gray-400 text-sm text-center py-6">Aucun départ sur cette période</p>
                    </div>
                  );
                }
                const pieData = reasons.filter(r => r.count > 0).map((r, i) => ({
                  name: DEPARTURE_REASON_LABELS[r.reason as DepartureReason] ?? r.reason,
                  value: r.count,
                  fill: COLORS[i % COLORS.length],
                }));
                return (
                  <div key={key}>
                    <p className="text-sm font-medium text-gray-600 mb-3">{label} — {total} départ(s)</p>
                    <div className="grid grid-cols-2 gap-4 items-center">
                      <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65}
                            dataKey="value" paddingAngle={3}>
                            {pieData.map((entry, i) => (
                              <Cell key={i} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: number) => [`${v} (${Math.round(v / total * 100)}%)`, '']} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-1.5">
                        {reasons.map((r, i) => (
                          <div key={r.reason} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5">
                              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                              <span className="text-gray-600 leading-tight">
                                {DEPARTURE_REASON_LABELS[r.reason as DepartureReason] ?? r.reason}
                              </span>
                            </div>
                            <span className="font-semibold text-gray-700 ml-2">
                              {r.count} ({r.pct}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
