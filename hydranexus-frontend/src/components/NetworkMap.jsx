import { useState } from 'react'
import ReactFlow, { Background, Controls, MiniMap, Handle, Position } from 'reactflow'
import 'reactflow/dist/style.css'
import { networkEdges, networkNodes } from '../data'

function MinimalNode({ data, selected }) {
  const alert = data.alert
  return (
    <div
      className={`min-w-[140px] rounded-md border bg-background px-3 py-2 shadow-sm ${
        alert ? 'border-destructive' : selected ? 'border-primary' : ''
      }`}
    >
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-0 !bg-muted-foreground" />
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium">{data.label}</span>
        <span className={`h-1.5 w-1.5 rounded-full ${alert ? 'bg-destructive' : 'bg-emerald-500'}`} />
      </div>
      <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{data.type || 'Junction'}</span>
        <span>{data.pressure || ''}</span>
      </div>
      {data.flow && <div className="mt-0.5 text-[11px] text-muted-foreground">{data.flow}</div>}
      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-0 !bg-muted-foreground" />
    </div>
  )
}

// Defined outside the component (React Flow error #002 fix) and reads the
// incident flag from node data instead of a window global.
const nodeTypes = { default: MinimalNode, input: MinimalNode }

export default function NetworkMap({ incidentActive = false, compact = false, onSelectSegment }) {
  const [activeNode, setActiveNode] = useState(null)

  const nodes = networkNodes.map((n) => ({
    ...n,
    data: {
      ...n.data,
      alert: incidentActive && (n.data.label.includes('B2') || n.data.label.includes('B3')),
    },
  }))

  const edges = networkEdges.map((edge) => {
    const isIncidentEdge = incidentActive && edge.id === 'e4'
    return {
      ...edge,
      animated: isIncidentEdge,
      style: {
        stroke: isIncidentEdge ? 'hsl(var(--destructive))' : 'hsl(var(--border))',
        strokeWidth: isIncidentEdge ? 2.5 : 1.5,
      },
      label: isIncidentEdge ? 'suspected leak' : '',
      labelStyle: { fontSize: 10 },
    }
  })

  return (
    <div className={`relative ${compact ? 'h-[320px]' : 'h-[480px]'} overflow-hidden rounded-lg border bg-background`}>
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
        <Background color="hsl(var(--border))" gap={24} size={1} />
        <Controls showInteractive={false} />
        <MiniMap pannable zoomable />
      </ReactFlow>

      {activeNode && (
        <div className="absolute bottom-3 right-3 z-20 w-64 rounded-md border bg-background p-3 shadow-md">
          <div className="flex items-start justify-between gap-2">
            <div className="text-xs font-medium">{activeNode.data.label}</div>
            <button
              onClick={() => setActiveNode(null)}
              className="rounded p-0.5 text-muted-foreground hover:bg-accent"
              aria-label="Close node details"
            >
              ×
            </button>
          </div>
          <dl className="mt-2 space-y-1 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <dt>Type</dt>
              <dd className="text-foreground">{activeNode.data.type || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Pressure</dt>
              <dd className="text-foreground">{activeNode.data.pressure || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Flow</dt>
              <dd className="text-foreground">{activeNode.data.flow || '—'}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  )
}
