/**
 * Property-Based Tests for StudyBackground
 *
 * Property 6: Animation keyframe constraint
 * Validates: Requirements 7.2, 10.1
 */

import * as fc from 'fast-check'
import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * **Validates: Requirements 7.2, 10.1**
 *
 * Property 6: Animation keyframe constraint
 *
 * Parse the StudyBackground CSS and assert no keyframe rule modifies
 * `width`, `height`, `top`, `left`, `margin`, or `padding` — only
 * `transform` and `opacity` are permitted.
 */

// Forbidden properties (including variants like margin-top, padding-left, etc.)
const FORBIDDEN_PROPERTIES = [
  'width',
  'height',
  'top',
  'left',
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'padding',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
]

// Allowed properties
const ALLOWED_PROPERTIES = ['transform', 'opacity']

/**
 * Extract all CSS property names used inside @keyframes blocks.
 * Handles nested braces by scanning character-by-character.
 */
function extractKeyframeProperties(cssContent) {
  const properties = []

  let i = 0
  while (i < cssContent.length) {
    // Look for @keyframes
    const keyframesIdx = cssContent.indexOf('@keyframes', i)
    if (keyframesIdx === -1) break

    // Find the opening brace of the @keyframes block
    const openBrace = cssContent.indexOf('{', keyframesIdx)
    if (openBrace === -1) break

    // Find the matching closing brace (accounting for nested braces)
    let depth = 1
    let j = openBrace + 1
    while (j < cssContent.length && depth > 0) {
      if (cssContent[j] === '{') depth++
      else if (cssContent[j] === '}') depth--
      j++
    }

    // Extract the full @keyframes block content (between outer braces)
    const blockContent = cssContent.slice(openBrace + 1, j - 1)

    // Now extract property names from keyframe stops (e.g. "0% { ... }")
    // Each stop is a nested block inside the keyframes block
    let k = 0
    while (k < blockContent.length) {
      const stopOpen = blockContent.indexOf('{', k)
      if (stopOpen === -1) break

      const stopClose = blockContent.indexOf('}', stopOpen)
      if (stopClose === -1) break

      const stopContent = blockContent.slice(stopOpen + 1, stopClose)

      // Extract property names from declarations like "property: value;"
      const declarationRegex = /([a-z][a-z-]*)\s*:/g
      let match
      while ((match = declarationRegex.exec(stopContent)) !== null) {
        properties.push(match[1])
      }

      k = stopClose + 1
    }

    i = j
  }

  return properties
}

test('Property 6: animation keyframe constraint — only transform and opacity are used in keyframes', () => {
  // Read the actual CSS file
  const cssPath = join(__dirname, '..', 'StudyBackground.css')
  const cssContent = readFileSync(cssPath, 'utf-8')

  // Extract all properties used in keyframes
  const keyframeProperties = extractKeyframeProperties(cssContent)

  // Ensure we actually found some keyframe properties (parser sanity check)
  expect(keyframeProperties.length).toBeGreaterThan(0)

  // Assert no forbidden properties are present
  const forbiddenFound = keyframeProperties.filter((prop) =>
    FORBIDDEN_PROPERTIES.includes(prop)
  )
  expect(forbiddenFound).toEqual([])

  // Assert every property found is in the allowed list
  const disallowedFound = keyframeProperties.filter(
    (prop) => !ALLOWED_PROPERTIES.includes(prop)
  )
  expect(disallowedFound).toEqual([])
})

/**
 * Property-based test: verify the parser correctly detects forbidden properties
 * in synthetically generated keyframe CSS.
 */
test('Property 6 (generative): parser correctly identifies forbidden properties in arbitrary keyframes', () => {
  fc.assert(
    fc.property(
      fc.constantFrom(...FORBIDDEN_PROPERTIES),
      fc.constantFrom('10px', '20%', '5rem', 'auto'),
      (forbiddenProp, value) => {
        const cssSnippet = `@keyframes testAnimation { 0% { ${forbiddenProp}: ${value}; } 100% { ${forbiddenProp}: ${value}; } }`
        const properties = extractKeyframeProperties(cssSnippet)
        return properties.includes(forbiddenProp)
      }
    ),
    { numRuns: 50 }
  )
})

/**
 * Property-based test: verify the parser correctly detects allowed properties
 * in synthetically generated keyframe CSS.
 */
test('Property 6 (generative): parser correctly identifies allowed properties in arbitrary keyframes', () => {
  fc.assert(
    fc.property(
      fc.constantFrom(...ALLOWED_PROPERTIES),
      fc.constantFrom('translateY(10px)', 'rotate(45deg)', '0.5', '1'),
      (allowedProp, value) => {
        const cssSnippet = `@keyframes testAnimation { 0% { ${allowedProp}: ${value}; } 100% { ${allowedProp}: ${value}; } }`
        const properties = extractKeyframeProperties(cssSnippet)
        return properties.includes(allowedProp)
      }
    ),
    { numRuns: 50 }
  )
})
