import { memo } from 'react'

/**
 * HydraBackground — Ambient Infrastructure Layer
 * 
 * Visual-only, non-interactive digital water-infrastructure network sitting
 * behind the HydraNexus interface. Pure SVG + CSS animations, zero impact on
 * layout, interactions, or performance.
 */
function HydraBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
      style={{
        background: `
          radial-gradient(ellipse 900px 500px at 15% 20%, rgba(59, 130, 246, 0.035) 0%, transparent 70%),
          radial-gradient(ellipse 800px 600px at 85% 75%, rgba(14, 165, 233, 0.03) 0%, transparent 70%)
        `,
      }}
    >
      <svg
        className="h-full w-full"
        viewBox="0 0 1440 900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Engineering grid dots */}
          <pattern id="hydra-grid-dots" width="48" height="48" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.85" fill="#3b82f6" fillOpacity="0.04" />
          </pattern>

          {/* Soft ambient radial glow gradient */}
          <radialGradient id="soft-glow-blue" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
            <stop offset="45%" stopColor="#0ea5e9" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
          </radialGradient>

          {/* Faint particle glow filter */}
          <filter id="hydra-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Core Conduit Paths */}
          <path
            id="pipe-path-1"
            d="M -30,120 L 320,120 L 320,240 L 680,240 L 680,160 L 1080,160 L 1080,300 L 1470,300"
          />
          <path
            id="pipe-path-2"
            d="M 160,-30 L 160,360 L 460,360 L 460,580 L 860,580 L 860,460 L 1240,460 L 1240,760 L 1470,760"
          />
          <path
            id="pipe-path-3"
            d="M -30,500 L 240,500 L 240,720 L 700,720 L 700,840 L 1380,840"
          />
          <path
            id="pipe-path-4"
            d="M 520,-30 L 520,180 L 820,180 L 820,380 L 1020,380 L 1020,700 L 1470,700"
          />
          <path
            id="pipe-path-5"
            d="M 940,-30 L 940,260 L 1320,260 L 1320,620 L 1470,620"
          />
        </defs>

        {/* Faint engineering grid pattern */}
        <rect width="100%" height="100%" fill="url(#hydra-grid-dots)" />

        {/* Pipeline network lines (4% - 6.5% opacity) */}
        <g stroke="#3b82f6" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.055">
          <use href="#pipe-path-1" />
          <use href="#pipe-path-2" />
          <use href="#pipe-path-3" />
          <use href="#pipe-path-4" />
          <use href="#pipe-path-5" />

          {/* Secondary sub-feeder links */}
          <line x1="320" y1="240" x2="460" y2="360" strokeDasharray="3 4" opacity="0.75" />
          <line x1="680" y1="240" x2="820" y2="380" strokeDasharray="3 4" opacity="0.75" />
          <line x1="860" y1="580" x2="1020" y2="700" strokeDasharray="3 4" opacity="0.75" />
          <line x1="240" y1="500" x2="460" y2="580" strokeDasharray="3 4" opacity="0.75" />
        </g>

        {/* Network Junction Nodes (6% - 10% opacity) */}
        <g fill="#2563eb" opacity="0.09">
          <circle cx="320" cy="120" r="2.5" />
          <circle cx="320" cy="240" r="3" />
          <circle cx="680" cy="240" r="3" />
          <circle cx="680" cy="160" r="2.5" />
          <circle cx="1080" cy="160" r="3" />
          <circle cx="1080" cy="300" r="2.5" />

          <circle cx="160" cy="360" r="3" />
          <circle cx="460" cy="360" r="3.5" />
          <circle cx="460" cy="580" r="3" />
          <circle cx="860" cy="580" r="3.5" />
          <circle cx="860" cy="460" r="2.5" />
          <circle cx="1240" cy="460" r="3" />
          <circle cx="1240" cy="760" r="2.5" />

          <circle cx="240" cy="500" r="3" />
          <circle cx="240" cy="720" r="2.5" />
          <circle cx="700" cy="720" r="3" />
          <circle cx="700" cy="840" r="2.5" />

          <circle cx="520" cy="180" r="3" />
          <circle cx="820" cy="180" r="2.5" />
          <circle cx="820" cy="380" r="3" />
          <circle cx="1020" cy="380" r="3" />
          <circle cx="1020" cy="700" r="2.5" />

          <circle cx="940" cy="260" r="3" />
          <circle cx="1320" cy="260" r="2.5" />
          <circle cx="1320" cy="620" r="3" />
        </g>

        {/* Ambient Pulsing Nodes (gentle, infrequent pulse; disabled on reduced motion) */}
        <g className="ambient-pulse">
          <circle cx="460" cy="360" r="3" fill="none" stroke="#3b82f6" strokeWidth="1" opacity="0.08">
            <animate attributeName="r" values="3;6;3" dur="9s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.08;0.02;0.08" dur="9s" repeatCount="indefinite" />
          </circle>
          <circle cx="860" cy="580" r="3" fill="none" stroke="#0ea5e9" strokeWidth="1" opacity="0.08">
            <animate attributeName="r" values="3;6.5;3" dur="11s" begin="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.08;0.02;0.08" dur="11s" begin="3s" repeatCount="indefinite" />
          </circle>
          <circle cx="1080" cy="160" r="3" fill="none" stroke="#3b82f6" strokeWidth="1" opacity="0.08">
            <animate attributeName="r" values="3;6;3" dur="13s" begin="5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.08;0.02;0.08" dur="13s" begin="5s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* Soft glowing ambient nodes matching reference mockup */}
        <g className="ambient-glow-nodes">
          {/* Upper right header glow clusters */}
          <circle cx="1020" cy="110" r="16" fill="url(#soft-glow-blue)" />
          <circle cx="1020" cy="110" r="2.5" fill="#38bdf8" opacity="0.5" />
          <circle cx="1180" cy="80" r="20" fill="url(#soft-glow-blue)" />
          <circle cx="1180" cy="80" r="3" fill="#38bdf8" opacity="0.6" />
          <circle cx="1360" cy="160" r="24" fill="url(#soft-glow-blue)" />
          <circle cx="1360" cy="160" r="3.5" fill="#0ea5e9" opacity="0.7" />

          {/* Mid-right clusters */}
          <circle cx="1320" cy="420" r="18" fill="url(#soft-glow-blue)" />
          <circle cx="1320" cy="420" r="2.5" fill="#38bdf8" opacity="0.45" />

          {/* Left sidebar & background ambient nodes */}
          <circle cx="90" cy="380" r="16" fill="url(#soft-glow-blue)" />
          <circle cx="90" cy="380" r="2.5" fill="#38bdf8" opacity="0.4" />
          <circle cx="70" cy="620" r="18" fill="url(#soft-glow-blue)" />
          <circle cx="70" cy="620" r="3" fill="#38bdf8" opacity="0.45" />

          {/* Central connecting nodes */}
          <circle cx="650" cy="480" r="14" fill="url(#soft-glow-blue)" />
          <circle cx="650" cy="480" r="2" fill="#38bdf8" opacity="0.4" />
          <circle cx="890" cy="480" r="18" fill="url(#soft-glow-blue)" />
          <circle cx="890" cy="480" r="2.5" fill="#38bdf8" opacity="0.45" />
        </g>

        {/* Slow Ambient Flow Pulses (8s-14s linear movement; low opacity; disabled on reduced motion) */}
        <g className="ambient-flow">
          {/* Flow pulse along Path 1 */}
          <circle r="2.2" fill="#38bdf8" opacity="0.12" filter="url(#hydra-glow)">
            <animateMotion dur="11s" repeatCount="indefinite" rotate="auto">
              <mpath href="#pipe-path-1" />
            </animateMotion>
          </circle>

          {/* Flow pulse along Path 2 */}
          <circle r="2" fill="#60a5fa" opacity="0.11" filter="url(#hydra-glow)">
            <animateMotion dur="14s" begin="4s" repeatCount="indefinite" rotate="auto">
              <mpath href="#pipe-path-2" />
            </animateMotion>
          </circle>

          {/* Flow pulse along Path 4 */}
          <circle r="2.2" fill="#0284c7" opacity="0.10" filter="url(#hydra-glow)">
            <animateMotion dur="12s" begin="7s" repeatCount="indefinite" rotate="auto">
              <mpath href="#pipe-path-4" />
            </animateMotion>
          </circle>
        </g>
      </svg>
    </div>
  )
}

export default memo(HydraBackground)
