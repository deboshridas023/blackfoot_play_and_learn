import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../App';

// Use manual firebase mock
jest.mock('../firebase');

// Prevent components from calling real Firestore functions during integration tests
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn().mockResolvedValue({ docs: [] }),
  doc: jest.fn(),
  getDoc: jest.fn().mockResolvedValue({ exists: () => true, data: () => ({ username: 'bob' }) }),
  updateDoc: jest.fn(),
  setDoc: jest.fn(),
  increment: jest.fn(() => 1),
}));

// Mock the username hook so routes don't redirect
jest.mock('../hooks/useEnsureUsername', () => () => ({ checking: false }));

// Mock page components to keep tests focused and fast
jest.mock('../pages/home', () => () => <div>Home Page</div>);
jest.mock('../pages/history', () => () => <div>History Page</div>);
jest.mock('../pages/leaderboard', () => () => <div>Leaderboard Page</div>);
jest.mock('../pages/chooseUsername', () => () => <div>ChooseUsername Page</div>);
jest.mock('../games/quiz', () => () => <div>Quiz Page</div>);
jest.mock('../games/flashcards', () => () => <div>Flashcards Page</div>);
jest.mock('../games/shortstorieslist', () => () => <div>Stories List Page</div>);
jest.mock('../games/fillinthegap', () => () => <div>FillInTheGap Page</div>);
jest.mock('../games/fillinthegapThemes', () => () => <div>FillInThemes Page</div>);

describe('Integration: Routes render (smoke)', () => {
  beforeEach(() => jest.resetAllMocks());

  function renderAt(path) {
    window.location.hash = path;
    const { auth } = require('../firebase');
    auth.onAuthStateChanged = jest.fn((cb) => { cb({ providerData: [{ providerId: 'password' }], emailVerified: true }); return () => {}; });
    render(<App />);
  }

  test('renders Home at /', () => {
    renderAt('/');
    expect(screen.getByText(/Home Page/i)).toBeInTheDocument();
  });

  test('renders History at /history', () => {
    renderAt('/history');
    expect(screen.getByText(/History Page/i)).toBeInTheDocument();
  });

  test('renders Leaderboard at /leaderboard', () => {
    renderAt('/leaderboard');
    expect(screen.getByText(/Leaderboard Page/i)).toBeInTheDocument();
  });

  test('renders Quiz at /games/quiz', () => {
    renderAt('/games/quiz');
    expect(screen.getByText(/Quiz Page/i)).toBeInTheDocument();
  });

  test('renders Flashcards at /games/flashcards/abc', () => {
    renderAt('/games/flashcards/abc');
    expect(screen.getByText(/Flashcards Page/i)).toBeInTheDocument();
  });

  test('renders ShortStories list at /games/shortstorieslist', () => {
    renderAt('/games/shortstorieslist');
    expect(screen.getByText(/Stories List Page/i)).toBeInTheDocument();
  });

  test('renders FillInTheGap at /games/fillinthegap', () => {
    renderAt('/games/fillinthegap');
    expect(screen.getByText(/FillInTheGap Page/i)).toBeInTheDocument();
  });

  test('renders FillInThemes at /games/fillinthegapthemes', () => {
    renderAt('/games/fillinthegapthemes');
    expect(screen.getByText(/FillInThemes Page/i)).toBeInTheDocument();
  });
});
