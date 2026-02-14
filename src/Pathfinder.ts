import { GameConfig } from './GameConfig';
import type { Rock } from './Rock';

/**
 * Grid-based A* Pathfinder for BaseHold v2.5
 * Works on the existing tile grid (60×60, cell size 40px)
 */

const GRID_SIZE = GameConfig.GAME.GRID_SIZE;      // 40
const MAP_TILES = GameConfig.GAME.MAP_WIDTH_TILES; // 60

// Directions: 4-way (up, down, left, right) + 4 diagonals
const DIRS = [
    { dx: 0, dy: -1, cost: 1 },   // up
    { dx: 0, dy: 1, cost: 1 },    // down
    { dx: -1, dy: 0, cost: 1 },   // left
    { dx: 1, dy: 0, cost: 1 },    // right
    { dx: -1, dy: -1, cost: 1.41 }, // top-left
    { dx: 1, dy: -1, cost: 1.41 },  // top-right
    { dx: -1, dy: 1, cost: 1.41 },  // bottom-left
    { dx: 1, dy: 1, cost: 1.41 },   // bottom-right
];

interface PathNode {
    x: number;
    y: number;
    g: number;
    h: number;
    f: number;
    parent: PathNode | null;
}

export interface PathPoint {
    x: number;
    y: number;
}

export class Pathfinder {
    // Grid: true = blocked, false = walkable
    private grid: boolean[];

    constructor() {
        this.grid = new Array(MAP_TILES * MAP_TILES).fill(false);
    }

    /** Reset grid — call before rebuilding */
    public resetGrid(): void {
        this.grid.fill(false);
    }

    /** Mark a grid cell as blocked by its tile coordinates */
    public blockTile(tileX: number, tileY: number): void {
        if (tileX >= 0 && tileX < MAP_TILES && tileY >= 0 && tileY < MAP_TILES) {
            this.grid[tileY * MAP_TILES + tileX] = true;
        }
    }

    /** Mark a grid cell as walkable by tile coordinates */
    public unblockTile(tileX: number, tileY: number): void {
        if (tileX >= 0 && tileX < MAP_TILES && tileY >= 0 && tileY < MAP_TILES) {
            this.grid[tileY * MAP_TILES + tileX] = false;
        }
    }

    /** Mark a grid cell as blocked by world pixel coordinates */
    public blockWorld(worldX: number, worldY: number): void {
        const tx = Math.floor(worldX / GRID_SIZE);
        const ty = Math.floor(worldY / GRID_SIZE);
        this.blockTile(tx, ty);
    }

    /** Mark a world cell as walkable */
    public unblockWorld(worldX: number, worldY: number): void {
        const tx = Math.floor(worldX / GRID_SIZE);
        const ty = Math.floor(worldY / GRID_SIZE);
        this.unblockTile(tx, ty);
    }

    /** Block all grid tiles that a rock overlaps (circle → grid cells) */
    public blockRock(rock: Rock): void {
        const cx = rock.x;
        const cy = rock.y;
        const r = rock.radius + 10; // Same margin as BuildingSystem.isRockAt

        // Find bounding box in tile coords
        const minTX = Math.max(0, Math.floor((cx - r) / GRID_SIZE));
        const maxTX = Math.min(MAP_TILES - 1, Math.floor((cx + r) / GRID_SIZE));
        const minTY = Math.max(0, Math.floor((cy - r) / GRID_SIZE));
        const maxTY = Math.min(MAP_TILES - 1, Math.floor((cy + r) / GRID_SIZE));

        for (let ty = minTY; ty <= maxTY; ty++) {
            for (let tx = minTX; tx <= maxTX; tx++) {
                // Check if cell center is inside rock circle
                const cellCX = tx * GRID_SIZE + GRID_SIZE / 2;
                const cellCY = ty * GRID_SIZE + GRID_SIZE / 2;
                const dx = cellCX - cx;
                const dy = cellCY - cy;
                if (dx * dx + dy * dy < r * r) {
                    this.grid[ty * MAP_TILES + tx] = true;
                }
            }
        }
    }

    /** Check if a tile is walkable */
    public isWalkable(tileX: number, tileY: number): boolean {
        if (tileX < 0 || tileX >= MAP_TILES || tileY < 0 || tileY >= MAP_TILES) return false;
        return !this.grid[tileY * MAP_TILES + tileX];
    }

