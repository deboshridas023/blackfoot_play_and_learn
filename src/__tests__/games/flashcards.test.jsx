import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import Flashcards from '../../games/flashcards';
import { renderWithRouter } from '../../test-utils/renderWithRouter';
import { auth } from '../../firebase';
import { getDocs } from 'firebase/firestore';

// Use manual firebase mock
jest.mock('../../firebase');

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
}));

jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  getDownloadURL: jest.fn(),
}));

describe('Flashcards component', () => {
  // Use a simpler path pattern to avoid matching issues
  const routeOptions = { 
    route: '/animals', 
    path: '/:theme' 
  };

  beforeEach(() => {
    jest.clearAllMocks();
    auth.__setUser({ email: 'test@e.com' });
    getDocs.mockResolvedValue({ docs: [] });
  });

  test('renders loading state then empty state', async () => {
    renderWithRouter(<Flashcards />, routeOptions);
    expect(screen.getByText(/Loading cards…/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText(/Loading cards…/i)).not.toBeInTheDocument());
    expect(screen.getByText(/No flashcards found/i)).toBeInTheDocument();
  });

  test('full flashcards flow: load, flip, next, prev, restart', async () => {
    const mockDoc = (id, data) => ({ id, data: () => data });
    const cards = [
      { english: 'Dog', blackfoot: 'Imitáá', audio: 'dog.mp3', image: 'dog.jpg' },
      { english: 'Cat', blackfoot: 'Póós', audio: 'cat.mp3', image: 'cat.jpg' },
    ];
    getDocs.mockResolvedValueOnce({ docs: cards.map((c, i) => mockDoc(`c${i}`, c)) });

    const { getDownloadURL } = require('firebase/storage');
    getDownloadURL.mockResolvedValue('http://mock-url');

    renderWithRouter(<Flashcards />, routeOptions);

    // Card 1
    await screen.findByText(/Dog/);
    expect(screen.getByText(/Tap to flip/i)).toBeInTheDocument();

    // Flip
    fireEvent.click(screen.getByText(/Dog/));
    await screen.findByText(/Imitáá/);

    // Next
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    
    // Card 2
    await screen.findByText(/Cat/);
    
    // Prev
    fireEvent.click(screen.getByRole('button', { name: /Prev/i }));
    await screen.findByText(/Dog/);
    
    // Next again
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    await screen.findByText(/Cat/);
    
    // Finish
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    await screen.findByText(/Theme completed/i);

    // Restart
    fireEvent.click(screen.getByRole('button', { name: /Restart/i }));
    await waitFor(() => expect(screen.queryByText(/Theme completed/i)).not.toBeInTheDocument());
  });

  test('handles dialect filter', async () => {
    const mockDoc = (id, data) => ({ id, data: () => data });
    getDocs.mockResolvedValueOnce({ docs: [mockDoc('c1', { english: 'Dog', blackfoot: 'Imitáá' })] });

    renderWithRouter(<Flashcards />, { 
        route: '/animals?dialect=Siksika', 
        path: '/:theme' 
    });
    await screen.findByText(/Dialect/i);
    expect(screen.getByText(/Siksika/i)).toBeInTheDocument();
  });

  test('handles firestore error', async () => {
    getDocs.mockRejectedValueOnce(new Error('Firestore fail'));
    renderWithRouter(<Flashcards />, routeOptions);
    await waitFor(() => expect(screen.queryByText(/Loading cards…/i)).not.toBeInTheDocument());
  });
});
