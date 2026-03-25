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
    <div className="animate-fade-in">

      {/* Formulaire */}
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Rapports</h1>
        <p className="text-gray-500 text-sm mb-6">Générez et téléchargez vos rapports RH mensuels au format Excel.</p>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mois</label>
              <select
                value={month}
                onChange={e => setMonth(Number(e.target.value))}
                className="input w-full"
              >
                {MONTHS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Année</label>
              <select
                value={year}
                onChange={e => setYear(Number(e.target.value))}
                className="input w-full"
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
            className="btn-primary w-full justify-center"
          >
            {loading ? 'Génération en cours...' : 'Générer le rapport Excel'}
          </button>

          <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1.5">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Données sécurisées et confidentielles
          </p>
        </div>
      </div>

    </div>
  );
}
