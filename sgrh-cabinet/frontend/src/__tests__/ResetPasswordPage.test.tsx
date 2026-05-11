import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import api from '../services/api';

const mockApi = api as { post: ReturnType<typeof vi.fn> };

const renderWithToken = (token?: string) =>
  render(
    <MemoryRouter initialEntries={[token ? `/reset-password?token=${token}` : '/reset-password']}>
      <Routes>
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Routes>
    </MemoryRouter>
  );

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche un message d\'erreur si le token est absent', () => {
    renderWithToken();
    expect(screen.getByText(/lien invalide ou expiré/i)).toBeInTheDocument();
  });

  it('affiche le formulaire si le token est présent', () => {
    renderWithToken('abc123token');
    expect(screen.getByText('Nouveau mot de passe')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/au moins 8 caractères/i)).toBeInTheDocument();
  });

  it('affiche une erreur si les mots de passe ne correspondent pas', async () => {
    renderWithToken('abc123token');
    const [pwdInput, confirmInput] = screen.getAllByRole('textbox').length > 0
      ? [screen.getByPlaceholderText(/au moins 8/i), screen.getByPlaceholderText(/confirmer/i)]
      : [screen.getAllByDisplayValue('')[0], screen.getAllByDisplayValue('')[1]];

    await userEvent.type(pwdInput, 'Password1!');
    await userEvent.type(confirmInput, 'Different1!');
    await userEvent.click(screen.getByRole('button', { name: /réinitialiser/i }));

    await waitFor(() => {
      expect(mockApi.post).not.toHaveBeenCalled();
    });
  });

  it('soumet le formulaire avec token et nouveau mot de passe', async () => {
    mockApi.post.mockResolvedValueOnce({ data: { message: 'Mot de passe réinitialisé' } });
    renderWithToken('valid-token-xyz');

    const pwdInput = screen.getByPlaceholderText(/au moins 8 caractères/i);
    const confirmInput = screen.getByPlaceholderText(/confirmer le mot de passe/i);

    await userEvent.type(pwdInput, 'NewPass1234!');
    await userEvent.type(confirmInput, 'NewPass1234!');
    await userEvent.click(screen.getByRole('button', { name: /réinitialiser/i }));

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/auth/reset-password', {
        token: 'valid-token-xyz',
        newPassword: 'NewPass1234!',
      });
    });
  });
});
