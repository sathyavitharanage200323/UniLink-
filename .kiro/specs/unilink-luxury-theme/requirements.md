# Requirements Document

## Introduction

This document defines the functional and non-functional requirements for the UniLink Luxury Theme feature — a comprehensive "orange-gold luxury" UI redesign of the UniLink university appointment booking system. The feature introduces a CSS custom-property token system, dual light/dark palettes built around orange, gold, gray, white, and black, elegant editorial typography (Playfair Display + DM Sans), study-themed SVG background animations, and a persistent theme toggle. All requirements are derived directly from the approved design document.

---

## Glossary

- **ThemeProvider**: React context provider that manages theme state, reads/writes localStorage, and applies the `data-theme` attribute to the document root.
- **ThemeToggle**: Sun/moon icon button rendered inside the Header that calls `toggleTheme()` from ThemeContext.
- **StudyBackground**: Decorative SVG animation layer rendered on hero sections and the login page.
- **ThemeContext**: React context value exposing `{ theme, toggleTheme }` to all descendant components.
- **CSS_Token**: A CSS custom property (e.g. `--color-primary`) defined in `:root` and overridden under `[data-theme="dark"]`.
- **FWOT_Script**: Inline `<script>` placed in `index.html` before any stylesheet that applies `data-theme` synchronously to prevent a flash-of-wrong-theme.
- **Light_Theme**: The default palette using `#FAFAFA` near-white background, `#E8650A` orange, and `#C9A84C` gold.
- **Dark_Theme**: The alternate palette using `#0A0A0A` near-black background with dark gray surfaces.
- **data-theme**: HTML attribute on `document.documentElement` whose value is either `'light'` or `'dark'`, used by CSS to resolve the correct token values.
- **prefers-color-scheme**: CSS media feature / `window.matchMedia` API used to detect the user's OS-level colour preference.
- **Reduced_Motion**: The `prefers-reduced-motion: reduce` media query indicating the user has requested minimal animation.

---

## Requirements

### Requirement 1: Theme Initialisation

**User Story:** As a returning user, I want the page to load with my previously chosen theme, so that I never see a flash of the wrong theme or have to re-select my preference on every visit.

#### Acceptance Criteria

1. WHEN the page loads and `localStorage` contains a valid theme value (`'light'` or `'dark'`), THE ThemeProvider SHALL apply that stored theme to `document.documentElement` via the `data-theme` attribute before the first paint.
2. WHEN the page loads and `localStorage` contains no valid theme value, THE ThemeProvider SHALL read `window.matchMedia('(prefers-color-scheme: dark)').matches` and apply `'dark'` if it is `true`, otherwise apply `'light'`.
3. WHEN `localStorage` contains a value that is not `'light'` or `'dark'`, THE ThemeProvider SHALL ignore that value and fall back to the `prefers-color-scheme` detection.
4. THE FWOT_Script SHALL be placed inside `<head>` in `index.html` before any stylesheet link, so that `data-theme` is set synchronously before CSS is parsed.
5. IF `localStorage` is unavailable (e.g. blocked by browser policy), THEN THE ThemeProvider SHALL silently catch the error and fall back to `prefers-color-scheme` without displaying any error to the user.

---

### Requirement 2: Theme Toggle Behaviour

**User Story:** As a user, I want to switch between light and dark mode at any time, so that I can choose the visual experience that suits my environment or preference.

#### Acceptance Criteria

1. WHEN a user activates the ThemeToggle, THE ThemeProvider SHALL set the new theme to the opposite of the current theme (`'light'` → `'dark'`, `'dark'` → `'light'`).
2. WHEN `toggleTheme()` is called, THE ThemeProvider SHALL update the `data-theme` attribute on `document.documentElement` synchronously.
3. WHEN `toggleTheme()` is called, THE ThemeProvider SHALL persist the new theme value to `localStorage` under the key `'unilink-theme'`.
4. WHEN `toggleTheme()` is called `n` times starting from `'light'`, THE ThemeProvider SHALL result in theme `'light'` if `n` is even and `'dark'` if `n` is odd.
5. THE ThemeProvider SHALL expose a stable `toggleTheme` function reference (via `useCallback`) so that consumers do not re-render unnecessarily.

