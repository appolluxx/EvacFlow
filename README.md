# EvacFlow

> **2D Agent-Based Building Evacuation Simulator**  
> A client-side research and decision-support prototype for comparing evacuation strategies in a multi-story school building.

## 1. Project at a Glance

EvacFlow is a browser-based application that models how occupants move from rooms through corridors and staircases toward designated exits during a building evacuation.

The application represents a building as a spatial graph and represents each occupant as an agent. A simulation engine advances agent movement in fixed time steps, estimates local crowd density, models congestion and queues, and records evacuation events. Users can compare three evacuation strategies under controlled conditions:

1. **Baseline** — occupants begin moving at approximately the same time and use the shortest available route to an exit.
2. **Zoning** — each area or zone is assigned to a designated stairwell and exit route.
3. **Staggered** — occupants use the baseline route, but floors begin moving at different configured times.

EvacFlow visualizes the simulation on a 2D floor plan and provides analytics such as total evacuation time, peak density, queueing time, and bottleneck locations.

**Important:** EvacFlow is a simplified simulation and research prototype. It is intended to compare modeled scenarios and support discussion with school safety personnel. It is not a certified evacuation model, a fire/smoke simulator, an emergency navigation system, or a replacement for an officially approved emergency plan.

---

## 2. Project Goals

### 2.1 Main goals

- Convert a multi-story building layout into a graph that can be validated and searched.
- Simulate occupant movement using an Agent-Based Modeling (ABM) approach.
- Represent congestion, limited pathway storage, queueing, and slower movement under dense conditions.
- Compare Baseline, Zoning, and Staggered scenarios using the same building and controlled random inputs.
- Show agent movement, local density, queues, and bottlenecks on a 2D visualization.
- Run repeatable batch experiments and calculate descriptive statistics.
- Export building configurations and experiment results as JSON and CSV.
- Keep the simulation engine independent from the UI so it can be tested without a browser canvas.

### 2.2 Non-goals

The first version does **not** attempt to simulate:

- Fire growth, smoke propagation, toxic gas, heat, or visibility loss.
- Structural collapse, blocked exits caused by damage, or dynamic hazards.
- Panic psychology, group behavior, family/group cohesion, assistance behavior, or individual disabilities in a validated way.
- Detailed body geometry, collisions, shoulder-to-shoulder interactions, or realistic pedestrian avoidance.
- Two-way pedestrian traffic and counterflow as a validated behavior model.
- Live emergency guidance or automatic changes to a school's official evacuation procedure.

These limitations must be visible in the documentation and must not be hidden in result reports.

---

## 3. Research Context and Intended Use

The project focuses on a practical school-building problem: occupants from multiple rooms and floors may reach the same corridor, staircase, or exit at similar times. This can create queues and areas of high density.

EvacFlow allows a researcher or school safety representative to configure a building model, run alternative strategies, and compare the resulting measurements. The model can help identify questions worth examining during a properly supervised drill, such as:

- Which corridors or stairwells become bottlenecks in the current model?
- Does assigning zones to different stairwells change the modeled distribution of occupants?
- How does a configured floor release delay affect total evacuation time and queues?
- Which parameters have the greatest influence on the result?

Simulation results are conditional on the building data, assumptions, and parameter values entered by the user. A better result in the simulation does not automatically prove that the same strategy is safer in a real emergency.

---

## 4. Technology Stack

The preferred implementation is a fully client-side web application.

| Area | Preferred technology | Responsibility |
|---|---|---|
| Frontend | React + Vite | Application shell and component rendering |
| Language | TypeScript | Domain models, engine contracts, and UI types |
| Styling | Tailwind CSS | Layout and visual styling |
| Icons | Lucide React | Interface icons |
| 2D rendering | HTML Canvas API | Building graph, heatmap, and agent rendering |
| Charts | Recharts | Evacuation curves and experiment comparisons |
| UI state | Zustand or React hooks | User interface and configuration state |
| Batch execution | Web Worker | Run experiments without freezing the UI |
| Unit/integration tests | Vitest | Engine and application tests |
| Data storage | Browser memory and file import/export | No backend is required for the first version |

### Technical decisions

- Use **React + Vite + TypeScript** as the default stack. Do not switch to Next.js unless there is a clear, documented requirement.
- Keep the first version **100% client-side**. Do not add a server, authentication provider, external database, or paid API unless the project scope is explicitly changed.
- Keep simulation calculations out of React components and out of Canvas rendering code.
- Canvas rendering should read simulation snapshots; it must not become the source of simulation truth.
- A Web Worker should run batch experiments. The worker must import the same headless simulation engine used by the interactive mode.
- Use fixed simulation time steps. Browser frame rate must not change the mathematical simulation results.

---

## 5. High-Level Architecture

```text
React Application
│
├── Presentation Layer
│   ├── Building Canvas
│   ├── Floor Switcher
│   ├── Heatmap and Agent Layers
│   ├── Scenario Controls
│   └── Analytics Dashboard
│
├── Application Layer
│   ├── Scenario Manager
│   ├── Simulation Session Controller
│   ├── Building Import / Export
│   └── Results Import / Export
│
├── Simulation Core (headless; no DOM or Canvas dependency)
│   ├── Graph Model and Validation
│   ├── Pathfinding
│   ├── Agent Initialization
│   ├── Movement Engine
│   ├── Density and Congestion Model
│   ├── Queue Manager
│   └── Simulation Metrics
│
├── Experiment and Analytics Layer
│   ├── Batch Runner
│   ├── Seeded Random Number Generator
│   ├── Statistics
│   └── Bottleneck Analysis
│
└── Data Layer
    ├── Building Dataset
    ├── Scenario Configuration
    ├── Simulation Results
    └── JSON / CSV Serialization
```

