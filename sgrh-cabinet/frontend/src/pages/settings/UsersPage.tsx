import { useState, useEffect } from 'react';
import api from '../../services/api';
import { ROLE_LABELS } from '../../types';
import { PlusIcon, PencilIcon, KeyIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface UserRecord {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<UserRecord | null>(null);
  const [showPwdModal, setShowPwdModal] = useState<string | null>(null);
  const [newPwd, setNewPwd] = useState('');

  const fetchUsers = () => {
    api.get('/users').then(res => setUsers(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleResetPwd = async () => {
    if (!newPwd || newPwd.length < 8) { toast.error('Minimum 8 caractères'); return; }
    await api.post(`/users/${showPwdModal}/reset-password`, { newPassword: newPwd });
    toast.success('Mot de passe réinitialisé');
    setShowPwdModal(null);
    setNewPwd('');
  };

  const toggleActive = async (u: UserRecord) => {
    await api.put(`/users/${u.id}`, { is_active: !u.is_active });
    toast.success(u.is_active ? 'Utilisateur désactivé' : 'Utilisateur activé');
    fetchUsers();
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Utilisateurs</h2>
          <p className="text-gray-500 text-sm">{users.length} utilisateur(s)</p>
        </div>
        <button onClick={() => { setEditing(null); setShowModal(true); }} className="btn-primary">
          <PlusIcon className="w-4 h-4" /> Nouvel utilisateur
        </button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Email</th>
              <th>Rôle</th>
              <th>Statut</th>
              <th>Dernière connexion</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8">Chargement...</td></tr>
            ) : users.map(u => (
              <tr key={u.id}>
                <td className="font-medium">{u.first_name} {u.last_name}</td>
                <td className="text-sm text-gray-600">{u.email}</td>
                <td>
                  <span className={`badge ${
                    u.role === 'DRH' ? 'badge-blue'
                    : u.role === 'DIRECTION_GENERALE' ? 'badge-purple'
                    : u.role === 'ASSOCIE' ? 'badge-green'
                    : 'badge-gray'
                  }`}>
                    {ROLE_LABELS[u.role as keyof typeof ROLE_LABELS] || u.role}
                  </span>
                </td>
                <td>
                  <span className={`badge ${u.is_active ? 'badge-green' : 'badge-red'}`}>
                    {u.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td className="text-sm text-gray-500">
                  {u.last_login ? new Date(u.last_login).toLocaleString('fr-FR') : '—'}
                </td>
                <td>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setEditing(u); setShowModal(true); }}
                      className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded"
                      title="Modifier"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowPwdModal(u.id)}
                      className="p-1.5 text-gray-400 hover:text-brand-700 hover:bg-brand-50 rounded"
                      title="Réinitialiser MDP"
                    >
                      <KeyIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleActive(u)}
                      className={`px-2 py-1 text-xs rounded ${u.is_active ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                    >
                      {u.is_active ? 'Désactiver' : 'Activer'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User modal */}
      {showModal && (
        <UserModal
          user={editing}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchUsers(); }}
        />
      )}

      {/* Reset password modal */}
      {showPwdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Réinitialiser le mot de passe</h3>
            <div>
              <label className="label">Nouveau mot de passe (min. 8 caractères)</label>
              <input type="password" className="input" value={newPwd} onChange={e => setNewPwd(e.target.value)} />
            </div>
            <div className="flex gap-3 justify-end mt-4">
              <button onClick={() => { setShowPwdModal(null); setNewPwd(''); }} className="btn-secondary">Annuler</button>
              <button onClick={handleResetPwd} className="btn-primary">Réinitialiser</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UserModal({ user, onClose, onSaved }: {
  user: UserRecord | null; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState({
    email: user?.email || '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    role: user?.role || 'UTILISATEUR',
    password: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (user) {
        await api.put(`/users/${user.id}`, { role: form.role, first_name: form.first_name, last_name: form.last_name });
      } else {
        await api.post('/users', form);
      }
      toast.success(user ? 'Utilisateur mis à jour' : 'Utilisateur créé');
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {user ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
        </h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Prénom *</label>
              <input className="input" value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Nom *</label>
              <input className="input" value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))} />
            </div>
          </div>
          {!user && (
            <div>
              <label className="label">Email *</label>
              <input type="email" className="input" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
          )}
          <div>
            <label className="label">Rôle *</label>
            <select className="input" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
              {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          {!user && (
            <div>
              <label className="label">Mot de passe *</label>
              <input type="password" className="input" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Minimum 8 caractères" />
            </div>
          )}
        </div>
        <div className="flex gap-3 justify-end mt-5">
          <button onClick={onClose} className="btn-secondary">Annuler</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}
