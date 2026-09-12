import { useState, useEffect } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Database,
  Droplets,
  Layers,
  Network,
  Play,
  ShieldAlert,
  Sliders,
  Zap,
} from 'lucide-react'

const SCENES = [
  { id: 1, name: 'Conduits', title: 'Infrastructure Emergence', duration: 1800 },
  { id: 2, name: 'Identity', title: 'HydraNexus Intelligence', duration: 2000 },
  { id: 3, name: 'Topology', title: 'Network Node Activation', duration: 2000 },
  { id: 4, name: 'Telemetry', title: 'Real-time Telemetry Streams', duration: 2000 },
  { id: 5, name: 'Anomaly', title: 'Hydraulic Anomaly Detected', duration: 2000 },
  { id: 6, name: 'Diagnosis', title: 'AI Isolation Forest & Evidence', duration: 2200 },
  { id: 7, name: 'Decide', title: 'Decision Intelligence Engine', duration: 2000 },
  { id: 8, name: 'Console', title: 'Operational Console Handoff', duration: 1200 },
]

export default function LandingExperience({ onComplete, scenario = 'leak' }) {
  const [sceneIndex, setSceneIndex] = useState(0)
  const [isExiting, setIsExiting] = useState(false)

  const current = SCENES[sceneIndex]

  // Auto-advance timeline
  useEffect(() => {
    if (sceneIndex >= SCENES.length - 1) {
      const exitTimer = setTimeout(() => {
        handleFinish()
      }, SCENES[sceneIndex].duration)
      return () => clearTimeout(exitTimer)
    }

    const timer = setTimeout(() => {
      setSceneIndex((prev) => prev + 1)
    }, current.duration)

    return () => clearTimeout(timer)
  }, [sceneIndex])

  const handleFinish = () => {
    setIsExiting(true)
    setTimeout(() => {
      onComplete()
    }, 450)
  }

  const handleJump = (idx) => {
    setSceneIndex(idx)
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col justify-between bg-[#060b14] text-slate-100 transition-all duration-500 select-none ${
        isExiting ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Dynamic Background Conduit Animation */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        <svg className="h-full w-full" viewBox="0 0 1440 900" fill="none" preserveAspectRatio="xMidYMid slice">
          <pattern id="landing-dots" width="36" height="36" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.8" fill="#38bdf8" fillOpacity="0.15" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#landing-dots)" />
          <path
            d="M 100,450 L 350,450 L 550,300 L 850,300 L 1050,450 L 1350,450"
            stroke="#0284c7"
            strokeWidth="1.5"
            strokeDasharray="8 6"
            className="animate-flow-dash"
            opacity="0.5"
          />
          <path
            d="M 350,450 L 550,600 L 850,600 L 1050,450"
            stroke={sceneIndex >= 4 ? '#ef4444' : '#0284c7'}
            strokeWidth={sceneIndex >= 4 ? '2.5' : '1.5'}
            strokeDasharray="6 6"
            className="animate-flow-dash"
            opacity={sceneIndex >= 4 ? '0.85' : '0.4'}
          />
        </svg>
      </div>

      {/* Top Bar: Progress & Skip Button */}
      <header className="relative z-10 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/40 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600 text-white shadow-sm shadow-sky-500/30">
            <Droplets className="h-4 w-4" />
          </div>
          <div>
            <span className="font-mono text-xs font-semibold tracking-wider text-sky-400">HYDRANEXUS SYSTEM BRIEFING</span>
            <span className="ml-2 text-[11px] text-slate-500 hidden sm:inline">Mission-Control Sequence</span>
          </div>
        </div>

        {/* Scene Indicator Dots */}
        <div className="hidden md:flex items-center gap-2">
          {SCENES.map((sc, i) => (
            <button
              key={sc.id}
              onClick={() => handleJump(i)}
              className={`group flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-mono transition-all ${
                sceneIndex === i
                  ? 'bg-sky-950 text-sky-300 border border-sky-800/80 font-bold'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${sceneIndex === i ? 'bg-sky-400 animate-ping' : 'bg-slate-700'}`} />
              <span>{sc.name}</span>
            </button>
          ))}
        </div>

        {/* Skip / Enter Console Button */}
        <button
          onClick={handleFinish}
          className="flex items-center gap-2 rounded-lg border border-sky-800/80 bg-sky-950/60 px-3.5 py-1.5 text-xs font-medium text-sky-300 shadow-xs hover:bg-sky-900/80 hover:text-white transition-all cursor-pointer"
        >
          <span>Enter Console</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </header>

      {/* Main Scene Content Container */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-6 py-8">
        <div className="w-full max-w-4xl">
          {/* Scene 1: Infrastructure Emergence */}
          {sceneIndex === 0 && (
            <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-500">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-900/60 bg-sky-950/40 px-3 py-1 font-mono text-xs text-sky-400">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
                CONDUIT MESH ACTIVE · SAMPLING SCADA NODES
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
                Municipal Water Distribution
              </h1>
              <p className="mx-auto max-w-lg text-sm text-slate-400 sm:text-base">
                Initializing hydraulic telemetry grid across pressurized sub-district zones.
              </p>
            </div>
          )}

          {/* Scene 2: Identity */}
          {sceneIndex === 1 && (
            <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-500">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-600/20 border border-sky-500/40 text-sky-400 shadow-lg shadow-sky-500/10">
                <Droplets className="h-8 w-8 text-sky-400" />
              </div>
              <div>
                <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
                  HydraNexus
                </h1>
                <p className="mt-2 text-lg font-medium text-sky-400 sm:text-xl">
                  Decision Intelligence for Water Infrastructure
                </p>
              </div>
              <p className="mx-auto max-w-md text-xs font-mono text-slate-400">
                Autonomous Anomaly Detection · Physical Hydraulic Verification · Human-in-the-Loop Interventions
              </p>
            </div>
          )}

          {/* Scene 3: Network Activation */}
          {sceneIndex === 2 && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="text-center">
                <span className="font-mono text-xs text-sky-400 uppercase tracking-widest">TOPOLOGY MAPPING</span>
                <h2 className="text-2xl font-bold text-white sm:text-3xl">Sub-district Conduit Network</h2>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 text-center">
                <div className="rounded-xl border border-sky-900/60 bg-slate-900/80 p-3.5 shadow-sm">
                  <span className="block text-[10px] font-mono text-slate-400">SOURCE</span>
                  <span className="block mt-1 text-sm font-bold text-white">Reservoir</span>
                  <span className="text-[11px] text-sky-400">4.5 bar</span>
                </div>
                <div className="rounded-xl border border-sky-900/60 bg-slate-900/80 p-3.5 shadow-sm">
                  <span className="block text-[10px] font-mono text-slate-400">JUNCTION N1</span>
                  <span className="block mt-1 text-sm font-bold text-white">Distribution</span>
                  <span className="text-[11px] text-sky-400">8,200 L/hr</span>
                </div>
                <div className="rounded-xl border border-sky-900/60 bg-slate-900/80 p-3.5 shadow-sm">
                  <span className="block text-[10px] font-mono text-slate-400">ARTERIAL FEED</span>
                  <span className="block mt-1 text-sm font-bold text-white">B2 Junction</span>
                  <span className="text-[11px] text-sky-400">3,060 L/hr</span>
                </div>
                <div className="rounded-xl border border-sky-900/60 bg-slate-900/80 p-3.5 shadow-sm">
                  <span className="block text-[10px] font-mono text-slate-400">ZONES A / B / C</span>
                  <span className="block mt-1 text-sm font-bold text-white">Consumer Grid</span>
                  <span className="text-[11px] text-emerald-400">1,360 Users</span>
                </div>
                <div className="rounded-xl border border-sky-900/60 bg-slate-900/80 p-3.5 shadow-sm col-span-2 sm:col-span-1">
                  <span className="block text-[10px] font-mono text-slate-400">STORAGE</span>
                  <span className="block mt-1 text-sm font-bold text-white">Tank B & C</span>
                  <span className="text-[11px] text-sky-400">3.2m Nominal</span>
                </div>
              </div>
            </div>
          )}

          {/* Scene 4: Telemetry Activation */}
          {sceneIndex === 3 && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="text-center">
                <span className="font-mono text-xs text-sky-400 uppercase tracking-widest">LIVE SCADA STREAMS</span>
                <h2 className="text-2xl font-bold text-white sm:text-3xl">Active Hydraulic Telemetry</h2>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
                  <span className="text-xs text-slate-400">Total System Flow</span>
                  <p className="mt-1 text-2xl font-mono font-bold text-sky-300">8,180 L/hr</p>
                  <span className="text-[11px] text-emerald-400">Baseline ≈ 8,000</span>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
                  <span className="text-xs text-slate-400">Average Pressure</span>
                  <p className="mt-1 text-2xl font-mono font-bold text-sky-300">4.0 bar</p>
                  <span className="text-[11px] text-emerald-400">Nominal 4.0 bar</span>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
                  <span className="text-xs text-slate-400">Metered Consumption</span>
                  <p className="mt-1 text-2xl font-mono font-bold text-sky-300">3,040 L/hr</p>
                  <span className="text-[11px] text-slate-400">Steady Profile</span>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
                  <span className="text-xs text-slate-400">Estimated Loss</span>
                  <p className="mt-1 text-2xl font-mono font-bold text-emerald-400">0 L/hr</p>
                  <span className="text-[11px] text-emerald-400">No active shear</span>
                </div>
              </div>
            </div>
          )}

          {/* Scene 5: Hydraulic Anomaly */}
          {sceneIndex === 4 && (
            <div className="space-y-6 text-center animate-in zoom-in-95 duration-500">
              <div className="inline-flex items-center gap-2 rounded-full border border-red-900/80 bg-red-950/60 px-3 py-1 font-mono text-xs text-red-400 shadow-md shadow-red-950/40">
                <AlertTriangle className="h-4 w-4 text-red-400 animate-pulse" />
                HYDRAULIC ANOMALY ON ARTERIAL SEGMENT B2 → B3
              </div>
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Flow Surge Coupled with Downstream Pressure Loss
              </h2>
              <div className="mx-auto grid max-w-xl grid-cols-3 gap-3">
                <div className="rounded-xl border border-red-900/70 bg-red-950/30 p-3">
                  <span className="text-[11px] text-slate-400">Flow Deviation</span>
                  <p className="text-lg font-mono font-bold text-red-400">+31% surge</p>
                </div>
                <div className="rounded-xl border border-red-900/70 bg-red-950/30 p-3">
                  <span className="text-[11px] text-slate-400">Pressure Drop</span>
                  <p className="text-lg font-mono font-bold text-red-400">-17% drop</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                  <span className="text-[11px] text-slate-400">Consumption</span>
                  <p className="text-lg font-mono font-bold text-slate-200">Stable</p>
                </div>
              </div>
            </div>
          )}

          {/* Scene 6: AI Diagnostic Investigation */}
          {sceneIndex === 5 && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="text-center">
                <span className="font-mono text-xs text-sky-400 uppercase tracking-widest">EXPLAINABLE AI DIAGNOSIS</span>
                <h2 className="text-2xl font-bold text-white sm:text-3xl">Multi-Signal Sensor Fusion</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4">
                  <span className="block text-xs font-semibold text-slate-400">1. MODEL SIGNAL</span>
                  <p className="mt-1 text-xl font-mono font-bold text-amber-400">0.88 Score</p>
                  <p className="mt-1 text-[11px] text-slate-400">Isolation Forest unsupervised density drop.</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4">
                  <span className="block text-xs font-semibold text-slate-400">2. DOMAIN EVIDENCE</span>
                  <p className="mt-1 text-xl font-mono font-bold text-sky-400">Orifice Flow Rule</p>
                  <p className="mt-1 text-[11px] text-slate-400">Q_leak = C_d · A · √(2gH) confirms physical rupture.</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4">
                  <span className="block text-xs font-semibold text-slate-400">3. HYDRAULIC DIAGNOSIS</span>
                  <p className="mt-1 text-xl font-mono font-bold text-red-400">Pipeline Leak (76%)</p>
                  <p className="mt-1 text-[11px] text-slate-400">Location: Segment B2 → B3 in Zone B.</p>
                </div>
              </div>
            </div>
          )}

          {/* Scene 7: Decision Intelligence Engine */}
          {sceneIndex === 6 && (
            <div className="space-y-6 text-center animate-in fade-in duration-500">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-900 bg-sky-950/60 px-3 py-1 font-mono text-xs text-sky-300">
                <Sliders className="h-3.5 w-3.5 text-sky-400" />
                OPERATIONAL DECISION INTELLIGENCE
              </div>
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Evaluate Simulated Interventions Before Acting
              </h2>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <span className="rounded-lg bg-slate-800/80 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300">Detect</span>
                <span className="text-slate-500">→</span>
                <span className="rounded-lg bg-slate-800/80 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300">Investigate</span>
                <span className="text-slate-500">→</span>
                <span className="rounded-lg bg-slate-800/80 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300">Assess</span>
                <span className="text-slate-500">→</span>
                <span className="rounded-lg bg-sky-900/60 border border-sky-500 text-sky-300 px-3 py-1.5 text-xs font-semibold">Simulate</span>
                <span className="text-slate-500">→</span>
                <span className="rounded-lg bg-emerald-950/60 border border-emerald-500 text-emerald-300 px-3 py-1.5 text-xs font-semibold">Decide</span>
              </div>
            </div>
          )}

          {/* Scene 8: Console Handoff */}
          {sceneIndex === 7 && (
            <div className="space-y-4 text-center animate-in zoom-in-95 duration-500">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-900/80 bg-emerald-950/40 px-3.5 py-1.5 font-mono text-xs text-emerald-400">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                SYSTEM INITIALIZED · OPERATOR IN CONTROL
              </div>
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Opening Operational Console...
              </h2>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Timeline Bar */}
      <footer className="relative z-10 flex flex-col gap-2 border-t border-slate-800/80 bg-slate-950/50 px-6 py-3.5 backdrop-blur-md">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <span>SCENE {sceneIndex + 1} OF {SCENES.length}: {current.title}</span>
          <span>{Math.round(((sceneIndex + 1) / SCENES.length) * 100)}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-sky-500 to-blue-600 transition-all duration-300"
            style={{ width: `${((sceneIndex + 1) / SCENES.length) * 100}%` }}
          />
        </div>
      </footer>
    </div>
  )
}