### Core architecture rule

The simulation core must be usable without React, the DOM, Canvas, `window`, or `requestAnimationFrame`. The interactive simulator and the batch runner must call the same engine implementation. Do not create separate movement or congestion formulas for the UI and batch modes.

---

## 6. Suggested Source Structure

The structure below is a recommended target. Adapt it to an existing repository when necessary, but preserve the separation of concerns.

```text
src/
├── app/
│   ├── App.tsx
│   └── routes/
│
├── components/
│   ├── canvas/
│   │   ├── BuildingCanvas.tsx
│   │   ├── GraphLayer.ts
│   │   ├── HeatmapLayer.ts
│   │   └── AgentLayer.ts
│   ├── controls/
│   └── dashboard/
│
├── engine/
│   ├── graph/
│   │   ├── Graph.ts
│   │   ├── Dijkstra.ts
│   │   └── GraphValidator.ts
│   ├── agents/
│   │   ├── AgentFactory.ts
│   │   └── AgentManager.ts
│   ├── movement/
│   │   ├── MovementEngine.ts
│   │   └── QueueManager.ts
│   ├── congestion/
│   │   ├── SegmentManager.ts
│   │   ├── DensityCalculator.ts
│   │   └── FlowCapacity.ts
│   ├── scenarios/
│   │   ├── Baseline.ts
│   │   ├── Zoning.ts
│   │   └── Staggered.ts
│   ├── metrics/
│   │   └── MetricsCollector.ts
│   └── SimulationEngine.ts
│
├── workers/
│   └── BatchSimulation.worker.ts
│
├── analytics/
│   ├── Statistics.ts
│   ├── BottleneckAnalyzer.ts
│   └── ScenarioComparison.ts
│
├── data/
│   └── defaultSchoolBuilding.ts
│
├── types/
│   ├── graph.ts
│   ├── agent.ts
│   ├── scenario.ts
│   └── results.ts
│
└── utils/
    ├── random.ts
    ├── serialization.ts
    └── validation.ts
```

---

## 7. Domain Model

All physical measurements must use SI units internally. Use meters, seconds, persons, and persons per square meter. Convert to pixels only in the rendering layer.

### 7.1 Building graph

A building is represented as a graph:

- **Node**: a meaningful location such as a room, corridor junction, staircase landing, or exit.
- **Edge**: a traversable connection between two nodes.
- **Path**: an ordered list of connected node IDs from an origin room to an exit.

The graph may be directed or undirected depending on the permitted movement direction of each connection. A bidirectional physical corridor should be represented in a way that allows movement in both directions; do not silently assume every edge is bidirectional.

Recommended node types:

```ts
export type NodeType =
  | 'ROOM'
  | 'CORRIDOR'
  | 'JUNCTION'
  | 'STAIR'
  | 'EXIT';
```

Recommended node model:

```ts
export interface GraphNode {
  id: string;
  label: string;
  floor: number;
  x: number; // Building-plan coordinate in meters, not canvas pixels
  y: number; // Building-plan coordinate in meters, not canvas pixels
  type: NodeType;
  initialOccupants?: number; // Only meaningful for ROOM nodes
  zoneId?: string;
  stairwellId?: string; // Shared identifier for the same stairwell across floors
}
```

Recommended edge model:

```ts
export type EdgeDirection = 'BIDIRECTIONAL' | 'A_TO_B' | 'B_TO_A';

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  lengthM: number;
  widthM: number;
  direction: EdgeDirection;
  isStair: boolean;
  stairwellId?: string;
  maxFlowRatePps?: number; // Optional calibrated entry/flow limit (persons/second)
}
```

### 7.2 Multi-floor representation

- Each floor has its own 2D coordinate plane for visualization.
- Nodes on different floors may have similar `x` and `y` coordinates; their `floor` values distinguish them.
- A stairwell is represented by landing nodes on the relevant floors, connected by stair edges.
- A stair edge must connect the appropriate landings between floors and must include its real travel length and usable width.
- `stairwellId` identifies the same physical stairwell across its landings and connecting edges.
- Do not represent a multi-story stairwell as one unconnected node or as a normal horizontal corridor.

### 7.3 Agent model

An agent represents one occupant in the simplified simulation.

```ts
export type AgentState = 'WAITING' | 'MOVING' | 'QUEUED' | 'EVACUATED' | 'UNASSIGNED';

export interface Agent {
  id: string;
  originNodeId: string;
  originFloor: number;
  currentNodeId: string | null;
  currentEdgeId: string | null;
  distanceOnEdgeM: number;
  path: string[];
  pathIndex: number;
  baseSpeedMps: number;
  currentSpeedMps: number;
  reactionDelayS: number;
  scenarioReleaseDelayS: number;
  state: AgentState;
  evacuatedAtS?: number;
  totalWaitTimeS: number;
}
```

Implementation may refine these interfaces, but it must preserve the meanings and units of the fields.

### 7.4 Scenario types

