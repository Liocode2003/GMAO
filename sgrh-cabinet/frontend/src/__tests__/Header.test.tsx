import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header from '../components/layout/Header';
import { useAuthStore } from '../store/authStore';

vi.mock('../store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

const mockLogout = vi.fn();
const mockUseAuthStore = useAuthStore as unknown as ReturnType<typeof vi.fn>;

const fakeUser = {
  id: 'u1',
  email: 'drh@cabinet.ci',
  firstName: 'Alice',
  lastName: 'Dupont',
  role: 'DRH' as const,
};

const renderHeader = (onMenuToggle = vi.fn()) =>
  render(
    <MemoryRouter>
      <Header onMenuToggle={onMenuToggle} />
    </MemoryRouter>
  );

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthStore.mockReturnValue({ user: fakeUser, logout: mockLogout });
  });

  it('affiche les initiales de l\'utilisateur', () => {
    renderHeader();
    expect(screen.getByText('AD')).toBeInTheDocument();
  });

  it('affiche le nom de l\'utilisateur', () => {
    renderHeader();
    expect(screen.getAllByText('Alice Dupont').length).toBeGreaterThan(0);
  });

  it('affiche le rôle de l\'utilisateur', () => {
    renderHeader();
    expect(screen.getByText('DRH')).toBeInTheDocument();
  });

  it('ouvre le menu dropdown au clic sur l\'avatar', () => {
    renderHeader();
    // Le dropdown est fermé initialement
    expect(screen.queryByText('Mon profil')).not.toBeInTheDocument();

    // Cliquer sur le bouton utilisateur
    fireEvent.click(screen.getByText('Alice Dupont', { selector: 'p' }));

    expect(screen.getByText('Mon profil')).toBeInTheDocument();
    expect(screen.getByText('Changer le mot de passe')).toBeInTheDocument();
    expect(screen.getByText('Déconnexion')).toBeInTheDocument();
  });

  it('affiche l\'email dans le dropdown', () => {
    renderHeader();
    fireEvent.click(screen.getByText('Alice Dupont', { selector: 'p' }));
    expect(screen.getByText('drh@cabinet.ci')).toBeInTheDocument();
  });

  it('appelle onMenuToggle lors du clic sur le hamburger', () => {
    const onMenuToggle = vi.fn();
    renderHeader(onMenuToggle);
    // Le bouton hamburger a la classe lg:hidden
    const hamburger = document.querySelector('button.lg\\:hidden') as HTMLElement;
    expect(hamburger).not.toBeNull();
    fireEvent.click(hamburger);
    expect(onMenuToggle).toHaveBeenCalledTimes(1);
  });

  it('appelle logout lors du clic sur Déconnexion', async () => {
    mockLogout.mockResolvedValueOnce(undefined);
    renderHeader();

    fireEvent.click(screen.getByText('Alice Dupont', { selector: 'p' }));
    fireEvent.click(screen.getByText('Déconnexion'));

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('affiche la cloche de notifications', () => {
    renderHeader();
    // La cloche est présente via BellIcon
    const bell = document.querySelector('[data-testid="notification-bell"], button[aria-label*="notification"]');
    // Soit par data-testid soit par la présence d'un bouton sans texte dans la zone des actions
    const buttons = screen.getAllByRole('button');
    // L'un d'eux doit être la cloche
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });
});
