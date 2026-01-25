import { describe, it, expect } from 'vitest';
import {
  calculateDamage,
  distance,
  distanceSquared,
  findNearestTarget,
  findTargetsInArea,
  getHpBarColor,
  isOutOfBounds,
  angleToTarget,
  normalizeAngleDiff,
  calculateRicochetDamage,
  calculateChainDamage,
  rollCritical
} from '../logic/CombatLogic';

describe('CombatLogic', () => {
  describe('calculateDamage', () => {
    it('normal damage without modifiers', () => {
      expect(calculateDamage(10, false, false)).toBe(10);
    });

    it('shield reduces damage by 50%', () => {
      expect(calculateDamage(10, true, false)).toBe(5);
    });

    it('critical doubles damage', () => {
      expect(calculateDamage(10, false, true)).toBe(20);
    });

    it('shield + critical = normal damage', () => {
      expect(calculateDamage(10, true, true)).toBe(10);
    });

    it('handles zero base damage', () => {
      expect(calculateDamage(0, false, false)).toBe(0);
      expect(calculateDamage(0, true, true)).toBe(0);
    });

    it('handles fractional damage', () => {
      expect(calculateDamage(5.5, true, false)).toBe(2.75);
    });
  });

  describe('distance', () => {
    it('calculates distance between two points', () => {
      expect(distance(0, 0, 3, 4)).toBe(5);
    });

    it('returns 0 for same point', () => {
      expect(distance(5, 5, 5, 5)).toBe(0);
    });

    it('handles negative coordinates', () => {
      expect(distance(-3, -4, 0, 0)).toBe(5);
    });

    it('handles horizontal distance', () => {
      expect(distance(0, 0, 10, 0)).toBe(10);
    });

    it('handles vertical distance', () => {
      expect(distance(0, 0, 0, 10)).toBe(10);
    });
  });

  describe('distanceSquared', () => {
    it('calculates squared distance', () => {
      expect(distanceSquared(0, 0, 3, 4)).toBe(25);
    });

    it('is faster for comparisons (no sqrt)', () => {
      const sq = distanceSquared(0, 0, 100, 100);
      expect(sq).toBe(20000);
    });
  });

  describe('findNearestTarget', () => {
    const source = { x: 0, y: 0 };

    it('finds closest target within range', () => {
      const targets = [
        { x: 100, y: 0 },
        { x: 50, y: 0 },
        { x: 200, y: 0 },
      ];
      const result = findNearestTarget(source, targets, 300);
      expect(result).toBe(targets[1]);
    });

    it('returns null if no targets in range', () => {
      const targets = [{ x: 500, y: 0 }];
      const result = findNearestTarget(source, targets, 100);
      expect(result).toBeNull();
    });

    it('returns null for empty targets array', () => {
      expect(findNearestTarget(source, [], 100)).toBeNull();
    });

    it('handles targets at same distance', () => {
      const targets = [
        { x: 50, y: 0 },
        { x: 0, y: 50 },
      ];
      const result = findNearestTarget(source, targets, 100);
      expect(result).toBe(targets[0]); // First one found
    });
  });

  describe('findTargetsInArea', () => {
    const center = { x: 0, y: 0 };

    it('finds all targets within radius', () => {
      const targets = [
        { x: 30, y: 0 },
        { x: 0, y: 40 },
        { x: 100, y: 100 },
      ];
      const result = findTargetsInArea(center, targets, 50);
      expect(result).toHaveLength(2);
      expect(result).toContain(targets[0]);
      expect(result).toContain(targets[1]);
    });

    it('returns empty array if no targets in area', () => {
      const targets = [{ x: 100, y: 100 }];
      const result = findTargetsInArea(center, targets, 50);
      expect(result).toHaveLength(0);
    });

    it('includes targets exactly on the edge', () => {
      const targets = [{ x: 50, y: 0 }];
      const result = findTargetsInArea(center, targets, 50);
      expect(result).toHaveLength(1);
    });
  });

  describe('getHpBarColor', () => {
    it('returns green above 50%', () => {
      expect(getHpBarColor(60, 100)).toBe(0x00FF00);
      expect(getHpBarColor(100, 100)).toBe(0x00FF00);
    });

    it('returns yellow between 25% and 50%', () => {
      expect(getHpBarColor(30, 100)).toBe(0xFFFF00);
      expect(getHpBarColor(50, 100)).toBe(0xFFFF00);
    });

    it('returns red below 25%', () => {
      expect(getHpBarColor(20, 100)).toBe(0xFF0000);
      expect(getHpBarColor(1, 100)).toBe(0xFF0000);
    });

    it('returns red for zero HP', () => {
      expect(getHpBarColor(0, 100)).toBe(0xFF0000);
    });
  });

  describe('isOutOfBounds', () => {
    const mapSize = 1000;

    it('returns true when outside left boundary', () => {
      expect(isOutOfBounds(-60, 500, mapSize)).toBe(true);
    });

    it('returns true when outside right boundary', () => {
      expect(isOutOfBounds(1060, 500, mapSize)).toBe(true);
    });

    it('returns true when outside top boundary', () => {
      expect(isOutOfBounds(500, -60, mapSize)).toBe(true);
    });

    it('returns true when outside bottom boundary', () => {
      expect(isOutOfBounds(500, 1060, mapSize)).toBe(true);
    });

    it('returns false when inside map', () => {
      expect(isOutOfBounds(500, 500, mapSize)).toBe(false);
    });

    it('returns false within margin', () => {
      expect(isOutOfBounds(-40, 500, mapSize)).toBe(false);
    });
  });

  describe('angleToTarget', () => {
    it('returns 0 for target directly to the right', () => {
      expect(angleToTarget(0, 0, 100, 0)).toBe(0);
    });

    it('returns PI/2 for target directly below', () => {
      expect(angleToTarget(0, 0, 0, 100)).toBeCloseTo(Math.PI / 2);
    });

    it('returns PI for target directly to the left', () => {
      expect(angleToTarget(0, 0, -100, 0)).toBeCloseTo(Math.PI);
    });

    it('returns -PI/2 for target directly above', () => {
      expect(angleToTarget(0, 0, 0, -100)).toBeCloseTo(-Math.PI / 2);
    });
  });

  describe('normalizeAngleDiff', () => {
    it('normalizes angles greater than PI', () => {
      expect(normalizeAngleDiff(Math.PI + 1)).toBeCloseTo(-Math.PI + 1);
    });

    it('normalizes angles less than -PI', () => {
      expect(normalizeAngleDiff(-Math.PI - 1)).toBeCloseTo(Math.PI - 1);
    });

    it('leaves angles within range unchanged', () => {
      expect(normalizeAngleDiff(0)).toBe(0);
      expect(normalizeAngleDiff(1)).toBe(1);
      expect(normalizeAngleDiff(-1)).toBe(-1);
    });
  });

  describe('calculateRicochetDamage', () => {
    it('returns 50% of original damage', () => {
      expect(calculateRicochetDamage(10)).toBe(5);
      expect(calculateRicochetDamage(20)).toBe(10);
    });
  });

  describe('calculateChainDamage', () => {
    it('returns 70% of original damage', () => {
      expect(calculateChainDamage(10)).toBe(7);
      expect(calculateChainDamage(100)).toBe(70);
    });
  });

  describe('rollCritical', () => {
    it('returns false when crit chance is 0', () => {
      expect(rollCritical(0)).toBe(false);
    });

    it('returns false when crit chance is negative', () => {
      expect(rollCritical(-0.5)).toBe(false);
    });

    it('returns true when crit chance is 1 (always crits)', () => {
      // With 100% crit chance, should always return true
      for (let i = 0; i < 10; i++) {
        expect(rollCritical(1)).toBe(true);
      }
    });

    it('respects probability (statistical test)', () => {
      const iterations = 1000;
      let crits = 0;
      for (let i = 0; i < iterations; i++) {
        if (rollCritical(0.5)) crits++;
      }
      // With 50% crit chance, expect roughly 500 crits (allow some variance)
      expect(crits).toBeGreaterThan(400);
      expect(crits).toBeLessThan(600);
    });
  });
});