```ts
export type ScenarioType = 'BASELINE' | 'ZONING' | 'STAGGERED';

export interface SimulationConfig {
  scenario: ScenarioType;
  timeStepS: number;
  playbackSpeed: number;
  floorDelaysS: Record<number, number>;
  zoneAssignments: Record<string, string>; // zoneId -> stairwellId
  randomSeed: number;
}
```

Use explicit unit suffixes such as `M`, `Mps`, `S`, and `Pps` in property names where practical. This reduces unit confusion and makes code easier for humans and AI agents to inspect.

---

## 8. Graph Construction and Validation

### 8.1 Graph construction

The building dataset must define:

- All room nodes and their occupant counts.
- Corridor and junction nodes.
- Stair landing nodes on each relevant floor.
- Stair edges between connected landings.
- Exit nodes on the ground floor or other designated discharge floors.
- Edge length, usable width, direction, and optional calibrated flow limit.
- Zone identifiers for rooms or other relevant origin areas.

### 8.2 Graph validation requirements

Before starting a simulation, validate the building graph. At minimum, check:

1. Every node ID is unique.
2. Every edge ID is unique.
3. Every edge references existing `from` and `to` nodes.
4. Edge lengths and widths are positive finite numbers.
5. Initial occupant counts are non-negative integers.
6. Every occupied room has at least one valid route to an exit under the selected scenario.
7. Stair edges connect valid stair landing nodes and use consistent `stairwellId` values.
8. Direction rules are respected by pathfinding.
9. Zone assignments refer to existing zones and stairwells.
10. A Zoning route actually traverses its assigned stairwell.
11. The graph does not contain invalid zero-length movement links that can break pathfinding.

If validation fails, show a useful error identifying the invalid node, edge, room, zone, or assignment. Do not silently drop occupants, invent a route, or leave agents waiting forever.

---

## 9. Pathfinding

Use **Dijkstra's algorithm** for the initial version because the primary route cost is physical distance and edge lengths are non-negative. A* may be added later, but it must produce valid routes and must not change scenario definitions.

### 9.1 Baseline

- Find the shortest valid path by total physical travel length from each occupied room to a reachable exit.
- Respect edge direction and stair connectivity.
- If multiple exits have the same minimum cost, apply a deterministic tie-breaking rule so the same input produces the same route.

### 9.2 Zoning

- Each zone is assigned to a `stairwellId`.
- Agents from that zone must use a route that traverses the assigned stairwell and then reaches a valid exit.
- The route must be checked as a complete connected path, not merely assigned an exit label.
- If no route through the assigned stairwell exists, report a configuration error or mark the agent `UNASSIGNED`; never silently send the agent through another stairwell.
- Do not add dynamic route reassignment in the first version unless it is explicitly designed, tested, and documented.

### 9.3 Staggered

- Use the same shortest-path rule as Baseline.
- Apply the configured release delay based on the agent's origin floor.
- A floor delay changes the start time; it does not change the route.

### 9.4 Route invariants

For every assigned agent:

- The first path node must equal the agent's origin node.
- The final path node must be an `EXIT` node.
- Every adjacent pair of path nodes must be connected by an edge that permits the required direction of travel.
- A Zoning path must traverse the assigned stairwell.
- A route must not contain repeated or disconnected nodes unless a future documented routing feature requires them.

---

## 10. Simulation Time and Movement Model

### 10.1 Fixed time step

The initial simulation time step is:

```ts
const DEFAULT_TIME_STEP_S = 0.1;
```

The engine advances in fixed simulation steps. The browser animation loop is only responsible for displaying the latest state.

- Interactive mode may use `requestAnimationFrame` to render frames.
- The simulation engine advances by fixed `timeStepS` increments.
- Playback speed (1x, 2x, 5x, 10x) changes how quickly simulation time is consumed relative to wall-clock time; it must not change the movement equations or the fixed simulation time step.
- Batch mode must call the same engine repeatedly without waiting for browser rendering.
- Set a configurable maximum simulation duration or maximum tick count to prevent an invalid scenario from running forever.

### 10.2 Initial walking speed

The initial design range is **1.2–1.5 m/s** per agent. Treat this as a configurable project assumption until it is supported by local measurement or an appropriate reference.

Use a seeded pseudo-random number generator so agent speeds and reaction values can be reproduced. Do not use unseeded `Math.random()` inside the simulation core.

### 10.3 Reaction and release delays

- Every scenario must use the same per-agent base speed and reaction-time sample for a given experiment seed.
- Baseline and Zoning use no additional floor release delay.
- Staggered adds `floorDelaysS[originFloor]` to the agent's reaction delay.
- If the project uses a reaction-time variation of ±2 seconds, clamp the resulting start delay to zero or above. Document the exact sampling distribution and apply it consistently across scenarios.
- The floor release delay is a model input, not a recommendation to delay real occupants during an emergency.

### 10.4 Stair speed

The initial project assumption is:

```ts
const DEFAULT_STAIR_SPEED_FACTOR = 0.6;
```

For a stair edge:

```text
freeFlowSpeed = baseSpeed × stairSpeedFactor
```

This is a configurable simplification, not a universal measured value. Calibrate it using suitable observations or references where possible. Use the actual travel length along the stair route, not an inconsistent mixture of horizontal map distance and vertical travel distance.

---

## 11. Density, Congestion, Storage, and Flow

These concepts must remain separate in the implementation.

### 11.1 Local density

