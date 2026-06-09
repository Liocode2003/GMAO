import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import ForvisMazarsLogo from '../../components/ui/ForvisMazarsLogo';

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
      {/* Côté gauche — Panneau décoratif branded */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12"
        style={{ background: 'linear-gradient(145deg, #0f1f5c 0%, #1E2D72 40%, #1a5fa8 100%)' }}
      >
        {/* Cercles décoratifs SVG en arrière-plan */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
          <circle cx="75%" cy="12%" r="220" fill="rgba(26,137,212,0.15)" />
          <circle cx="90%" cy="45%" r="160" fill="rgba(26,137,212,0.10)" />
          <circle cx="15%" cy="80%" r="280" fill="rgba(26,137,212,0.12)" />
          <circle cx="60%" cy="90%" r="120" fill="rgba(255,255,255,0.04)" />
          <circle cx="5%"  cy="20%" r="80"  fill="rgba(255,255,255,0.05)" />
          {/* Lignes décoratives */}
          <line x1="0" y1="55%" x2="100%" y2="45%" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          <line x1="0" y1="65%" x2="100%" y2="55%" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        </svg>

        {/* Grille de points */}
        <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>

        {/* Logo */}
        <div className="relative z-10">
          <ForvisMazarsLogo variant="white" height={60} />
        </div>

        {/* Bloc central — texte + stats */}
        <div className="relative z-10 flex-1 flex flex-col justify-center py-12">
          <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-4">
            Système de Gestion RH
          </p>
          <h1 className="text-white text-4xl font-bold leading-tight mb-6">
            Pilotez vos<br />ressources humaines<br />en toute simplicité
          </h1>
          <div className="flex gap-6 mt-2">
            {[
              { value: '56', label: 'Collaborateurs' },
              { value: '5',  label: 'Départements' },
              { value: '11', label: 'Modules RH' },
            ].map(stat => (
              <div key={stat.label}>
                <p className="text-white text-2xl font-bold">{stat.value}</p>
                <p className="text-white/50 text-xs mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tagline bas */}
        <div className="relative z-10">
          <p className="text-white/40 text-xs">
            © {new Date().getFullYear()} Forvis Mazars Burkina Faso
          </p>
        </div>
      </div>

      {/* Côté droit — Formulaire */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 px-8 py-12">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="mb-8">
            <ForvisMazarsLogo variant="color" height={52} className="mb-6" />
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
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none transition"
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

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-gray-500 hover:underline" style={{ color: '#C8102E' }}>
                Mot de passe oublié ?
              </Link>
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
        </div>
      </div>
    </div>
  );
}
