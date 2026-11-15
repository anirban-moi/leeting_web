import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import App from '../entrypoints/popup/App.jsx';

describe('Popup App Component', () => {
  it('renders extension title and main cards', async () => {
    await act(async () => {
      render(<App />);
    });
    expect(screen.getByText('Leeting')).toBeDefined();
    expect(screen.getByText('LeetCode & Focus Companion')).toBeDefined();
    expect(screen.getByText('Daily Challenge')).toBeDefined();
    expect(screen.getByText('Focus Mode')).toBeDefined();
    expect(screen.getByText('Solve Before Scroll')).toBeDefined();
    expect(screen.getByText('Daily LeetCoin Reward')).toBeDefined();
  });

  it('collapses and expands sections when header dropdown is clicked', async () => {
    await act(async () => {
      render(<App />);
    });

    const sbsHeader = screen.getByTitle('Collapse Solve Before Scroll');
    const sbsDropdown = screen.getByTestId('sbs-dropdown');

    // SBS dropdown is expanded initially
    expect(sbsHeader.getAttribute('aria-expanded')).toBe('true');
    expect(sbsDropdown.classList.contains('expanded')).toBe(true);
    expect(sbsDropdown.getAttribute('aria-hidden')).toBe('false');

    // Click Solve Before Scroll header to collapse
    await act(async () => {
      fireEvent.click(sbsHeader);
    });

    // SBS dropdown should now have collapsed classes and attributes
    expect(sbsHeader.getAttribute('aria-expanded')).toBe('false');
    expect(sbsDropdown.classList.contains('expanded')).toBe(false);
    expect(sbsDropdown.getAttribute('aria-hidden')).toBe('true');

    // Click again to expand
    await act(async () => {
      fireEvent.click(sbsHeader);
    });
    expect(sbsHeader.getAttribute('aria-expanded')).toBe('true');
    expect(sbsDropdown.classList.contains('expanded')).toBe(true);
    expect(sbsDropdown.getAttribute('aria-hidden')).toBe('false');

    // Focus Mode dropdown
    const focusHeader = screen.getByTitle('Collapse Focus Mode');
    const focusDropdown = screen.getByTestId('focus-dropdown');

    expect(focusHeader.getAttribute('aria-expanded')).toBe('true');
    expect(focusDropdown.classList.contains('expanded')).toBe(true);

    // Click Focus Mode header to collapse
    await act(async () => {
      fireEvent.click(focusHeader);
    });

    expect(focusHeader.getAttribute('aria-expanded')).toBe('false');
    expect(focusDropdown.classList.contains('expanded')).toBe(false);
    expect(focusDropdown.getAttribute('aria-hidden')).toBe('true');

    // Click again to expand Focus Mode
    await act(async () => {
      fireEvent.click(focusHeader);
    });
    expect(focusHeader.getAttribute('aria-expanded')).toBe('true');
    expect(focusDropdown.classList.contains('expanded')).toBe(true);
  });
});