A single average density for a long corridor can hide a local crowd near a door or staircase. Therefore, divide each edge into short segments for density calculations. A configurable segment length around 1–2 meters is a starting point, not a mandatory physical constant.

For segment `i`:

```text
segmentAreaM2 = segmentLengthM × edgeWidthM
segmentDensityPpm2 = segmentOccupantCount / segmentAreaM2
```

The edge's density is useful as a summary, but the heatmap and local movement model should use segment-level density whenever possible.

Agents must be counted in exactly one location at a time: a node/holding area, an edge segment, or an exit/evacuated state. Avoid double-counting agents at segment boundaries.

### 11.2 Speed-density relationship

The first version uses a simplified linear speed-decay function inspired by common speed-density modeling. It is a **project-defined approximation** and must not be described as a validated SFPE equation unless the implementation is later matched to a specific cited model.

Default parameters:

```ts
const DEFAULT_FREE_FLOW_DENSITY_PPM2 = 0.5;
const DEFAULT_JAM_DENSITY_PPM2 = 4.0;
const DEFAULT_MIN_SPEED_FACTOR = 0.15;
```

Let:

- `rho` = local segment density in persons/m².
- `rhoMin` = free-flow density threshold.
- `rhoJam` = jam density threshold.
- `vFree` = free-flow speed after applying the stair multiplier, if relevant.

Then:

```text
if rho <= rhoMin:
    speed = vFree
else:
    congestionFactor = 1 - (rho - rhoMin) / (rhoJam - rhoMin)
    speed = vFree × max(minSpeedFactor, congestionFactor)
```

The implementation must clamp or validate density and parameters so division by zero and invalid values cannot occur. At or above `rhoJam`, this formula still permits a small residual speed because of `minSpeedFactor`; physical blocking and queueing must therefore be handled separately by the segment/queue model.

### 11.3 Storage capacity

Storage capacity is the approximate number of people that can occupy a defined segment under the model's jam-density limit.

```text
segmentCapacity = floor(segmentAreaM2 × rhoJam)
```

Do not interpret this value as the number of people that can pass through the segment per second. It is a storage constraint only.

If a segment has insufficient storage for another agent, the agent must not enter it. The agent waits upstream in a managed queue or at the segment boundary according to the movement model.

### 11.4 Flow capacity / throughput

Flow capacity is the number of occupants that can pass a point or enter a constrained connection per unit time. It is different from storage capacity.

- Support an optional calibrated `maxFlowRatePps` for an edge or constrained connection.
- If a flow limit is configured, enforce it with a deterministic admission/service mechanism (for example, a time accumulator or token budget).
- If no calibrated flow value exists, do not invent one merely to create a bottleneck. Use the explicitly implemented storage and movement constraints and clearly report that a flow-rate limit was not configured.
- Any default flow-rate values must have a documented source or be labeled as experimental assumptions.

### 11.5 Queueing and FIFO

Queues must be managed explicitly rather than inferred only from an agent's `QUEUED` state.

A queue entry should include at least:

```ts
export interface QueueEntry {
  agentId: string;
  targetEdgeId: string;
  queuedAtS: number;
  sequenceNumber: number;
}
```

Queue requirements:

- Maintain a FIFO queue for each constrained entry or segment boundary.
- Preserve order using `queuedAtS` and a deterministic sequence number for ties.
- Admit an agent only when the next segment has sufficient storage and any configured flow-rate gate permits entry.
- Accumulate wait time for each agent.
- Record queue length and wait events for analysis.
- Prevent the same agent from appearing in multiple queues simultaneously.
- Do not allow an agent to move through a full segment or teleport past a queue.
- Handle blocked downstream segments without corrupting agent positions or queue order.

### 11.6 Bottlenecks

A bottleneck is a location or connection that shows evidence of constrained movement. EvacFlow should record multiple signals rather than relying on a single threshold:

- Peak segment density.
- Time spent above a configured density threshold.
- Maximum and average queue length.
- Total queueing time and maximum individual wait time.
- Throughput, when a calibrated flow-rate model is configured.

The bottleneck ranking should identify the measured signals used for each rank. Recommendations must be phrased as analysis prompts for review, not automatic safety instructions.

---

## 12. Scenario Definitions

All scenarios must use the same building graph, occupant count, time step, movement equations, and experiment seed for paired comparisons. Only the scenario-specific routing or release-time policy should change.

### Scenario 1 — Baseline (Simultaneous Evacuation)

- Route: shortest valid path to a reachable exit by physical distance.
- Release delay: per-agent reaction delay only; no additional floor delay.
- Zone restriction: none.
- Purpose: establish the reference result for the configured building and assumptions.

### Scenario 2 — Zoning (Assigned Stairwell)

- Route: shortest valid route that traverses the stairwell assigned to the agent's zone.
- Release delay: same per-agent reaction delay used for the corresponding Baseline experiment.
- Zone restriction: required stairwell assignment.
- Purpose: examine whether distributing zones across stairwells changes modeled congestion and evacuation time.

### Scenario 3 — Staggered (Phased Floor Release)

- Route: same shortest-path method as Baseline.
- Release delay: per-agent reaction delay plus the configured delay for the agent's origin floor.
- Zone restriction: none.
- Purpose: examine how configured floor release timing changes the model's queues and completion time.

