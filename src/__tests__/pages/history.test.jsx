import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import HistoryPage from '../../pages/history';
import { renderWithRouter } from '../../test-utils/renderWithRouter';
import { auth } from '../../firebase';

jest.mock('../../firebase');

describe('History page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    auth.__setUser({ email: 'test@example.com', uid: 'uid-123' });
  });

  test('renders history timeline', async () => {
    renderWithRouter(<HistoryPage />, { route: '/history' });

    expect(screen.getByText(/Blackfoot History/i)).toBeInTheDocument();
    
    // Check if some timeline items are rendered
    await waitFor(() => {
      expect(screen.getByText(/Before European contact/i)).toBeInTheDocument();
    });
  });
});
