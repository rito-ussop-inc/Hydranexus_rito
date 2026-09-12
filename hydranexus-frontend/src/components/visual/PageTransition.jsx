import { useState, useEffect } from 'react'

/**
 * PageTransition — Spatial Page Transition Wrapper
 * 
 * Provides smooth 280ms spatial transitions between navigation views
 * without breaking state or requiring an external routing rewrite.
 */
export default function PageTransition({ pageKey, children }) {
  const [active, setActive] = useState(false)

  useEffect(() => {
    setActive(false)
    const timer = setTimeout(() => setActive(true), 20)
    return () => clearTimeout(timer)
  }, [pageKey])

  return (
    <div
      key={pageKey}
      className={`transition-all duration-300 ease-out ${
        active
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-2'
      }`}
    >
      {children}
    </div>
  )
}