**Safety constraint:** Staggered release is a scenario for controlled analysis only. It must never be presented as an instruction to make people wait during a real emergency. The appropriateness of any real-world procedure must be determined by authorized school safety personnel and applicable requirements.

---

## 13. Default Mock Building Dataset

The application must load a synthetic building dataset on first launch so the system can be tested without an imported floor plan.

### 13.1 Required default counts

Use the following exact initial dataset:

| Property | Default |
|---|---:|
| Floors | 3 |
| Classrooms per floor | 7 |
| Total classrooms | 21 |
| Occupants per classroom | 36 |
| Total occupants | 756 |
| Main corridor width | 2.5 m |
| Left stair width | 1.5 m |
| Right stair width | 1.5 m |
| Ground-floor exits | 2 |

The number of occupants is:

```text
3 floors × 7 rooms/floor × 36 occupants/room = 756 occupants
```

### 13.2 Required topology

- Each floor has seven classroom nodes.
- Each classroom connects to the floor's corridor network.
- Each floor has a central corridor or a clearly connected corridor network.
- The corridor network connects to left and right stairwell landings.
- The left stairwell connects the relevant floors to the ground floor.
- The right stairwell connects the relevant floors to the ground floor.
- The two ground-floor discharge routes connect to two separate exit nodes.
- All classroom occupants must have at least one valid route to an exit in Baseline.
- Zoning must have valid zone-to-stairwell assignments for every occupied zone.

### 13.3 Mock-data rules

- Clearly label the dataset as **synthetic mock data** in code, UI, and exported reports.
- Do not claim that mock dimensions or occupant counts represent Surasakmontree School or any real building.
- Do not tune the mock data solely to guarantee that Zoning or Staggered outperforms Baseline.
- Bottlenecks may emerge from the model, but the application must display the measured result even when a scenario performs worse.
- The actual research dataset must be based on a school-authorized survey or approved building information.

---

## 14. User Interface Requirements

The UI should prioritize clear operation and readable research results. Do not prioritize decorative animation over correct information.

### Module 1 — 2D Building Visualizer

Required features:

- Floor tabs for Floor 1, Floor 2, Floor 3, and any imported floors.
- Optional multi-floor overview if it can be implemented without confusing the user.
- Clear visual styles for rooms, corridors, junctions, stairs, and exits.
- Labels for important nodes and connections.
- Agent dots that move smoothly along the active path.
- Heatmap toggle.
- Legend explaining density levels and agent states.
- Display current floor and simulation status.
- Pan and zoom are recommended for larger floor plans.

Heatmap thresholds (initial display defaults):

| Density | Display state |
|---|---|
| `< 1.0 persons/m²` | Green — low density |
| `1.0–< 2.0 persons/m²` | Yellow — moderate density |
| `2.0–< 3.0 persons/m²` | Orange — high density |
| `≥ 3.0 persons/m²` | Red — critical density indicator |

These are visualization thresholds, not universal safety classifications. The UI must label them as model thresholds. Use the same threshold definitions consistently in the legend and code.

Agent state colors:

- `MOVING`: blue.
- `QUEUED`: red.
- `WAITING`: gray.
- `EVACUATED`: optionally hidden or shown in a separate count; do not confuse evacuated agents with people still inside the building.
- `UNASSIGNED`: visibly flagged as a model/configuration error.

Optional later feature:

- Graph Editor Mode for moving nodes, changing room counts, and editing corridor widths.
- Do not implement the graph editor before graph validation, routing, and simulation tests are stable.

### Module 2 — Scenario and Simulation Controls

Required controls:

- Scenario selector: Baseline, Zoning, Staggered.
- Play, Pause, Reset, and single-step controls if practical.
- Playback speed: 1x, 2x, 5x, and optionally 10x.
- Heatmap on/off.
- Floor switcher.
- Batch Run button with configurable iteration count; default research run is 10 iterations per scenario.
- Walking speed range and stair speed factor controls, with clear units.
- Floor delay inputs when Staggered is selected.
- Zone-to-stairwell assignments when Zoning is selected.
- Validation messages before a simulation begins.

Changing a simulation parameter must make it clear whether the current run is invalidated and needs to be reset.

### Module 3 — Batch Runner

Required function contract:

```ts
runBatchSimulation({
  building,
  scenario,
  iterations: 10,
  seed,
  config,
  onProgress,
}): Promise<BatchResult>
```

The exact API may differ, but the batch runner must:

- Run the same headless Simulation Engine as interactive mode.
- Run without Canvas rendering or animation-frame delays.
- Use deterministic seeded random inputs.
- Use paired seeds across scenarios for fair comparison.
- Record each iteration separately; do not store only the mean.
- Return progress and support cancellation if practical.
- Run in a Web Worker so the UI remains responsive.
- Detect incomplete runs and timeouts.

### Module 4 — Analytics Dashboard

Real-time indicators:

- Simulation elapsed time (s).
- Evacuated occupants / total occupants.
- Active bottleneck count.
- Current and peak density (persons/m²).
- Current queue count or total queued occupants.

Batch analytics:

- Mean total evacuation time and sample standard deviation.
- Mean peak density.
- Maximum individual queue wait time.
- Mean queue wait time, where useful.
- Evacuation completion rate.
- Scenario-to-Baseline percentage change.
- Per-edge bottleneck ranking.

Charts and tables:

