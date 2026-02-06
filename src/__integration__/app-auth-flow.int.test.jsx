import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../App';

// Use manual firebase mock
jest.mock('../firebase');

// Prevent components from calling real Firestore functions during integration test
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn().mockResolvedValue({ docs: [] }),
  doc: jest.fn(),
  getDoc: jest.fn().mockResolvedValue({ exists: () => false }),
  updateDoc: jest.fn(),
  setDoc: jest.fn(),
  increment: jest.fn(() => 1),
}));

// Mock pages so App mounts quickly
jest.mock('../pages/login', () => () => <div>Login Page</div>);
jest.mock('../pages/home', () => () => <div>Home Page</div>);
// Mock the username check hook to avoid redirects during integration tests
jest.mock('../hooks/useEnsureUsername', () => () => ({ checking: false }));

describe('Integration: App auth gating', () => {
  beforeEach(() => jest.resetAllMocks());

  test('shows Login when not authenticated', () => {
    const { auth } = require('../firebase');
    auth.onAuthStateChanged = jest.fn((cb) => { cb(null); return () => {}; });
    // ensure getDoc/getDocs used by other hooks return safe defaults
    const fs = require('firebase/firestore');
    fs.getDoc = jest.fn().mockResolvedValue({ exists: () => false, data: () => ({}) });
    fs.getDocs = jest.fn().mockResolvedValue({ docs: [] });
    render(<App />);
    expect(screen.getByText(/Login Page/i)).toBeInTheDocument();
  });

  test('shows Home when authenticated', () => {
    const { auth } = require('../firebase');
    auth.onAuthStateChanged = jest.fn((cb) => { cb({ providerData: [{ providerId: 'password' }], emailVerified: true }); return () => {}; });
    const fs = require('firebase/firestore');
    // Return a user profile with a username so useEnsureUsername does not redirect
    fs.getDoc = jest.fn().mockResolvedValue({ exists: () => true, data: () => ({ username: 'bob' }) });
    fs.getDocs = jest.fn().mockResolvedValue({ docs: [] });
    render(<App />);
    expect(screen.getByText(/Home Page/i)).toBeInTheDocument();
  });
});
