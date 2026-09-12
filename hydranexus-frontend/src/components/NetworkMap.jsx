import { useState } from 'react'
import ReactFlow, { Background, Controls, MiniMap, Handle, Position } from 'reactflow'
import 'reactflow/dist/style.css'
import { networkEdges, networkNodes } from '../data'

function getNodeIcon(label, type) {
  const l = (label || '').toLowerCase()
  const t = (type || '').toLowerCase()
  if (l.includes('reservoir') || t.includes('source')) {
    return (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600 border border-sky-100">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      </div>
    )
  }
  if (l.includes('tank') || t.includes('tank')) {
    return (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <rect x="5" y="4" width="14" height="16" rx="3" />
          <path strokeLinecap="round" d="M5 9h14M5 15h14" />
        </svg>
      </div>
    )
  }
  if (l.includes('industrial') || l.includes('b3') || t.includes('demand')) {
    return (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      </div>
    )
  }
  if (l.includes('zone') || t.includes('sub-district') || t.includes('residential')) {
    return (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600 border border-sky-100">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </div>
    )
  }
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    </div>
  )
}

function MinimalNode({ data, selected }) {
  const alert = data.alert
  const decay = data.decay

  return (
    <div
      className={`min-w-[170px] rounded-xl border bg-white p-2.5 shadow-2xs transition-all ${
        alert
          ? decay
            ? 'border-orange-400 ring-2 ring-orange-200 shadow-orange-100'
            : 'border-red-400 ring-2 ring-red-200 shadow-red-100'
          : selected
          ? 'border-blue-500 ring-2 ring-blue-100'
          : 'border-slate-200/90 hover:border-blue-300 hover:shadow-xs'
      }`}
    >
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-0 !bg-blue-400/80" />
      
      <div className="flex items-start gap-2.5">
        {getNodeIcon(data.label, data.type)}
        
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1.5">
            <span className="truncate text-xs font-semibold text-slate-800 leading-tight">
              {data.label}
            </span>
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${
                alert
                  ? decay
                    ? 'bg-orange-500 animate-pulse'
                    : 'bg-red-500 animate-pulse'
                  : 'bg-emerald-500'
              }`}
            />
          </div>

          <div className="mt-0.5 text-[10px] font-medium text-slate-400">
            {data.type || 'Junction'}
          </div>

          <div className="mt-1 flex items-center justify-between text-[10px] font-semibold text-slate-600 tabular-nums">
            <span>{data.flow || (data.capacity ? data.capacity : '—')}</span>
            <span>{data.pressure || (data.level ? `${data.level}` : '')}</span>
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-0 !bg-blue-400/80" />
    </div>
  )
}

// Defined outside the component (React Flow error #002 fix)
const nodeTypes = { default: MinimalNode, input: MinimalNode }

export default function NetworkMap({ incidentActive = false, compact = false, onSelectSegment, scenario = 'leak' }) {
  const [activeNode, setActiveNode] = useState(null)
  const decay = scenario === 'corrosion'

  const nodes = networkNodes.map((n) => ({
    ...n,
    data: {
      ...n.data,
      alert: incidentActive && (n.data.label.includes('B2') || n.data.label.includes('B3') || n.data.label.includes('Tank')),
      decay: incidentActive && decay,
    },
  }))

  const edges = networkEdges.map((edge) => {
    const isIncidentEdge = incidentActive && edge.id === 'e4'
    const stroke = isIncidentEdge ? (decay ? '#f97316' : '#ef4444') : '#3b82f6'
    return {
      ...edge,
      type: 'smoothstep',
      animated: isIncidentEdge,
      style: {
        stroke,
        strokeWidth: isIncidentEdge ? 2.5 : 1.5,
        opacity: isIncidentEdge ? 1 : 0.75,
      },
      label: isIncidentEdge ? (decay ? 'structural decay' : scenario === 'burst' ? 'confirmed burst' : 'suspected leak') : '',
      labelStyle: { fontSize: 10, fill: isIncidentEdge ? (decay ? '#ea580c' : '#dc2626') : '#2563eb', fontWeight: 600 },
    }
  })

  return (
    <div className={`relative ${compact ? 'h-[360px]' : 'h-[500px]'} overflow-hidden rounded-2xl border border-slate-200/80 bg-white/50 backdrop-blur-xs`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => {
          setActiveNode(node)
          onSelectSegment?.('B2 → B3')
        }}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#cbd5e1" gap={24} size={1} />
        <Controls showInteractive={false} className="!border-slate-200 !bg-white !shadow-2xs !rounded-xl overflow-hidden" />
      </ReactFlow>

      {/* Floating Network Legend from Reference Mockup */}
      <div className="absolute bottom-3.5 right-3.5 z-10 flex items-center gap-3.5 rounded-full border border-slate-200/90 bg-white/95 px-4 py-1.5 text-[11px] font-medium text-slate-600 shadow-2xs backdrop-blur-xs">
        <div className="flex items-center gap-1.5">
          <span className="h-0.5 w-3.5 rounded-full bg-blue-500" />
          <span>Pipeline</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full border border-blue-500 bg-white" />
          <span>Node</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>Active</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          <span>Incident</span>
        </div>
      </div>

      {activeNode && (
        <div className="absolute bottom-14 right-3.5 z-20 w-64 rounded-xl border border-slate-200 bg-white p-3.5 shadow-md">
          <div className="flex items-start justify-between gap-2">
            <div className="text-xs font-semibold text-slate-800">{activeNode.data.label}</div>
            <button
              onClick={() => setActiveNode(null)}
              className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close node details"
            >
              ×
            </button>
          </div>
          <dl className="mt-2 space-y-1 text-xs text-slate-500">
            <div className="flex justify-between">
              <dt>Type</dt>
              <dd className="font-medium text-slate-700">{activeNode.data.type || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Pressure</dt>
              <dd className="font-medium text-slate-700">{activeNode.data.pressure || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Flow</dt>
              <dd className="font-medium text-slate-700">{activeNode.data.flow || '—'}</dd>
            </div>
            {activeNode.data.level && (
              <div className="flex justify-between">
                <dt>Tank level</dt>
                <dd className="font-medium text-slate-700">{activeNode.data.level}</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  )
}
