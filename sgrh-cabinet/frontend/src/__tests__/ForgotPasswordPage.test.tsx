import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import api from '../services/api';

const mockApi = api as { post: ReturnType<typeof vi.fn> };

const renderPage = () =>
  render(
    <MemoryRouter>
      <ForgotPasswordPage />
    </MemoryRouter>
  );

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche le formulaire avec le champ email', () => {
    renderPage();
    expect(screen.getByText('Mot de passe oublié')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('votre@email.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /envoyer le lien/i })).toBeInTheDocument();
  });

  it('affiche un lien retour vers la connexion', () => {
    renderPage();
    expect(screen.getByText(/retour à la connexion/i)).toBeInTheDocument();
  });

  it('soumet le formulaire et affiche le message de confirmation', async () => {
    mockApi.post.mockResolvedValueOnce({ data: { message: 'Si cet email existe, un lien a été envoyé.' } });
    renderPage();

    await userEvent.type(screen.getByPlaceholderText('votre@email.com'), 'test@cabinet.bf');
    await userEvent.click(screen.getByRole('button', { name: /envoyer le lien/i }));

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/auth/forgot-password', { email: 'test@cabinet.bf' });
    });

    await waitFor(() => {
      expect(screen.getByText(/si cet email existe/i)).toBeInTheDocument();
    });
  });

  it('désactive le bouton pendant l\'envoi', async () => {
    mockApi.post.mockReturnValue(new Promise(() => {}));
    renderPage();

    await userEvent.type(screen.getByPlaceholderText('votre@email.com'), 'test@cabinet.bf');
    await userEvent.click(screen.getByRole('button', { name: /envoyer le lien/i }));

    expect(screen.getByRole('button', { name: /envoi en cours/i })).toBeDisabled();
  });
});
