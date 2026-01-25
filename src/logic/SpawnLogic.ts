/**
 * Pure functions for spawn system calculations.
 * These functions have no side effects and can be easily tested.
 */

import { SPAWNING } from '../constants/GameConstants';

/**
 * Represents a 2D point
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Calculates a spawn position at a given radius from center.
 * @param centerX - Center X coordinate
 * @param centerY - Center Y coordinate
 * @param radius - Spawn radius
 * @param angle - Angle in radians (defaults to random)
 * @returns Spawn position
 */
export function getSpawnPosition(
  centerX: number,
  centerY: number,
  radius: number = SPAWNING.SPAWN_RADIUS,
  angle?: number
): Point {
  const finalAngle = angle ?? Math.random() * Math.PI * 2;
  return {
    x: centerX + Math.cos(finalAngle) * radius,
    y: centerY + Math.sin(finalAngle) * radius
  };
}

/**
 * Generates multiple spawn positions around a center point.
 * @param centerX - Center X coordinate
 * @param centerY - Center Y coordinate
 * @param count - Number of positions to generate
 * @param radius - Spawn radius
 * @param spreadAngle - Angle spread for group spawning (default: full circle)
 * @param baseAngle - Base angle for group (default: random)
 * @returns Array of spawn positions
 */
export function getGroupSpawnPositions(
  centerX: number,
  centerY: number,
  count: number,
  radius: number = SPAWNING.SPAWN_RADIUS,
  spreadAngle: number = Math.PI * 2,
  baseAngle?: number
): Point[] {
  const positions: Point[] = [];
  const finalBaseAngle = baseAngle ?? Math.random() * Math.PI * 2;

  for (let i = 0; i < count; i++) {
    const angleOffset = (Math.random() - 0.5) * spreadAngle;
    const angle = finalBaseAngle + angleOffset;
    positions.push(getSpawnPosition(centerX, centerY, radius, angle));
  }

  return positions;
}

/**
 * Enemy types that can spawn
 */
export type EnemyType = 'basic' | 'fast' | 'tank' | 'boss' | 'kamikaze' | 'shooter' |
                        'healer' | 'splitter' | 'shieldbearer' | 'miniboss';

/**
 * Determines enemy type based on wave number and random roll.
 * @param waveNumber - Current wave number
 * @param random - Random value between 0-1
 * @returns Enemy type to spawn
 */
export function determineEnemyType(waveNumber: number, random: number): EnemyType {
  // Early waves (1-3): mostly basic with some fast
  if (waveNumber <= 3) {
    if (random < 0.2) return 'fast';
    return 'basic';
  }

  // Mid waves (4-10): introduce variety
  if (waveNumber <= 10) {
    if (random < 0.1 + waveNumber * 0.005) return 'tank';
    if (random < 0.25 + waveNumber * 0.005) return 'shooter';
    if (random < 0.4 + waveNumber * 0.005) return 'kamikaze';
    if (random < 0.6) return 'fast';
    return 'basic';
  }

  // Late waves (10+): add v2.0 enemies
  if (random < 0.05) return 'healer';
  if (random < 0.10 && waveNumber >= 15) return 'splitter';
  if (random < 0.15 && waveNumber >= 20) return 'shieldbearer';
  if (random < 0.20) return 'tank';
  if (random < 0.35) return 'shooter';
  if (random < 0.50) return 'kamikaze';
  if (random < 0.70) return 'fast';
  return 'basic';
}

/**
 * Checks if a position is too close to center (for resource/rock generation).
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param centerX - Center X
 * @param centerY - Center Y
 * @param margin - Minimum distance from center
 * @returns true if position is too close to center
 */
export function isTooCloseToCenter(
  x: number,
  y: number,
  centerX: number,
  centerY: number,
  margin: number
): boolean {
  return Math.abs(x - centerX) < margin && Math.abs(y - centerY) < margin;
}

/**
 * Checks if two positions overlap (for resource/rock placement).
 * @param x1 - First X
 * @param y1 - First Y
 * @param x2 - Second X
 * @param y2 - Second Y
 * @param margin - Minimum distance between positions
 * @returns true if positions overlap
 */
export function positionsOverlap(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  margin: number
): boolean {
  return Math.abs(x1 - x2) < margin && Math.abs(y1 - y2) < margin;
}

/**
 * Generates a random grid position.
 * @param mapWidthTiles - Number of tiles in map width
 * @param gridSize - Size of each grid cell
 * @returns Random grid-aligned position
 */
export function getRandomGridPosition(mapWidthTiles: number, gridSize: number): Point {
  return {
    x: Math.floor(Math.random() * mapWidthTiles) * gridSize,
    y: Math.floor(Math.random() * mapWidthTiles) * gridSize
  };
}