1. **Evacuation curve:** cumulative number of evacuated agents over simulation time. For batch output, show the mean curve across iterations and optionally a variability band.
2. **Scenario comparison:** mean evacuation time with standard deviation for all three scenarios.
3. **Density comparison:** mean per-run peak density for all three scenarios.
4. **Bottleneck table:** edge/stair label, peak density, time above threshold, average queue wait, maximum queue wait, and the measurements used for its ranking.

Do not compare only final evacuation time. Two scenarios may have similar completion times but very different congestion patterns.

---

## 15. Experiment Design and Statistics

### 15.1 Controlled experiment conditions

For a valid comparison, keep these inputs identical across scenarios:

- Building topology and dimensions.
- Initial occupant count and room distribution.
- Agent base-speed samples for each paired seed.
- Reaction-time samples for each paired seed.
- Simulation time step.
- Density and speed-decay parameters.
- Segment length.
- Flow-rate parameters, if configured.
- Maximum simulation duration.

Only change the scenario policy: route restrictions for Zoning or release timing for Staggered.

### 15.2 Reproducible random seeds

Use the same set of seeds for each scenario. Example:

| Iteration | Baseline | Zoning | Staggered |
|---:|---:|---:|---:|
| 1 | 1001 | 1001 | 1001 |
| 2 | 1002 | 1002 | 1002 |
| 3 | 1003 | 1003 | 1003 |
| ... | ... | ... | ... |
| 10 | 1010 | 1010 | 1010 |

For the same seed, the same agent should receive the same base speed and reaction-time sample in every scenario. Use stable agent IDs and a deterministic random sampling strategy so route differences do not change the random characteristics assigned to agents.

### 15.3 Definitions of metrics

**Total evacuation time (per run)**

```text
lastEvacuationTimeS = maximum evacuatedAtS across all required occupants
```

A run is complete only when all required occupants reach a valid exit. If some occupants are unassigned, stranded, or not evacuated before the maximum duration, mark the run as incomplete. Do not treat its partial completion time as a successful total evacuation time.

**Peak density (per run)**

```text
runPeakDensity = maximum segment density observed on any edge during the run
```

**Maximum individual wait time (per run)**

```text
maxAgentWaitS = maximum totalWaitTimeS across all agents in the run
```

**Mean queue wait time**

Calculate from recorded queue wait events. Document whether the mean is per queue event or per agent; do not mix the two definitions.

### 15.4 Mean and standard deviation

For `n` completed runs with values `x1 ... xn`:

```text
mean = sum(xi) / n

sampleSD = sqrt(sum((xi - mean)^2) / (n - 1))
```

Use sample standard deviation (`n - 1`) for the reported standard deviation when `n > 1`. Clearly show the number of completed runs used in every statistic. Do not silently exclude incomplete runs.

### 15.5 Percentage change relative to Baseline

For a metric where lower is preferable, such as evacuation time or peak density:

```text
reductionPercent =
  ((baselineMean - scenarioMean) / baselineMean) × 100
```

Interpretation:

- Positive value: lower metric than Baseline.
- Zero: same metric as Baseline.
- Negative value: higher metric than Baseline.

Use labels such as **reduction relative to Baseline** rather than always calling the result an improvement. A lower simulated value is not, by itself, proof of improved real-world safety.

### 15.6 Evacuation curve aggregation

For batch comparisons, compute cumulative evacuated counts at consistent simulation-time intervals. Aggregate values across runs at matching time points. If a run ends earlier, retain its final evacuated count for later time points or document another consistent aggregation rule. Do not overlay a single arbitrary run as if it were the batch mean.

### 15.7 Minimum experiment count

The initial project requirement is at least 10 iterations per scenario. Ten runs provide a basic descriptive comparison, not a guarantee of statistical power or generalizable conclusions. Report the sample size and variability, and increase iterations when time and compute capacity allow.

---

## 16. Verification, Validation, and Calibration

These are different activities and must be reported separately.

### 16.1 Verification — did we implement the model correctly?

Use unit and integration tests to confirm that the software follows the specified equations and rules.

Minimum tests:

- Dijkstra returns a valid shortest path for a known graph.
- Direction restrictions are respected.
- Zoning routes traverse the assigned stairwell.
- Invalid or disconnected rooms are reported.
- Agent count is conserved throughout a run.
- An agent cannot occupy two segments or queues at once.
- Agent distance never becomes negative or exceeds the edge length without transitioning correctly.
- Agents cannot enter a full segment.
- FIFO queue order is preserved.
- Configured flow-rate limits are respected.
- Density calculations use the correct segment area and occupant count.
- Speed-decay calculations match the documented formula.
- Fixed time-step results do not depend on Canvas frame rate.
- The same building, seed, and configuration produce repeatable results.
- Batch mode and interactive/headless engine mode use the same model rules.
- A completed agent reaches an `EXIT` node and receives a valid evacuation timestamp.

### 16.2 Validation — does the model represent observed behavior sufficiently?

Where permission is granted, compare model outputs with safe, supervised observations or existing authorized drill records.

Possible observations include:

- Walking speed over a measured distance.
- Time for a group to pass through a corridor or doorway.
- Stair travel time.
- Queue duration at a constrained point.
- Total drill completion time, if the data is reliable and comparable.

Record the data collection method, date, conditions, measurement uncertainty, and any differences between the drill and the simulation.

If suitable real observations are unavailable, clearly state that the model is **not yet empirically validated**. Do not claim accuracy based only on visually plausible animation.

