import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success('Connexion réussie');
      navigate('/');
    } catch {
      // Error handled by interceptor
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Panneau gauche — Forvis Mazars branding */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ backgroundColor: '#1C2B4A' }}
      >
        {/* Formes géométriques décoratives en arrière-plan */}
        <svg
          className="absolute inset-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <circle cx="90%" cy="10%" r="220" fill="rgba(255,255,255,0.03)" />
          <circle cx="10%" cy="85%" r="180" fill="rgba(255,255,255,0.03)" />
          <circle cx="75%" cy="60%" r="120" fill="rgba(200,16,46,0.06)" />
          <line x1="0" y1="100%" x2="100%" y2="0" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          <line x1="0" y1="80%" x2="60%" y2="0" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        </svg>

        {/* Logo Forvis Mazars */}
        <div className="relative flex items-center">
          <img src="/logo-white.svg" alt="Forvis Mazars" className="h-10 w-auto object-contain" />
        </div>

        {/* Illustration centrale — équipe RH */}
        <div className="relative flex justify-center items-center">
          <svg
            viewBox="0 0 360 260"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full max-w-xs opacity-90"
            aria-hidden="true"
          >
            {/* Lignes de connexion réseau */}
            <line x1="180" y1="90" x2="80" y2="160" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeDasharray="4 3" />
            <line x1="180" y1="90" x2="180" y2="170" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeDasharray="4 3" />
            <line x1="180" y1="90" x2="280" y2="160" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeDasharray="4 3" />
            <line x1="80" y1="160" x2="180" y2="170" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="4 3" />
            <line x1="280" y1="160" x2="180" y2="170" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="4 3" />

            {/* Personne centrale (DRH) */}
            <circle cx="180" cy="52" r="22" fill="rgba(200,16,46,0.85)" />
            <circle cx="180" cy="52" r="18" fill="rgba(200,16,46,0.4)" />
            <text x="180" y="57" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">DRH</text>
            <rect x="163" y="76" width="34" height="20" rx="4" fill="rgba(200,16,46,0.7)" />

            {/* Personne gauche */}
            <circle cx="80" cy="148" r="18" fill="rgba(255,255,255,0.15)" />
            <circle cx="80" cy="148" r="14" fill="rgba(255,255,255,0.08)" />
            <text x="80" y="153" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="10">MGR</text>
            <rect x="66" y="168" width="28" height="16" rx="3" fill="rgba(255,255,255,0.1)" />

            {/* Personne centre-bas */}
            <circle cx="180" cy="158" r="18" fill="rgba(255,255,255,0.15)" />
            <circle cx="180" cy="158" r="14" fill="rgba(255,255,255,0.08)" />
            <text x="180" y="163" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="10">RH</text>
            <rect x="166" y="178" width="28" height="16" rx="3" fill="rgba(255,255,255,0.1)" />

            {/* Personne droite */}
            <circle cx="280" cy="148" r="18" fill="rgba(255,255,255,0.15)" />
            <circle cx="280" cy="148" r="14" fill="rgba(255,255,255,0.08)" />
            <text x="280" y="153" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="10">ASS</text>
            <rect x="266" y="168" width="28" height="16" rx="3" fill="rgba(255,255,255,0.1)" />

            {/* Graphique bar — coin bas droit */}
            <g transform="translate(270,200)">
              <rect x="0" y="20" width="10" height="30" rx="2" fill="rgba(200,16,46,0.5)" />
              <rect x="14" y="10" width="10" height="40" rx="2" fill="rgba(200,16,46,0.7)" />
              <rect x="28" y="0" width="10" height="50" rx="2" fill="rgba(200,16,46,0.9)" />
              <line x1="-2" y1="50" x2="42" y2="50" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            </g>

            {/* Badge KPI — coin bas gauche */}
            <g transform="translate(28,205)">
              <rect x="0" y="0" width="72" height="36" rx="6" fill="rgba(255,255,255,0.07)" />
              <text x="36" y="14" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="8">Effectifs</text>
              <text x="36" y="28" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="13" fontWeight="bold">247</text>
            </g>
          </svg>
        </div>

        {/* Texte central */}
        <div className="relative">
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Système de Gestion<br />des Ressources<br />Humaines
          </h1>
          <p className="text-blue-200/70 text-base leading-relaxed max-w-sm">
            Gérez vos collaborateurs, formations et indicateurs RH depuis une plateforme unifiée et sécurisée.
          </p>
        </div>

        {/* Footer */}
        <p className="relative text-blue-300/40 text-xs">
          © {new Date().getFullYear()} Forvis Mazars — Tous droits réservés
        </p>
      </div>

      {/* Panneau droit — Formulaire */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-sm">
          {/* Logo mobile */}
          <div className="lg:hidden mb-10">
            <img src="/logo.svg" alt="Forvis Mazars" className="h-9 w-auto object-contain" />
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Connexion</h2>
            <p className="text-gray-500 text-sm mt-1">Accédez à votre espace RH</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Adresse email
              </label>
              <input
                type="email"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:border-transparent transition"
                style={{ '--tw-ring-color': '#C8102E' } as React.CSSProperties}
                onFocus={e => (e.target.style.boxShadow = '0 0 0 2px #C8102E33')}
                onBlur={e => (e.target.style.boxShadow = '')}
                placeholder="votre@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none transition"
                  onFocus={e => (e.target.style.boxShadow = '0 0 0 2px #C8102E33')}
                  onBlur={e => (e.target.style.boxShadow = '')}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPwd ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 text-white text-sm font-semibold rounded-lg transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              style={{ backgroundColor: '#C8102E' }}
              onMouseEnter={e => { if (!isLoading) (e.currentTarget.style.backgroundColor = '#a50d24'); }}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#C8102E')}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Connexion...
                </span>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-400 text-center">
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
