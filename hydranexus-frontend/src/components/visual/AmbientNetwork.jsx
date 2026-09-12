import { memo } from 'react'

/**
 * AmbientNetwork — State-Aware Water Infrastructure Layer
 * 
 * Persistent SVG/Canvas conduit network sitting behind HydraNexus.
 * Reflects real hydraulic state:
 * - Normal: calm cyan/blue flowing telemetry pulses
 * - Incident (Burst/Leak): active segment B2 → B3 pulses with amber/red alert flow
 */
function AmbientNetwork({ incidentActive = false, scenario = 'normal' }) {
  const isDecay = scenario === 'corrosion'
  const isBurst = scenario === 'burst'
  const alertColor = isDecay ? '#f97316' : isBurst ? '#ef4444' : '#f59e0b'

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
      style={{
        background: `
          radial-gradient(ellipse 1200px 700px at 20% 10%, rgba(14, 165, 233, 0.12) 0%, transparent 70%),
          radial-gradient(ellipse 1000px 600px at 85% 85%, rgba(2, 132, 199, 0.10) 0%, transparent 70%),
          radial-gradient(circle 800px at 50% 45%, rgba(14, 116, 144, 0.08) 0%, transparent 100%)
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
          {/* Engineering Coordinate Grid Pattern */}
          <pattern id="infra-grid-dots" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.75" fill="#38bdf8" fillOpacity="0.07" />
          </pattern>

          {/* Conduit Glow Filters */}
          <filter id="infra-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="alert-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Core Conduit Paths */}
          <path
            id="infra-pipe-1"
            d="M -40,110 L 280,110 L 280,210 L 640,210 L 640,140 L 1040,140 L 1040,280 L 1480,280"
          />
          <path
            id="infra-pipe-2"
            d="M 120,-40 L 120,340 L 440,340 L 440,560 L 840,560 L 840,440 L 1200,440 L 1200,740 L 1480,740"
          />
          <path
            id="infra-pipe-3"
            d="M -40,480 L 220,480 L 220,700 L 680,700 L 680,820 L 1400,820"
          />
          <path
            id="infra-pipe-4"
            d="M 500,-40 L 500,160 L 800,160 L 800,360 L 980,360 L 980,680 L 1480,680"
          />
          {/* Arterial feed segment matching B2 → B3 */}
          <path
            id="infra-segment-b2b3"
            d="M 440,340 L 640,210 L 800,360 L 840,560"
          />
        </defs>

        {/* Faint coordinate grid */}
        <rect width="100%" height="100%" fill="url(#infra-grid-dots)" />

        {/* Normal Infrastructure Conduits */}
        <g stroke="#0284c7" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.12">
          <use href="#infra-pipe-1" />
          <use href="#infra-pipe-2" />
          <use href="#infra-pipe-3" />
          <use href="#infra-pipe-4" />
          <line x1="280" y1="210" x2="440" y2="340" strokeDasharray="3 4" opacity="0.6" />
          <line x1="640" y1="210" x2="800" y2="360" strokeDasharray="3 4" opacity="0.6" />
          <line x1="840" y1="560" x2="980" y2="680" strokeDasharray="3 4" opacity="0.6" />
        </g>

        {/* State-Aware Segment B2 → B3 Overlay */}
        <g>
          {incidentActive ? (
            <path
              d="M 440,340 L 640,210 L 800,360 L 840,560"
              stroke={alertColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="8 6"
              className="animate-flow-dash"
              filter="url(#alert-glow)"
              opacity="0.65"
            />
          ) : (
            <path
              d="M 440,340 L 640,210 L 800,360 L 840,560"
              stroke="#38bdf8"
              strokeWidth="1.2"
              strokeLinecap="round"
              opacity="0.18"
            />
          )}
        </g>

        {/* Conduit Nodes & Junction Rings */}
        <g fill="#0ea5e9" opacity="0.25">
          <circle cx="280" cy="110" r="2.5" />
          <circle cx="280" cy="210" r="3" />
          <circle cx="640" cy="210" r="3" />
          <circle cx="640" cy="140" r="2.5" />
          <circle cx="1040" cy="140" r="3" />
          <circle cx="440" cy="340" r="3.5" />
          <circle cx="440" cy="560" r="3" />
          <circle cx="840" cy="560" r="3.5" />
          <circle cx="800" cy="360" r="3" />
          <circle cx="1200" cy="440" r="3" />
        </g>

        {/* Dynamic Incident Anomaly Pulses */}
        {incidentActive && (
          <g className="ambient-pulse">
            <circle cx="800" cy="360" r="7" fill="none" stroke={alertColor} strokeWidth="1.5" opacity="0.7">
              <animate attributeName="r" values="4;14;4" dur="2.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;0.1;0.8" dur="2.4s" repeatCount="indefinite" />
            </circle>
            <circle cx="640" cy="210" r="5" fill="none" stroke={alertColor} strokeWidth="1.2" opacity="0.5">
              <animate attributeName="r" values="3;10;3" dur="2.8s" begin="0.6s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.7;0.05;0.7" dur="2.8s" begin="0.6s" repeatCount="indefinite" />
            </circle>
          </g>
        )}

        {/* Normal Telemetry Flow Points */}
        <g className="ambient-flow">
          <circle r="2.5" fill="#38bdf8" opacity="0.4" filter="url(#infra-glow)">
            <animateMotion dur={incidentActive ? "6s" : "11s"} repeatCount="indefinite" rotate="auto">
              <mpath href="#infra-pipe-1" />
            </animateMotion>
          </circle>
          <circle r="2" fill="#0284c7" opacity="0.35" filter="url(#infra-glow)">
            <animateMotion dur={incidentActive ? "7s" : "13s"} begin="3s" repeatCount="indefinite" rotate="auto">
              <mpath href="#infra-pipe-2" />
            </animateMotion>
          </circle>
          <circle r="2.2" fill="#0ea5e9" opacity="0.3" filter="url(#infra-glow)">
            <animateMotion dur={incidentActive ? "8s" : "15s"} begin="5s" repeatCount="indefinite" rotate="auto">
              <mpath href="#infra-pipe-4" />
            </animateMotion>
          </circle>
          {incidentActive && (
            <circle r="3" fill={alertColor} opacity="0.75" filter="url(#alert-glow)">
              <animateMotion dur="3.5s" repeatCount="indefinite" rotate="auto">
                <mpath href="#infra-segment-b2b3" />
              </animateMotion>
            </circle>
          )}
        </g>
      </svg>
    </div>
  )
}

export default memo(AmbientNetwork)
