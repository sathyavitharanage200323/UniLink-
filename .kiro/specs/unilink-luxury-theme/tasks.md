# Implementation Plan: UniLink Luxury Theme

## Overview

Implement the orange-gold luxury theme redesign in a bottom-up order: CSS tokens first, then the theme infrastructure (ThemeProvider, FWOT script, fonts), then the new UI components (ThemeToggle, StudyBackground), then wire everything together, and finally migrate all existing pages/components from hardcoded colours to token references.

## Tasks

- [x] 1. Define CSS token system in `index.css`
  - Add `:root` block with all `--color-*`, `--font-*`, `--radius-*`, and `--shadow-*` tokens from the design token schema (light theme defaults: orange `#E8650A` primary, gold `#C9A84C` accent, near-white `#FAFAFA` background)
  - Add `[data-theme="dark"]` override block with all dark-palette colour tokens (near-black `#0A0A0A` background, dark gray surfaces, gold and orange highlights)
  - Apply `var(--font-heading)` to `h1`, `h2`, `h3` and `var(--font-body)` to `body` globally
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 6.2, 6.3_

- [x] 2. Update `public/index.html` — fonts and FWOT script
  - Add Google Fonts `<link>` for Playfair Display and DM Sans with `display=swap` inside `<head>`
  - Add the inline FWOT `<script>` block inside `<head>` **before** the Google Fonts link and any stylesheet, reading `localStorage` and setting `data-theme` synchronously
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 6.1_

- [x] 3. Create `ThemeProvider.jsx`
  - [x] 3.1 Implement `ThemeProvider` component
    - Create `frontend/src/theme/ThemeProvider.jsx`
    - Implement `ThemeContext` with `React.createContext`
    - On mount: read `localStorage.getItem('unilink-theme')`, validate against allowlist `['light', 'dark']`, fall back to `window.matchMedia('(prefers-color-scheme: dark)')`, then call `applyThemeToDOM`
    - Wrap all `localStorage` calls in `try/catch`; silently fall back on error
    - Expose `{ theme, toggleTheme }` via context; wrap `toggleTheme` in `useCallback`
    - Export `useTheme()` hook that throws a descriptive error when called outside a provider
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 2.1, 2.2, 2.3, 2.5, 9.1, 9.2, 9.3, 10.5_

  - [x] 3.2 Write property test — toggle parity (Property 2)
    - **Property 2: Toggle parity (round-trip)**
    - Use fast-check to generate arbitrary non-negative integers `n`; assert theme equals `'light'` when `n` is even and `'dark'` when `n` is odd, starting from `'light'`
    - **Validates: Requirements 2.1, 2.4**

  - [x] 3.3 Write property test — localStorage persistence (Property 3)
    - **Property 3: localStorage persistence on toggle**
    - For any current theme, after `toggleTheme()`, assert `localStorage.getItem('unilink-theme')` equals the new opposite theme
    - **Validates: Requirements 2.3**

  - [x] 3.4 Write property test — localStorage allowlist validation (Property 5)
    - **Property 5: localStorage allowlist validation**
    - Use fast-check to generate arbitrary strings; assert that any value not in `['light', 'dark']` is ignored and the system falls back to `prefers-color-scheme`
    - **Validates: Requirements 1.3, 10.5**

  - [x] 3.5 Write property test — applyThemeToDOM idempotence (Property 8)
    - **Property 8: applyThemeToDOM idempotence**
    - For any valid theme `t`, calling `applyThemeToDOM(t)` twice produces the same `document.documentElement` state as calling it once
    - **Validates: Requirements 2.2**

  - [x] 3.6 Write unit tests for `ThemeProvider`
    - Test `initTheme` reads stored `localStorage` value and sets `data-theme`
    - Test fallback to `prefers-color-scheme` when `localStorage` is empty
    - Test silent error handling when `localStorage` is blocked
    - Test `useTheme()` throws when called outside provider
    - _Requirements: 1.1, 1.2, 1.5, 9.3_

- [x] 4. Create `ThemeToggle.jsx`
  - [x] 4.1 Implement `ThemeToggle` component
    - Create `frontend/src/theme/ThemeToggle.jsx`
    - Import `Sun` and `Moon` from `lucide-react`; call `useTheme()` for state
    - Render `<Moon>` in light mode, `<Sun>` in dark mode
    - Set `aria-label` and `aria-pressed` correctly per requirements
    - Apply `transition: opacity 0.2s` CSS crossfade on icon swap via `.header__theme-btn` class
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 10.3_

  - [x] 4.2 Write property test — ARIA pressed reflects theme state (Property 7)
    - **Property 7: aria-pressed reflects theme state**
    - For any theme value, assert `aria-pressed === true` if and only if `theme === 'dark'`
    - **Validates: Requirements 3.3**

  - [x] 4.3 Write unit tests for `ThemeToggle`
    - Test `aria-label` reads "Switch to dark mode" in light mode and "Switch to light mode" in dark mode
    - Test clicking the button calls `toggleTheme`
    - Test keyboard operability (Enter and Space)
    - _Requirements: 3.1, 3.2, 10.3_

