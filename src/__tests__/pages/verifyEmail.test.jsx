import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import VerifyEmail from '../../pages/verifyEmail';
import { renderWithRouter } from '../../test-utils/renderWithRouter';
import { auth } from '../../firebase';
import { sendEmailVerification, signOut } from 'firebase/auth';

jest.mock('../../firebase');

jest.mock('firebase/auth', () => ({
  sendEmailVerification: jest.fn(),
  signOut: jest.fn(),
}));

describe('VerifyEmail page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders verification screen', () => {
    auth.__setUser({ email: 'test@example.com', emailVerified: false, providerData: [{ providerId: 'password' }] });
    renderWithRouter(<VerifyEmail />, { route: '/verify-email' });

    expect(screen.getByText(/Verify your email/i)).toBeInTheDocument();
    expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
  });

  test('handles resend verification email', async () => {
    auth.__setUser({ email: 'test@example.com', emailVerified: false, providerData: [{ providerId: 'password' }] });
    sendEmailVerification.mockResolvedValueOnce();

    renderWithRouter(<VerifyEmail />, { route: '/verify-email' });

    const resendBtn = screen.getByRole('button', { name: /Resend verification email/i });
    fireEvent.click(resendBtn);

    await waitFor(() => {
      expect(screen.getByText(/Verification email sent/i)).toBeInTheDocument();
    });
  });

  test('handles sign out', async () => {
    auth.__setUser({ email: 'test@example.com', emailVerified: false, providerData: [{ providerId: 'password' }] });
    signOut.mockResolvedValueOnce();

    renderWithRouter(<VerifyEmail />, { route: '/verify-email' });

    const signoutBtn = screen.getByRole('button', { name: /Log out/i });
    fireEvent.click(signoutBtn);

    await waitFor(() => {
      expect(signOut).toHaveBeenCalled();
    });
  });
});
