import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../pages/auth/LoginPage';
import { useAuthStore } from '../store/authStore';

// Mock du store d'authentification
vi.mock('../store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

const mockLogin = vi.fn();
const mockUseAuthStore = useAuthStore as unknown as ReturnType<typeof vi.fn>;

const renderLogin = () =>
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthStore.mockReturnValue({
      login: mockLogin,
      isLoading: false,
    });
  });

  it('affiche le formulaire de connexion', () => {
    renderLogin();
    expect(screen.getByRole('heading', { name: /connexion/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/votre@email\.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument();
  });

  it('affiche "Connexion..." et désactive le bouton pendant le chargement', () => {
    mockUseAuthStore.mockReturnValue({ login: mockLogin, isLoading: true });
    renderLogin();
    const btn = screen.getByRole('button', { name: /connexion\.\.\./i });
    expect(btn).toBeDisabled();
  });

  it('met à jour les champs email et mot de passe', async () => {
    renderLogin();
    const emailInput = screen.getByPlaceholderText(/votre@email\.com/i);
    const passwordInput = screen.getByPlaceholderText('••••••••');

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'Password123');

    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('Password123');
  });

  it('affiche/masque le mot de passe avec le bouton toggle', async () => {
    renderLogin();
    const passwordInput = screen.getByPlaceholderText('••••••••');
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleBtn = screen.getByRole('button', { name: '' }); // bouton icône sans texte
    await userEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'text');

    await userEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('appelle login avec email et mot de passe lors de la soumission', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    renderLogin();

    await userEvent.type(screen.getByPlaceholderText(/votre@email\.com/i), 'drh@cabinet.ci');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'Admin123!');
    await userEvent.click(screen.getByRole('button', { name: /se connecter/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('drh@cabinet.ci', 'Admin123!');
    });
  });

  it('appelle login lors de la soumission du formulaire via submit event', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    renderLogin();
    await userEvent.type(screen.getByPlaceholderText(/votre@email\.com/i), 'test@test.ci');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'Pass123!');
    fireEvent.submit(screen.getByRole('button', { name: /se connecter/i }).closest('form')!);
    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith('test@test.ci', 'Pass123!'));
  });

  it('affiche le branding Forvis Mazars', () => {
    renderLogin();
    expect(screen.getByText(/système de gestion/i)).toBeInTheDocument();
    // Le texte est splitté par des <br/>, on cherche le conteneur h1
    const h1 = document.querySelector('h1');
    expect(h1?.textContent?.toLowerCase()).toContain('ressources');
  });
});
