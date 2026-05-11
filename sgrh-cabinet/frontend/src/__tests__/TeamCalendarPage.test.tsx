import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import TeamCalendarPage from '../pages/calendar/TeamCalendarPage';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

vi.mock('../store/authStore', () => ({ useAuthStore: vi.fn() }));

const mockApi = api as { get: ReturnType<typeof vi.fn>; patch: ReturnType<typeof vi.fn> };
const mockUseAuthStore = useAuthStore as unknown as ReturnType<typeof vi.fn>;

const fakeEmployees = {
  data: [
    { id: 'e1', first_name: 'Issouf',  last_name: 'Sawadogo', service_line: 'AUDIT_ASSURANCE',  status: 'ACTIF', email: 'issouf@cabinet.bf',  manager_id: null },
    { id: 'e2', first_name: 'Aïssata', last_name: 'Traoré',   service_line: 'AUDIT_ASSURANCE',  status: 'ACTIF', email: 'aissata@cabinet.bf', manager_id: 'e1' },
    { id: 'e3', first_name: 'Seydou',  last_name: 'Konaté',   service_line: 'ADMINISTRATION',   status: 'ACTIF', email: 'seydou@cabinet.bf',  manager_id: 'e1' },
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

const fakePending = [
  {
    id: 'l3',
    employee_id: 'e3',
    employee_name: 'Seydou Konaté',
    service_line: 'ADMINISTRATION',
    type: 'IMPRÉVU',
    start_date: `${currentYear}-${currentMonth}-17`,
    end_date: `${currentYear}-${currentMonth}-18`,
    days: 2,
    status: 'EN_ATTENTE',
    notes: 'Urgence familiale',
    manager_name: 'Issouf Sawadogo',
    created_by_name: 'Issouf Sawadogo',
  },
];

/** DRH: employees + 3 individual leave calls + pending */
const setupDRHMocks = () => {
  mockApi.get
    .mockResolvedValueOnce({ data: fakeEmployees })       // GET /employees
    .mockResolvedValueOnce({ data: [fakeLeaves[0]] })     // GET /leaves/employee/e1
    .mockResolvedValueOnce({ data: [fakeLeaves[1]] })     // GET /leaves/employee/e2
    .mockResolvedValueOnce({ data: [fakeLeaves[2]] })     // GET /leaves/employee/e3
    .mockResolvedValueOnce({ data: fakePending });         // GET /leaves/pending
};

/** MANAGER: employees + 3 individual leave calls (no pending) */
const setupManagerMocks = () => {
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
    mockUseAuthStore.mockReturnValue({ user: { role: 'DRH', email: 'drh@cabinet.bf' } });
  });

  it('affiche un spinner pendant le chargement', () => {
    mockApi.get.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('affiche le titre "Calendrier des congés"', async () => {
    setupDRHMocks();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/calendrier des congés/i)).toBeInTheDocument();
    });
  });

  it('affiche la grille calendrier avec les jours de la semaine', async () => {
    setupDRHMocks();
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
    setupDRHMocks();
    renderPage();

    const monthNames = ['Janvier','Février','Mars','Avril','Mai','Juin',
                        'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
    const expectedMonth = monthNames[today.getMonth()];

    await waitFor(() => {
      expect(screen.getByText(new RegExp(expectedMonth, 'i'))).toBeInTheDocument();
    });
    // Year appears in multiple places (selector, dates) — verify at least one match
    expect(screen.getAllByText(new RegExp(String(currentYear))).length).toBeGreaterThan(0);
  });

  it('affiche le congé approuvé d\'Issouf sur le calendrier', async () => {
    setupDRHMocks();
    renderPage();

    await waitFor(() => {
      expect(screen.getAllByText(/Issouf/).length).toBeGreaterThan(0);
    });
  });

  it('affiche le compteur de congés du mois', async () => {
    setupDRHMocks();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/congé/i)).toBeInTheDocument();
    });
  });

  it('affiche les filtres (collaborateur, ligne de service)', async () => {
    setupDRHMocks();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/tous les collaborateurs/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/toutes les lignes/i)).toBeInTheDocument();
  });

  it('affiche les boutons de navigation mois précédent/suivant', async () => {
    setupDRHMocks();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Lun')).toBeInTheDocument();
    });

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(1);
  });

  it('affiche les demandes en attente pour un DRH', async () => {
    setupDRHMocks();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/demandes en attente/i)).toBeInTheDocument();
    });
    // Seydou appears in the pending panel (may also appear in leave list/dropdown)
    expect(screen.getAllByText(/Seydou Konaté/).length).toBeGreaterThan(0);
  });

  it('affiche les boutons Approuver et Refuser (DRH)', async () => {
    setupDRHMocks();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/approuver/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/refuser/i)).toBeInTheDocument();
  });

  it('appelle PATCH /leaves/:id/approve lors d\'un clic sur Approuver', async () => {
    setupDRHMocks();
    mockApi.patch = vi.fn().mockResolvedValueOnce({ data: { message: 'Congé approuvé' } });
    // After approve, fetchData is called again
    mockApi.get
      .mockResolvedValueOnce({ data: fakeEmployees })
      .mockResolvedValueOnce({ data: [fakeLeaves[0]] })
      .mockResolvedValueOnce({ data: [fakeLeaves[1]] })
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [] });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/approuver/i)).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText(/approuver/i));

    await waitFor(() => {
      expect(mockApi.patch).toHaveBeenCalledWith(
        expect.stringContaining('/leaves/l3/approve'),
        { status: 'APPROUVE' }
      );
    });
  });

  it('affiche le bouton "Nouvelle demande" pour DRH', async () => {
    setupDRHMocks();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/nouvelle demande/i)).toBeInTheDocument();
    });
  });

  it('affiche le bouton "Nouvelle demande" pour MANAGER', async () => {
    mockUseAuthStore.mockReturnValue({ user: { role: 'MANAGER', email: 'issouf@cabinet.bf' } });
    setupManagerMocks();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/nouvelle demande/i)).toBeInTheDocument();
    });
  });

  it('le dropdown manager ne liste que les collaborateurs directs', async () => {
    mockUseAuthStore.mockReturnValue({ user: { role: 'MANAGER', email: 'issouf@cabinet.bf' } });
    setupManagerMocks();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/nouvelle demande/i)).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText(/nouvelle demande/i));

    await waitFor(() => {
      // The modal's employee select should only contain direct reports
      // Aïssata (manager_id='e1') and Seydou (manager_id='e1') → in modal select
      // Issouf (manager_id=null) → must NOT appear in the modal select
      const modal = document.querySelector('.fixed.inset-0');
      expect(modal).toBeInTheDocument();
      const modalOptions = modal!.querySelectorAll('select option');
      const modalOptionTexts = Array.from(modalOptions).map(o => o.textContent?.trim());
      expect(modalOptionTexts.some(t => t?.includes('Aïssata'))).toBe(true);
      expect(modalOptionTexts.some(t => t?.includes('Seydou'))).toBe(true);
      expect(modalOptionTexts.some(t => t?.includes('Issouf Sawadogo'))).toBe(false);
    });
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

  it('ne plante pas si /leaves/pending échoue', async () => {
    mockApi.get
      .mockResolvedValueOnce({ data: fakeEmployees })
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [] })
      .mockRejectedValueOnce(new Error('Forbidden'));
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/calendrier/i)).toBeInTheDocument();
    });
  });
});
