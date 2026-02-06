import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Flashcards from '../../games/flashcards';
import { renderWithRouter } from '../../test-utils/renderWithRouter';

// Mock firebase modules
jest.mock('../../firebase', () => ({ db: {}, storage: {}, auth: { currentUser: null } }));
jest.mock('firebase/firestore', () => ({ collection: jest.fn(), getDocs: jest.fn(), doc: jest.fn(), getDoc: jest.fn() }));
jest.mock('firebase/storage', () => ({ ref: jest.fn(), getDownloadURL: jest.fn() }));

describe('Flashcards component (basic smoke)', () => {
  beforeEach(() => jest.resetAllMocks());

  test('renders and shows loading/fallback when no theme param', async () => {
    renderWithRouter(<Flashcards />, { route: '/games/flashcards' });
    // The component shows a loading message while attempting to load cards
    expect(screen.getByText(/Loading cards…/i)).toBeInTheDocument();
  });
});
