import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChooseUsername from '../../pages/chooseUsername';
import { renderWithRouter } from '../../test-utils/renderWithRouter';
import { auth } from '../../firebase';
import { getDoc } from 'firebase/firestore';

jest.mock('../../firebase');

jest.mock('firebase/firestore', () => ({
  doc: jest.fn((...args) => ({ path: args.join('/') })),
  getDoc: jest.fn(),
}));

describe('ChooseUsername page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    auth.__setUser({ email: 'test@example.com', uid: 'uid-123' });
    getDoc.mockResolvedValue({ exists: () => false });
  });

  test('renders form', () => {
    renderWithRouter(<ChooseUsername />, { route: '/choose-username' });
    expect(screen.getByText(/Choose a Username/i)).toBeInTheDocument();
  });

  test('submits form', async () => {
    const { isUsernameAvailable, reserveUsernameForUser } = require('../../utils/username');
    jest.spyOn(require('../../utils/username'), 'isUsernameAvailable').mockResolvedValue(true);
    jest.spyOn(require('../../utils/username'), 'reserveUsernameForUser').mockResolvedValue('newuser');

    renderWithRouter(<ChooseUsername />, { route: '/choose-username' });

    const input = screen.getByPlaceholderText(/e.g. firstname_lastname/i);
    await userEvent.type(input, 'newuser');

    const button = screen.getByRole('button', { name: /Save username/i });
    await waitFor(() => expect(button).not.toBeDisabled(), { timeout: 2000 });
    
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Username saved! Redirecting…/i)).toBeInTheDocument();
    });
  });

  test('shows error when username is unavailable', async () => {
    const { isUsernameAvailable } = require('../../utils/username');
    jest.spyOn(require('../../utils/username'), 'isUsernameAvailable').mockResolvedValue(false);

    renderWithRouter(<ChooseUsername />, { route: '/choose-username' });

    const input = screen.getByPlaceholderText(/e.g. firstname_lastname/i);
    await userEvent.type(input, 'takenuser');

    const button = screen.getByRole('button', { name: /Save username/i });
    
    // The button will remain disabled if the username is taken,
    // so we should wait for the error message instead of clicking.
    await waitFor(() => {
      expect(screen.getByText(/That username is taken./i)).toBeInTheDocument();
    });
  });
});
