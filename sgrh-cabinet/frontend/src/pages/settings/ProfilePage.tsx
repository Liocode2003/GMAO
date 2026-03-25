import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { ROLE_LABELS } from '../../types';
import {
  UserCircleIcon,
  KeyIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ProfileData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  last_login: string | null;
  created_at: string;
}

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<ProfileData | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/auth/profile')
      .then(res => setProfile(res.data))
      .catch(() => toast.error('Impossible de charger le profil'));
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    setSaving(true);
    try {
      await api.put('/auth/password', { currentPassword, newPassword });
      toast.success('Mot de passe mis à jour');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Mon profil</h1>
        <p className="text-gray-500 text-sm mt-1">Informations de votre compte et sécurité</p>
      </div>

      {/* Informations du compte */}
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-brand-600 rounded-lg flex items-center justify-center">
            <UserCircleIcon className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-base font-semibold text-gray-800">Informations du compte</h2>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-brand-600 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700">
              {ROLE_LABELS[user?.role || 'UTILISATEUR']}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Email</p>
            <p className="text-sm text-gray-700">{profile?.email ?? user?.email}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Rôle</p>
            <p className="text-sm text-gray-700">{ROLE_LABELS[user?.role || 'UTILISATEUR']}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Dernière connexion</p>
            <p className="text-sm text-gray-700">
              {profile?.last_login
                ? format(new Date(profile.last_login), "d MMMM yyyy à HH:mm", { locale: fr })
                : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Compte créé le</p>
            <p className="text-sm text-gray-700">
              {profile?.created_at
                ? format(new Date(profile.created_at), "d MMMM yyyy", { locale: fr })
                : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Changer le mot de passe */}
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-gray-700 rounded-lg flex items-center justify-center">
            <KeyIcon className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-base font-semibold text-gray-800">Changer le mot de passe</h2>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Mot de passe actuel
            </label>
            <input
              type="password"
              className="input w-full"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              className="input w-full"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Minimum 8 caractères"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Confirmer le nouveau mot de passe
            </label>
            <input
              type="password"
              className="input w-full"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn-primary gap-2"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Enregistrement...
              </span>
            ) : (
              <>
                <CheckCircleIcon className="w-4 h-4" />
                Mettre à jour le mot de passe
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
