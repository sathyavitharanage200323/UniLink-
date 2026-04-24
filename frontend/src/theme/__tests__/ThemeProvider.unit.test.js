/**
 * Unit Tests for ThemeProvider
 *
 * Validates: Requirements 1.1, 1.2, 1.5, 9.3
 */

import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { ThemeProvider, useTheme } from '../ThemeProvider'

// ---------------------------------------------------------------------------
// Shared mocks
// ---------------------------------------------------------------------------

const localStorageMock = (() => {
  let store = {}
  return {
    getItem: jest.fn((key) => store[key] ?? null),
    setItem: jest.fn((key, value) => { store[key] = String(value) }),
    removeItem: jest.fn((key) => { delete store[key] }),
    clear: () => { store = {} },
    _reset: () => { store = {}; jest.clearAllMocks() },
  }
})()

function makeMatchMedia(prefersDark) {
  return (query) => ({
    matches: prefersDark && query === '(prefers-color-scheme: dark)',
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })
}

beforeAll(() => {
  Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true })
})

beforeEach(() => {
  localStorageMock._reset()
  document.documentElement.removeAttribute('data-theme')
  // Default: system preference is light
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: makeMatchMedia(false),
  })
})

// ---------------------------------------------------------------------------
// Requirement 1.1 — stored 'light' value is applied
// ---------------------------------------------------------------------------

test('initTheme: reads stored "light" from localStorage and sets data-theme="light"', () => {
  localStorageMock.getItem.mockImplementation((key) =>
    key === 'unilink-theme' ? 'light' : null
  )

  const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>
  const { result } = renderHook(() => useTheme(), { wrapper })

  expect(result.current.theme).toBe('light')
  expect(document.documentElement.getAttribute('data-theme')).toBe('light')
})

// ---------------------------------------------------------------------------
// Requirement 1.1 — stored 'dark' value is applied
// ---------------------------------------------------------------------------

test('initTheme: reads stored "dark" from localStorage and sets data-theme="dark"', () => {
  localStorageMock.getItem.mockImplementation((key) =>
    key === 'unilink-theme' ? 'dark' : null
  )

  const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>
  const { result } = renderHook(() => useTheme(), { wrapper })

  expect(result.current.theme).toBe('dark')
  expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
})

// ---------------------------------------------------------------------------
// Requirement 1.2 — fallback to prefers-color-scheme: dark when localStorage empty
// ---------------------------------------------------------------------------

test('initTheme: falls back to prefers-color-scheme dark when localStorage is empty', () => {
  // localStorage returns null (empty)
  localStorageMock.getItem.mockReturnValue(null)
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: makeMatchMedia(true), // OS prefers dark
  })

  const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>
  const { result } = renderHook(() => useTheme(), { wrapper })

  expect(result.current.theme).toBe('dark')
  expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
})

// ---------------------------------------------------------------------------
// Requirement 1.2 — fallback to prefers-color-scheme: light when localStorage empty
// ---------------------------------------------------------------------------

test('initTheme: falls back to prefers-color-scheme light when localStorage is empty', () => {
  localStorageMock.getItem.mockReturnValue(null)
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: makeMatchMedia(false), // OS prefers light
  })

  const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>
  const { result } = renderHook(() => useTheme(), { wrapper })

  expect(result.current.theme).toBe('light')
  expect(document.documentElement.getAttribute('data-theme')).toBe('light')
})

// ---------------------------------------------------------------------------
// Requirement 1.5 — silent error handling when localStorage is blocked
// ---------------------------------------------------------------------------

test('initTheme: silently catches localStorage error and falls back to prefers-color-scheme dark', () => {
  localStorageMock.getItem.mockImplementation(() => {
    throw new DOMException('Access denied', 'SecurityError')
  })
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: makeMatchMedia(true), // OS prefers dark
  })

  // Should not throw
  const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>
  let result
  expect(() => {
    ;({ result } = renderHook(() => useTheme(), { wrapper }))
  }).not.toThrow()

  expect(result.current.theme).toBe('dark')
  expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
})

test('initTheme: silently catches localStorage error and falls back to prefers-color-scheme light', () => {
  localStorageMock.getItem.mockImplementation(() => {
    throw new DOMException('Access denied', 'SecurityError')
  })
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: makeMatchMedia(false), // OS prefers light
  })

  const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>
  let result
  expect(() => {
    ;({ result } = renderHook(() => useTheme(), { wrapper }))
  }).not.toThrow()

  expect(result.current.theme).toBe('light')
  expect(document.documentElement.getAttribute('data-theme')).toBe('light')
})

// ---------------------------------------------------------------------------
// Requirement 9.3 — useTheme() throws outside provider
// ---------------------------------------------------------------------------

test('useTheme: throws a descriptive error when called outside a ThemeProvider', () => {
  // Render without any wrapper (no ThemeProvider)
  expect(() => {
    renderHook(() => useTheme())
  }).toThrow(/useTheme must be used within a <ThemeProvider>/i)
})
