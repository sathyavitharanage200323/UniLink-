/**
 * StudyBackground — decorative SVG animation layer for hero sections and login page.
 *
 * Props:
 *   density  'low' | 'medium'  (default: 'low')  — controls opacity
 *   variant  'hero' | 'login'  (default: 'hero')  — controls z-index and opacity
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 10.1, 10.2
 */
import './StudyBackground.css';

const VARIANT_STYLES = {
  hero:  { opacity: 1,    zIndex: 0 },
  login: { opacity: 0.85, zIndex: 0 },
};

const DENSITY_OPACITY = {
  low:    0.18,
  medium: 0.30,
};

export function StudyBackground({ density = 'low', variant = 'hero' }) {
  const variantStyle = VARIANT_STYLES[variant] ?? VARIANT_STYLES.hero;
  const iconOpacity  = DENSITY_OPACITY[density]  ?? DENSITY_OPACITY.low;

  const containerStyle = {
    position:      'absolute',
    inset:         0,
    zIndex:        variantStyle.zIndex,
    pointerEvents: 'none',
    overflow:      'hidden',
    opacity:       variantStyle.opacity,
  };

  // will-change is applied inline on each animated <g> element (not globally).
  const iconStyle = { willChange: 'transform' };

  return (
    <div style={containerStyle}>
      <svg
        aria-hidden="true"
        focusable="false"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* ── Icon 1 — Open Book (top-left area) ── */}
        <g
          className="study-bg-icon study-bg-icon--float"
          style={{ ...iconStyle, opacity: iconOpacity }}
          transform="translate(80, 120)"
        >
          <path
            d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          />
          <path
            d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
            fill="none" stroke="currentColor" strokeWidth="2"
          />
          <line x1="12" y1="6" x2="18" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="12" y1="10" x2="18" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </g>

        {/* ── Icon 2 — Pencil (upper-right) ── */}
        <g
          className="study-bg-icon study-bg-icon--drift"
          style={{ ...iconStyle, opacity: iconOpacity }}
          transform="translate(1300, 80) rotate(-20)"
        >
          <path
            d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          />
        </g>

        {/* ── Icon 3 — Graduation Cap (centre-top) ── */}
        <g
          className="study-bg-icon study-bg-icon--float"
          style={{ ...iconStyle, opacity: iconOpacity }}
          transform="translate(680, 50) scale(1.4)"
        >
          <polygon
            points="12 2 22 8.5 12 15 2 8.5"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"
          />
          <polyline
            points="6 11.5 6 17.5 12 21 18 17.5 18 11.5"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          />
          <line x1="22" y1="8.5" x2="22" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* ── Icon 4 — Star (right-middle) ── */}
        <g
          className="study-bg-icon study-bg-icon--drift"
          style={{ ...iconStyle, opacity: iconOpacity }}
          transform="translate(1360, 400) scale(1.2)"
        >
          <polygon
            points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"
          />
        </g>

        {/* ── Icon 5 — Closed Book (bottom-left) ── */}
        <g
          className="study-bg-icon study-bg-icon--float"
          style={{ ...iconStyle, opacity: iconOpacity }}
          transform="translate(60, 700) scale(1.1)"
        >
          <path
            d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          />
          <path
            d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
            fill="none" stroke="currentColor" strokeWidth="2"
          />
        </g>

        {/* ── Icon 6 — Pencil (bottom-right) ── */}
        <g
          className="study-bg-icon study-bg-icon--drift"
          style={{ ...iconStyle, opacity: iconOpacity }}
          transform="translate(1350, 780) rotate(15) scale(1.3)"
        >
          <path
            d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          />
        </g>

        {/* ── Icon 7 — Star (left-middle) ── */}
        <g
          className="study-bg-icon study-bg-icon--float"
          style={{ ...iconStyle, opacity: iconOpacity }}
          transform="translate(30, 430) scale(0.9)"
        >
          <polygon
            points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"
          />
        </g>

        {/* ── Icon 8 — Graduation Cap (bottom-centre) ── */}
        <g
          className="study-bg-icon study-bg-icon--drift"
          style={{ ...iconStyle, opacity: iconOpacity }}
          transform="translate(700, 820) scale(1.2)"
        >
          <polygon
            points="12 2 22 8.5 12 15 2 8.5"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"
          />
          <polyline
            points="6 11.5 6 17.5 12 21 18 17.5 18 11.5"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          />
          <line x1="22" y1="8.5" x2="22" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* ── Icon 9 — Open Book (upper-right quadrant) ── */}
        <g
          className="study-bg-icon study-bg-icon--float"
          style={{ ...iconStyle, opacity: iconOpacity }}
          transform="translate(1100, 160) scale(1.15)"
        >
          <path
            d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          />
          <path
            d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
            fill="none" stroke="currentColor" strokeWidth="2"
          />
          <line x1="12" y1="6" x2="18" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="12" y1="10" x2="18" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </g>

        {/* ── Icon 10 — Star (centre-right) ── */}
        <g
          className="study-bg-icon study-bg-icon--drift"
          style={{ ...iconStyle, opacity: iconOpacity }}
          transform="translate(1200, 550) scale(0.85)"
        >
          <polygon
            points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"
          />
        </g>
      </svg>
    </div>
  );
}

export default StudyBackground;
