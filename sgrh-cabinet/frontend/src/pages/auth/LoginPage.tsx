import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
      {/* Côté gauche — Photo */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img
          src="/team-photo.png"
          alt="Équipe Forvis Mazars"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        {/* Overlay dégradé léger en bas pour lisibilité */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        {/* Tagline en bas à gauche */}
        <div className="absolute bottom-10 left-10 right-10 text-white">
          <p className="text-2xl font-bold leading-snug">
            Bienvenue dans votre<br />espace RH
          </p>
          <p className="text-sm mt-2 text-white/75">
            Gérez vos collaborateurs, formations et performances
          </p>
        </div>
      </div>

      {/* Côté droit — Formulaire */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 px-8 py-12">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="mb-8">
            <img src="/logo.svg" alt="Logo" className="h-10 mb-6" />
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
