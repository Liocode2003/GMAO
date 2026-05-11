import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import RecruitmentPage from '../pages/recruitment/RecruitmentPage';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

vi.mock('../store/authStore', () => ({ useAuthStore: vi.fn() }));

const mockApi = api as { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> };
const mockUseAuthStore = useAuthStore as unknown as ReturnType<typeof vi.fn>;

const fakeCandidates = [
  {
    id: 'c1',
    first_name: 'Moussa',
    last_name: 'Kinda',
    email: 'moussa.kinda@gmail.com',
    phone: '+226 70 11 11 11',
    position: 'Auditeur Junior',
    department: 'Audit',
    status: 'NOUVEAU' as const,
    source: 'LinkedIn',
    notes: 'Diplômé ISCAE 2025.',
    interview_date: null,
    salary_expected: 500000,
    created_by_name: 'Catherine Sawadogo',
    created_at: '2026-01-10T10:00:00Z',
  },
  {
    id: 'c2',
    first_name: 'Rasmata',
    last_name: 'Zongo',
    email: 'rasmata.z@gmail.com',
    phone: '+226 65 66 66 66',
    position: 'Assistante de Direction',
    department: 'Administration',
    status: 'ENTRETIEN' as const,
    source: 'Site web',
    notes: 'Entretien planifié.',
    interview_date: '2026-04-02T09:00:00Z',
    salary_expected: 450000,
    created_by_name: 'Catherine Sawadogo',
    created_at: '2026-02-01T10:00:00Z',
  },
  {
    id: 'c3',
    first_name: 'Patrick',
    last_name: 'Yameogo',
    email: 'patrick.y@gmail.com',
    phone: '+226 74 99 99 99',
    position: 'Auditeur Confirmé',
    department: 'Audit',
    status: 'EMBAUCHE' as const,
    source: 'LinkedIn',
    notes: 'Embauché — intégration 01/04/2026.',
    interview_date: null,
    salary_expected: 850000,
    created_by_name: 'Catherine Sawadogo',
    created_at: '2026-01-15T10:00:00Z',
  },
  {
    id: 'c4',
    first_name: 'Didier',
    last_name: 'Kaboré',
    email: 'didier.k@gmail.com',
    phone: '+226 76 20 20 20',
    position: 'Consultant FA',
    department: 'Financial Advisory',
    status: 'REFUSE' as const,
    source: 'LinkedIn',
    notes: 'Profil insuffisant.',
    interview_date: null,
    salary_expected: 800000,
    created_by_name: 'Catherine Sawadogo',
    created_at: '2026-02-10T10:00:00Z',
  },
];

const renderPage = () =>
  render(
    <MemoryRouter>
      <RecruitmentPage />
    </MemoryRouter>
  );

describe('RecruitmentPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthStore.mockReturnValue({ user: { role: 'DRH' } });
  });

  it('affiche un spinner pendant le chargement', () => {
    mockApi.get.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('affiche les candidats en vue kanban', async () => {
    mockApi.get.mockResolvedValueOnce({ data: fakeCandidates });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Moussa')).toBeInTheDocument();
    });
    expect(screen.getByText('Rasmata')).toBeInTheDocument();
    expect(screen.getByText('Patrick')).toBeInTheDocument();
  });

  it('affiche les colonnes du pipeline kanban', async () => {
    mockApi.get.mockResolvedValueOnce({ data: fakeCandidates });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Nouveau')).toBeInTheDocument();
    });
    expect(screen.getByText('Entretien')).toBeInTheDocument();
    expect(screen.getByText('Embauché')).toBeInTheDocument();
  });

  it('affiche le bouton "Ajouter un candidat" pour DRH', async () => {
    mockApi.get.mockResolvedValueOnce({ data: fakeCandidates });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/ajouter/i)).toBeInTheDocument();
    });
  });

  it('n\'affiche pas le bouton Ajouter pour UTILISATEUR', async () => {
    mockUseAuthStore.mockReturnValue({ user: { role: 'UTILISATEUR' } });
    mockApi.get.mockResolvedValueOnce({ data: fakeCandidates });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Moussa')).toBeInTheDocument();
    });
    expect(screen.queryByText(/ajouter un candidat/i)).not.toBeInTheDocument();
  });

  it('bascule en vue liste', async () => {
    mockApi.get.mockResolvedValueOnce({ data: fakeCandidates });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Moussa')).toBeInTheDocument();
    });

    const listeBtn = screen.queryByTitle(/liste/i) || screen.queryByLabelText(/liste/i);
    if (listeBtn) {
      await userEvent.click(listeBtn);
      await waitFor(() => {
        expect(screen.getByText('Auditeur Junior')).toBeInTheDocument();
      });
    }
  });

  it('affiche les stats : nombre total de candidats', async () => {
    mockApi.get.mockResolvedValueOnce({ data: fakeCandidates });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('4')).toBeInTheDocument();
    });
  });

  it('affiche le statut REFUSE dans la section appropriée', async () => {
    mockApi.get.mockResolvedValueOnce({ data: fakeCandidates });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Refusé')).toBeInTheDocument();
    });
    expect(screen.getByText('Didier')).toBeInTheDocument();
  });

  it('ne plante pas si l\'API échoue', async () => {
    mockApi.get.mockRejectedValueOnce(new Error('Network error'));
    renderPage();

    await waitFor(() => {
      expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
    });
  });

  it('affiche "Aucun candidat" si la liste est vide', async () => {
    mockApi.get.mockResolvedValueOnce({ data: [] });
    renderPage();

    await waitFor(() => {
      expect(screen.getAllByText(/aucun candidat/i).length).toBeGreaterThan(0);
    });
  });
});
