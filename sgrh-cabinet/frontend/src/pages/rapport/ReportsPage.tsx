import { useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const MONTHS = [
  { value: 1, label: 'Janvier' }, { value: 2, label: 'Février' }, { value: 3, label: 'Mars' },
  { value: 4, label: 'Avril' }, { value: 5, label: 'Mai' }, { value: 6, label: 'Juin' },
  { value: 7, label: 'Juillet' }, { value: 8, label: 'Août' }, { value: 9, label: 'Septembre' },
  { value: 10, label: 'Octobre' }, { value: 11, label: 'Novembre' }, { value: 12, label: 'Décembre' },
];

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;
const YEARS = Array.from({ length: 3 }, (_, i) => currentYear - i);

export default function ReportsPage() {
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      // Étape 1 : générer le rapport
      const res = await api.post('/reports/generate', { year, month });
      const { filename } = res.data;

      // Étape 2 : télécharger le fichier Excel
      const download = await api.get(`/reports/download/${filename}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([download.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }));
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Rapport généré et téléchargé');
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
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mois</label>
            <select
              value={month}
              onChange={e => setMonth(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {MONTHS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Année</label>
            <select
              value={year}
              onChange={e => setYear(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {YEARS.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Génération...' : 'Générer le rapport Excel'}
        </button>
      </div>
    </div>
  );
}
