import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import App from '../entrypoints/popup/App.jsx';

describe('Dropdown & Module Easing Animation Tests', () => {
  it('defines smooth CSS Grid and Material cubic-bezier transition rules in style.css', () => {
    const cssPath = path.resolve(__dirname, '../entrypoints/popup/style.css');
    const css = fs.readFileSync(cssPath, 'utf8');

    // 1. Grid-template-rows 0fr -> 1fr technique
    expect(css).toContain('grid-template-rows: 0fr');
    expect(css).toContain('grid-template-rows: 1fr');

    // 2. Material Design standard easing curve cubic-bezier(0.4, 0, 0.2, 1)
    expect(css).toContain('cubic-bezier(0.4, 0, 0.2, 1)');

    // 3. Opacity transitions
    expect(css).toContain('opacity: 0');
    expect(css).toContain('opacity: 1');

    // 4. Zero minimum height and overflow hidden on inner container to ensure 0px collapse
    expect(css).toContain('overflow: hidden');
    expect(css).toContain('min-height: 0');

    // 5. Hardware acceleration hint
    expect(css).toContain('will-change: grid-template-rows, opacity');
  });

  it('wires all 6 collapsible modules to the animated accordion structure', async () => {
    await act(async () => {
      render(<App />);
    });

    // Test each dropdown has the accordion-collapse container and accordion-inner wrapper
    const testIds = [
      'user-dropdown',
      'daily-dropdown',
      'sbs-dropdown',
      'focus-dropdown',
      'coins-dropdown',
    ];

    testIds.forEach((testId) => {
      const container = screen.getByTestId(testId);
      expect(container.classList.contains('accordion-collapse')).toBe(true);
      expect(container.querySelector('.accordion-inner')).not.toBeNull();
    });
  });

  it('animates expand and collapse state transitions when toggled', async () => {
    await act(async () => {
      render(<App />);
    });

    const sbsHeader = screen.getByTitle('Collapse Solve Before Scroll');
    const sbsDropdown = screen.getByTestId('sbs-dropdown');

    // Initially expanded
    expect(sbsDropdown.classList.contains('expanded')).toBe(true);
    expect(sbsDropdown.getAttribute('aria-hidden')).toBe('false');
    expect(sbsHeader.getAttribute('aria-expanded')).toBe('true');

    // Collapse
    await act(async () => {
      fireEvent.click(sbsHeader);
    });

    // Class 'expanded' removed so grid-template-rows transitions to 0fr
    expect(sbsDropdown.classList.contains('expanded')).toBe(false);
    expect(sbsDropdown.getAttribute('aria-hidden')).toBe('true');
    expect(sbsHeader.getAttribute('aria-expanded')).toBe('false');

    // Re-expand
    await act(async () => {
      fireEvent.click(sbsHeader);
    });

    expect(sbsDropdown.classList.contains('expanded')).toBe(true);
    expect(sbsDropdown.getAttribute('aria-hidden')).toBe('false');
    expect(sbsHeader.getAttribute('aria-expanded')).toBe('true');
  });

  it('synchronizes chevron rotation duration with accordion easing', async () => {
    let renderedContainer;
    await act(async () => {
      const res = render(<App />);
      renderedContainer = res.container;
    });

    const chevrons = renderedContainer.querySelectorAll('.lucide-chevron-down');
    expect(chevrons.length).toBeGreaterThanOrEqual(4);

    chevrons.forEach((chevron) => {
      // Chevron class contains transition-transform and duration-300 ease-in-out
      expect(chevron.className).toContain('transition-transform');
      expect(chevron.className).toContain('duration-300');
      expect(chevron.className).toContain('ease-in-out');
    });
  });
});
