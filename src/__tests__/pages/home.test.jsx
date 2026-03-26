import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import Home from '../../pages/home';
import { renderWithRouter } from '../../test-utils/renderWithRouter';
import { auth } from '../../firebase';
import { getDoc } from 'firebase/firestore';

jest.mock('../../firebase');

jest.mock('firebase/firestore', () => ({
  doc: jest.fn((...args) => ({ path: args.join('/') })),
  getDoc: jest.fn(),
}));

describe('Home page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    auth.__setUser({ email: 'test@example.com', uid: 'uid-123' });
    getDoc.mockResolvedValue({ exists: () => true, data: () => ({ username: 'bob', quizScore: 10, flashcardsScore: 20 }) });
  });

  test('renders navigation tiles', async () => {
    renderWithRouter(<Home />, { route: '/' });

    await waitFor(() => {
      expect(screen.getByText(/bob/i)).toBeInTheDocument();
    });

    // Tiles
    expect(screen.getByText(/Flashcards/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Blackfoot Builder/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Quiz/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Voices of the Blackfoot/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Leaderboard/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Blackfoot History/i).length).toBeGreaterThan(0);
  });
});
