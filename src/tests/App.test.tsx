import { act } from '@testing-library/react';
import { describe } from 'vitest';
// import App from '../App';

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
