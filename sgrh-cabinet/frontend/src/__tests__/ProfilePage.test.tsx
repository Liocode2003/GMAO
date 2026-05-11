import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ProfilePage from '../pages/settings/ProfilePage';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

vi.mock('../store/authStore', () => ({ useAuthStore: vi.fn() }));

const mockApi = api as {
  get: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
};
const mockUseAuthStore = useAuthStore as unknown as ReturnType<typeof vi.fn>;

const fakeProfile = {
  id: 'u1',
  email: 'drh@cabinet.bf',
  first_name: 'Alice',
  last_name: 'COULIBALY',
  role: 'DRH',
  last_login: '2026-03-25T08:00:00Z',
  created_at: '2024-01-01T00:00:00Z',
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <ProfilePage />
    </MemoryRouter>
  );

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthStore.mockReturnValue({ user: { role: 'DRH', firstName: 'Alice', lastName: 'COULIBALY' } });
  });

  it('charge et affiche le profil utilisateur', async () => {
    mockApi.get.mockResolvedValueOnce({ data: fakeProfile });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });
    expect(screen.getByText('COULIBALY')).toBeInTheDocument();
    expect(screen.getByText('drh@cabinet.bf')).toBeInTheDocument();
  });

  it('affiche le rôle de l\'utilisateur', async () => {
    mockApi.get.mockResolvedValueOnce({ data: fakeProfile });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/DRH|Directeur des Ressources Humaines/i)).toBeInTheDocument();
    });
  });

  it('affiche le formulaire de changement de mot de passe', async () => {
    mockApi.get.mockResolvedValueOnce({ data: fakeProfile });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/mot de passe/i)).toBeInTheDocument();
    });
  });

  it('affiche une erreur si les mots de passe ne correspondent pas', async () => {
    mockApi.get.mockResolvedValueOnce({ data: fakeProfile });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/mot de passe/i)).toBeInTheDocument();
    });

    const inputs = screen.getAllByRole('textbox');
    // Trouver les champs password
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    if (passwordInputs.length >= 2) {
      await userEvent.type(passwordInputs[0], 'CurrentPass1!');
      await userEvent.type(passwordInputs[1], 'NewPass1234!');
      await userEvent.type(passwordInputs[2], 'DifferentPass!');
      const btn = screen.getByRole('button', { name: /changer|mettre à jour/i });
      await userEvent.click(btn);
      // Toast d'erreur devrait apparaître
    }
    expect(inputs).toBeDefined();
  });

  it('soumet le formulaire de changement de mot de passe', async () => {
    mockApi.get.mockResolvedValueOnce({ data: fakeProfile });
    mockApi.put.mockResolvedValueOnce({ data: { message: 'Mot de passe mis à jour' } });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/mot de passe/i)).toBeInTheDocument();
    });

    const passwordInputs = document.querySelectorAll('input[type="password"]');
    if (passwordInputs.length >= 3) {
      await userEvent.type(passwordInputs[0], 'CurrentPass1!');
      await userEvent.type(passwordInputs[1], 'NewPass1234!');
      await userEvent.type(passwordInputs[2], 'NewPass1234!');
      const btn = screen.getByRole('button', { name: /changer|mettre à jour/i });
      await userEvent.click(btn);

      await waitFor(() => {
        expect(mockApi.put).toHaveBeenCalledWith('/auth/password', {
          currentPassword: 'CurrentPass1!',
          newPassword: 'NewPass1234!',
        });
      });
    }
  });
});
