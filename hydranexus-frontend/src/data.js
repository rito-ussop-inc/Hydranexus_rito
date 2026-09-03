export const zones = [
  { id: 'A', name: 'Zone A', demand: 1980, pressure: 4.1, status: 'Normal', users: 420, baselineLoss: '0%' },
  { id: 'B', name: 'Zone B', demand: 3060, pressure: 3.3, status: 'Critical', users: 560, baselineLoss: '18.4%' },
  { id: 'C', name: 'Zone C', demand: 2140, pressure: 3.9, status: 'Normal', users: 380, baselineLoss: '1.2%' },
]

export const normalTelemetry = [
  { time: '08:00', flow: 7900, pressure: 4.1, consumption: 2920, anomalyScore: 0.02 },
  { time: '09:00', flow: 8050, pressure: 4.0, consumption: 3010, anomalyScore: 0.01 },
  { time: '10:00', flow: 8120, pressure: 4.0, consumption: 2980, anomalyScore: 0.03 },
  { time: '11:00', flow: 8200, pressure: 3.9, consumption: 3050, anomalyScore: 0.02 },
  { time: '12:00', flow: 8100, pressure: 4.0, consumption: 3000, anomalyScore: 0.01 },
  { time: '13:00', flow: 8150, pressure: 3.9, consumption: 3040, anomalyScore: 0.04 },
  { time: '14:00', flow: 8200, pressure: 3.9, consumption: 3060, anomalyScore: 0.02 },
  { time: '15:00', flow: 8180, pressure: 4.0, consumption: 3040, anomalyScore: 0.02 },
]

export const leakTelemetry = [
  ...normalTelemetry.slice(0, 5),
  { time: '13:00', flow: 8150, pressure: 3.9, consumption: 3040, anomalyScore: 0.04 },
  { time: '14:00', flow: 11400, pressure: 3.2, consumption: 3060, anomalyScore: 0.88 },
  { time: '15:00', flow: 11500, pressure: 3.3, consumption: 3050, anomalyScore: 0.94 },
]

export const burstTelemetry = [
  ...normalTelemetry.slice(0, 5),
  { time: '13:00', flow: 14200, pressure: 2.7, consumption: 3040, anomalyScore: 0.96 },
  { time: '14:00', flow: 15000, pressure: 2.4, consumption: 3000, anomalyScore: 0.99 },
  { time: '15:00', flow: 15300, pressure: 2.3, consumption: 2980, anomalyScore: 0.99 },
]

export const demandTelemetry = [
  ...normalTelemetry.slice(0, 5),
  { time: '13:00', flow: 10400, pressure: 3.8, consumption: 4050, anomalyScore: 0.42 },
  { time: '14:00', flow: 10800, pressure: 3.7, consumption: 4280, anomalyScore: 0.51 },
  { time: '15:00', flow: 11100, pressure: 3.6, consumption: 4400, anomalyScore: 0.58 },
]

export const sensorTelemetry = [
  ...normalTelemetry.slice(0, 5),
  { time: '13:00', flow: 8200, pressure: 4.0, consumption: 3010, anomalyScore: 0.05 },
  { time: '14:00', flow: 12100, pressure: 3.9, consumption: 3030, anomalyScore: 0.72 },
  { time: '15:00', flow: 7900, pressure: 4.0, consumption: 3050, anomalyScore: 0.08 },
]

