import { useState } from 'react'
import ReactFlow, { Background, Controls, MiniMap, Handle, Position } from 'reactflow'
import 'reactflow/dist/style.css'
import { networkEdges, networkNodes } from '../data'

function CustomNode({ data }) {
  const isReservoir = data.label.includes('Reservoir')
  const isSuspected = (data.label.includes('B2') || data.label.includes('B3')) && window.__HYDRA_INCIDENT__

  return (
    <div
      className={`group relative min-w-[150px] rounded-2xl border p-3.5 shadow-md backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:shadow-lg ${
        isSuspected
          ? 'border-rose-400 bg-rose-50/90 text-rose-900 ring-4 ring-rose-200/50'
          : isReservoir
          ? 'border-sky-300 bg-sky-50/90 text-sky-900'
          : 'border-white/90 bg-white/85 text-slate-800'
      }`}
    >
      <Handle type="target" position={Position.Left} className="!bg-sky-400 !w-2.5 !h-2.5" />
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-extrabold tracking-tight">{data.label}</div>
        <span
          className={`h-2 w-2 rounded-full ${
            isSuspected ? 'animate-ping bg-rose-500' : isReservoir ? 'bg-sky-500' : 'bg-emerald-500'
          }`}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
        <span>{data.type || 'Junction'}</span>
        <span className="font-semibold">{data.pressure || '4.0 bar'}</span>
      </div>
      {data.flow && (
        <div className="mt-1 text-[10px] font-bold text-sky-600">
          Flow: {data.flow}
        </div>
      )}
      <Handle type="source" position={Position.Right} className="!bg-sky-400 !w-2.5 !h-2.5" />
    </div>
  )
}

const nodeTypes = { default: CustomNode, input: CustomNode }

export default function NetworkMap({ incidentActive = false, compact = false, onSelectSegment }) {
  window.__HYDRA_INCIDENT__ = incidentActive
  const [activeNode, setActiveNode] = useState(null)

  const edges = networkEdges.map(edge => {
    const isIncidentEdge = incidentActive && edge.id === 'e4'
    return {
      ...edge,
      animated: incidentActive || isIncidentEdge,
      style: {
        stroke: isIncidentEdge ? '#f43f5e' : incidentActive ? '#38bdf8' : '#94a3b8',
        strokeWidth: isIncidentEdge ? 4 : 2.5,
      },
      label: isIncidentEdge ? '⚠ HIGH LEAK PROBABILITY' : '',
    }
  })

  return (
    <div className={`relative ${compact ? 'h-[360px]' : 'h-[540px]'} overflow-hidden rounded-3xl border border-white/90 bg-slate-900/5 backdrop-blur-xl shadow-inner`}>
      <ReactFlow
        nodes={networkNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => {
          setActiveNode(node)
          onSelectSegment?.('B2 → B3')
        }}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#7dd3fc" gap={20} size={1.5} />
        <MiniMap
          nodeColor={(node) => (node.id === 'n4' && incidentActive ? '#f43f5e' : '#0ea5e9')}
          maskColor="rgba(238,249,255,.75)"
        />
        <Controls />
      </ReactFlow>

      {/* Node Inspector Modal/Drawer overlay */}
      {activeNode && (
        <div className="absolute bottom-4 right-4 z-20 w-72 rounded-2xl border border-white/90 bg-white/95 p-4 shadow-xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-sky-600">Selected Node</div>
              <div className="mt-0.5 text-sm font-extrabold text-slate-900">{activeNode.data.label}</div>
            </div>
            <button
              onClick={() => setActiveNode(null)}
              className="grid h-6 w-6 place-items-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500 hover:bg-slate-200"
            >
              ✕
            </button>
          </div>
          <div className="mt-3 space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between border-b border-slate-100 pb-1">
              <span>Category:</span> <span className="font-semibold text-slate-800">{activeNode.data.type}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-1">
              <span>Pressure:</span> <span className="font-semibold text-slate-800">{activeNode.data.pressure}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-1">
              <span>Flow rate:</span> <span className="font-semibold text-slate-800">{activeNode.data.flow || 'Normal'}</span>
            </div>
            <div className="flex justify-between">
              <span>Telemetry status:</span>{' '}
              <span className="font-bold text-emerald-600">Online</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