### 16.3 Calibration

Use observations or cited references to select model parameters such as:

- Free-flow walking speed range.
- Stair speed factor.
- Reaction-time distribution.
- Segment length.
- Density thresholds.
- Flow-rate constraints.

Record the source and rationale for every non-obvious parameter. Keep calibrated values separate from editable experimental assumptions.

---

## 17. Data Import, Export, and Reproducibility

### JSON

JSON export should include:

- Schema version.
- Building metadata and source label (`SYNTHETIC_MOCK` or `FIELD_SURVEY`).
- Nodes and edges with units.
- Occupant distribution.
- Scenario configuration.
- Model parameters and time step.
- Random seeds.
- Software/model version where available.

Import must validate the schema and graph before accepting the file. Invalid data must produce actionable errors.

### CSV

Provide CSV export for at least:

- Per-run scenario summary.
- Per-agent evacuation and waiting metrics.
- Per-edge/segment density and queue metrics.
- Evacuation curve time series.

Each export must include units in column names or a clear metadata sheet/file. Do not export only pre-aggregated values when raw run-level values are available.

### Reproducibility record

Every experiment result should retain enough configuration to reproduce it:

- Building dataset version or content hash.
- Scenario type and scenario parameters.
- Model parameters.
- Random seed.
- Iteration number.
- Simulation time step.
- Completion status and stop reason.

---

## 18. Privacy, Permissions, and Safety

- Obtain permission before surveying or modeling a real school building.
- Use aggregate occupant counts by room or area. Do not collect student names, student IDs, personal phone numbers, or individual movement histories for this project.
- Treat detailed real-building floor plans and security-sensitive information carefully. Do not publish restricted floor plans in a public repository or public demo without authorization.
- Clearly distinguish synthetic mock data from surveyed school data in the UI and exported reports.
- Do not present simulation output as an approved evacuation route or a directive for occupants.
- Do not advise users to delay, redirect, or otherwise change a real evacuation without review and approval by responsible school safety personnel.
- Follow the school's approved emergency procedures during all real drills and observations.

---

## 19. Development Phases

Implement in this order. Do not build the complete dashboard before the simulation engine is verified.

### Phase 1 — Domain models and graph validation

- Define TypeScript domain types and units.
- Implement graph loading and validation.
- Create the synthetic three-floor building dataset.
- Test that all 756 mock occupants have valid Baseline routes.

**Exit criteria:** graph validation passes and invalid graphs produce useful errors.

### Phase 2 — Pathfinding and scenario routing

- Implement Dijkstra.
- Implement Baseline route assignment.
- Implement Zoning route constraints through assigned stairwells.
- Implement Staggered release-delay configuration.

**Exit criteria:** all routes satisfy route invariants and scenario rules.

### Phase 3 — Headless simulation engine

- Implement seeded agent creation.
- Implement fixed-step movement.
- Implement segment occupancy and density.
- Implement speed decay, storage constraints, queues, and optional flow limits.
- Record evacuation and waiting events.

**Exit criteria:** engine unit tests pass and a small deterministic building can complete a simulation.

### Phase 4 — Verification and batch experiments

- Add conservation, FIFO, capacity, density, and repeatability tests.
- Implement headless batch execution.
- Add paired random seeds across the three scenarios.
- Move batch runs to a Web Worker.

**Exit criteria:** batch output is reproducible, the UI remains responsive, and incomplete runs are reported correctly.

### Phase 5 — 2D visualizer

- Render nodes, edges, labels, and floors.
- Render agents from engine snapshots.
- Add floor switching, pan/zoom, and heatmap.
- Keep render performance separate from engine correctness.

**Exit criteria:** displayed agent positions and density values match the engine state.

### Phase 6 — Analytics and export

- Add live KPIs.
- Add evacuation curves and scenario comparison charts.
- Add bottleneck ranking.
- Add JSON and CSV import/export.

**Exit criteria:** dashboard values can be traced to raw experiment results and metric definitions.

### Phase 7 — Field-data calibration and evaluation

- Obtain approved building information and aggregate occupant counts.
- Collect permitted observation or drill data.
- Calibrate model parameters and document uncertainty.
- Compare model outputs with observations.

**Exit criteria:** report which parts were verified, which were empirically validated, and which remain assumptions.

---

## 20. Acceptance Criteria

The first usable version is acceptable only when all required items below are satisfied.

### Building and graph

- [ ] The synthetic default building loads without external services.
- [ ] It contains 3 floors, 21 rooms, 36 occupants per room, and 756 occupants total.
- [ ] It contains two connected stairwells and two ground-floor exits.
- [ ] All occupied rooms have valid Baseline routes.
- [ ] Graph validation identifies missing links, invalid dimensions, and invalid zone assignments.

### Simulation engine

- [ ] Simulation runs with a fixed time step of 0.1 seconds by default.
- [ ] Engine code has no dependency on React, Canvas, DOM, or `requestAnimationFrame`.
- [ ] Baseline, Zoning, and Staggered follow their documented rules.
- [ ] Agent speed and reaction samples are reproducible from a seed.
- [ ] Paired scenarios use matching per-agent random characteristics for the same seed.
- [ ] Segment density, speed decay, storage capacity, and queueing are calculated consistently.
- [ ] FIFO queueing is tested.
- [ ] Incomplete or invalid runs are clearly reported.

