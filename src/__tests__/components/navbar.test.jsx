import React from 'react';
import { screen, waitFor, fireEvent, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Navbar from '../../components/navbar';
import { MemoryRouter } from 'react-router-dom';
import { auth } from '../../firebase';
import { getDoc, updateDoc, setDoc, deleteDoc, runTransaction } from 'firebase/firestore';
import { deleteUser, signOut } from 'firebase/auth';

// Manual firebase mock
jest.mock('../../firebase');

jest.mock('firebase/firestore', () => ({
  doc: jest.fn((...args) => ({ path: args.join('/') })),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  runTransaction: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  signOut: jest.fn(),
  deleteUser: jest.fn(),
  EmailAuthProvider: { credential: jest.fn() },
  reauthenticateWithCredential: jest.fn(),
}));

describe('Navbar component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    auth.__setUser({ email: 'test@e.com', uid: 'u1', providerData: [{ providerId: 'password' }] });
    getDoc.mockResolvedValue({ exists: () => true, data: () => ({ username: 'bob' }) });
  });

  const wrapper = ({ children }) => <MemoryRouter>{children}</MemoryRouter>;

  test('renders user email and username', async () => {
    render(<Navbar />, { wrapper });
    await screen.findByText(/bob/i);
    expect(screen.getByTitle(/test@e.com/i)).toBeInTheDocument();
  });

  test('opens profile menu and changes username', async () => {
    render(<Navbar />, { wrapper });
    await screen.findByText(/bob/i);

    const profileBtn = screen.getByLabelText(/Profile settings/i);
    fireEvent.click(profileBtn);

    const input = screen.getByPlaceholderText(/e.g. firstname_lastname/i);
    await userEvent.clear(input);
    await userEvent.type(input, 'newname');

    // Wait for availability check (mocked in background)
    const { isUsernameAvailable } = require('../../utils/username');
    // ... we already have mocked firestore which is used by isUsernameAvailable

    // mock the changeUsernameForUser helper which is imported in Navbar
    const usernameUtils = require('../../utils/username');
    jest.spyOn(usernameUtils, 'isUsernameAvailable').mockResolvedValue(true);
    jest.spyOn(usernameUtils, 'changeUsernameForUser').mockResolvedValue('newname');

    await screen.findByText(/Username available/i);

    const saveBtn = screen.getByRole('button', { name: /Save username/i });
    fireEvent.click(saveBtn);

    await screen.findByText(/Username updated/i);
  });

  test('handles sign out', async () => {
    render(<Navbar />, { wrapper });
    const logoutBtn = screen.getByRole('button', { name: /Logout/i });
    fireEvent.click(logoutBtn);
    await waitFor(() => expect(signOut).toHaveBeenCalled());
  });

  test('handles account deletion', async () => {
    render(<Navbar />, { wrapper });
    fireEvent.click(screen.getByLabelText(/Profile settings/i));

    const deleteInput = screen.getByPlaceholderText(/DELETE/i);
    await userEvent.type(deleteInput, 'DELETE');

    const passwordInput = screen.getByPlaceholderText(/••••••••/i);
    await userEvent.type(passwordInput, 'password123');

    const deleteBtn = screen.getByRole('button', { name: /Delete account/i });
    fireEvent.click(deleteBtn);

    await waitFor(() => expect(deleteUser).toHaveBeenCalled());
  });
});
