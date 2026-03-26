import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FillInTheGap from '../../games/fillinthegap';
import { renderWithRouter } from '../../test-utils/renderWithRouter';
import { auth } from '../../firebase';
import { getDocs, getDoc, updateDoc } from 'firebase/firestore';

// Mock firebase
jest.mock('../../firebase');

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  doc: jest.fn((...args) => ({ path: args.join('/') })),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  increment: jest.fn((n) => n),
}));

jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  getDownloadURL: jest.fn(),
}));

describe('FillInTheGap component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    auth.__setUser({ email: 'test@example.com', uid: 'uid-123' });
    getDoc.mockResolvedValue({ exists: () => true, data: () => ({ dialect: 'north', username: 'bob' }) });
    getDocs.mockResolvedValue({ docs: [] });
  });

  test('full game flow', async () => {
    const mockDoc = (id, data) => ({ id, data: () => data });
    const sentences = [
      { id: 's1', blackfoot: 'S1', english: 'Hello __', answer: 'world', audio: 's1.mp3' },
      { id: 's2', blackfoot: 'S2', english: 'Goodbye __', answer: 'friend', audio: null },
    ];
    getDocs.mockResolvedValue({ docs: sentences.map((s) => mockDoc(s.id, s)) });

    renderWithRouter(<FillInTheGap />, { route: '/games/fillinthegap?themeId=abc' });

    await screen.findByText('S1');
    const input = screen.getByPlaceholderText(/type/i);
    await userEvent.type(input, 'world');
    fireEvent.click(screen.getByRole('button', { name: /Check answer/i }));
    await screen.findByText(/Correct!/i);

    const nextBtn = await screen.findByRole('button', { name: /Skip/i });
    fireEvent.click(nextBtn);

    await screen.findByText('S2');
    await userEvent.type(screen.getByPlaceholderText(/type/i), 'wrong');
    fireEvent.click(screen.getByRole('button', { name: /Check answer/i }));
    await screen.findByText(/Try again\./i);

    fireEvent.click(screen.getByRole('button', { name: /Show answer/i }));
    await waitFor(() => expect(screen.getByPlaceholderText(/type/i)).toHaveValue('friend'));
    
    // Since "Show answer" was used, check answer is disabled. We must skip.
    const finishBtn = await screen.findByRole('button', { name: /Skip/i });
    fireEvent.click(finishBtn);
    
    await screen.findByText(/Session completed/i);
    expect(updateDoc).toHaveBeenCalled();
  });

  test('handles audio and errors', async () => {
    const mockDoc = (id, data) => ({ id, data: () => data });
    getDocs.mockResolvedValue({ docs: [mockDoc('s1', { id: 's1', blackfoot: 'S1', english: 'H', answer: 'A', audio: 'a.mp3' })] });
    const { getDownloadURL } = require('firebase/storage');
    getDownloadURL.mockResolvedValue('url');

    renderWithRouter(<FillInTheGap />, { route: '/games/fillinthegap?themeId=abc' });
    await screen.findByText('S1');
    
    fireEvent.click(screen.getByRole('button', { name: /^Play$/i }));
    expect(getDownloadURL).toHaveBeenCalled();

    // Force error in load
    jest.clearAllMocks();
    getDocs.mockRejectedValueOnce(new Error('fail'));
    renderWithRouter(<FillInTheGap />, { route: '/games/fillinthegap?themeId=abc' });
    await screen.findByText(/No builder sentences found/i);
  });
});
