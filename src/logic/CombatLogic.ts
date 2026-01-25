/**
 * Pure functions for combat calculations.
 * These functions have no side effects and can be easily tested.
 */

import { COMBAT, VISUALS } from '../constants/GameConstants';

/**
 * Calculates final damage after applying modifiers.
 * @param baseDamage - Base damage amount
 * @param isShielded - Whether target is shielded
 * @param isCritical - Whether this is a critical hit
 * @returns Final damage value
 */
export function calculateDamage(
  baseDamage: number,
  isShielded: boolean,
  isCritical: boolean
): number {
  let damage = baseDamage;
  if (isShielded) {
    damage *= COMBAT.SHIELD_DAMAGE_REDUCTION;
  }
  if (isCritical) {
    damage *= COMBAT.CRITICAL_MULTIPLIER;
  }
  return damage;
}

/**
 * Calculates the distance between two points.
 * @param x1 - First point X
 * @param y1 - First point Y
 * @param x2 - Second point X
 * @param y2 - Second point Y
 * @returns Distance between the two points
 */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculates squared distance between two points (faster for comparisons).
 * @param x1 - First point X
 * @param y1 - First point Y
 * @param x2 - Second point X
 * @param y2 - Second point Y
 * @returns Squared distance
 */
export function distanceSquared(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return dx * dx + dy * dy;
}

/**
 * Represents a target with position
 */
export interface Positioned {
  x: number;
  y: number;
}

/**
 * Finds the nearest target within range.
 * @param source - Source position
 * @param targets - Array of potential targets
 * @param maxRange - Maximum range to consider
 * @returns Nearest target or null if none in range
 */
export function findNearestTarget<T extends Positioned>(
  source: Positioned,
  targets: T[],
  maxRange: number
): T | null {
  let nearest: T | null = null;
  let nearestDistSq = maxRange * maxRange;

  for (const target of targets) {
    const distSq = distanceSquared(source.x, source.y, target.x, target.y);
    if (distSq < nearestDistSq) {
      nearestDistSq = distSq;
      nearest = target;
    }
  }
  return nearest;
}

/**
 * Finds targets within an area.
 * @param center - Center of the area
 * @param targets - Array of potential targets
 * @param radius - Radius of the area
 * @returns Array of targets within the area
 */
export function findTargetsInArea<T extends Positioned>(
  center: Positioned,
  targets: T[],
  radius: number
): T[] {
  const radiusSq = radius * radius;
  return targets.filter(target => {
    const distSq = distanceSquared(center.x, center.y, target.x, target.y);
    return distSq <= radiusSq;
  });
}

/**
 * Calculates the HP bar color based on health percentage.
 * @param currentHp - Current HP
 * @param maxHp - Maximum HP
 * @returns Color as hex number
 */
export function getHpBarColor(currentHp: number, maxHp: number): number {
  const pct = Math.max(0, currentHp / maxHp);
  if (pct > VISUALS.HP_BAR_GREEN_THRESHOLD) return 0x00FF00; // Green
  if (pct > VISUALS.HP_BAR_YELLOW_THRESHOLD) return 0xFFFF00; // Yellow
  return 0xFF0000; // Red
}

/**
 * Checks if a position is within the valid map bounds.
 * @param x - X position
 * @param y - Y position
 * @param mapSize - Size of the map
 * @param margin - Margin before counting as "out of bounds"
 * @returns true if position is outside valid bounds
 */
export function isOutOfBounds(x: number, y: number, mapSize: number, margin: number = 50): boolean {
  return x < -margin || x > mapSize + margin || y < -margin || y > mapSize + margin;
}

/**
 * Calculates the angle between two points.
 * @param fromX - Source X
 * @param fromY - Source Y
 * @param toX - Target X
 * @param toY - Target Y
 * @returns Angle in radians
 */
export function angleToTarget(fromX: number, fromY: number, toX: number, toY: number): number {
  return Math.atan2(toY - fromY, toX - fromX);
}

/**
 * Normalizes an angle difference to be within -PI to PI.
 * @param angle - Angle difference
 * @returns Normalized angle
 */
export function normalizeAngleDiff(angle: number): number {
  while (angle <= -Math.PI) angle += Math.PI * 2;
  while (angle > Math.PI) angle -= Math.PI * 2;
  return angle;
}

/**
 * Calculates ricochet damage (reduced from original).
 * @param originalDamage - Original projectile damage
 * @returns Damage for ricocheted projectile
 */
export function calculateRicochetDamage(originalDamage: number): number {
  return originalDamage * COMBAT.RICOCHET_DAMAGE_MULT;
}

/**
 * Calculates chain lightning damage (reduced from original).
 * @param originalDamage - Original damage
 * @returns Damage for chain hit
 */
export function calculateChainDamage(originalDamage: number): number {
  return originalDamage * COMBAT.CHAIN_DAMAGE_MULT;
}

/**
 * Rolls for a critical hit based on chance.
 * @param critChance - Chance of critical hit (0-1)
 * @returns true if critical hit
 */
export function rollCritical(critChance: number): boolean {
  if (critChance <= 0) return false;
  return Math.random() < critChance;
}
