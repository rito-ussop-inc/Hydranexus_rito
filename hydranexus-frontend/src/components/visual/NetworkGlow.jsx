import { memo } from 'react'

/**
 * NetworkGlow — Sector Highlight & Depth Accent
 */
function NetworkGlow({ active = false, sector = 'B' }) {
  if (!active) return null

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -top-10 -right-10 h-64 w-64 rounded-full opacity-20 blur-3xl transition-opacity duration-700"
      style={{
        background: 'radial-gradient(circle, rgba(239, 68, 68, 0.4) 0%, rgba(245, 158, 11, 0.2) 50%, transparent 70%)',
      }}
    />
  )
}

export default memo(NetworkGlow)