---

### Requirement 3: ThemeToggle Component

**User Story:** As a user, I want a clearly labelled, accessible toggle button in the header, so that I can switch themes without confusion and with full screen-reader support.

#### Acceptance Criteria

1. WHILE the current theme is `'light'`, THE ThemeToggle SHALL render a Moon icon and set `aria-label` to `"Switch to dark mode"`.
2. WHILE the current theme is `'dark'`, THE ThemeToggle SHALL render a Sun icon and set `aria-label` to `"Switch to light mode"`.
3. THE ThemeToggle SHALL set `aria-pressed="true"` if and only if the current theme is `'dark'`.
4. THE ThemeToggle SHALL be rendered inside the `.header__right` cluster of the Header component, positioned between the notification bell and the user chip.
5. WHEN the ThemeToggle icon transitions between Sun and Moon, THE ThemeToggle SHALL apply a CSS `transition: opacity 0.2s` crossfade.

---

### Requirement 4: CSS Token System — Light Theme

**User Story:** As a developer, I want all colour, typography, spacing, and shadow values defined as CSS custom properties, so that the entire UI can be restyled by changing a single token block.

#### Acceptance Criteria

1. THE System SHALL define all `--color-*`, `--font-*`, `--radius-*`, and `--shadow-*` tokens listed in the design document inside the `:root` selector in `index.css`.
2. THE System SHALL define the following brand colour tokens in `:root`: `--color-primary: #E8650A`, `--color-accent: #C9A84C`, `--color-bg: #FAFAFA`, `--color-bg-secondary: #F5F5F5`, `--color-bg-elevated: #FFFFFF`.
3. THE System SHALL define typography tokens `--font-heading` (Playfair Display with Libre Baskerville and Georgia serif fallbacks) and `--font-body` (DM Sans with Inter and Segoe UI system-ui fallbacks) in `:root`.
4. THE System SHALL define hero gradient tokens `--color-hero-from: #C9A84C` (gold), `--color-hero-mid: #E07A20` (warm amber), `--color-hero-to: #E8650A` (orange) in `:root`.
5. THE System SHALL define status colour tokens `--color-success`, `--color-warning`, and `--color-danger` with their corresponding background variants in `:root`.

---

### Requirement 5: CSS Token System — Dark Theme

**User Story:** As a user who prefers dark mode, I want all UI surfaces to switch to a near-black and dark gray palette, so that the interface is comfortable to use in low-light environments.

#### Acceptance Criteria

1. THE System SHALL define dark-mode overrides for all `--color-*` tokens under the `[data-theme="dark"]` selector in `index.css`.
2. WHEN `data-theme="dark"` is active, THE System SHALL resolve `--color-bg` to `#0A0A0A`, `--color-bg-secondary` to `#1A1A1A`, and `--color-bg-elevated` to `#2A2A2A`.
3. WHEN `data-theme="dark"` is active, THE System SHALL resolve `--color-primary` to `#F97316` (a brighter orange readable on dark backgrounds).
4. WHEN `data-theme="dark"` is active, THE System SHALL resolve `--color-text-primary` to `#F5F5F5` and `--color-text-secondary` to `#B0B0B0`.
5. THE System SHALL not load any additional stylesheet for dark mode — all dark overrides SHALL be resolved by the browser via `var()` references when `data-theme` changes.

---

### Requirement 6: Typography

**User Story:** As a user, I want the application to use elegant, legible fonts, so that the interface feels premium and is easy to read.

#### Acceptance Criteria

1. THE System SHALL load Playfair Display and DM Sans from Google Fonts via a `<link>` tag in `index.html` with `display=swap` to prevent render-blocking.
2. THE System SHALL apply `var(--font-heading)` (Playfair Display) to all `h1`, `h2`, and `h3` elements across all restyled pages.
3. THE System SHALL apply `var(--font-body)` (DM Sans) to all body text, labels, navigation items, and buttons.
4. IF Google Fonts fails to load, THEN THE System SHALL render headings using the `'Libre Baskerville', 'Georgia', serif` fallback and body text using the `'Inter', 'Segoe UI', system-ui, sans-serif` fallback, maintaining full legibility.

