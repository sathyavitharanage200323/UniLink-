/**
 * Property-Based Tests for ThemeToggle
 *
 * Property 7: ARIA pressed reflects theme state
 * Validates: Requirements 3.3
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import * as fc from 'fast-check'
import { ThemeToggle } from '../ThemeToggle'
import { ThemeContext } from '../ThemeProvider'

// Mock localStorage
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

/**
 * **Validates: Requirements 3.3**
 *
 * Property 7: ARIA pressed reflects theme state
 *
 * For any theme value ('light' or 'dark'), aria-pressed on the ThemeToggle
 * element SHALL equal true if and only if theme === 'dark'.
 */
test('Property 7: aria-pressed reflects theme state — true iff theme is dark', () => {
  fc.assert(
    fc.property(fc.constantFrom('light', 'dark'), (theme) => {
      const toggleTheme = () => {}

      const { unmount } = render(
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
          <ThemeToggle />
        </ThemeContext.Provider>
      )

      const button = screen.getByRole('button')
      const ariaPressedAttr = button.getAttribute('aria-pressed')

      // aria-pressed is a string attribute in the DOM; React sets it as boolean
      // which serialises to the string "true" or "false"
      const ariaPressed = ariaPressedAttr === 'true' || ariaPressedAttr === true

      const expectedPressed = theme === 'dark'
      const passed = ariaPressed === expectedPressed

      unmount()
      return passed
    }),
    { numRuns: 100 }
  )
})