### Experiment and analytics

- [ ] At least 10 iterations can be run per scenario.
- [ ] Batch runs use the same engine as interactive mode.
- [ ] Batch execution does not freeze the main UI thread.
- [ ] Mean, sample standard deviation, peak density, and maximum individual wait are reported with units.
- [ ] Percentage changes use the documented Baseline formula.
- [ ] Per-run raw results remain available for inspection/export.

### User interface and data

- [ ] Users can switch floors and view the building graph.
- [ ] Users can start, pause, reset, and change playback speed.
- [ ] Users can toggle the heatmap and understand its legend.
- [ ] Users can configure the relevant scenario parameters.
- [ ] Users can export and re-import valid JSON building configurations.
- [ ] Users can export experiment results to CSV.
- [ ] Mock data is clearly labeled and never presented as measured school data.

---

## 21. Instructions for AI Coding Agents

This section is written for AI coding agents that inspect, implement, test, or maintain EvacFlow.

### 21.1 Before changing code

1. Inspect the repository structure, package scripts, existing implementation, and current tests.
2. Read this README completely before proposing an architecture change.
3. Identify what already exists. Do not recreate working modules unnecessarily.
4. Separate confirmed defects from missing features, assumptions, and optional improvements.
5. If real-building measurements are missing, use the clearly labeled synthetic dataset. Never invent real school measurements.

### 21.2 Implementation rules

- Treat this README as the project specification unless a newer, explicitly approved project decision supersedes it.
- Implement working functionality, not UI-only placeholders that pretend to simulate occupants.
- Do not hard-code favorable results or guarantee that Zoning or Staggered will outperform Baseline.
- Do not silently change equations, thresholds, units, route rules, or metric definitions. Explain and test any proposed change.
- Keep the engine deterministic when a seed is provided.
- Keep all physical calculations in SI units.
- Keep the engine independent from the UI and rendering loop.
- Use the same engine for interactive and batch execution.
- Validate imported data before simulation.
- Add or update tests whenever engine behavior changes.
- Avoid unnecessary dependencies and avoid adding a backend to the first version.
- Do not claim empirical validation unless an actual comparison with suitable observation data has been completed.
- Do not hide incomplete runs or invalid agents from reports.

### 21.3 Required work cycle

For each implementation task:

1. Inspect relevant source files and identify the actual code path.
2. State the intended change briefly in the task report or work log.
3. Implement the smallest coherent change that satisfies the requirement.
4. Run relevant unit and integration tests.
5. Run the production build or type check when available.
6. Inspect the changed code and test output for regressions.
7. Report files changed, behavior implemented, tests executed, test results, and known limitations.

### 21.4 Do not

- Do not fabricate test results, benchmark numbers, school data, references, or validation evidence.
- Do not replace the simulation engine with hard-coded animation.
- Do not calculate batch statistics from a single simulation run.
- Do not use different random agent characteristics across paired scenarios when the same seed is intended for comparison.
- Do not confuse storage capacity with flow capacity.
- Do not treat visualization colors as certified safety ratings.
- Do not represent this prototype as an emergency-response system.

---

## 22. Suggested Development Commands

For a standard Vite project, the expected commands are typically:

```bash
npm install
npm run dev
npm run test
npm run build
```

The actual commands depend on the scripts defined in `package.json`. AI agents must inspect `package.json` and use the commands that really exist rather than assuming these scripts are already configured.

---

## 23. Research References and Further Reading

The following references are relevant starting points for evacuation dynamics, agent-based modeling, model validation, and the project's sustainability context. The implementation must still verify that each cited source supports the specific equation or parameter attributed to it.

- Helbing, D., Farkas, I., & Vicsek, T. (2000). Simulating dynamical features of escape panic. *Nature, 407*(6803), 487–490. https://doi.org/10.1038/35035023
- Poulos, A., Tocornal, F., de la Llera, J. C., & Mitrani-Reiser, J. (2018). Validation of an agent-based building evacuation model with a school drill. *Transportation Research Part C: Emerging Technologies, 97*, 82–95. https://doi.org/10.1016/j.trc.2018.10.010
- International Organization for Standardization. (2020). *ISO 20414:2020 Fire safety engineering — Verification and validation protocol for building fire evacuation models.* https://www.iso.org/standard/78348.html
- สำนักงานสภาพัฒนาการเศรษฐกิจและสังคมแห่งชาติ. เป้าหมายการพัฒนาที่ยั่งยืน (Sustainable Development Goals: SDGs). https://sdgs.nesdc.go.th/

Do not claim that EvacFlow complies with ISO 20414 or is certified under that standard merely because it references the document. Use the standard as a source for understanding verification and validation practices, subject to access to and review of the applicable requirements.

---

## 24. Project Status

This README defines the intended product behavior and engineering requirements. It does **not** prove that every listed module has already been implemented.

When reporting project status, distinguish clearly between:

- **Implemented** — present in the repository and working.
- **Tested** — supported by recorded test execution and results.
- **Verified** — shown to implement the documented model rules correctly.
- **Validated** — compared with suitable real-world observation data.
- **Planned** — specified here but not yet implemented.

Never describe a planned feature as completed.

---

**Project name:** EvacFlow  
**Project type:** Client-side 2D Agent-Based Building Evacuation Simulator  
**Primary purpose:** Compare modeled evacuation strategies and identify potential congestion under documented assumptions.
