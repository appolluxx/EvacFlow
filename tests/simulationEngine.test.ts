import { describe, it, expect } from 'vitest';
import { defaultSchoolBuilding, DEFAULT_ZONE_ASSIGNMENTS, DEFAULT_FLOOR_DELAYS } from '../src/data/defaultSchoolBuilding';
import { SimulationEngine } from '../src/engine/SimulationEngine';
import { SimulationConfig } from '../src/types/scenario';

describe('Headless SimulationEngine', () => {
  const baseConfig: SimulationConfig = {
    scenario: 'BASELINE',
    timeStepS: 0.2, // 0.2s for snappy test runs
    playbackSpeed: 1,
    floorDelaysS: DEFAULT_FLOOR_DELAYS,
    zoneAssignments: DEFAULT_ZONE_ASSIGNMENTS,
    randomSeed: 42,
  };

  it('preserves agent conservation at every simulation step', () => {
    const engine = new SimulationEngine(defaultSchoolBuilding, baseConfig);
    const total = 756;

    for (let step = 0; step < 50; step++) {
      engine.step();
      const agents = engine.getAgents();
      expect(agents.length).toBe(total);

      const states = agents.reduce((acc, a) => {
        acc[a.state] = (acc[a.state] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const sum = Object.values(states).reduce((s, c) => s + c, 0);
      expect(sum).toBe(total);
    }
  });

  it('guarantees identical agent characteristics across paired scenarios for the same seed', () => {
    const engineBaseline = new SimulationEngine(defaultSchoolBuilding, {
      ...baseConfig,
      scenario: 'BASELINE',
    });
    const engineZoning = new SimulationEngine(defaultSchoolBuilding, {
      ...baseConfig,
      scenario: 'ZONING',
    });
    const engineStaggered = new SimulationEngine(defaultSchoolBuilding, {
      ...baseConfig,
      scenario: 'STAGGERED',
    });

    const agentsBase = engineBaseline.getAgents();
    const agentsZone = engineZoning.getAgents();
    const agentsStag = engineStaggered.getAgents();

    expect(agentsBase.length).toBe(agentsZone.length);
    expect(agentsBase.length).toBe(agentsStag.length);

    for (let i = 0; i < agentsBase.length; i++) {
      expect(agentsBase[i].id).toBe(agentsZone[i].id);
      expect(agentsBase[i].baseSpeedMps).toBeCloseTo(agentsZone[i].baseSpeedMps, 6);
      expect(agentsBase[i].baseSpeedMps).toBeCloseTo(agentsStag[i].baseSpeedMps, 6);
      expect(agentsBase[i].reactionDelayS).toBeCloseTo(agentsZone[i].reactionDelayS, 6);
      expect(agentsBase[i].reactionDelayS).toBeCloseTo(agentsStag[i].reactionDelayS, 6);
    }
  });

  it('completes evacuation of all 756 occupants in Baseline scenario deterministically', () => {
    const engine = new SimulationEngine(defaultSchoolBuilding, {
      ...baseConfig,
      timeStepS: 0.5,
    });

    const result = engine.runUntilComplete(600);

    expect(result.completed).toBe(true);
    expect(result.evacuatedCount).toBe(756);
    expect(result.totalOccupants).toBe(756);
    expect(result.totalEvacuationTimeS).toBeGreaterThan(0);
    expect(result.peakDensityPpm2).toBeGreaterThan(0);

    // Cumulative evacuation curve must be non-decreasing
    for (let i = 1; i < result.timeSeries.length; i++) {
      expect(result.timeSeries[i].evacuatedCount).toBeGreaterThanOrEqual(
        result.timeSeries[i - 1].evacuatedCount
      );
    }
  });

  it('provides valid agent snapshots with valid coordinates for 2D rendering', () => {
    const engine = new SimulationEngine(defaultSchoolBuilding, baseConfig);
    // Take a step
    engine.step();
    const snapshots = engine.getSnapshot();

    expect(snapshots.length).toBe(756);
    for (const snap of snapshots) {
      expect(snap.id).toBeDefined();
      expect(Number.isFinite(snap.x)).toBe(true);
      expect(Number.isFinite(snap.y)).toBe(true);
      expect([1, 2, 3]).toContain(snap.floor);
      expect(['WAITING', 'MOVING', 'QUEUED', 'EVACUATED', 'UNASSIGNED']).toContain(snap.state);
    }
  });
});
