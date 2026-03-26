import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import ShortStoriesList from '../../games/shortstorieslist';
import { renderWithRouter } from '../../test-utils/renderWithRouter';
import { auth } from '../../firebase';
import { getDocs } from 'firebase/firestore';

// Use manual firebase mock
jest.mock('../../firebase');

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  doc: jest.fn((...args) => ({ path: args.join('/') })),
  getDoc: jest.fn(),
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('ShortStoriesList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    auth.__setUser({ email: 'test@e.com' });
    const { getDoc } = require('firebase/firestore');
    getDoc.mockResolvedValue({ exists: () => true, data: () => ({ username: 'bob' }) });
    getDocs.mockResolvedValue({ docs: [] });
  });

  test('renders loading then empty state', async () => {
    renderWithRouter(<ShortStoriesList />, { route: '/games/shortstorieslist' });
    expect(screen.getByText(/Loading stories/i)).toBeInTheDocument();
    await screen.findByText(/No stories found/i);
  });

  test('renders stories and navigates', async () => {
    const mockDoc = (id, data) => ({ id, data: () => data });
    const stories = [
      { id: 's1', englishtitle: 'Story 1', blackfoottitle: 'B1', description: 'Desc 1' },
    ];
    getDocs.mockResolvedValueOnce({ docs: stories.map((s) => mockDoc(s.id, s)) });

    renderWithRouter(<ShortStoriesList />, { route: '/games/shortstorieslist' });

    await screen.findByText(/Story 1/);
    expect(screen.getByText(/B1/)).toBeInTheDocument();
    expect(screen.getByText(/Desc 1/)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Story 1/));
    expect(mockNavigate).toHaveBeenCalledWith('/games/shortstoriesdetails/s1');
  });

  test('handles firestore error', async () => {
    getDocs.mockRejectedValueOnce(new Error('Load fail'));
    renderWithRouter(<ShortStoriesList />, { route: '/games/shortstorieslist' });
    await waitFor(() => expect(screen.queryByText(/Loading stories/i)).not.toBeInTheDocument());
  });
});
