import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const REPORT_TYPES = [
  { value: 'monthly_hr', label: 'Rapport RH mensuel' },
  { value: 'employee_list', label: 'Liste du personnel' },
  { value: 'training_summary', label: 'Bilan formations' },
  { value: 'kpi_dashboard', label: 'Tableau de bord KPI' },
];

export default function ReportsPage() {
  const [type, setType] = useState('monthly_hr');
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await axios.post('/api/reports/generate', { type }, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Rapport généré');
    } catch {
      toast.error('Erreur lors de la génération');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Rapports</h1>
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type de rapport</label>
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {REPORT_TYPES.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Génération...' : 'Générer le rapport PDF'}
        </button>
      </div>
    </div>
  );
}
