import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import ShortStoryDetail from '../../games/shortstoriesdetails';
import { renderWithRouter } from '../../test-utils/renderWithRouter';
import { auth } from '../../firebase';
import { getDoc, setDoc, updateDoc } from 'firebase/firestore';

// Mock firebase
jest.mock('../../firebase');

jest.mock('firebase/firestore', () => ({
  doc: jest.fn((...args) => ({ path: args.join('/') })),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  increment: jest.fn((n) => n),
}));

jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  getDownloadURL: jest.fn(),
}));

describe('ShortStoryDetail component', () => {
  const routeOptions = { 
    route: '/games/shortstoriesdetails/s1', 
    path: '/games/shortstoriesdetails/:id' 
  };

  beforeEach(() => {
    jest.clearAllMocks();
    auth.__setUser({ email: 'test@e.com' });
    getDoc.mockResolvedValue({ exists: () => false });
  });

  test('renders loading state then empty state', async () => {
    renderWithRouter(<ShortStoryDetail />, routeOptions);
    expect(screen.getByText(/Loading story…/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText(/Loading story…/i)).not.toBeInTheDocument());
    expect(screen.getByText(/Story not found/i)).toBeInTheDocument();
  });

  test('full story flow: load, play audio, play dialect game', async () => {
    const storyData = {
      englishtitle: 'Story 1',
      blackfoottitle: 'B1',
      englishtranslation: 'Translation 1',
      blackfootaudio: 'a1.mp3',
      dialectOptions: ['North', 'South'],
      correctDialect: 'North'
    };
    getDoc.mockResolvedValueOnce({ exists: () => true, id: 's1', data: () => storyData });
    // and for Navbar/addPointForUser
    getDoc.mockResolvedValue({ exists: () => true, data: () => ({ username: 'bob' }) });

    const { getDownloadURL } = require('firebase/storage');
    getDownloadURL.mockResolvedValue('http://audio-url');

    renderWithRouter(<ShortStoryDetail />, routeOptions);

    await screen.findByText(/Story 1/);
    expect(screen.getByText(/Translation 1/)).toBeInTheDocument();

    // Dialect game
    const northBtn = screen.getByRole('button', { name: /North/i });
    fireEvent.click(northBtn);
    
    await screen.findByText(/Correct — \+1 point/i);
    expect(updateDoc).toHaveBeenCalled();

    // Second time doesn't call addPointForUser again
    fireEvent.click(northBtn);
    expect(updateDoc).toHaveBeenCalledTimes(1);
  });

  test('full story flow: setDoc if user doc missing', async () => {
    const storyData = { englishtitle: 'S1', dialectOptions: ['NorthDialect'], correctDialect: 'NorthDialect' };
    getDoc.mockResolvedValueOnce({ exists: () => true, data: () => storyData });
    getDoc.mockResolvedValueOnce({ exists: () => false }); // user doc missing

    renderWithRouter(<ShortStoryDetail />, routeOptions);
    await screen.findByText(/S1/);
    fireEvent.click(screen.getByRole('button', { name: /NorthDialect/i }));
    await waitFor(() => expect(setDoc).toHaveBeenCalled());
  });

  test('handles incorrect dialect guess', async () => {
    const storyData = {
      englishtitle: 'Story 1',
      dialectOptions: ['North', 'South'],
      correctDialect: 'North'
    };
    getDoc.mockResolvedValueOnce({ exists: () => true, id: 's1', data: () => storyData });
    getDoc.mockResolvedValue({ exists: () => true, data: () => ({}) });

    renderWithRouter(<ShortStoryDetail />, routeOptions);

    await screen.findByText(/Story 1/);
    const southBtn = screen.getByRole('button', { name: /South/i });
    fireEvent.click(southBtn);
    
    await screen.findByText(/Not quite. Try again./i);
    expect(updateDoc).not.toHaveBeenCalled();
  });

  test('handles firestore error', async () => {
    getDoc.mockRejectedValueOnce(new Error('fail'));
    renderWithRouter(<ShortStoryDetail />, routeOptions);
    await waitFor(() => expect(screen.queryByText(/Loading story…/i)).not.toBeInTheDocument());
  });
});
