import { BuildingData, GraphNode, GraphEdge } from '../../types/graph';
import { ValidationResult, ValidationIssue } from '../../types/results';
import { ScenarioType } from '../../types/scenario';
import { Graph } from './Graph';
import { Dijkstra, PathResult } from './Dijkstra';

export interface ValidationOptions {
  scenario?: ScenarioType;
  zoneAssignments?: Record<string, string>; // zoneId -> stairwellId
}

export class GraphValidator {
  /**
   * Validates a complete building graph according to the 11 requirements in Section 8.2
   */
  public static validate(data: BuildingData, options?: ValidationOptions): ValidationResult {
    const issues: ValidationIssue[] = [];

    const nodeMap = new Map<string, GraphNode>();
    const edgeMap = new Map<string, GraphEdge>();

    // 1. Check: Every node ID is unique
    for (const node of data.nodes) {
      if (nodeMap.has(node.id)) {
        issues.push({
          severity: 'ERROR',
          code: 'DUPLICATE_NODE_ID',
          message: `Duplicate node ID detected: "${node.id}". Node IDs must be unique.`,
          nodeId: node.id,
        });
      } else {
        nodeMap.set(node.id, node);
      }
    }

    // 2. Check: Every edge ID is unique
    for (const edge of data.edges) {
      if (edgeMap.has(edge.id)) {
        issues.push({
          severity: 'ERROR',
          code: 'DUPLICATE_EDGE_ID',
          message: `Duplicate edge ID detected: "${edge.id}". Edge IDs must be unique.`,
          edgeId: edge.id,
        });
      } else {
        edgeMap.set(edge.id, edge);
      }
    }

    // 3. Check: Every edge references existing from and to nodes
    // 4. Check: Edge lengths and widths are positive finite numbers
    // 11. Check: Zero-length links and self-loops
    for (const edge of data.edges) {
      const fromNode = nodeMap.get(edge.from);
      const toNode = nodeMap.get(edge.to);

      if (!fromNode) {
        issues.push({
          severity: 'ERROR',
          code: 'EDGE_MISSING_NODE',
          message: `Edge "${edge.id}" references non-existent "from" node: "${edge.from}".`,
          edgeId: edge.id,
          nodeId: edge.from,
        });
      }

      if (!toNode) {
        issues.push({
          severity: 'ERROR',
          code: 'EDGE_MISSING_NODE',
          message: `Edge "${edge.id}" references non-existent "to" node: "${edge.to}".`,
          edgeId: edge.id,
          nodeId: edge.to,
        });
      }

      if (edge.from === edge.to) {
        issues.push({
          severity: 'ERROR',
          code: 'EDGE_SELF_LOOP',
          message: `Edge "${edge.id}" is a self-loop (from and to node are identical: "${edge.from}").`,
          edgeId: edge.id,
          nodeId: edge.from,
        });
      }

      if (!Number.isFinite(edge.lengthM) || edge.lengthM <= 0) {
        issues.push({
          severity: 'ERROR',
          code: 'INVALID_EDGE_LENGTH',
          message: `Edge "${edge.id}" has invalid length (${edge.lengthM}m). Length must be a positive finite number.`,
          edgeId: edge.id,
        });
      }

      if (!Number.isFinite(edge.widthM) || edge.widthM <= 0) {
        issues.push({
          severity: 'ERROR',
          code: 'INVALID_EDGE_WIDTH',
          message: `Edge "${edge.id}" has invalid width (${edge.widthM}m). Width must be a positive finite number.`,
          edgeId: edge.id,
        });
      }

      // 7. Check: Stair edges connect valid stair landing nodes and use consistent stairwellId
      if (edge.isStair) {
        if (!edge.stairwellId || edge.stairwellId.trim() === '') {
          issues.push({
            severity: 'ERROR',
            code: 'STAIR_MISSING_STAIRWELL_ID',
            message: `Stair edge "${edge.id}" is missing stairwellId.`,
            edgeId: edge.id,
          });
        } else {
          // If nodes have stairwellId defined, ensure they match edge stairwellId
          if (fromNode?.stairwellId && fromNode.stairwellId !== edge.stairwellId) {
            issues.push({
              severity: 'ERROR',
              code: 'STAIRWELL_ID_MISMATCH',
              message: `Stair edge "${edge.id}" stairwellId ("${edge.stairwellId}") does not match "from" node "${fromNode.id}" stairwellId ("${fromNode.stairwellId}").`,
              edgeId: edge.id,
              nodeId: fromNode.id,
              stairwellId: edge.stairwellId,
            });
          }
          if (toNode?.stairwellId && toNode.stairwellId !== edge.stairwellId) {
            issues.push({
              severity: 'ERROR',
              code: 'STAIRWELL_ID_MISMATCH',
              message: `Stair edge "${edge.id}" stairwellId ("${edge.stairwellId}") does not match "to" node "${toNode.id}" stairwellId ("${toNode.stairwellId}").`,
              edgeId: edge.id,
              nodeId: toNode.id,
              stairwellId: edge.stairwellId,
            });
          }
        }
      }
    }

    // 5. Check: Initial occupant counts are non-negative integers
    for (const node of data.nodes) {
      if (node.initialOccupants !== undefined) {
        if (!Number.isInteger(node.initialOccupants) || node.initialOccupants < 0) {
          issues.push({
            severity: 'ERROR',
            code: 'INVALID_OCCUPANT_COUNT',
            message: `Node "${node.id}" has invalid initialOccupants (${node.initialOccupants}). Must be a non-negative integer.`,
            nodeId: node.id,
          });
        }
        if (node.type !== 'ROOM' && node.initialOccupants > 0) {
          issues.push({
            severity: 'WARNING',
            code: 'NON_ROOM_OCCUPANTS',
            message: `Non-room node "${node.id}" of type "${node.type}" has ${node.initialOccupants} occupants. Occupants should typically be placed in ROOM nodes.`,
            nodeId: node.id,
          });
        }
      }
    }

    // Check exit existence
    const exitNodes = data.nodes.filter((n) => n.type === 'EXIT');
    if (exitNodes.length === 0) {
      issues.push({
        severity: 'ERROR',
        code: 'NO_EXITS_DEFINED',
        message: 'Building graph contains no EXIT nodes. At least one EXIT node is required.',
      });
    }

    // Check zone assignments if provided (Check 9)
    const existingZones = new Set(data.nodes.map((n) => n.zoneId).filter(Boolean) as string[]);
    const existingStairwells = new Set([
      ...data.nodes.map((n) => n.stairwellId).filter(Boolean) as string[],
      ...data.edges.map((e) => e.stairwellId).filter(Boolean) as string[],
    ]);

    if (options?.zoneAssignments) {
      for (const [zoneId, stairwellId] of Object.entries(options.zoneAssignments)) {
        if (!existingZones.has(zoneId)) {
          issues.push({
            severity: 'ERROR',
            code: 'INVALID_ZONE_ID',
            message: `Zone assignment references unknown zone: "${zoneId}".`,
            zoneId,
          });
        }
        if (!existingStairwells.has(stairwellId)) {
          issues.push({
            severity: 'ERROR',
            code: 'INVALID_STAIRWELL_ID',
            message: `Zone assignment references unknown stairwell: "${stairwellId}".`,
            stairwellId,
          });
        }
      }
    }

    // Build Graph instance for pathfinding checks (Checks 6, 8, 10)
    // Only proceed with graph routing if there are no fatal structural issues
    const hasStructuralErrors = issues.some((i) =>
      ['DUPLICATE_NODE_ID', 'DUPLICATE_EDGE_ID', 'EDGE_MISSING_NODE'].includes(i.code)
    );

    if (!hasStructuralErrors && exitNodes.length > 0) {
      const graph = new Graph(data);
      const occupiedRooms = graph.getOccupiedRooms();

      for (const room of occupiedRooms) {
        // Baseline route check (Check 6)
        const baselineRoute = Dijkstra.findShortestPathToExit(graph, room.id);
        if (!baselineRoute) {
          issues.push({
            severity: 'ERROR',
            code: 'ROOM_NO_EXIT_ROUTE',
            message: `Occupied room "${room.id}" (${room.label}) has no valid path to any EXIT in Baseline scenario.`,
            nodeId: room.id,
          });
        } else {
          // Verify route invariants (Check 8)
          const invariantIssue = this.validateRouteInvariants(graph, baselineRoute, room.id);
          if (invariantIssue) {
            issues.push(invariantIssue);
          }
        }

        // Zoning route check (Check 10) if Zoning scenario or zone assignment provided
        if (options?.scenario === 'ZONING' || (room.zoneId && options?.zoneAssignments?.[room.zoneId])) {
          const assignedStairwell = room.zoneId ? options?.zoneAssignments?.[room.zoneId] : undefined;
          if (!assignedStairwell) {
            issues.push({
              severity: 'ERROR',
              code: 'MISSING_ZONE_ASSIGNMENT',
              message: `Occupied room "${room.id}" has zone "${room.zoneId || 'none'}" which has no stairwell assignment for Zoning scenario.`,
              nodeId: room.id,
              zoneId: room.zoneId,
            });
          } else {
            const zoningRoute = Dijkstra.findShortestPathWithStairwell(graph, room.id, assignedStairwell);
            if (!zoningRoute) {
              issues.push({
                severity: 'ERROR',
                code: 'ZONING_ROUTE_UNAVAILABLE',
                message: `Occupied room "${room.id}" (${room.label}) cannot reach an exit through assigned stairwell "${assignedStairwell}".`,
                nodeId: room.id,
                zoneId: room.zoneId,
                stairwellId: assignedStairwell,
              });
            } else {
              const invariantIssue = this.validateRouteInvariants(
                graph,
                zoningRoute,
                room.id,
                assignedStairwell
              );
              if (invariantIssue) {
                issues.push(invariantIssue);
              }
            }
          }
        }
      }
    }

    const hasErrors = issues.some((i) => i.severity === 'ERROR');
    return {
      isValid: !hasErrors,
      issues,
    };
  }

