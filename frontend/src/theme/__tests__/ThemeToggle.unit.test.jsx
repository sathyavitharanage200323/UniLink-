/**
 * Unit Tests for ThemeToggle
 *
 * Validates: Requirements 3.1, 3.2, 10.3
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeToggle } from '../ThemeToggle'
import { ThemeContext } from '../ThemeProvider'

// ---------------------------------------------------------------------------
// Shared mocks
// ---------------------------------------------------------------------------

const localStorageMock = (() => {
  let store = {}
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = String(value) },
    removeItem: (key) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

beforeAll(() => {
  Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true })
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
})

beforeEach(() => {
  localStorageMock.clear()
  document.documentElement.removeAttribute('data-theme')
})

// ---------------------------------------------------------------------------
// Requirement 3.1 — aria-label in light mode
// ---------------------------------------------------------------------------

test('aria-label reads "Switch to dark mode" when theme is light', () => {
  const toggleTheme = jest.fn()

  render(
    <ThemeContext.Provider value={{ theme: 'light', toggleTheme }}>
      <ThemeToggle />
    </ThemeContext.Provider>
  )

  const button = screen.getByRole('button')
  expect(button).toHaveAttribute('aria-label', 'Switch to dark mode')
})

// ---------------------------------------------------------------------------
// Requirement 3.2 — aria-label in dark mode
// ---------------------------------------------------------------------------

test('aria-label reads "Switch to light mode" when theme is dark', () => {
  const toggleTheme = jest.fn()

  render(
    <ThemeContext.Provider value={{ theme: 'dark', toggleTheme }}>
      <ThemeToggle />
    </ThemeContext.Provider>
  )

  const button = screen.getByRole('button')
  expect(button).toHaveAttribute('aria-label', 'Switch to light mode')
})

// ---------------------------------------------------------------------------
// Requirement 3.2 — clicking the button calls toggleTheme
// ---------------------------------------------------------------------------

test('clicking the button calls toggleTheme', () => {
  const toggleTheme = jest.fn()

  render(
    <ThemeContext.Provider value={{ theme: 'light', toggleTheme }}>
      <ThemeToggle />
    </ThemeContext.Provider>
  )

  const button = screen.getByRole('button')
  userEvent.click(button)

  expect(toggleTheme).toHaveBeenCalledTimes(1)
})

// ---------------------------------------------------------------------------
// Requirement 10.3 — keyboard operability with Enter key
// ---------------------------------------------------------------------------

test('pressing Enter key calls toggleTheme', () => {
  const toggleTheme = jest.fn()

  render(
    <ThemeContext.Provider value={{ theme: 'light', toggleTheme }}>
      <ThemeToggle />
    </ThemeContext.Provider>
  )

  const button = screen.getByRole('button')
  button.focus()
  userEvent.type(button, '{enter}', { skipClick: true })

  expect(toggleTheme).toHaveBeenCalledTimes(1)
})

// ---------------------------------------------------------------------------
// Requirement 10.3 — keyboard operability with Space key
// ---------------------------------------------------------------------------

test('pressing Space key calls toggleTheme', () => {
  const toggleTheme = jest.fn()

  render(
    <ThemeContext.Provider value={{ theme: 'light', toggleTheme }}>
      <ThemeToggle />
    </ThemeContext.Provider>
  )

  const button = screen.getByRole('button')
  button.focus()
  userEvent.type(button, ' ', { skipClick: true })

  expect(toggleTheme).toHaveBeenCalledTimes(1)
})
