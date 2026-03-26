import { renderHook, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import useEnsureUsername from '../../hooks/useEnsureUsername';
import { auth } from '../../firebase';
import { getDoc } from 'firebase/firestore';

// Mock firebase
jest.mock('../../firebase', () => ({
  auth: { currentUser: null },
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('useEnsureUsername hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    auth.currentUser = null;
  });

  test('stops checking if no user is logged in', async () => {
    const wrapper = ({ children }) => (
      <MemoryRouter initialEntries={['/']}>
        {children}
      </MemoryRouter>
    );
    const { result } = renderHook(() => useEnsureUsername(), { wrapper });
    await waitFor(() => expect(result.current.checking).toBe(false));
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('redirects if user has no username', async () => {
    const wrapper = ({ children }) => (
      <MemoryRouter initialEntries={['/']}>
        {children}
      </MemoryRouter>
    );
    auth.currentUser = { email: 'test@e.com' };
    getDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({}) });

    const { result } = renderHook(() => useEnsureUsername(), { wrapper });
    await waitFor(() => expect(result.current.checking).toBe(false));
    expect(mockNavigate).toHaveBeenCalledWith('/choose-username', { replace: true });
  });

  test('stops checking and does not redirect if user has username', async () => {
    const wrapper = ({ children }) => (
      <MemoryRouter initialEntries={['/']}>
        {children}
      </MemoryRouter>
    );
    auth.currentUser = { email: 'test@e.com' };
    getDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ username: 'bob' }) });

    const { result } = renderHook(() => useEnsureUsername(), { wrapper });
    await waitFor(() => expect(result.current.checking).toBe(false));
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('does not redirect if already on /choose-username', async () => {
    const wrapper = ({ children }) => (
      <MemoryRouter initialEntries={['/choose-username']}>
        {children}
      </MemoryRouter>
    );
    auth.currentUser = { email: 'test@e.com' };

    const { result } = renderHook(() => useEnsureUsername(), { wrapper });
    await waitFor(() => expect(result.current.checking).toBe(false));
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
