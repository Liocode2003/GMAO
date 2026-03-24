import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import api from '../services/api';

// Réinitialiser le store Zustand entre les tests
beforeEach(() => {
  // Reset localStorage
  localStorage.clear();
  vi.clearAllMocks();
});

// On importe après le mock pour avoir la version mockée
vi.mock('../services/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

const mockApi = api as { post: ReturnType<typeof vi.fn> };

describe('AuthStore', () => {
  it('login enregistre les tokens et l\'utilisateur', async () => {
    const fakeResponse = {
      data: {
        accessToken: 'fake-access-token',
        refreshToken: 'fake-refresh-token',
        user: { id: '1', email: 'drh@test.ci', firstName: 'Alice', lastName: 'Dupont', role: 'DRH' },
      },
    };
    mockApi.post.mockResolvedValueOnce(fakeResponse);

    // Importer le store dynamiquement pour avoir un état propre
    const { useAuthStore } = await import('../store/authStore');
    const store = useAuthStore.getState();

    await act(async () => {
      await store.login('drh@test.ci', 'Admin123!');
    });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.email).toBe('drh@test.ci');
    expect(state.accessToken).toBe('fake-access-token');
    expect(localStorage.getItem('accessToken')).toBe('fake-access-token');
    expect(localStorage.getItem('refreshToken')).toBe('fake-refresh-token');
  });

  it('login lève une exception si l\'API échoue', async () => {
    mockApi.post.mockRejectedValueOnce(new Error('Identifiants incorrects'));

    const { useAuthStore } = await import('../store/authStore');
    const store = useAuthStore.getState();

    await expect(store.login('wrong@test.ci', 'bad')).rejects.toThrow();

    const state = useAuthStore.getState();
    expect(state.isLoading).toBe(false);
  });

  it('logout supprime les tokens et reset l\'état', async () => {
    mockApi.post.mockResolvedValueOnce({});
    localStorage.setItem('accessToken', 'some-token');
    localStorage.setItem('refreshToken', 'some-refresh');

    const { useAuthStore } = await import('../store/authStore');
    useAuthStore.setState({
      user: { id: '1', email: 'drh@test.ci', firstName: 'Alice', lastName: 'Dupont', role: 'DRH' },
      accessToken: 'some-token',
      refreshToken: 'some-refresh',
      isAuthenticated: true,
      isLoading: false,
      login: useAuthStore.getState().login,
      logout: useAuthStore.getState().logout,
      setTokens: useAuthStore.getState().setTokens,
    });

    await act(async () => {
      await useAuthStore.getState().logout();
    });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });

  it('setTokens met à jour les tokens dans le store et localStorage', async () => {
    const { useAuthStore } = await import('../store/authStore');
    const store = useAuthStore.getState();

    act(() => {
      store.setTokens('new-access', 'new-refresh');
    });

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('new-access');
    expect(state.refreshToken).toBe('new-refresh');
    expect(localStorage.getItem('accessToken')).toBe('new-access');
    expect(localStorage.getItem('refreshToken')).toBe('new-refresh');
  });
});