- [x] 5. Create `StudyBackground.jsx`
  - [x] 5.1 Implement `StudyBackground` component
    - Create `frontend/src/theme/StudyBackground.jsx`
    - Render inline SVG with 8–12 study-themed icons (books, pencils, graduation caps, stars) with `aria-hidden="true"`
    - Position with `position: absolute`, `z-index: 0`, `pointer-events: none`
    - Accept `density` (`'low'` | `'medium'`, default `'low'`) and `variant` (`'hero'` | `'login'`, default `'hero'`) props
    - Apply `will-change: transform` only to animated icon elements
    - Keep total inline SVG markup ≤ 100 KB
    - _Requirements: 7.1, 7.3, 7.4, 7.6, 10.2_

  - [x] 5.2 Add CSS keyframe animations for `StudyBackground`
    - Define `float` and `drift` keyframe animations using only `transform` and `opacity`
    - Assign staggered `animation-delay` values (1.8 s base + small jitter) to each icon element
    - Add `@media (prefers-reduced-motion: reduce)` block that sets `animation: none` on all animated icons
    - _Requirements: 7.2, 7.5, 10.1_

  - [x] 5.3 Write property test — animation keyframe constraint (Property 6)
    - **Property 6: Animation keyframe constraint**
    - Parse the StudyBackground CSS and assert no keyframe rule modifies `width`, `height`, `top`, `left`, `margin`, or `padding` — only `transform` and `opacity` are permitted
    - **Validates: Requirements 7.2, 10.1**

  - [x] 5.4 Write unit tests for `StudyBackground`
    - Test `aria-hidden="true"` is present on the SVG root
    - Test `pointer-events: none` and `position: absolute` are applied
    - Test `density` and `variant` props affect rendered output
    - _Requirements: 7.1, 7.4, 7.6_

- [x] 6. Checkpoint — core theme infrastructure complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Wire `ThemeProvider` into `src/index.js`
  - Import `ThemeProvider` from `./theme/ThemeProvider`
  - Wrap `<App />` with `<ThemeProvider>` in the `ReactDOM.createRoot(...).render(...)` call
  - _Requirements: 9.1, 9.4_

- [x] 8. Update `Header.jsx` and `Header.css`
  - [x] 8.1 Add `ThemeToggle` to `Header.jsx`
    - Import `ThemeToggle` from `../theme/ThemeToggle`
    - Render `<ThemeToggle />` inside `.header__right`, positioned between the notification bell and the user chip
    - Add `.header__theme-btn` class in `Header.css` (reusing `.header__icon-btn` base styles) with `transition: opacity 0.2s`
    - _Requirements: 3.4, 3.5_

  - [x] 8.2 Migrate `Header.css` to CSS tokens
    - Replace all hardcoded hex colour values with `var(--color-*)` token references
    - Replace all hardcoded gradient values with `var(--color-hero-from)` (gold), `var(--color-hero-mid)` (amber), `var(--color-hero-to)` (orange)
    - _Requirements: 8.1, 8.4, 8.5_

  - [x] 8.3 Write unit tests for Header integration
    - Render `<ThemeProvider><Header /></ThemeProvider>` and assert `ThemeToggle` is present
    - Simulate click on ThemeToggle and assert `document.documentElement.getAttribute('data-theme')` changes
    - _Requirements: 3.4, 9.1_

- [x] 9. Migrate `LoginPage.jsx` to CSS tokens
  - Replace `authInputStyle` and `authButtonStyle` inline style objects with CSS token-based class names
  - Add corresponding CSS rules (e.g. `.auth-input`, `.auth-button`) in a `LoginPage.css` or inline `<style>` block that reference `var(--color-*)` tokens
  - Optionally render `<StudyBackground variant="login" />` on the login hero section
  - _Requirements: 8.2, 8.4, 8.5_

- [x] 10. Migrate page CSS files to CSS tokens
  - [x] 10.1 Migrate `StudentHome.css`
    - Replace all hardcoded hex colour values with `var(--color-*)` token references
    - _Requirements: 8.1, 8.4, 8.5_

  - [x] 10.2 Migrate `LecturerHome.css`
    - Replace all hardcoded hex colour values with `var(--color-*)` token references
    - _Requirements: 8.1, 8.4, 8.5_

  - [x] 10.3 Migrate `BookingPage.css`
    - Replace all hardcoded hex colour values with `var(--color-*)` token references
    - _Requirements: 8.1, 8.4, 8.5_

  - [x] 10.4 Migrate `LecturerSchedulePage.css`
    - Replace all hardcoded hex colour values with `var(--color-*)` token references
    - _Requirements: 8.1, 8.4, 8.5_

  - [x] 10.5 Migrate `NotificationsPage.css`
    - Replace all hardcoded hex colour values with `var(--color-*)` token references
    - _Requirements: 8.1, 8.4, 8.5_

- [x] 11. Migrate `ProfilePage.jsx` and `UtilityPages.jsx` to CSS tokens
  - Replace all inline style objects in `ProfilePage.jsx` with CSS token-based class names; add corresponding CSS rules
  - Replace all inline style objects in `UtilityPages.jsx` with CSS token-based class names; add corresponding CSS rules
  - _Requirements: 8.3, 8.4, 8.5_

- [x] 12. Final checkpoint — full theme integration complete
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Property tests use `fast-check` (already referenced in the design document)
- All new theme files live in `frontend/src/theme/`
- The FWOT script in task 2 must appear **before** any `<link rel="stylesheet">` in `index.html` to guarantee synchronous `data-theme` application
- Tasks 1 and 2 have no dependencies and can be done in parallel; all subsequent tasks depend on task 1
- Tasks 10.1–10.5 are independent of each other and can be done in any order
