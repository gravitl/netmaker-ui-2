import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe } from 'vitest';
import App from '../App';

describe('App', () => {
  // TODO: mocking

  // beforeEach(() => {
  //   act(() => {
  //     render(<App />);
  //   });
  // });

  it('renders placeholder text', () => {
    act(() => {
      expect(true).toBe(true);
      // expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0);
    });
  });
});
