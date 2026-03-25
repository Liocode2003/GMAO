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
      {/* Panneau gauche — Photo équipe Forvis Mazars */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between relative overflow-hidden">
        {/* Photo de fond */}
        <img
          src="/team-photo.jpg"
          alt="Équipe Forvis Mazars"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        {/* Overlay dégradé pour lisibilité du texte */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1C2B4A]/90 via-[#1C2B4A]/30 to-[#1C2B4A]/50" />

        {/* Logo */}
        <div className="relative z-10 p-12">
          <img src="/logo-white.svg" alt="Forvis Mazars" className="h-10 w-auto object-contain" />
        </div>

        {/* Texte bas */}
        <div className="relative z-10 p-12">
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Système de Gestion<br />des Ressources<br />Humaines
          </h1>
          <p className="text-blue-200/80 text-base leading-relaxed max-w-sm">
            Gérez vos collaborateurs, formations et indicateurs RH depuis une plateforme unifiée et sécurisée.
          </p>
          <p className="text-blue-300/40 text-xs mt-6">
            © {new Date().getFullYear()} Forvis Mazars — Tous droits réservés
          </p>
        </div>
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
