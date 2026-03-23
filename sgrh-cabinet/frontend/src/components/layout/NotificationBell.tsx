import { useState, useEffect, useRef } from 'react';
import { BellIcon, XMarkIcon } from '@heroicons/react/24/outline';
import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/solid';
import api from '../../services/api';

interface Notification {
  id: string;
  type: 'BIRTHDAY' | 'CONTRACT_END';
  title: string;
  body: string;
  employeeId: string;
  date: string;
  priority: 'INFO' | 'WARNING' | 'URGENT';
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('dismissed-notifications');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications || []);
    } catch {
      // silencieux si pas connecté
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Rafraîchissement toutes les 5 minutes
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Fermer en cliquant en dehors
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const visible = notifications.filter(n => !dismissed.has(n.id));
  const urgentCount = visible.filter(n => n.priority === 'URGENT').length;
  const badge = visible.length;

  const dismiss = (id: string) => {
    const next = new Set(dismissed).add(id);
    setDismissed(next);
    localStorage.setItem('dismissed-notifications', JSON.stringify([...next]));
  };

  const dismissAll = () => {
    const next = new Set([...dismissed, ...visible.map(n => n.id)]);
    setDismissed(next);
    localStorage.setItem('dismissed-notifications', JSON.stringify([...next]));
    setOpen(false);
  };

  const priorityIcon = (priority: Notification['priority']) => {
    if (priority === 'URGENT') return <ExclamationTriangleIcon className="w-4 h-4 text-red-500 flex-shrink-0" />;
    if (priority === 'WARNING') return <ExclamationTriangleIcon className="w-4 h-4 text-amber-500 flex-shrink-0" />;
    return <InformationCircleIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />;
  };

  const typeIcon = (type: Notification['type']) => {
    if (type === 'BIRTHDAY') return <CalendarDaysIcon className="w-4 h-4 text-pink-500 flex-shrink-0" />;
    return <ExclamationTriangleIcon className="w-4 h-4 text-orange-500 flex-shrink-0" />;
  };

  const priorityBorder = (priority: Notification['priority']) => {
    if (priority === 'URGENT') return 'border-l-2 border-red-400';
    if (priority === 'WARNING') return 'border-l-2 border-amber-400';
    return 'border-l-2 border-blue-300';
  };

  return (
    <div ref={ref} className="relative" data-testid="notification-bell">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <BellIcon className="w-5 h-5" />
        {badge > 0 && (
          <span
            className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] text-[10px] font-bold text-white rounded-full flex items-center justify-center px-1 ${
              urgentCount > 0 ? 'bg-red-500' : 'bg-amber-500'
            }`}
          >
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden animate-fade-in">
          {/* En-tête */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <BellIcon className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-semibold text-gray-800">
                Alertes {badge > 0 && `(${badge})`}
              </span>
            </div>
            {badge > 0 && (
              <button
                onClick={dismissAll}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Tout marquer lu
              </button>
            )}
          </div>

          {/* Corps */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-gray-200 border-t-brand-500 rounded-full animate-spin" />
              </div>
            ) : visible.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-3">
                  <BellIcon className="w-6 h-6 text-green-400" />
                </div>
                <p className="text-sm font-medium text-gray-600">Aucune alerte</p>
                <p className="text-xs text-gray-400 mt-1">Tous les indicateurs sont au vert</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {visible.map(n => (
                  <li
                    key={n.id}
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${priorityBorder(n.priority)}`}
                  >
                    <div className="mt-0.5 flex gap-1">
                      {typeIcon(n.type)}
                      {priorityIcon(n.priority)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 leading-snug">{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.body}</p>
                    </div>
                    <button
                      onClick={() => dismiss(n.id)}
                      className="mt-0.5 text-gray-300 hover:text-gray-500 flex-shrink-0"
                      aria-label="Ignorer"
                    >
                      <XMarkIcon className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Pied */}
          {visible.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-400 text-center">
                Mis à jour automatiquement toutes les 5 minutes
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
