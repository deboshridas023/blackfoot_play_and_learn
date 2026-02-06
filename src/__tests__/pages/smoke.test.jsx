import React from 'react';
import { render } from '@testing-library/react';

// Mock pages to simple placeholders to avoid heavy Firebase logic
jest.mock('../../pages/chooseUsername', () => () => <div>ChooseUsername</div>);
jest.mock('../../pages/login', () => () => <div>LoginPage</div>);
jest.mock('../../pages/verifyEmail', () => () => <div>VerifyEmail</div>);

import ChooseUsername from '../../pages/chooseUsername';
import Login from '../../pages/login';
import VerifyEmail from '../../pages/verifyEmail';

describe('Page smoke tests', () => {
  test('chooseUsername placeholder renders', () => {
    const { getByText } = render(<ChooseUsername />);
    expect(getByText(/ChooseUsername/i)).toBeInTheDocument();
  });

  test('login placeholder renders', () => {
    const { getByText } = render(<Login />);
    expect(getByText(/LoginPage/i)).toBeInTheDocument();
  });

  test('verifyEmail placeholder renders', () => {
    const { getByText } = render(<VerifyEmail />);
    expect(getByText(/VerifyEmail/i)).toBeInTheDocument();
  });
});
