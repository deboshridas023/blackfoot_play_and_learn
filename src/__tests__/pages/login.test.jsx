import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '../../pages/login';
import { renderWithRouter } from '../../test-utils/renderWithRouter';
import { auth } from '../../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';

jest.mock('../../firebase');

jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  GoogleAuthProvider: jest.fn(),
  signInWithPopup: jest.fn(),
}));

describe('Login page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders login form by default', () => {
    renderWithRouter(<Login />, { route: '/login' });
    expect(screen.getAllByText(/Sign in/i).length).toBeGreaterThan(0);
  });

  test('toggles to sign up form', () => {
    renderWithRouter(<Login />, { route: '/login' });
    fireEvent.click(screen.getByRole('button', { name: /Create one/i }));
    expect(screen.getByText(/Create your account/i)).toBeInTheDocument();
  });

  test('handles email/password sign in', async () => {
    signInWithEmailAndPassword.mockResolvedValueOnce({ user: { email: 'test@test.com' } });

    renderWithRouter(<Login />, { route: '/login' });
    
    await userEvent.type(screen.getByPlaceholderText(/name@example.com/i), 'test@test.com');
    await userEvent.type(screen.getByPlaceholderText(/••••••••/i), 'password123');
    
    fireEvent.click(screen.getByRole('button', { name: /^Sign in$/i }));
    
    await waitFor(() => {
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(auth, 'test@test.com', 'password123');
    });
  });

  test('handles sign up', async () => {
    createUserWithEmailAndPassword.mockResolvedValueOnce({ user: { email: 'test@test.com' } });

    renderWithRouter(<Login />, { route: '/login' });
    
    fireEvent.click(screen.getByRole('button', { name: /Create one/i }));
    
    await userEvent.type(screen.getByPlaceholderText(/name@example.com/i), 'test@test.com');
    const passwords = screen.getAllByPlaceholderText(/••••••••/i);
    await userEvent.type(passwords[0], 'password123');
    await userEvent.type(passwords[1], 'password123');
    
    fireEvent.click(screen.getByRole('button', { name: /^Create account$/i }));
    
    await waitFor(() => {
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(auth, 'test@test.com', 'password123');
    });
  });

  test('handles google sign in', async () => {
    signInWithPopup.mockResolvedValueOnce({ user: { email: 'google@test.com' } });

    renderWithRouter(<Login />, { route: '/login' });
    
    fireEvent.click(screen.getByRole('button', { name: /Continue with Google/i }));
    
    await waitFor(() => {
      expect(signInWithPopup).toHaveBeenCalled();
    });
  });

  test('handles forgot password', async () => {
    sendPasswordResetEmail.mockResolvedValueOnce();

    renderWithRouter(<Login />, { route: '/login' });
    
    // Type in email before clicking forgot password
    const emailInput = screen.getByPlaceholderText(/name@example.com/i);
    await userEvent.type(emailInput, 'test@test.com');

    fireEvent.click(screen.getByRole('button', { name: /Forgot password\?/i }));
    
    await waitFor(() => {
      expect(sendPasswordResetEmail).toHaveBeenCalledWith(auth, 'test@test.com');
    });
  });
});