    /**
     * Find path from world coords to world coords.
     * Returns array of world-coordinate waypoints (center of each tile),
     * or empty array if no path found.
     * maxNodes limits the search to prevent lag on large maps.
     */
    public findPath(fromX: number, fromY: number, toX: number, toY: number, maxNodes: number = 500): PathPoint[] {
        const startTX = Math.floor(fromX / GRID_SIZE);
        const startTY = Math.floor(fromY / GRID_SIZE);
        let endTX = Math.floor(toX / GRID_SIZE);
        let endTY = Math.floor(toY / GRID_SIZE);

        // Clamp to grid bounds
        const clamp = (v: number) => Math.max(0, Math.min(MAP_TILES - 1, v));
        const stx = clamp(startTX);
        const sty = clamp(startTY);
        endTX = clamp(endTX);
        endTY = clamp(endTY);

        // If start or end is blocked, find nearest walkable
        if (!this.isWalkable(stx, sty)) {
            // Enemy is on a blocked cell — just return direct path
            return [{ x: toX, y: toY }];
        }

        if (!this.isWalkable(endTX, endTY)) {
            // Target is on a blocked cell — find nearest walkable neighbor
            const neighbor = this.findNearestWalkable(endTX, endTY);
            if (neighbor) {
                endTX = neighbor.x;
                endTY = neighbor.y;
            } else {
                return [{ x: toX, y: toY }];
            }
        }

        // Already at target tile
        if (stx === endTX && sty === endTY) {
            return [{ x: toX, y: toY }];
        }

        // A* search
        const openMap = new Map<number, PathNode>();
        const closedSet = new Set<number>();

        const startNode: PathNode = {
            x: stx, y: sty,
            g: 0,
            h: this.heuristic(stx, sty, endTX, endTY),
            f: 0,
            parent: null
        };
        startNode.f = startNode.g + startNode.h;

        const startKey = sty * MAP_TILES + stx;
        openMap.set(startKey, startNode);

        let nodesSearched = 0;

        while (openMap.size > 0) {
            // Find node with lowest f in open set
            let current: PathNode | null = null;
            let currentKey = -1;
            let lowestF = Infinity;

            for (const [key, node] of openMap) {
                if (node.f < lowestF) {
                    lowestF = node.f;
                    current = node;
                    currentKey = key;
                }
            }

            if (!current) break;

            // Reached goal?
            if (current.x === endTX && current.y === endTY) {
                return this.reconstructPath(current, toX, toY);
            }

            openMap.delete(currentKey);
            closedSet.add(currentKey);
            nodesSearched++;

            if (nodesSearched >= maxNodes) {
                // Budget exceeded — return best partial path
                return this.reconstructPath(current, toX, toY);
            }

            // Expand neighbors
            for (const dir of DIRS) {
                const nx = current.x + dir.dx;
                const ny = current.y + dir.dy;

                if (!this.isWalkable(nx, ny)) continue;

                // For diagonal moves, ensure both adjacent cardinal cells are walkable
                // to prevent cutting through corners
                if (dir.dx !== 0 && dir.dy !== 0) {
                    if (!this.isWalkable(current.x + dir.dx, current.y) ||
                        !this.isWalkable(current.x, current.y + dir.dy)) {
                        continue;
                    }
                }

                const nKey = ny * MAP_TILES + nx;
                if (closedSet.has(nKey)) continue;

                const tentativeG = current.g + dir.cost;

                const existing = openMap.get(nKey);
                if (existing) {
                    if (tentativeG < existing.g) {
                        existing.g = tentativeG;
                        existing.f = tentativeG + existing.h;
                        existing.parent = current;
                    }
                } else {
                    const h = this.heuristic(nx, ny, endTX, endTY);
                    openMap.set(nKey, {
                        x: nx, y: ny,
                        g: tentativeG,
                        h: h,
                        f: tentativeG + h,
                        parent: current
                    });
                }
            }
        }

        // No path found — return direct point
        return [{ x: toX, y: toY }];
    }

    private heuristic(ax: number, ay: number, bx: number, by: number): number {
        // Octile distance heuristic (admissible for 8-direction)
        const dx = Math.abs(ax - bx);
        const dy = Math.abs(ay - by);
        return Math.max(dx, dy) + 0.41 * Math.min(dx, dy);
    }

    private reconstructPath(endNode: PathNode, finalX: number, finalY: number): PathPoint[] {
        const path: PathPoint[] = [];

        let node: PathNode | null = endNode;
        while (node && node.parent) {
            path.push({
                x: node.x * GRID_SIZE + GRID_SIZE / 2,
                y: node.y * GRID_SIZE + GRID_SIZE / 2
            });
            node = node.parent;
        }
        // Don't include start node — enemy is already there

        path.reverse();

        // Replace last point with exact target coordinates
        if (path.length > 0) {
            path[path.length - 1] = { x: finalX, y: finalY };
        }

        return path;
    }

    private findNearestWalkable(tileX: number, tileY: number): { x: number; y: number } | null {
        // BFS outward in a small radius
        for (let r = 1; r <= 5; r++) {
            for (let dy = -r; dy <= r; dy++) {
                for (let dx = -r; dx <= r; dx++) {
                    if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue; // Only perimeter
                    const nx = tileX + dx;
                    const ny = tileY + dy;
                    if (this.isWalkable(nx, ny)) return { x: nx, y: ny };
                }
            }
        }
        return null;
    }
}
