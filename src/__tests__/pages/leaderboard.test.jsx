import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import Leaderboard from '../../pages/leaderboard';
import { renderWithRouter } from '../../test-utils/renderWithRouter';
import { auth } from '../../firebase';
import { getDocs, getDoc } from 'firebase/firestore';

jest.mock('../../firebase');

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn((...args) => ({ path: args.join('/') })),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
}));

describe('Leaderboard page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    auth.__setUser({ email: 'test@example.com', uid: 'uid-123' });
    getDoc.mockResolvedValue({ exists: () => true, data: () => ({ username: 'bob' }) });
  });

  test('renders top players for different games', async () => {
    const mockDoc = (id, data) => ({ id, data: () => data });
    getDocs.mockResolvedValue({
      docs: [
        mockDoc('u1', { username: 'alice', quizScore: 30, builderScore: 10, shortStoriesScore: 5 }),
        mockDoc('u2', { username: 'bob', quizScore: 20, builderScore: 15, shortStoriesScore: 10 }),
        mockDoc('u3', { username: 'charlie', quizScore: 40, builderScore: 5, shortStoriesScore: 2 }),
      ]
    });

    renderWithRouter(<Leaderboard />, { route: '/leaderboard' });

    expect(screen.getByText(/Loading scores/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText(/Loading scores/i)).not.toBeInTheDocument();
    });

    // Default tab is Overall
    // Total: alice (45), bob (45), charlie (47)
    // charlie is top
    await screen.findAllByText('charlie');
    
    // Switch to Quiz
    fireEvent.click(screen.getByRole('button', { name: /Quiz/i }));
    // Quiz: charlie (40), alice (30), bob (20)
    await screen.findAllByText('charlie');

    // Switch to Blackfoot Builder
    fireEvent.click(screen.getByRole('button', { name: /Blackfoot Builder/i }));
    // Builder: bob (15), alice (10), charlie (5)
    await screen.findAllByText('bob');

    // Switch to Voices of the Blackfoot
    fireEvent.click(screen.getByRole('button', { name: /Voices of the Blackfoot/i }));
    // Stories: bob (10), alice (5), charlie (2)
    await screen.findAllByText('bob');
  });

  test('handles errors gracefully', async () => {
    getDocs.mockRejectedValueOnce(new Error('fail'));

    renderWithRouter(<Leaderboard />, { route: '/leaderboard' });

    await waitFor(() => {
      expect(screen.getByText(/Failed to load scores/i)).toBeInTheDocument();
    });
  });
});
