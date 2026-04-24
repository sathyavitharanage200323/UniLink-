/**
 * Integration Tests for Header + ThemeProvider
 *
 * Validates: Requirements 3.4, 9.1
 */

import React from 'react'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '../../theme/ThemeProvider'
import Header from '../Header'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('react-router-dom', () => ({
  Link: ({ to, children, onClick, className }) => (
    <a href={to} onClick={onClick} className={className}>{children}</a>
  ),
  useNavigate: () => jest.fn(),
}))

jest.mock('../../api/chatApi', () => ({
  chatApi: {
    getRoomsForUser: jest.fn(() => Promise.resolve({ data: [] })),
    getUnreadCount: jest.fn(() => Promise.resolve({ data: { count: 0 } })),
  },
}))

jest.mock('../../api', () => ({
  getAllAppointments: jest.fn(() => Promise.resolve([])),
  getLecturerAppointments: jest.fn(() => Promise.resolve([])),
  getStudentAppointments: jest.fn(() => Promise.resolve([])),
}))

jest.mock('react-toastify', () => ({
  toast: { info: jest.fn() },
}))

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
  jest.clearAllTimers()
})

afterEach(() => {
  jest.useRealTimers()
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockUser = { id: 1, name: 'Alice Smith', role: 'STUDENT' }
const mockLogout = jest.fn()

function renderHeader() {
  return render(
    <ThemeProvider>
      <Header currentUser={mockUser} onLogout={mockLogout} />
    </ThemeProvider>
  )
}

// ---------------------------------------------------------------------------
// Requirement 3.4 — ThemeToggle is present inside Header
// ---------------------------------------------------------------------------

test('ThemeToggle is rendered inside Header when wrapped with ThemeProvider', async () => {
  jest.useFakeTimers()
  renderHeader()

  // ThemeToggle renders a button with aria-label "Switch to dark mode" in light mode
  const toggleBtn = screen.getByRole('button', { name: /switch to dark mode/i })
  expect(toggleBtn).toBeInTheDocument()
})

// ---------------------------------------------------------------------------
// Requirement 9.1 — clicking ThemeToggle changes document.documentElement data-theme
// ---------------------------------------------------------------------------

test('clicking ThemeToggle changes data-theme on document.documentElement', async () => {
  jest.useFakeTimers()
  renderHeader()

  // Initial state: light theme (default)
  expect(document.documentElement.getAttribute('data-theme')).toBe('light')

  const toggleBtn = screen.getByRole('button', { name: /switch to dark mode/i })

  await act(async () => {
    userEvent.click(toggleBtn)
  })

  expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
})

// ---------------------------------------------------------------------------
// Requirement 9.1 — toggling back restores light theme
// ---------------------------------------------------------------------------

test('clicking ThemeToggle twice returns data-theme to light', async () => {
  jest.useFakeTimers()
  renderHeader()

  const toggleBtn = screen.getByRole('button', { name: /switch to dark mode/i })

  await act(async () => {
    userEvent.click(toggleBtn)
  })

  expect(document.documentElement.getAttribute('data-theme')).toBe('dark')

  // After second click the button label changes — find by new label
  const toggleBtnDark = screen.getByRole('button', { name: /switch to light mode/i })

  await act(async () => {
    userEvent.click(toggleBtnDark)
  })

  expect(document.documentElement.getAttribute('data-theme')).toBe('light')
})
