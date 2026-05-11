import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ReportingCommercialPage from '../pages/commercial/ReportingCommercialPage';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

vi.mock('../store/authStore', () => ({ useAuthStore: vi.fn() }));

const mockApi = api as { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> };
const mockUseAuthStore = useAuthStore as unknown as ReturnType<typeof vi.fn>;

const fakeAMI = [
  {
    id: 's1',
    type: 'AMI',
    reference: 'AMI-2026-001',
    title: 'Audit consolidé Groupe Coris',
    client: 'Coris Bank International',
    submission_date: '2026-01-20',
    service_line: 'AUDIT_ASSURANCE',
    responsible_employee_id: 'e1',
    responsible_name: 'François Ouattara',
    status: 'GAGNE',
    contract_amount: 62000000,
    contract_start_date: '2026-03-01',
    contract_end_date: '2026-12-31',
    created_at: '2026-01-20T10:00:00Z',
  },
  {
    id: 's2',
    type: 'AMI',
    reference: 'AMI-2026-002',
    title: 'Assistance juridique ARCEP',
    client: 'ARCEP',
    submission_date: '2026-02-05',
    service_line: 'JURIDIQUE_FISCALITE',
    responsible_employee_id: 'e2',
    responsible_name: 'Yves Belem',
    status: 'EN_COURS',
    contract_amount: null,
    contract_start_date: null,
    contract_end_date: null,
    created_at: '2026-02-05T10:00:00Z',
  },
];

const fakeStats = {
  AMI: { total: 2, GAGNE: 1, EN_COURS: 1, PERDU: 0, totalAmount: 62000000 },
  APPEL_OFFRE: { total: 2, GAGNE: 1, EN_COURS: 1, PERDU: 0, totalAmount: 35000000 },
};

const fakeEmployees = [
  { id: 'e1', first_name: 'François', last_name: 'Ouattara', status: 'ACTIF' },
  { id: 'e2', first_name: 'Yves',     last_name: 'Belem',    status: 'ACTIF' },
];

const renderPage = () =>
  render(
    <MemoryRouter>
      <ReportingCommercialPage />
    </MemoryRouter>
  );

describe('ReportingCommercialPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthStore.mockReturnValue({ user: { role: 'DRH' } });
  });

  it('affiche un spinner pendant le chargement', () => {
    mockApi.get.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('affiche les onglets AMI et Appels d\'offre', async () => {
    mockApi.get
      .mockResolvedValueOnce({ data: fakeAMI })
      .mockResolvedValueOnce({ data: fakeStats })
      .mockResolvedValueOnce({ data: fakeEmployees });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/AMI/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Appels d'offre/i)).toBeInTheDocument();
  });

  it('affiche les soumissions AMI', async () => {
    mockApi.get
      .mockResolvedValueOnce({ data: fakeAMI })
      .mockResolvedValueOnce({ data: fakeStats })
      .mockResolvedValueOnce({ data: fakeEmployees });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Audit consolidé Groupe Coris')).toBeInTheDocument();
    });
    expect(screen.getByText('AMI-2026-001')).toBeInTheDocument();
    expect(screen.getByText('Assistance juridique ARCEP')).toBeInTheDocument();
  });

  it('affiche les statuts colorés (GAGNE, EN_COURS)', async () => {
    mockApi.get
      .mockResolvedValueOnce({ data: fakeAMI })
      .mockResolvedValueOnce({ data: fakeStats })
      .mockResolvedValueOnce({ data: fakeEmployees });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/gagné/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/en cours/i)).toBeInTheDocument();
  });

  it('affiche le montant pour les DRH (canViewAmounts)', async () => {
    mockApi.get
      .mockResolvedValueOnce({ data: fakeAMI })
      .mockResolvedValueOnce({ data: fakeStats })
      .mockResolvedValueOnce({ data: fakeEmployees });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Audit consolidé Groupe Coris')).toBeInTheDocument();
    });
    expect(screen.getByText(/62/)).toBeInTheDocument();
  });

  it('masque les montants pour un UTILISATEUR', async () => {
    mockUseAuthStore.mockReturnValue({ user: { role: 'UTILISATEUR' } });
    mockApi.get
      .mockResolvedValueOnce({ data: fakeAMI })
      .mockResolvedValueOnce({ data: fakeStats })
      .mockResolvedValueOnce({ data: fakeEmployees });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Audit consolidé Groupe Coris')).toBeInTheDocument();
    });
    expect(screen.queryByText(/62 000 000/)).not.toBeInTheDocument();
  });

  it('affiche le bouton "Nouvelle soumission" pour DRH', async () => {
    mockApi.get
      .mockResolvedValueOnce({ data: fakeAMI })
      .mockResolvedValueOnce({ data: fakeStats })
      .mockResolvedValueOnce({ data: fakeEmployees });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/nouvelle/i)).toBeInTheDocument();
    });
  });

  it('bascule vers l\'onglet Appels d\'offre', async () => {
    mockApi.get
      .mockResolvedValueOnce({ data: fakeAMI })
      .mockResolvedValueOnce({ data: fakeStats })
      .mockResolvedValueOnce({ data: fakeEmployees })
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: fakeStats });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Appels d'offre/i)).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText(/Appels d'offre/i));

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledTimes(2);
    });
  });

  it('ne plante pas si l\'API échoue', async () => {
    mockApi.get.mockRejectedValueOnce(new Error('Network error'));
    renderPage();

    await waitFor(() => {
      expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
    });
  });
});
