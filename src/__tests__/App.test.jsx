import React from 'react';
import { render } from '@testing-library/react';

// Mock firebase auth used by App
jest.mock('../firebase', () => ({
  auth: {
    onAuthStateChanged: jest.fn(),
  },
}));

// Mock pages to avoid heavy rendering
jest.mock('../pages/login', () => () => <div>Login Page</div>);
jest.mock('../pages/verifyEmail', () => () => <div>Verify Email</div>);
jest.mock('../pages/home', () => () => <div>Home Page</div>);

import App from '../App';
import { act } from 'react-dom/test-utils';

describe('App auth gating', () => {
  let auth;

  beforeEach(() => {
    auth = require('../firebase').auth;
  });

  test('renders null while auth loading', () => {
    auth.onAuthStateChanged.mockImplementation((cb) => { /* do not call cb to simulate loading */ return () => {}; });
    const { container } = render(<App />);
    // while auth hasn't called back, App returns null
    expect(container.firstChild).toBeNull();
  });

  test('renders Login when not authenticated', () => {
    auth.onAuthStateChanged.mockImplementation((cb) => { cb(null); return () => {}; });
    const { getByText } = render(<App />);
    expect(getByText(/Login Page/i)).toBeInTheDocument();
  });

  test('renders Home when authenticated and email verified', () => {
    const user = { providerData: [{ providerId: 'password' }], emailVerified: true };
    auth.onAuthStateChanged.mockImplementation((cb) => { cb(user); return () => {}; });
    const { getByText } = render(<App />);
    expect(getByText(/Home Page/i)).toBeInTheDocument();
  });
});
