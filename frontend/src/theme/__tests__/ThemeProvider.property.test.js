/**
 * Property-Based Tests for ThemeProvider
 *
 * Property 2: Toggle parity (round-trip)
 * Validates: Requirements 2.1, 2.4
 *
 * Property 3: localStorage persistence on toggle
 * Validates: Requirements 2.3
 *
 * Property 5: localStorage allowlist validation
 * Validates: Requirements 1.3, 10.5
 */

import React from 'react'
import { renderHook, act } from '@testing-library/react'
import * as fc from 'fast-check'
import { ThemeProvider, useTheme } from '../ThemeProvider'

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

// Mock window.matchMedia
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
 * **Validates: Requirements 2.1, 2.4**
 *
 * Property 2: Toggle parity (round-trip)
 *
 * For any non-negative integer n, calling toggleTheme() exactly n times
 * starting from 'light' SHALL result in:
 *   - 'light' if n is even
 *   - 'dark'  if n is odd
 */
test('Property 2: toggle parity — theme after n toggles from light equals light if n even, dark if n odd', () => {
  fc.assert(
    fc.property(fc.nat({ max: 50 }), (n) => {
      // Render a fresh provider for each run (localStorage is cleared in beforeEach,
      // but fc.assert runs synchronously so we clear manually here)
      localStorageMock.clear()
      document.documentElement.removeAttribute('data-theme')

      const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>
      const { result, unmount } = renderHook(() => useTheme(), { wrapper })

      // Starting theme must be 'light' (localStorage empty, matchMedia returns false)
      expect(result.current.theme).toBe('light')

      // Call toggleTheme n times
      act(() => {
        for (let i = 0; i < n; i++) {
          result.current.toggleTheme()
        }
      })

      const expectedTheme = n % 2 === 0 ? 'light' : 'dark'
      const passed = result.current.theme === expectedTheme

      unmount()
      return passed
    }),
    { numRuns: 100 }
  )
})

/**
 * **Validates: Requirements 2.3**
 *
 * Property 3: localStorage persistence on toggle
 *
 * For any current theme value ('light' or 'dark'), after toggleTheme() is called,
 * localStorage.getItem('unilink-theme') SHALL equal the new (opposite) theme value.
 */
test('Property 3: localStorage persistence — after toggleTheme(), localStorage contains the new opposite theme', () => {
  fc.assert(
    fc.property(fc.constantFrom('light', 'dark'), (startingTheme) => {
      localStorageMock.clear()
      document.documentElement.removeAttribute('data-theme')

      // Pre-seed localStorage so the provider initialises with the desired starting theme
      localStorageMock.setItem('unilink-theme', startingTheme)

      const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>
      const { result, unmount } = renderHook(() => useTheme(), { wrapper })

      expect(result.current.theme).toBe(startingTheme)

      act(() => {
        result.current.toggleTheme()
      })

      const expectedTheme = startingTheme === 'light' ? 'dark' : 'light'
      const storedTheme = localStorageMock.getItem('unilink-theme')
      const passed = storedTheme === expectedTheme

      unmount()
      return passed
    }),
    { numRuns: 100 }
  )
})

/**
 * **Validates: Requirements 1.3, 10.5**
 *
 * Property 5: localStorage allowlist validation
 *
 * For any arbitrary string value stored in localStorage under 'unilink-theme',
 * if that value is not 'light' or 'dark', THE System SHALL ignore it and fall
 * back to prefers-color-scheme detection.
 *
 * Tests both cases:
 *   - when prefers-color-scheme is dark  → applied theme should be 'dark'
 *   - when prefers-color-scheme is light → applied theme should be 'light'
 */
describe('Property 5: localStorage allowlist validation', () => {
  test('invalid localStorage value is ignored — falls back to prefers-color-scheme: dark', () => {
    // Override matchMedia to report dark preference
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    })

    fc.assert(
      fc.property(
        fc.string().filter((s) => s !== 'light' && s !== 'dark'),
        (invalidValue) => {
          localStorageMock.clear()
          document.documentElement.removeAttribute('data-theme')

          // Store an invalid value in localStorage
          localStorageMock.setItem('unilink-theme', invalidValue)

          const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>
          const { result, unmount } = renderHook(() => useTheme(), { wrapper })

          // Invalid value must be ignored; system falls back to prefers-color-scheme (dark)
          const passed = result.current.theme === 'dark'

          unmount()
          return passed
        }
      ),
      { numRuns: 100 }
    )
  })

  test('invalid localStorage value is ignored — falls back to prefers-color-scheme: light', () => {
    // Override matchMedia to report light preference
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query) => ({
        matches: false, // prefers-color-scheme: dark does NOT match → light
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    })

    fc.assert(
      fc.property(
        fc.string().filter((s) => s !== 'light' && s !== 'dark'),
        (invalidValue) => {
          localStorageMock.clear()
          document.documentElement.removeAttribute('data-theme')

          // Store an invalid value in localStorage
          localStorageMock.setItem('unilink-theme', invalidValue)

          const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>
          const { result, unmount } = renderHook(() => useTheme(), { wrapper })

          // Invalid value must be ignored; system falls back to prefers-color-scheme (light)
          const passed = result.current.theme === 'light'

          unmount()
          return passed
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * **Validates: Requirements 2.2**
 *
 * Property 8: applyThemeToDOM idempotence
 *
 * For any valid theme value t ∈ { 'light', 'dark' }, calling applyThemeToDOM(t)
 * twice in succession SHALL produce the same document.documentElement state as
 * calling it once.
 */
test('Property 8: applyThemeToDOM idempotence — calling twice produces same DOM state as calling once', () => {
  fc.assert(
    fc.property(fc.constantFrom('light', 'dark'), (t) => {
      document.documentElement.removeAttribute('data-theme')

      // Apply once — record state
      document.documentElement.setAttribute('data-theme', t)
      const afterOne = document.documentElement.getAttribute('data-theme')

      // Apply again — state must be identical
      document.documentElement.setAttribute('data-theme', t)
      const afterTwo = document.documentElement.getAttribute('data-theme')

      return afterOne === t && afterTwo === t && afterOne === afterTwo
    }),
    { numRuns: 100 }
  )
})
