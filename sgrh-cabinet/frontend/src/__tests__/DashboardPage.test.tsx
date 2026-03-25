import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from '../pages/dashboard/DashboardPage';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

vi.mock('../store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

const mockApi = api as { get: ReturnType<typeof vi.fn> };
const mockUseAuthStore = useAuthStore as unknown as ReturnType<typeof vi.fn>;

const dashboardData = {
  totalActive: 42,
  withEmail: 38,
  birthdaysThisMonth: [{ id: '1', first_name: 'Jean', last_name: 'Dupont', birth_date: '1990-03-15' }],
  contractsToRenew: [],
  byServiceLine: [
    { service_line: 'AUDIT_ASSURANCE', count: '20' },
    { service_line: 'CONSULTING_FA', count: '12' },
  ],
  byGender: [
    { gender: 'M', count: '25', percentage: '59.5' },
    { gender: 'F', count: '17', percentage: '40.5' },
  ],
  byAgeGroup: [
    { age_group: 'moins_25', count: '5' },
    { age_group: '25_35', count: '20' },
    { age_group: '36_45', count: '12' },
    { age_group: 'plus_45', count: '5' },
  ],
  recentHires: [],
  commercialStats: { total: 0, won: 0, pending: 0, win_rate: '0' },
};

const renderDashboard = () =>
  render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>
  );

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthStore.mockReturnValue({ user: { role: 'DRH' } });
  });

  it('affiche un spinner pendant le chargement', () => {
    mockApi.get.mockReturnValue(new Promise(() => {}));
    renderDashboard();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('affiche les stats après chargement', async () => {
    mockApi.get.mockResolvedValueOnce({ data: dashboardData });
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    expect(screen.getByText('38')).toBeInTheDocument();
    expect(screen.getByText('Effectif actif')).toBeInTheDocument();
    expect(screen.getByText('Avec email')).toBeInTheDocument();
  });

  it('affiche "1" anniversaire ce mois', async () => {
    mockApi.get.mockResolvedValueOnce({ data: dashboardData });
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Anniversaires ce mois')).toBeInTheDocument();
    });
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('affiche "0" contrats à renouveler', async () => {
    mockApi.get.mockResolvedValueOnce({ data: dashboardData });
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Contrats à renouveler')).toBeInTheDocument();
    });
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('affiche le titre Tableau de bord', async () => {
    mockApi.get.mockResolvedValueOnce({ data: dashboardData });
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Tableau de bord')).toBeInTheDocument();
    });
  });

  it('ne plante pas si l\'API échoue', async () => {
    mockApi.get.mockRejectedValueOnce(new Error('Network error'));
    renderDashboard();

    await waitFor(() => {
      expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
    });
  });
});
