import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../services/api';
import {
  SERVICE_LINE_LABELS, FUNCTION_LABELS, GRADE_LABELS, CONTRACT_LABELS, MARITAL_STATUS_LABELS, Employee,
} from '../../types';
import { ArrowLeftIcon, ExclamationTriangleIcon, CameraIcon, UserIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../../store/authStore';

type FormData = {
  matricule: string;
  first_name: string;
  last_name: string;
  gender: string;
  email: string;
  phone: string;
  birth_date: string;
  function: string;
  service_line: string;
  grade: string;
  contract_type: string;
  entry_date: string;
  exit_date: string;
  salary: string;
  notes: string;
  has_dec_french: boolean;
  has_decofi: boolean;
  has_other_dec: boolean;
  has_cisa: boolean;
  has_cfa: boolean;
  department: string;
  is_expatriate: boolean;
  // Nouveaux champs v2
  manager_id: string;
  marital_status: string;
  spouse_name: string;
  spouse_phone: string;
  children_count: string;
};

export default function EmployeeFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuthStore();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [duplicate, setDuplicate] = useState<{ message: string } | null>(null);
  const [confirmDuplicate, setConfirmDuplicate] = useState(false);
  const [managers, setManagers] = useState<Pick<Employee, 'id' | 'first_name' | 'last_name'>[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const canEditSalary = ['DRH', 'DIRECTION_GENERALE'].includes(user?.role || '');

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: { marital_status: 'CELIBATAIRE', gender: 'M', children_count: '0' },
  });

  const maritalStatus = watch('marital_status');

  useEffect(() => {
    // Charger la liste des managers (tous les collaborateurs actifs)
    api.get('/employees', { params: { status: 'ACTIF', limit: '500' } }).then(({ data }) => {
      setManagers(data.data);
    }).catch(() => {});

    if (isEdit) {
      api.get(`/employees/${id}`).then(({ data }) => {
        reset({
          ...data,
          salary: data.salary ? String(data.salary) : '',
          exit_date: data.exit_date ? data.exit_date.split('T')[0] : '',
          birth_date: data.birth_date ? data.birth_date.split('T')[0] : '',
          entry_date: data.entry_date ? data.entry_date.split('T')[0] : '',
          children_count: data.children_count != null ? String(data.children_count) : '0',
          manager_id: data.manager_id || '',
          marital_status: data.marital_status || 'CELIBATAIRE',
        });
        if (data.photo_url) setPhotoPreview(data.photo_url);
      });
    }
  }, [id, isEdit, reset]);

  const firstName = watch('first_name');
  const lastName = watch('last_name');
  const birthDate = watch('birth_date');
  const emailVal = watch('email');
  const matriculeVal = watch('matricule');

  const checkDuplicates = async () => {
    if (!firstName || !lastName || !birthDate) return;
    try {
      const { data } = await api.get('/employees/check-duplicates', {
        params: { first_name: firstName, last_name: lastName, birth_date: birthDate, email: emailVal, matricule: matriculeVal },
      });
      if (data.hasDuplicates && !isEdit) {
        const messages = [];
        if (data.duplicates.email) messages.push('Email déjà utilisé');
        if (data.duplicates.matricule) messages.push('Matricule déjà utilisé');
        if (data.duplicates.nameAndBirthDate) messages.push('Nom + date de naissance identiques à un collaborateur existant');
        setDuplicate({ message: messages.join(' | ') });
      } else {
        setDuplicate(null);
      }
    } catch {}
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
  };

  const onSubmit = async (formData: FormData) => {
    if (duplicate && !confirmDuplicate) {
      toast.error('Confirmez d\'abord le doublon potentiel');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        salary: canEditSalary && formData.salary ? parseFloat(formData.salary) : undefined,
        exit_date: formData.exit_date || null,
        manager_id: formData.manager_id || null,
        children_count: parseInt(formData.children_count) || 0,
        spouse_name: formData.marital_status === 'MARIE' ? (formData.spouse_name || null) : null,
        spouse_phone: formData.marital_status === 'MARIE' ? (formData.spouse_phone || null) : null,
      };
      if (!canEditSalary) delete payload.salary;

      let employeeId = id;
      if (isEdit) {
        await api.put(`/employees/${id}`, payload);
        toast.success('Collaborateur mis à jour');
      } else {
        const { data } = await api.post('/employees', payload);
        employeeId = data.id;
        toast.success('Collaborateur créé avec succès');
      }

      // Upload photo si sélectionnée
      if (photoFile && employeeId) {
        const formDataPhoto = new FormData();
        formDataPhoto.append('photo', photoFile);
        await api.post(`/employees/${employeeId}/photo`, formDataPhoto, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      navigate('/personnel');
    } catch {
      // Error handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="btn-secondary p-2">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {isEdit ? 'Modifier le collaborateur' : 'Nouveau collaborateur'}
          </h2>
          <p className="text-gray-500 text-sm">Remplissez tous les champs obligatoires *</p>
        </div>
      </div>

      {duplicate && !confirmDuplicate && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-amber-800 font-medium text-sm">Doublon potentiel détecté</p>
            <p className="text-amber-700 text-sm mt-1">{duplicate.message}</p>
            <button
              onClick={() => setConfirmDuplicate(true)}
              className="mt-2 text-xs text-amber-700 underline hover:no-underline"
            >
              Continuer quand même
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* Photo de profil */}
        <div className="card">
          <h3 className="text-base font-semibold text-gray-700 mb-4 pb-2 border-b">Photo de profil</h3>
          <div className="flex items-center gap-6">
            <div
              className="w-24 h-24 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-brand-400 transition-colors"
              onClick={() => photoInputRef.current?.click()}
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Photo" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center">
                  <UserIcon className="w-8 h-8 text-gray-300 mx-auto" />
                </div>
              )}
            </div>
            <div>
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="btn-secondary gap-2 text-sm"
              >
                <CameraIcon className="w-4 h-4" />
                {photoPreview ? 'Changer la photo' : 'Ajouter une photo'}
              </button>
              <p className="text-xs text-gray-400 mt-1">JPEG, PNG ou WebP — 5 Mo max</p>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>
          </div>
        </div>

        {/* Identité */}
        <div className="card">
          <h3 className="text-base font-semibold text-gray-700 mb-4 pb-2 border-b">Identité</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="label">Matricule *</label>
              <input className="input" {...register('matricule', { required: true })} placeholder="MAT-2024-001" />
              {errors.matricule && <p className="text-red-500 text-xs mt-1">Requis</p>}
            </div>
            <div>
              <label className="label">Nom *</label>
              <input className="input" {...register('last_name', { required: true })}
                onBlur={checkDuplicates} placeholder="KONÉ" />
              {errors.last_name && <p className="text-red-500 text-xs mt-1">Requis</p>}
            </div>
            <div>
              <label className="label">Prénoms *</label>
              <input className="input" {...register('first_name', { required: true })}
                onBlur={checkDuplicates} placeholder="Aminata" />
              {errors.first_name && <p className="text-red-500 text-xs mt-1">Requis</p>}
            </div>
            <div>
              <label className="label">Sexe *</label>
              <select className="input" {...register('gender', { required: true })}>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </div>
            <div>
              <label className="label">Date de naissance *</label>
              <input type="date" className="input" {...register('birth_date', { required: true })}
                onBlur={checkDuplicates} />
              {errors.birth_date && <p className="text-red-500 text-xs mt-1">Requis</p>}
            </div>
            <div>
              <label className="label">Téléphone</label>
              <input className="input" {...register('phone')} placeholder="+225 07 XX XX XX" />
            </div>
          </div>
        </div>

        {/* Situation personnelle */}
        <div className="card">
          <h3 className="text-base font-semibold text-gray-700 mb-4 pb-2 border-b">Situation personnelle</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="label">Situation matrimoniale</label>
              <select className="input" {...register('marital_status')}>
                {Object.entries(MARITAL_STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            {maritalStatus === 'MARIE' && (
              <>
                <div>
                  <label className="label">Nom du / de la conjoint(e)</label>
                  <input className="input" {...register('spouse_name')} placeholder="Nom complet" />
                </div>
                <div>
                  <label className="label">Téléphone du / de la conjoint(e)</label>
                  <input className="input" {...register('spouse_phone')} placeholder="+225 07 XX XX XX" />
                </div>
              </>
            )}
            <div>
              <label className="label">Nombre d'enfants</label>
              <input type="number" min="0" className="input" {...register('children_count')} placeholder="0" />
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="card">
          <h3 className="text-base font-semibold text-gray-700 mb-4 pb-2 border-b">Contact</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Email professionnel</label>
              <input type="email" className="input" {...register('email')}
                onBlur={checkDuplicates} placeholder="prenom.nom@cabinet.ci" />
            </div>
          </div>
        </div>

        {/* Poste */}
        <div className="card">
          <h3 className="text-base font-semibold text-gray-700 mb-4 pb-2 border-b">Poste & Contrat</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="label">Fonction *</label>
              <select className="input" {...register('function', { required: true })}>
                <option value="">Sélectionner</option>
                {Object.entries(FUNCTION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              {errors.function && <p className="text-red-500 text-xs mt-1">Requis</p>}
            </div>
            <div>
              <label className="label">Ligne de service *</label>
              <select className="input" {...register('service_line', { required: true })}>
                <option value="">Sélectionner</option>
                {Object.entries(SERVICE_LINE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              {errors.service_line && <p className="text-red-500 text-xs mt-1">Requis</p>}
            </div>
            <div>
              <label className="label">Grade *</label>
              <select className="input" {...register('grade', { required: true })}>
                <option value="">Sélectionner</option>
                {Object.entries(GRADE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              {errors.grade && <p className="text-red-500 text-xs mt-1">Requis</p>}
            </div>
            <div>
              <label className="label">Type de contrat *</label>
              <select className="input" {...register('contract_type', { required: true })}>
                <option value="">Sélectionner</option>
                {Object.entries(CONTRACT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              {errors.contract_type && <p className="text-red-500 text-xs mt-1">Requis</p>}
            </div>
            <div>
              <label className="label">Date d'entrée *</label>
              <input type="date" className="input" {...register('entry_date', { required: true })} />
              {errors.entry_date && <p className="text-red-500 text-xs mt-1">Requis</p>}
            </div>
            <div>
              <label className="label">Date de sortie
                <span className="ml-1 text-xs text-gray-400 font-normal">(détermine le statut)</span>
              </label>
              <input type="date" className="input" {...register('exit_date')} />
            </div>
            {canEditSalary && (
              <div>
                <label className="label">Salaire (FCFA)</label>
                <input type="number" className="input" {...register('salary')} placeholder="0" min="0" />
              </div>
            )}
            <div>
              <label className="label">Département / Équipe</label>
              <input className="input" {...register('department')} placeholder="Audit, Tax, IT..." />
            </div>
            <div>
              <label className="label">Supérieur hiérarchique</label>
              <select className="input" {...register('manager_id')}>
                <option value="">Aucun</option>
                {managers.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.last_name} {m.first_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <input type="checkbox" id="is_expatriate" {...register('is_expatriate')} className="rounded" />
            <label htmlFor="is_expatriate" className="text-sm text-gray-700">Associé expatrié (Carl)</label>
          </div>
        </div>

        {/* Diplômes */}
        <div className="card">
          <h3 className="text-base font-semibold text-gray-700 mb-4 pb-2 border-b">Diplômes professionnels</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { field: 'has_dec_french' as const, label: 'DEC Français' },
              { field: 'has_decofi' as const, label: 'DECOFI' },
              { field: 'has_other_dec' as const, label: 'Autre DEC' },
              { field: 'has_cisa' as const, label: 'CISA' },
              { field: 'has_cfa' as const, label: 'CFA' },
            ].map(({ field, label }) => (
              <label key={field} className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                <input type="checkbox" {...register(field)} className="rounded" />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="card">
          <h3 className="text-base font-semibold text-gray-700 mb-4 pb-2 border-b">Notes</h3>
          <textarea
            className="input h-24 resize-none"
            placeholder="Informations complémentaires..."
            {...register('notes')}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pb-6">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
            Annuler
          </button>
          <button type="submit" disabled={loading} className="btn-primary px-8">
            {loading ? 'Enregistrement...' : (isEdit ? 'Mettre à jour' : 'Créer le collaborateur')}
          </button>
        </div>
      </form>
    </div>
  );
}
