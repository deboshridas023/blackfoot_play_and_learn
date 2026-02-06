import React from 'react';

// Ensure firebase and related functions are mocked before importing components
jest.mock('../../firebase', () => ({
  storage: {},
  db: {},
  auth: { currentUser: { email: 'test@example.com', uid: 'uid-123' }, onAuthStateChanged: (cb) => { cb(null); return () => {}; } },
}));

// Mock firestore functions the component imports directly
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  increment: jest.fn(() => 1),
}));

// Mock storage helpers
jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  getDownloadURL: jest.fn(),
}));

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FillInTheGap from '../../games/fillinthegap';
import { renderWithRouter } from '../../test-utils/renderWithRouter';

describe('FillInTheGap component', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('renders choose theme message when no themeId in url', () => {
    renderWithRouter(<FillInTheGap />, { route: '/games/fillinthegap' });
    expect(screen.getByText(/Choose a theme to begin/i)).toBeInTheDocument();
  });

  test('loads levels and accepts correct answer', async () => {
    // Prepare mocked getDoc/getDocs to simulate a theme and two sentences
    const { getDocs, getDoc } = require('firebase/firestore');

    // theme doc returns dialect
    getDoc.mockImplementation(async (ref) => ({ exists: () => true, data: () => ({ dialect: 'north' }) }));

    const sentences = [
      { id: '1', blackfoot: 'S1', english: 'Hello __', answer: 'world', audio: null },
      { id: '2', blackfoot: 'S2', english: 'Goodbye __', answer: 'friend', audio: null },
    ];

    getDocs.mockImplementation(async (q) => ({ docs: sentences.map((s) => ({ id: s.id, data: () => s })) }));

    renderWithRouter(<FillInTheGap />, { route: '/games/fillinthegap?themeId=abc' });

    // Wait for first level to show by waiting for the blackfoot sentence to render
    await waitFor(() => expect(screen.getByText('S1')).toBeInTheDocument());

    // Type correct answer and submit
    const input = screen.getByPlaceholderText(/type/i);
    await userEvent.type(input, 'world');
    await userEvent.click(screen.getByRole('button', { name: /Check answer/i }));

    // After correct, should show feedback and then advance to next level
    await waitFor(() => expect(screen.getByText(/Correct! \+1 point/i)).toBeInTheDocument());

    // Wait for second sentence (level 2) to be displayed
    await waitFor(() => expect(screen.getByText('S2')).toBeInTheDocument());
  });

  test('shows try again for incorrect answer and show answer fills inputs', async () => {
    const { getDocs, getDoc } = require('firebase/firestore');

    getDoc.mockImplementation(async (ref) => ({ exists: () => false, data: () => null }));

    const sentences = [
      { id: '1', blackfoot: 'S1', english: 'Hello __', answer: 'apple', audio: null },
    ];

    getDocs.mockImplementation(async (q) => ({ docs: sentences.map((s) => ({ id: s.id, data: () => s })) }));

    renderWithRouter(<FillInTheGap />, { route: '/games/fillinthegap?themeId=abc' });

    await waitFor(() => expect(screen.getByText('S1')).toBeInTheDocument());

    const input = screen.getByPlaceholderText(/type/i);
    await userEvent.type(input, 'banana');
    await userEvent.click(screen.getByRole('button', { name: /Check answer/i }));

    await waitFor(() => expect(screen.getByText(/Try again\./i)).toBeInTheDocument());

    // Click Show answer and expect input value to be filled (read-only check via value)
    await userEvent.click(screen.getByRole('button', { name: /Show answer/i }));

    expect(screen.getByPlaceholderText(/type/i)).toHaveValue('apple');
  });
});
