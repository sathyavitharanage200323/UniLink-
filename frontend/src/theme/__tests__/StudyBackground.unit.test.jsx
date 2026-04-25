/**
 * Unit Tests for StudyBackground
 *
 * Validates: Requirements 7.1, 7.4, 7.6
 */

import React from 'react'
import { render } from '@testing-library/react'
import { StudyBackground } from '../StudyBackground'

// ---------------------------------------------------------------------------
// Requirement 7.1 — aria-hidden="true" on the SVG root
// ---------------------------------------------------------------------------

test('SVG root has aria-hidden="true"', () => {
  const { container } = render(<StudyBackground />)
  const svg = container.querySelector('svg')
  expect(svg).not.toBeNull()
  expect(svg).toHaveAttribute('aria-hidden', 'true')
})

test('SVG root has focusable="false"', () => {
  const { container } = render(<StudyBackground />)
  const svg = container.querySelector('svg')
  expect(svg).toHaveAttribute('focusable', 'false')
})

// ---------------------------------------------------------------------------
// Requirement 7.4 — container has position: absolute and pointer-events: none
// ---------------------------------------------------------------------------

test('container div has position: absolute', () => {
  const { container } = render(<StudyBackground />)
  const div = container.firstChild
  expect(div.style.position).toBe('absolute')
})

test('container div has pointer-events: none', () => {
  const { container } = render(<StudyBackground />)
  const div = container.firstChild
  expect(div.style.pointerEvents).toBe('none')
})

// ---------------------------------------------------------------------------
// Requirement 7.6 — density prop affects icon opacity
// ---------------------------------------------------------------------------

test('density="low" applies opacity 0.18 to icon elements', () => {
  const { container } = render(<StudyBackground density="low" />)
  const icons = container.querySelectorAll('g.study-bg-icon')
  expect(icons.length).toBeGreaterThan(0)
  icons.forEach((icon) => {
    expect(icon.style.opacity).toBe('0.18')
  })
})

test('density="medium" applies opacity 0.30 to icon elements', () => {
  const { container } = render(<StudyBackground density="medium" />)
  const icons = container.querySelectorAll('g.study-bg-icon')
  expect(icons.length).toBeGreaterThan(0)
  icons.forEach((icon) => {
    expect(icon.style.opacity).toBe('0.3')
  })
})

test('density="medium" produces higher icon opacity than density="low"', () => {
  const { container: lowContainer } = render(<StudyBackground density="low" />)
  const { container: medContainer } = render(<StudyBackground density="medium" />)

  const lowIcon = lowContainer.querySelector('g.study-bg-icon')
  const medIcon = medContainer.querySelector('g.study-bg-icon')

  expect(parseFloat(medIcon.style.opacity)).toBeGreaterThan(parseFloat(lowIcon.style.opacity))
})

// ---------------------------------------------------------------------------
// Requirement 7.6 — variant prop affects container opacity
// ---------------------------------------------------------------------------

test('variant="hero" applies opacity 1 to the container', () => {
  const { container } = render(<StudyBackground variant="hero" />)
  const div = container.firstChild
  expect(div.style.opacity).toBe('1')
})

test('variant="login" applies opacity 0.85 to the container', () => {
  const { container } = render(<StudyBackground variant="login" />)
  const div = container.firstChild
  expect(div.style.opacity).toBe('0.85')
})

test('variant="login" produces lower container opacity than variant="hero"', () => {
  const { container: heroContainer } = render(<StudyBackground variant="hero" />)
  const { container: loginContainer } = render(<StudyBackground variant="login" />)

  const heroOpacity = parseFloat(heroContainer.firstChild.style.opacity)
  const loginOpacity = parseFloat(loginContainer.firstChild.style.opacity)

  expect(heroOpacity).toBeGreaterThan(loginOpacity)
})

// ---------------------------------------------------------------------------
// Default props
// ---------------------------------------------------------------------------

test('defaults to density="low" and variant="hero" when no props are passed', () => {
  const { container } = render(<StudyBackground />)
  const div = container.firstChild
  const icon = container.querySelector('g.study-bg-icon')

  // container opacity from hero variant
  expect(div.style.opacity).toBe('1')
  // icon opacity from low density
  expect(icon.style.opacity).toBe('0.18')
})
