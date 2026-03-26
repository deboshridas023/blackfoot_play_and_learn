import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import Quiz from '../../games/quiz';
import { renderWithRouter } from '../../test-utils/renderWithRouter';
import { auth } from '../../firebase';
import { getDocs, getDoc, updateDoc, setDoc } from 'firebase/firestore';

// Use manual firebase mock
jest.mock('../../firebase');

jest.mock('firebase/firestore', () => {
  const actual = jest.requireActual('firebase/firestore');
  return {
    ...actual,
    collection: jest.fn(),
    getDocs: jest.fn(),
    doc: jest.fn((...args) => ({ path: args.join('/') })),
    getDoc: jest.fn(),
    updateDoc: jest.fn(),
    setDoc: jest.fn(),
    increment: jest.fn((n) => n),
  };
});

describe('Quiz component', () => {
  beforeEach(() => {
    jest.spyOn(global.Math, 'random').mockReturnValue(0.5); // Predictable shuffle
    jest.clearAllMocks();
    auth.__setUser({ email: 'test@e.com' });
    getDocs.mockResolvedValue({ docs: [] });
    getDoc.mockResolvedValue({ exists: () => false, data: () => ({}) });
  });

  test('renders loading state then empty state', async () => {
    renderWithRouter(<Quiz />, { route: '/games/quiz' });
    expect(screen.getByText(/Loading quiz/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText(/Loading quiz/i)).not.toBeInTheDocument());
    expect(screen.getByText(/No quiz questions found/i)).toBeInTheDocument();
  });

  test('full quiz flow: load, answer correctly, submit, retake', async () => {
    const mockDoc = (id, data) => ({ id, data: () => data });
    const questions = [
      { 'Question': 'Q1', 'Option-1': 'OptA', 'Option-2': 'OptB', 'Option-3': 'OptC', 'Option-4': 'OptD', 'CorrectAnswer': 'OptA' },
      { 'Question': 'Q2', 'Option-1': 'OptX', 'Option-2': 'OptY', 'Option-3': 'OptZ', 'Option-4': 'OptW', 'CorrectAnswer': '2' },
    ];
    getDocs.mockResolvedValue({ docs: questions.map((q, i) => mockDoc(`q${i}`, q)) });
    getDoc.mockResolvedValue({ exists: () => true, data: () => ({ quizScore: 10, username: 'bob' }) });

    renderWithRouter(<Quiz />, { route: '/games/quiz' });

    // Q1
    await screen.findByText(/Q1/);
    fireEvent.click(screen.getByLabelText(/OptA/));
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));

    // Q2
    await screen.findByText(/Q2/);
    fireEvent.click(screen.getByLabelText(/OptY/));
    
    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Submit/i }));

    // Should show results
    await screen.findByText(/Your score: 2 \/ 2/i);
    await waitFor(() => expect(updateDoc).toHaveBeenCalled());

    // Retake
    fireEvent.click(screen.getByRole('button', { name: /Retake quiz/i }));
    await screen.findByText(/Q1/);
  });

  test('handles errors and fallback paths', async () => {
    getDocs.mockRejectedValueOnce(new Error('Firestore load fail'));
    renderWithRouter(<Quiz />, { route: '/games/quiz' });
    await screen.findByText(/Failed to load quiz questions/i);

    // reset and try update error
    jest.clearAllMocks();
    updateDoc.mockRejectedValueOnce(new Error('Update failed'));
    const mockDoc = (id, data) => ({ id, data: () => data });
    getDocs.mockResolvedValue({ docs: [mockDoc('q1', { 'Question': 'QErr', 'Option-1': 'A', 'Option-2': 'B', 'Option-3': 'C', 'Option-4': 'D', 'CorrectAnswer': '1' })] });
    getDoc.mockResolvedValue({ exists: () => true, data: () => ({}) });

    renderWithRouter(<Quiz />, { route: '/games/quiz' });
    await screen.findByText(/QErr/);
    fireEvent.click(screen.getByLabelText(/A/));
    fireEvent.click(screen.getByRole('button', { name: /Submit/i }));
    await screen.findByText(/Your score: 1 \/ 1/i);
    
    // Fallback answer matching (coerceAnswerIndex with direct label)
    jest.clearAllMocks();
    getDocs.mockResolvedValue({ docs: [
        mockDoc('q3', { 'Question': 'Q3', 'Option-1': 'A', 'Option-2': 'B', 'Option-3': 'C', 'Option-4': 'D', 'CorrectAnswer': 'Option-3' }),
    ] });
    renderWithRouter(<Quiz />, { route: '/games/quiz' });
    await screen.findByText(/Q3/);
    fireEvent.click(screen.getByLabelText('C'));
    fireEvent.click(screen.getByRole('button', { name: /Submit/i }));
    await screen.findByText(/Your score: 1 \/ 1/i);
  });

  afterEach(() => {
    jest.spyOn(global.Math, 'random').mockRestore();
  });

  test('addQuizPointsForUser early return on zero points', async () => {
    const mockDoc = (id, data) => ({ id, data: () => data });
    getDocs.mockResolvedValue({ docs: [mockDoc('q1', { 'Question': 'QZero', 'Option-1': 'A', 'Option-2': 'B', 'Option-3': 'C', 'Option-4': 'D', 'CorrectAnswer': '2' })] });
    getDoc.mockResolvedValue({ exists: () => true, data: () => ({}) });

    renderWithRouter(<Quiz />, { route: '/games/quiz' });
    await screen.findByText(/QZero/);
    fireEvent.click(screen.getByLabelText(/A/)); // wrong answer
    fireEvent.click(screen.getByRole('button', { name: /Submit/i }));

    await screen.findByText(/Your score: 0 \/ 1/i);
    // expect updateDoc not called for points=0. 
    // Note: getDoc IS called by Navbar and potentially addQuizPointsForUser (if it didn't return early)
    expect(updateDoc).not.toHaveBeenCalled();
  });
});
