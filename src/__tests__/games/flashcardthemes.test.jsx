import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import FlashcardThemes from '../../games/flashcardthemes';
import { renderWithRouter } from '../../test-utils/renderWithRouter';
import { auth } from '../../firebase';
import { getDocs, getDoc } from 'firebase/firestore';

// Mock firebase
jest.mock('../../firebase');

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  limit: jest.fn(),
  doc: jest.fn((...args) => ({ path: args.join('/') })),
  getDoc: jest.fn(),
}));

describe('FlashcardThemes component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    auth.__setUser({ email: 'test@example.com', uid: 'uid-123' });
    getDoc.mockResolvedValue({ exists: () => true, data: () => ({ username: 'bob' }) });
  });

  test('renders themes list and handles availability', async () => {
    // Mock getDocs to return true for 'animals' in 'Kainai'
    getDocs.mockImplementation((q) => {
      // It's a bit hard to introspect q if it's mocked loosely,
      // but let's just make it return empty: false for the first few calls
      return Promise.resolve({ empty: false });
    });

    renderWithRouter(<FlashcardThemes />, { route: '/games/flashcardthemes' });

    expect(screen.getByText(/Choose a theme/i)).toBeInTheDocument();
    
    await screen.findByText('Animals');
    expect(screen.getByText('Creatures great & small')).toBeInTheDocument();
  });

  test('handles errors gracefully', async () => {
    getDocs.mockRejectedValue(new Error('fail'));
    
    renderWithRouter(<FlashcardThemes />, { route: '/games/flashcardthemes' });
    
    await waitFor(() => {
      expect(screen.getByText(/Choose a theme/i)).toBeInTheDocument();
    });
  });
});
