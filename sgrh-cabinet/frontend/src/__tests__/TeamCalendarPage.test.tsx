import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TeamCalendarPage from '../pages/calendar/TeamCalendarPage';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

vi.mock('../store/authStore', () => ({ useAuthStore: vi.fn() }));

const mockApi = api as { get: ReturnType<typeof vi.fn> };
const mockUseAuthStore = useAuthStore as unknown as ReturnType<typeof vi.fn>;

const fakeEmployees = {
  data: [
    { id: 'e1', first_name: 'Issouf',  last_name: 'Sawadogo', service_line: 'AUDIT_ASSURANCE',  status: 'ACTIF' },
    { id: 'e2', first_name: 'Aïssata', last_name: 'Traoré',   service_line: 'AUDIT_ASSURANCE',  status: 'ACTIF' },
    { id: 'e3', first_name: 'Seydou',  last_name: 'Konaté',   service_line: 'ADMINISTRATION',   status: 'ACTIF' },
  ],
  total: 3,
};

const today = new Date();
const currentYear = today.getFullYear();
const currentMonth = String(today.getMonth() + 1).padStart(2, '0');

const fakeLeaves = [
  {
    id: 'l1',
    employee_id: 'e1',
    type: 'PLANIFIE',
    start_date: `${currentYear}-${currentMonth}-03`,
    end_date: `${currentYear}-${currentMonth}-07`,
    days: 5,
    status: 'APPROUVE',
    notes: null,
  },
  {
    id: 'l2',
    employee_id: 'e2',
    type: 'PLANIFIE',
    start_date: `${currentYear}-${currentMonth}-10`,
    end_date: `${currentYear}-${currentMonth}-12`,
    days: 3,
    status: 'APPROUVE',
    notes: null,
  },
  {
    id: 'l3',
    employee_id: 'e3',
    type: 'IMPRÉVU',
    start_date: `${currentYear}-${currentMonth}-17`,
    end_date: `${currentYear}-${currentMonth}-18`,
    days: 2,
    status: 'EN_ATTENTE',
    notes: 'Urgence familiale',
  },
];

const setupMocks = () => {
  // Employees call + leave calls for each employee
  mockApi.get
    .mockResolvedValueOnce({ data: fakeEmployees })
    .mockResolvedValueOnce({ data: [fakeLeaves[0]] })
    .mockResolvedValueOnce({ data: [fakeLeaves[1]] })
    .mockResolvedValueOnce({ data: [fakeLeaves[2]] });
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <TeamCalendarPage />
    </MemoryRouter>
  );

describe('TeamCalendarPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthStore.mockReturnValue({ user: { role: 'DRH' } });
  });

  it('affiche un spinner pendant le chargement', () => {
    mockApi.get.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('affiche le titre "Calendrier des congés"', async () => {
    setupMocks();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/calendrier/i)).toBeInTheDocument();
    });
  });

  it('affiche la grille calendrier avec les jours de la semaine', async () => {
    setupMocks();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Lun')).toBeInTheDocument();
    });
    expect(screen.getByText('Mar')).toBeInTheDocument();
    expect(screen.getByText('Mer')).toBeInTheDocument();
    expect(screen.getByText('Jeu')).toBeInTheDocument();
    expect(screen.getByText('Ven')).toBeInTheDocument();
  });

  it('affiche le mois et l\'année courants', async () => {
    setupMocks();
    renderPage();

    const monthNames = ['Janvier','Février','Mars','Avril','Mai','Juin',
                        'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
    const expectedMonth = monthNames[today.getMonth()];

    await waitFor(() => {
      expect(screen.getByText(new RegExp(expectedMonth, 'i'))).toBeInTheDocument();
    });
    expect(screen.getByText(new RegExp(String(currentYear)))).toBeInTheDocument();
  });

  it('affiche le congé approuvé d\'Issouf Sawadogo sur le calendrier', async () => {
    setupMocks();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Issouf/)).toBeInTheDocument();
    });
  });

  it('affiche le compteur de congés du mois', async () => {
    setupMocks();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/congé/i)).toBeInTheDocument();
    });
  });

  it('affiche les filtres (collaborateur, ligne de service)', async () => {
    setupMocks();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/tous les collaborateurs/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/toutes les lignes/i)).toBeInTheDocument();
  });

  it('affiche les boutons de navigation mois précédent/suivant', async () => {
    setupMocks();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Lun')).toBeInTheDocument();
    });

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(1);
  });

  it('ne plante pas si l\'API employés échoue', async () => {
    mockApi.get.mockRejectedValueOnce(new Error('Network error'));
    renderPage();

    await waitFor(() => {
      expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
    });
  });

  it('ne plante pas si aucun employé n\'est retourné', async () => {
    mockApi.get.mockResolvedValueOnce({ data: { data: [], total: 0 } });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/calendrier/i)).toBeInTheDocument();
    });
  });
});
