import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import TrainingsPage from '../pages/trainings/TrainingsPage';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

vi.mock('../store/authStore', () => ({ useAuthStore: vi.fn() }));

const mockApi = api as { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> };
const mockUseAuthStore = useAuthStore as unknown as ReturnType<typeof vi.fn>;

const fakeTrainings = [
  {
    id: 't1',
    type: 'INTRA',
    title: 'Formation Excel avancé',
    date: '2026-03-10',
    location: 'Salle A',
    duration_hours: 8,
    trainer: 'M. Kaboré',
    participant_count: 12,
  },
  {
    id: 't2',
    type: 'INTERNE',
    title: 'Formation IFRS',
    date: '2026-02-15',
    location: 'Salle B',
    duration_hours: 16,
    trainer: 'Mme Sawadogo',
    participant_count: 8,
  },
];

const renderPage = () =>
  render(
    <MemoryRouter>
      <TrainingsPage />
    </MemoryRouter>
  );

describe('TrainingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthStore.mockReturnValue({ user: { role: 'DRH' } });
  });

  it('affiche un spinner pendant le chargement', () => {
    mockApi.get.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('affiche la liste des formations', async () => {
    mockApi.get.mockResolvedValueOnce({ data: fakeTrainings });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Formation Excel avancé')).toBeInTheDocument();
    });
    expect(screen.getByText('Formation IFRS')).toBeInTheDocument();
  });

  it('affiche les types de formations avec badge coloré', async () => {
    mockApi.get.mockResolvedValueOnce({ data: fakeTrainings });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('INTRA')).toBeInTheDocument();
    });
    expect(screen.getByText('INTERNE')).toBeInTheDocument();
  });

  it('affiche le bouton "Nouvelle formation" pour DRH', async () => {
    mockApi.get.mockResolvedValueOnce({ data: fakeTrainings });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/nouvelle formation/i)).toBeInTheDocument();
    });
  });

  it('le filtre par année est présent', async () => {
    mockApi.get.mockResolvedValueOnce({ data: fakeTrainings });
    renderPage();

    await waitFor(() => {
      expect(screen.getByDisplayValue(String(new Date().getFullYear()))).toBeInTheDocument();
    });
  });

  it('change l\'année et recharge les données', async () => {
    mockApi.get.mockResolvedValue({ data: fakeTrainings });
    renderPage();

    await waitFor(() => {
      expect(screen.getByDisplayValue(String(new Date().getFullYear()))).toBeInTheDocument();
    });

    const select = screen.getByDisplayValue(String(new Date().getFullYear()));
    await userEvent.selectOptions(select, String(new Date().getFullYear() - 1));

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledTimes(2);
    });
  });

  it('n\'affiche pas le bouton Nouvelle formation pour UTILISATEUR', async () => {
    mockUseAuthStore.mockReturnValue({ user: { role: 'UTILISATEUR' } });
    mockApi.get.mockResolvedValueOnce({ data: fakeTrainings });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Formation Excel avancé')).toBeInTheDocument();
    });
    expect(screen.queryByText(/nouvelle formation/i)).not.toBeInTheDocument();
  });
});
