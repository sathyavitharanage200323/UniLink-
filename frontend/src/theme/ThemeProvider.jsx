import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

const STORAGE_KEY = 'unilink-theme'
const ALLOWLIST = ['light', 'dark']

export const ThemeContext = createContext(null)

function applyThemeToDOM(theme) {
  document.documentElement.setAttribute('data-theme', theme)
}

function getInitialTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (ALLOWLIST.includes(stored)) {
      return stored
    }
  } catch {
    // localStorage unavailable — fall through to system preference
  }

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  return prefersDark ? 'dark' : 'light'
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const initial = getInitialTheme()
    applyThemeToDOM(initial)
    return initial
  })

  useEffect(() => {
    applyThemeToDOM(theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = current === 'light' ? 'dark' : 'light'
      applyThemeToDOM(next)
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {
        // localStorage unavailable — theme still works in-session
      }
      return next
    })
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (ctx === null) {
    throw new Error('useTheme must be used within a <ThemeProvider>. Wrap your component tree with <ThemeProvider>.')
  }
  return ctx
}
