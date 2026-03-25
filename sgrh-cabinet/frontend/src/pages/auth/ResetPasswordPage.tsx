import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <p className="text-red-600 font-medium mb-4">Lien invalide ou expiré.</p>
          <Link to="/login" className="text-sm font-medium" style={{ color: '#C8102E' }}>
            ← Retour à la connexion
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirm) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    setIsLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword });
      toast.success('Mot de passe réinitialisé avec succès');
      navigate('/login');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || 'Token invalide ou expiré');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <img src="/logo.svg" alt="Logo" className="h-10 mb-6" />
          <h2 className="text-2xl font-bold text-gray-900">Nouveau mot de passe</h2>
          <p className="text-gray-500 text-sm mt-1">Choisissez un nouveau mot de passe sécurisé</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nouveau mot de passe</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm text-gray-900 bg-white focus:outline-none transition"
                onFocus={e => (e.target.style.boxShadow = '0 0 0 2px #C8102E33')}
                onBlur={e => (e.target.style.boxShadow = '')}
                placeholder="Au moins 8 caractères"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                minLength={8}
                autoFocus
              />
              <button type="button" onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPwd ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmer le mot de passe</label>
            <input
              type={showPwd ? 'text' : 'password'}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none transition"
              onFocus={e => (e.target.style.boxShadow = '0 0 0 2px #C8102E33')}
              onBlur={e => (e.target.style.boxShadow = '')}
              placeholder="Confirmer le mot de passe"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 text-white text-sm font-semibold rounded-lg transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#C8102E' }}
            onMouseEnter={e => { if (!isLoading) (e.currentTarget.style.backgroundColor = '#a50d24'); }}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#C8102E')}
          >
            {isLoading ? 'Enregistrement...' : 'Réinitialiser le mot de passe'}
          </button>

          <p className="text-center text-sm text-gray-500">
            <Link to="/login" className="font-medium" style={{ color: '#C8102E' }}>
              ← Retour à la connexion
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
