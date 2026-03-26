import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import FillInTheGapThemes from '../../games/fillinthegapThemes';
import { renderWithRouter } from '../../test-utils/renderWithRouter';
import { auth } from '../../firebase';
import { getDocs, collectionGroup, getDoc } from 'firebase/firestore';

// Mock firebase
jest.mock('../../firebase');

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  limit: jest.fn(),
  collectionGroup: jest.fn(),
  doc: jest.fn((...args) => ({ path: args.join('/') })),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
}));

describe('FillInTheGapThemes component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    auth.__setUser({ email: 'test@example.com', uid: 'uid-123' });
    getDoc.mockResolvedValue({ exists: () => true, data: () => ({ username: 'bob' }) });
  });

  test('renders loading and then themes list', async () => {
    const mockDoc = (id, data) => ({ id, data: () => data });
    getDocs.mockResolvedValueOnce({
      docs: [
        mockDoc('t1', { englishtitle: 'Theme 1', blackfoottitle: 'BTheme 1', description: 'Desc 1' }),
        mockDoc('t2', { englishtitle: 'Theme 2', dialect: 'Kainai' }),
      ]
    });

    renderWithRouter(<FillInTheGapThemes />, { route: '/games/fillinthegapthemes' });

    expect(screen.getByText(/Loading themes/i)).toBeInTheDocument();
    
    await screen.findByText('Theme 1');
    expect(screen.getByText('BTheme 1')).toBeInTheDocument();
    expect(screen.getByText('Theme 2')).toBeInTheDocument();
  });

  test('filters by dialect (top-level field)', async () => {
    const mockDoc = (id, data) => ({ id, data: () => data });
    getDocs.mockResolvedValueOnce({
      docs: [
        mockDoc('t1', { englishtitle: 'Theme 1', dialect: 'Kainai' }),
        mockDoc('t2', { englishtitle: 'Theme 2', dialect: 'Siksika' }),
      ]
    });

    renderWithRouter(<FillInTheGapThemes />, { route: '/games/fillinthegapthemes' });
    await screen.findByText('Theme 1');

    // Click Piikani (not present)
    const kainaiBtn = screen.getByRole('button', { name: 'Kainai' });
    fireEvent.click(kainaiBtn);

    await waitFor(() => {
      expect(screen.queryByText('Theme 2')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Theme 1')).toBeInTheDocument();
  });

  test('handles collectionGroup fallback for dialect filtering', async () => {
    const mockDoc = (id, data, parentRef) => ({ id, data: () => data, ref: { parent: parentRef } });
    
    getDocs.mockResolvedValueOnce({
      docs: [
        mockDoc('t1', { englishtitle: 'Theme 1' }),
        mockDoc('t2', { englishtitle: 'Theme 2' }),
      ]
    });

    renderWithRouter(<FillInTheGapThemes />, { route: '/games/fillinthegapthemes' });
    await screen.findByText('Theme 1');

    // Mock collectionGroup result
    const theme1Ref = { id: 't1' };
    const sentencesRef = { parent: theme1Ref };
    getDocs.mockResolvedValueOnce({
      size: 1,
      forEach: (cb) => {
        cb(mockDoc('s1', { dialect: 'Siksika' }, sentencesRef));
      }
    });

    const siksikaBtn = screen.getByRole('button', { name: 'Siksika' });
    fireEvent.click(siksikaBtn);

    await waitFor(() => {
      expect(screen.queryByText('Theme 2')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Theme 1')).toBeInTheDocument();
  });
  
  test('handles errors gracefully', async () => {
    getDocs.mockRejectedValueOnce(new Error('fail'));
    renderWithRouter(<FillInTheGapThemes />, { route: '/games/fillinthegapthemes' });
    
    // Will stop loading and show empty grid
    await waitFor(() => {
      expect(screen.queryByText(/Loading themes/i)).not.toBeInTheDocument();
    });
    expect(screen.getByText(/Choose a theme/i)).toBeInTheDocument();
  });
});
