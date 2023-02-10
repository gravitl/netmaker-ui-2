import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe } from 'vitest';
import App from '../App';

describe('App', () => {
  beforeEach(() => {
    act(() => {
      render(<App />);
    });
  });

  it('renders placeholder text', () => {
    act(() => {
      expect(screen.getAllByText('Option 1').length).toBeGreaterThan(0);
    });
  });
});
