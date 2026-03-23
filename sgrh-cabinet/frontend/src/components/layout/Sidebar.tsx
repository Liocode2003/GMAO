import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  HomeIcon,
  UsersIcon,
  ChartBarIcon,
  AcademicCapIcon,
  DocumentChartBarIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  XMarkIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';

interface NavItem {
  to: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  roles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', icon: HomeIcon, label: 'Tableau de bord' },
  { to: '/personnel', icon: UsersIcon, label: 'Personnel' },
  { to: '/kpis', icon: ChartBarIcon, label: 'KPIs & Statistiques' },
  { to: '/formations', icon: AcademicCapIcon, label: 'Formations' },
  { to: '/commercial', icon: BriefcaseIcon, label: 'Reporting Commercial' },
  { to: '/rapports', icon: DocumentChartBarIcon, label: 'Rapports', roles: ['DRH', 'DIRECTION_GENERALE'] },
];

const SETTINGS_ITEMS: NavItem[] = [
  { to: '/parametres/utilisateurs', icon: UserGroupIcon, label: 'Utilisateurs', roles: ['DRH', 'DIRECTION_GENERALE'] },
  { to: '/parametres/audit', icon: ClipboardDocumentListIcon, label: 'Journal d\'audit', roles: ['DRH', 'DIRECTION_GENERALE'] },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user } = useAuthStore();

  const canAccess = (roles?: string[]) => !roles || roles.includes(user?.role || '');

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-navy-800 transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-20 px-4 border-b border-white/10">
        <div className="flex items-center gap-3 flex-1">
          <img src="/logo-white.svg" alt="Forvis Mazars" className="h-10 w-auto object-contain" />
        </div>
        <button onClick={onClose} className="lg:hidden text-white/60 hover:text-white">
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 py-2 text-xs font-semibold text-white/40 uppercase tracking-wider">
          Principal
        </p>
        {NAV_ITEMS.map((item) =>
          canAccess(item.roles) ? (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                ${isActive
                  ? 'bg-brand-600 text-white'
                  : 'text-white/60 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {item.label}
            </NavLink>
          ) : null
        )}

        {(canAccess(['DRH', 'DIRECTION_GENERALE'])) && (
          <>
            <p className="px-3 py-2 mt-4 text-xs font-semibold text-white/40 uppercase tracking-wider">
              Administration
            </p>
            {SETTINGS_ITEMS.map((item) =>
              canAccess(item.roles) ? (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                    ${isActive
                      ? 'bg-brand-600 text-white'
                      : 'text-white/60 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {item.label}
                </NavLink>
              ) : null
            )}
          </>
        )}
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-white/50 text-xs truncate">{user?.role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