  /**
   * Validates Section 9.4 Route Invariants for an assigned route
   */
  public static validateRouteInvariants(
    graph: Graph,
    route: PathResult,
    expectedOriginId: string,
    requiredStairwellId?: string
  ): ValidationIssue | null {
    if (route.path.length === 0) {
      return {
        severity: 'ERROR',
        code: 'EMPTY_ROUTE',
        message: 'Computed route is empty.',
        nodeId: expectedOriginId,
      };
    }

    // Invariant 1: First node must equal agent's origin node
    if (route.path[0] !== expectedOriginId) {
      return {
        severity: 'ERROR',
        code: 'ROUTE_INVALID_ORIGIN',
        message: `Route origin "${route.path[0]}" does not match expected origin "${expectedOriginId}".`,
        nodeId: expectedOriginId,
      };
    }

    // Invariant 2: Final node must be an EXIT node
    const lastNodeId = route.path[route.path.length - 1];
    const lastNode = graph.getNode(lastNodeId);
    if (!lastNode || lastNode.type !== 'EXIT') {
      return {
        severity: 'ERROR',
        code: 'ROUTE_INVALID_DESTINATION',
        message: `Route destination "${lastNodeId}" is not an EXIT node.`,
        nodeId: lastNodeId,
      };
    }

    // Invariant 3: Every adjacent pair must be connected by an edge that permits travel direction
    for (let i = 0; i < route.path.length - 1; i++) {
      const u = route.path[i];
      const v = route.path[i + 1];
      const edge = graph.getEdgeBetween(u, v);
      if (!edge) {
        return {
          severity: 'ERROR',
          code: 'ROUTE_DISCONNECTED_STEP',
          message: `Route step from "${u}" to "${v}" is not connected by a traversable edge.`,
          nodeId: u,
        };
      }
    }

    // Invariant 4: No repeated nodes in simple path
    const visitedNodes = new Set<string>();
    for (const nodeId of route.path) {
      if (visitedNodes.has(nodeId)) {
        return {
          severity: 'ERROR',
          code: 'ROUTE_CYCLE_DETECTED',
          message: `Route contains repeated node "${nodeId}" (cycle).`,
          nodeId,
        };
      }
      visitedNodes.add(nodeId);
    }

    // Invariant 5: If required stairwell, must traverse it
    if (requiredStairwellId) {
      let traversed = false;
      for (let i = 0; i < route.path.length; i++) {
        const node = graph.getNode(route.path[i]);
        if (node?.stairwellId === requiredStairwellId) {
          traversed = true;
          break;
        }
      }
      if (!traversed) {
        for (const edgeId of route.edgeIds) {
          const edge = graph.getEdge(edgeId);
          if (edge?.stairwellId === requiredStairwellId) {
            traversed = true;
            break;
          }
        }
      }

      if (!traversed) {
        return {
          severity: 'ERROR',
          code: 'ROUTE_MISSING_ASSIGNED_STAIRWELL',
          message: `Route from "${expectedOriginId}" failed to traverse assigned stairwell "${requiredStairwellId}".`,
          nodeId: expectedOriginId,
          stairwellId: requiredStairwellId,
        };
      }
    }

    return null;
  }
}