---

### Requirement 7: Study Background Animations

**User Story:** As a user visiting the login page or home page hero sections, I want to see subtle study-themed decorative animations, so that the interface feels lively and contextually relevant to a university setting.

#### Acceptance Criteria

1. THE StudyBackground SHALL render an inline SVG containing 8–12 study-themed icons (books, pencils, graduation caps, stars) with `aria-hidden="true"`.
2. THE StudyBackground SHALL animate each icon using staggered `float` and `drift` CSS keyframe animations, using only `transform` and `opacity` properties.
3. THE StudyBackground SHALL have a total rendered SVG markup size of ≤ 100 KB.
4. THE StudyBackground SHALL be positioned with `position: absolute`, `z-index: 0`, and `pointer-events: none` so it does not interfere with interactive elements.
5. WHEN `prefers-reduced-motion: reduce` is active, THE StudyBackground SHALL set all animations to `none` via a CSS media query.
6. THE StudyBackground SHALL accept a `density` prop (`'low'` | `'medium'`, defaulting to `'low'`) and a `variant` prop (`'hero'` | `'login'`, defaulting to `'hero'`) to control opacity and z-index.

---

### Requirement 8: Component Restyling

**User Story:** As a developer, I want all existing UI components to consume CSS tokens instead of hardcoded colour values, so that theme switching works consistently across the entire application without per-component JavaScript.

#### Acceptance Criteria

1. THE System SHALL replace all hardcoded hex colour values in `Header.css`, `StudentHome.css`, `LecturerHome.css`, `BookingPage.css`, `LecturerSchedulePage.css`, `NotificationsPage.css` with `var(--color-*)` token references.
2. THE System SHALL replace all inline `authInputStyle` and `authButtonStyle` objects in `LoginPage.jsx` with CSS token-based classes.
3. THE System SHALL replace all inline style objects in `ProfilePage.jsx` and `UtilityPages.jsx` with CSS token-based classes.
4. WHEN `data-theme` changes, THE System SHALL update all restyled components visually without any JavaScript re-render — CSS variable resolution SHALL handle the repaint.
5. THE System SHALL preserve all existing component functionality and layout after restyling — no interactive behaviour SHALL be broken by the token migration.

---

### Requirement 9: Application Integration

**User Story:** As a developer, I want the ThemeProvider to wrap the entire React application, so that any component in the tree can access and respond to the current theme.

#### Acceptance Criteria

1. THE System SHALL wrap the root `<App />` component with `<ThemeProvider>` in `src/index.js`.
2. THE System SHALL export a `useTheme()` hook from `ThemeProvider.jsx` that returns `{ theme, toggleTheme }` where `theme ∈ { 'light', 'dark' }`.
3. IF `useTheme()` is called outside a `<ThemeProvider>`, THEN THE System SHALL throw a descriptive error indicating the hook must be used within a ThemeProvider.
4. THE System SHALL place all new theme-related files (`ThemeProvider.jsx`, `ThemeToggle.jsx`, `StudyBackground.jsx`) in a `src/theme/` directory.

---

### Requirement 10: Performance and Accessibility

**User Story:** As a user on any device, I want theme switching and animations to be smooth and accessible, so that the experience is not degraded by performance issues or inaccessible interactions.

#### Acceptance Criteria

1. THE System SHALL use only `transform` and `opacity` in all `StudyBackground` animation keyframes so that animations are GPU-composited and do not trigger layout or paint.
2. THE System SHALL apply `will-change: transform` only to animated SVG icon elements within `StudyBackground` (not globally).
3. THE ThemeToggle SHALL be keyboard-focusable and operable via the Enter and Space keys as a standard `<button>` element.
4. WHEN `data-theme` is changed, THE System SHALL resolve the new CSS variable values without triggering a JavaScript-driven repaint or layout shift.
5. THE System SHALL validate any value read from `localStorage` against the allowlist `['light', 'dark']` before applying it, ignoring any other value.
