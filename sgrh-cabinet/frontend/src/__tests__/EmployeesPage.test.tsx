import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import EmployeesPage from '../pages/personnel/EmployeesPage';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

vi.mock('../store/authStore', () => ({ useAuthStore: vi.fn() }));

const mockApi = api as { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn> };
const mockUseAuthStore = useAuthStore as unknown as ReturnType<typeof vi.fn>;

const fakeEmployees = {
  data: [
    {
      id: 'e1',
      matricule: 'EMP001',
      first_name: 'Jean',
      last_name: 'DUPONT',
      function: 'AUDITEUR',
      service_line: 'AUDIT_ASSURANCE',
      grade: 'JUNIOR',
      contract_type: 'CDI',
      entry_date: '2022-01-01',
      exit_date: null,
      status: 'ACTIF',
      gender: 'M',
      email: 'jean@cabinet.bf',
      phone: null,
    },
    {
      id: 'e2',
      matricule: 'EMP002',
      first_name: 'Sophie',
      last_name: 'MARTIN',
      function: 'MANAGER_PRINCIPAL',
      service_line: 'CONSULTING_FA',
      grade: 'SENIOR_2',
      contract_type: 'CDI',
      entry_date: '2018-06-15',
      exit_date: null,
      status: 'ACTIF',
      gender: 'F',
      email: 'sophie@cabinet.bf',
      phone: null,
    },
  ],
  total: 2,
  page: 1,
  totalPages: 1,
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <EmployeesPage />
    </MemoryRouter>
  );

describe('EmployeesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthStore.mockReturnValue({ user: { role: 'DRH', id: '1' } });
  });

  it('affiche un spinner pendant le chargement', () => {
    mockApi.get.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('affiche la liste des collaborateurs', async () => {
    mockApi.get.mockResolvedValueOnce({ data: fakeEmployees });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('DUPONT')).toBeInTheDocument();
    });
    expect(screen.getByText('MARTIN')).toBeInTheDocument();
    expect(screen.getByText('EMP001')).toBeInTheDocument();
    expect(screen.getByText('EMP002')).toBeInTheDocument();
  });

  it('affiche le nombre total de collaborateurs', async () => {
    mockApi.get.mockResolvedValueOnce({ data: fakeEmployees });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/2/)).toBeInTheDocument();
    });
  });

  it('affiche le champ de recherche', async () => {
    mockApi.get.mockResolvedValueOnce({ data: fakeEmployees });
    renderPage();

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/rechercher/i)).toBeInTheDocument();
    });
  });

  it('lance une nouvelle recherche à la saisie', async () => {
    mockApi.get.mockResolvedValue({ data: fakeEmployees });
    renderPage();

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/rechercher/i)).toBeInTheDocument();
    });

    await userEvent.type(screen.getByPlaceholderText(/rechercher/i), 'Jean');

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledTimes(2);
    });
  });

  it('affiche le bouton "Nouveau collaborateur" pour DRH', async () => {
    mockApi.get.mockResolvedValueOnce({ data: fakeEmployees });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/nouveau collaborateur/i)).toBeInTheDocument();
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