export const incidents = [
  {
    id: 'INC-1048',
    title: 'Probable pipeline leak',
    type: 'Leak',
    location: 'B2 → B3',
    zone: 'Zone B',
    started: '14:00 today',
    status: 'Investigating',
    severity: 'HIGH',
    confidence: 76,
    lossPerHour: 3500,
    loss24h: 84000,
    pressureChange: -17,
    flowChange: 31,
    causes: [
      ['Pipeline Leak', 76],
      ['Demand Spike', 14],
      ['Valve Issue', 6],
      ['Sensor Fault', 4],
    ],
    evidence: [
      'Flow increased by +31% at main arterial inlet B2',
      'Pressure dropped by -17% across downstream sensor B3',
      'End-user metered consumption remained stable (no demand spike pattern)',
      'Adjacent Zone A and Zone C pressure profiles showed zero cross-coupling',
      'Automated acoustic anomaly model flag matched active pipe shear profile',
    ],
  },
  {
    id: 'INC-1045',
    title: 'Possible demand spike',
    type: 'Demand',
    location: 'C1 → Zone C',
    zone: 'Zone C',
    started: '12:40 today',
    status: 'Resolved',
    severity: 'MEDIUM',
    confidence: 83,
    lossPerHour: 0,
    loss24h: 0,
    pressureChange: -6,
    flowChange: 18,
    causes: [
      ['Demand Spike', 83],
      ['Valve Issue', 8],
      ['Leak', 6],
      ['Sensor Fault', 3],
    ],
    evidence: [
      'Consumption increased by 46%',
      'Pressure reduced modestly',
      'Network-wide flow remained plausible',
    ],
  },
  {
    id: 'INC-1039',
    title: 'Transient PRV oscillation',
    type: 'Valve',
    location: 'N1 Junction',
    zone: 'Zone A',
    started: 'Yesterday 09:15',
    status: 'Resolved',
    severity: 'LOW',
    confidence: 91,
    lossPerHour: 120,
    loss24h: 2880,
    pressureChange: -4,
    flowChange: 5,
    causes: [
      ['Valve Issue', 91],
      ['Sensor Fault', 6],
      ['Demand Spike', 3],
    ],
    evidence: [
      'Pressure regulating valve hunted around 4.1 bar setpoint',
      'Resolved via automated PID loop parameter re-tuning',
    ],
  },
]

export const whatIfOptions = {
  isolate: {
    label: 'Isolate B2 → B3 (Valve Closure 100%)',
    before: { loss: 3500, pressure: 3.3, users: 0 },
    after: { loss: 300, pressure: 3.0, users: 120 },
    notes: 'Maximizes loss reduction (91.4% saved), but isolates 120 customer connections in Zone B until bypass is engaged.',
  },
  reducePressure: {
    label: 'Throttle PRV (Pressure Drop to 3.0 bar)',
    before: { loss: 3500, pressure: 3.3, users: 0 },
    after: { loss: 1575, pressure: 3.15, users: 0 },
    notes: 'Cuts leakage rate by ~55% while maintaining minimum service pressure for all connected customers.',
  },
  bypassRoute: {
    label: 'Reroute via Parallel Sub-main B1-Alt',
    before: { loss: 3500, pressure: 3.3, users: 0 },
    after: { loss: 450, pressure: 3.8, users: 15 },
    notes: 'Maintains 97% supply pressure and isolates leak, requires opening manual valve V-42.',
  },
  doNothing: {
    label: 'Do Nothing (Monitor baseline)',
    before: { loss: 3500, pressure: 3.3, users: 0 },
    after: { loss: 3500, pressure: 3.3, users: 0 },
    notes: 'Continuous loss of 3,500 L/hr (84,000 L/day) leading to potential ground erosion.',
  },
}

export const networkNodes = [
  { id: 'reservoir', position: { x: 40, y: 180 }, data: { label: '💧 Reservoir', type: 'Source', capacity: '120,000 m³', pressure: '4.5 bar' }, type: 'input' },
  { id: 'n1', position: { x: 260, y: 180 }, data: { label: 'N1 · Main Junction', type: 'Distribution', flow: '8,200 L/h', pressure: '4.2 bar' } },
  { id: 'n2', position: { x: 500, y: 80 }, data: { label: 'N2 · Zone A', type: 'Sub-district', flow: '1,980 L/h', pressure: '4.1 bar' } },
  { id: 'n3', position: { x: 500, y: 280 }, data: { label: 'N3 · B2 Junction', type: 'Arterial Feed', flow: '3,060 L/h', pressure: '3.9 bar' } },
  { id: 'n4', position: { x: 760, y: 280 }, data: { label: 'N4 · B3 / Zone B', type: 'High Density', flow: '6,560 L/h', pressure: '3.3 bar' } },
  { id: 'n5', position: { x: 760, y: 80 }, data: { label: 'N5 · Zone C', type: 'Residential', flow: '2,140 L/h', pressure: '3.9 bar' } },
]

export const networkEdges = [
  { id: 'e1', source: 'reservoir', target: 'n1' },
  { id: 'e2', source: 'n1', target: 'n2' },
  { id: 'e3', source: 'n1', target: 'n3' },
  { id: 'e4', source: 'n3', target: 'n4' },
  { id: 'e5', source: 'n1', target: 'n5' },
]

export const systemMetrics = {
  network: { status: 'WARNING', flow: 11500, avgPressure: 3.3, loss: 3500, anomalies: 1 },
  normal: { status: 'NORMAL', flow: 8180, avgPressure: 4.0, loss: 0, anomalies: 0 },
}

