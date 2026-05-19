import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-6xl font-bold text-brand-600">404</p>
        <h1 className="mt-4 text-2xl font-semibold text-gray-900">Page introuvable</h1>
        <p className="mt-2 text-gray-500">La page que vous recherchez n'existe pas ou a été déplacée.</p>
        <button
          onClick={() => navigate('/', { replace: true })}
          className="mt-6 btn-primary"
        >
          Retour au tableau de bord
        </button>
      </div>
    </div>
  );
}
