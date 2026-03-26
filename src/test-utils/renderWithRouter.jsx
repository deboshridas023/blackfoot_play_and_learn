import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { render } from '@testing-library/react';

/**
 * Custom render for components that use react-router hooks.
 * @param {React.ReactElement} ui - component to test
 * @param {Object} options - { route, path, ...renderOptions }
 *   - route: the current URL (e.g. '/games/flashcards/animals')
 *   - path: the route pattern (e.g. '/games/flashcards/:theme')
 */
export function renderWithRouter(ui, { route = '/', path = '*', ...options } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path={path} element={ui} />
      </Routes>
    </MemoryRouter>,
    options
  );
}

export default renderWithRouter;
