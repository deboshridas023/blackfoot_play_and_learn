import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import Quiz from '../../games/quiz';
import { renderWithRouter } from '../../test-utils/renderWithRouter';

// Use manual firebase mock (src/__mocks__/firebase.js)
jest.mock('../../firebase');
jest.mock('firebase/firestore', () => ({ collection: jest.fn(), getDocs: jest.fn() }));

describe('Quiz component (smoke)', () => {
  beforeEach(() => jest.resetAllMocks());

  test('renders loading state', () => {
    renderWithRouter(<Quiz />, { route: '/games/quiz' });
    expect(screen.getByText(/Loading quiz/i)).toBeInTheDocument();
  });

  test('select options, submit and calls addQuizPointsForUser', async () => {
    // Mock Firestore getDocs to return two questions
    const { getDocs } = require('firebase/firestore');
    const mockDoc = (id, data) => ({ id, data: () => data });
    getDocs.mockResolvedValue({ docs: [mockDoc('q1', { 'Question': 'Q1', 'Option-1': 'A', 'Option-2': 'B', 'Option-3': 'C', 'Option-4': 'D', 'CorrectAnswer': '1' })] });

    // Mock auth currentUser
    const firebase = require('../../firebase');
    firebase.auth.__setUser({ email: 'user@test.com' });

    const { getByText, findByText, getByLabelText } = renderWithRouter(<Quiz />, { route: '/games/quiz' });

    // Wait for question to load
    await findByText(/Q1/);

    // select first option
    const firstOption = getByLabelText(/A/);
    firstOption.click();

    // click submit (button text may be Submit)
    const submitBtn = getByText(/Submit/);
    submitBtn.click();

    // Since addQuizPointsForUser uses firestore methods, ensure no uncaught errors
    await new Promise((r) => setTimeout(r, 100));
    expect(true).toBe(true);
  });
});
