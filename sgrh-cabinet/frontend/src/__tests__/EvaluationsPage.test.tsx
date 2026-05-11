import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import EvaluationsPage from '../pages/evaluations/EvaluationsPage';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

vi.mock('../store/authStore', () => ({ useAuthStore: vi.fn() }));

const mockApi = api as { get: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> };
const mockUseAuthStore = useAuthStore as unknown as ReturnType<typeof vi.fn>;

const fakeEvaluations = [
  {
    id: 'ev1',
    employee_id: 'e1',
    employee_name: 'Issouf SAWADOGO',
    employee_function: 'AUDITEUR',
    employee_service_line: 'AUDIT_ASSURANCE',
    evaluator_name: 'Catherine Sawadogo',
    year: new Date().getFullYear(),
    period: 'ANNUEL',
    status: 'TERMINE',
    overall_score: 16.5,
    objectives_score: 17.0,
    skills_score: 16.0,
    behavior_score: 16.5,
    comments: 'Excellente performance.',
    objectives: 'Conduire 3 missions.',
    strengths: 'Autonomie, rigueur.',
    improvements: 'Management.',
    created_at: '2026-01-10T10:00:00Z',
  },
  {
    id: 'ev2',
    employee_id: 'e2',
    employee_name: 'Mariam COMPAORÉ',
    employee_function: 'MANAGER_PRINCIPAL',
    employee_service_line: 'CONSULTING_FA',
    evaluator_name: 'Catherine Sawadogo',
    year: new Date().getFullYear(),
    period: 'MI_ANNUEL',
    status: 'EN_COURS',
    overall_score: null,
    objectives_score: 17.0,
    skills_score: null,
    behavior_score: null,
    comments: null,
    objectives: 'Développer le portefeuille.',
    strengths: null,
    improvements: null,
    created_at: '2026-02-01T10:00:00Z',
  },
  {
    id: 'ev3',
    employee_id: 'e3',
    employee_name: 'Aïssata TRAORÉ',
    employee_function: 'AUDITEUR',
    employee_service_line: 'AUDIT_ASSURANCE',
    evaluator_name: 'Catherine Sawadogo',
    year: new Date().getFullYear(),
    period: 'ANNUEL',
    status: 'BROUILLON',
    overall_score: null,
    objectives_score: null,
    skills_score: null,
    behavior_score: null,
    comments: null,
    objectives: null,
    strengths: null,
    improvements: null,
    created_at: '2026-03-01T10:00:00Z',
  },
];

const renderPage = () =>
  render(
    <MemoryRouter>
      <EvaluationsPage />
    </MemoryRouter>
  );

describe('EvaluationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthStore.mockReturnValue({ user: { role: 'DRH' } });
  });

  it('affiche un spinner pendant le chargement', () => {
    mockApi.get.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('affiche la liste des évaluations après chargement', async () => {
    mockApi.get.mockResolvedValueOnce({ data: fakeEvaluations });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Issouf SAWADOGO')).toBeInTheDocument();
    });
    expect(screen.getByText('Mariam COMPAORÉ')).toBeInTheDocument();
    expect(screen.getByText('Aïssata TRAORÉ')).toBeInTheDocument();
  });

  it('affiche les statuts avec badge coloré', async () => {
    mockApi.get.mockResolvedValueOnce({ data: fakeEvaluations });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Terminé')).toBeInTheDocument();
    });
    expect(screen.getByText('En cours')).toBeInTheDocument();
    expect(screen.getByText('Brouillon')).toBeInTheDocument();
  });

  it('affiche le score moyen des évaluations terminées', async () => {
    mockApi.get.mockResolvedValueOnce({ data: fakeEvaluations });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Moyenne/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/16\.5\/20/i)).toBeInTheDocument();
  });

  it('affiche le résumé nombre d\'évaluations / terminées', async () => {
    mockApi.get.mockResolvedValueOnce({ data: fakeEvaluations });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/3 évaluation\(s\)/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/1 terminée\(s\)/i)).toBeInTheDocument();
  });

  it('affiche le bouton "Nouvelle évaluation" pour DRH', async () => {
    mockApi.get.mockResolvedValueOnce({ data: fakeEvaluations });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/nouvelle évaluation/i)).toBeInTheDocument();
    });
  });

  it('n\'affiche pas le bouton Nouvelle évaluation pour UTILISATEUR', async () => {
    mockUseAuthStore.mockReturnValue({ user: { role: 'UTILISATEUR' } });
    mockApi.get.mockResolvedValueOnce({ data: fakeEvaluations });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Issouf SAWADOGO')).toBeInTheDocument();
    });
    expect(screen.queryByText(/nouvelle évaluation/i)).not.toBeInTheDocument();
  });

  it('le filtre par année affiche l\'année courante par défaut', async () => {
    mockApi.get.mockResolvedValueOnce({ data: fakeEvaluations });
    renderPage();

    await waitFor(() => {
      expect(screen.getByDisplayValue(String(new Date().getFullYear()))).toBeInTheDocument();
    });
  });

  it('change l\'année et recharge les données', async () => {
    mockApi.get.mockResolvedValue({ data: fakeEvaluations });
    renderPage();

    await waitFor(() => {
      expect(screen.getByDisplayValue(String(new Date().getFullYear()))).toBeInTheDocument();
    });

    const selects = screen.getAllByRole('combobox');
    const yearSelect = selects.find(s => s.getAttribute('class')?.includes('input') && (s as HTMLSelectElement).value === String(new Date().getFullYear()));
    if (yearSelect) {
      await userEvent.selectOptions(yearSelect, String(new Date().getFullYear() - 1));
      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalledTimes(2);
      });
    }
  });

  it('ne plante pas si l\'API échoue', async () => {
    mockApi.get.mockRejectedValueOnce(new Error('Network error'));
    renderPage();

    await waitFor(() => {
      expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
    });
  });

  it('affiche "Aucune évaluation" si la liste est vide', async () => {
    mockApi.get.mockResolvedValueOnce({ data: [] });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/aucune évaluation/i)).toBeInTheDocument();
    });
  });
});
