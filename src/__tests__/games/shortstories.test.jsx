import React from 'react';
import { screen } from '@testing-library/react';
import ShortStoriesList from '../../games/shortstorieslist';
import { renderWithRouter } from '../../test-utils/renderWithRouter';

jest.mock('../../firebase', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({ collection: jest.fn(), getDocs: jest.fn() }));

describe('ShortStoriesList (smoke)', () => {
  beforeEach(() => jest.resetAllMocks());

  test('shows loading initially', () => {
    renderWithRouter(<ShortStoriesList />, { route: '/games/shortstorieslist' });
    expect(screen.getByText(/Loading stories/i)).toBeInTheDocument();
  });
});
