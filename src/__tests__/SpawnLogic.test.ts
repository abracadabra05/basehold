import { describe, it, expect } from 'vitest';
import {
  getSpawnPosition,
  getGroupSpawnPositions,
  determineEnemyType,
  isTooCloseToCenter,
  positionsOverlap,
  getRandomGridPosition
} from '../logic/SpawnLogic';
import { SPAWNING } from '../constants/GameConstants';

describe('SpawnLogic', () => {
  describe('getSpawnPosition', () => {
    it('returns position at correct radius from center', () => {
      const center = { x: 100, y: 100 };
      const radius = 50;
      const angle = 0; // Right direction

      const pos = getSpawnPosition(center.x, center.y, radius, angle);

      expect(pos.x).toBeCloseTo(150); // 100 + 50 * cos(0)
      expect(pos.y).toBeCloseTo(100); // 100 + 50 * sin(0)
    });

    it('calculates position with different angles', () => {
      const center = { x: 0, y: 0 };
      const radius = 100;

      // 90 degrees (up in math coords)
      const pos90 = getSpawnPosition(center.x, center.y, radius, Math.PI / 2);
      expect(pos90.x).toBeCloseTo(0);
      expect(pos90.y).toBeCloseTo(100);

      // 180 degrees (left)
      const pos180 = getSpawnPosition(center.x, center.y, radius, Math.PI);
      expect(pos180.x).toBeCloseTo(-100);
      expect(pos180.y).toBeCloseTo(0);

      // 270 degrees (down)
      const pos270 = getSpawnPosition(center.x, center.y, radius, Math.PI * 1.5);
      expect(pos270.x).toBeCloseTo(0);
      expect(pos270.y).toBeCloseTo(-100);
    });

    it('uses default spawn radius when not specified', () => {
      const pos = getSpawnPosition(0, 0, undefined, 0);
      expect(pos.x).toBeCloseTo(SPAWNING.SPAWN_RADIUS);
      expect(pos.y).toBeCloseTo(0);
    });

    it('generates random angle when not specified', () => {
      const positions = Array.from({ length: 10 }, () =>
        getSpawnPosition(0, 0, 100)
      );

      // All positions should be at the correct radius
      for (const pos of positions) {
        const dist = Math.sqrt(pos.x * pos.x + pos.y * pos.y);
        expect(dist).toBeCloseTo(100);
      }

      // Positions should vary (not all the same)
      const uniqueX = new Set(positions.map(p => Math.round(p.x)));
      expect(uniqueX.size).toBeGreaterThan(1);
    });
  });

  describe('getGroupSpawnPositions', () => {
    it('returns correct number of positions', () => {
      const positions = getGroupSpawnPositions(0, 0, 5, 100, Math.PI * 2, 0);
      expect(positions).toHaveLength(5);
    });

    it('all positions are at correct radius', () => {
      const radius = 200;
      const positions = getGroupSpawnPositions(100, 100, 10, radius, Math.PI * 2, 0);

      for (const pos of positions) {
        const dx = pos.x - 100;
        const dy = pos.y - 100;
        const dist = Math.sqrt(dx * dx + dy * dy);
        expect(dist).toBeCloseTo(radius);
      }
    });

    it('respects spread angle', () => {
      // With a very small spread, positions should be clustered
      const narrowSpread = getGroupSpawnPositions(0, 0, 5, 100, 0.1, 0);
      const angles = narrowSpread.map(p => Math.atan2(p.y, p.x));
      const maxAngleDiff = Math.max(...angles) - Math.min(...angles);
      expect(maxAngleDiff).toBeLessThan(0.2); // Should be within the spread
    });

    it('returns empty array for count 0', () => {
      const positions = getGroupSpawnPositions(0, 0, 0, 100);
      expect(positions).toHaveLength(0);
    });
  });

  describe('determineEnemyType', () => {
    describe('early waves (1-3)', () => {
      it('returns fast for random < 0.2', () => {
        expect(determineEnemyType(1, 0)).toBe('fast');
        expect(determineEnemyType(2, 0.1)).toBe('fast');
        expect(determineEnemyType(3, 0.19)).toBe('fast');
      });

      it('returns basic for random >= 0.2', () => {
        expect(determineEnemyType(1, 0.2)).toBe('basic');
        expect(determineEnemyType(2, 0.5)).toBe('basic');
        expect(determineEnemyType(3, 0.99)).toBe('basic');
      });
    });

    describe('mid waves (4-10)', () => {
      it('can spawn tank enemies', () => {
        // Wave 5: threshold is 0.1 + 5 * 0.005 = 0.125
        expect(determineEnemyType(5, 0)).toBe('tank');
        expect(determineEnemyType(5, 0.12)).toBe('tank');
      });

      it('can spawn shooter enemies', () => {
        // Wave 5: threshold is 0.25 + 5 * 0.005 = 0.275
        expect(determineEnemyType(5, 0.13)).toBe('shooter');
        expect(determineEnemyType(5, 0.27)).toBe('shooter');
      });

      it('can spawn kamikaze enemies', () => {
        // Wave 5: threshold is 0.4 + 5 * 0.005 = 0.425
        expect(determineEnemyType(5, 0.28)).toBe('kamikaze');
        expect(determineEnemyType(5, 0.42)).toBe('kamikaze');
      });

      it('can spawn fast enemies', () => {
        expect(determineEnemyType(5, 0.43)).toBe('fast');
        expect(determineEnemyType(5, 0.59)).toBe('fast');
      });

      it('spawns basic enemies for high random values', () => {
        expect(determineEnemyType(5, 0.61)).toBe('basic');
        expect(determineEnemyType(5, 0.99)).toBe('basic');
      });
    });

    describe('late waves (11+)', () => {
      it('can spawn healer enemies', () => {
        expect(determineEnemyType(11, 0)).toBe('healer');
        expect(determineEnemyType(11, 0.04)).toBe('healer');
      });

      it('spawns splitter only on wave 15+', () => {
        expect(determineEnemyType(14, 0.06)).toBe('tank'); // Not splitter before wave 15
        expect(determineEnemyType(15, 0.06)).toBe('splitter');
        expect(determineEnemyType(20, 0.06)).toBe('splitter');
      });

      it('spawns shieldbearer only on wave 20+', () => {
        expect(determineEnemyType(19, 0.11)).toBe('tank'); // Not shieldbearer before wave 20
        expect(determineEnemyType(20, 0.11)).toBe('shieldbearer');
        expect(determineEnemyType(25, 0.11)).toBe('shieldbearer');
      });

      it('can spawn tank enemies', () => {
        expect(determineEnemyType(11, 0.16)).toBe('tank');
        expect(determineEnemyType(11, 0.19)).toBe('tank');
      });

      it('can spawn shooter enemies', () => {
        expect(determineEnemyType(11, 0.21)).toBe('shooter');
        expect(determineEnemyType(11, 0.34)).toBe('shooter');
      });

      it('can spawn kamikaze enemies', () => {
        expect(determineEnemyType(11, 0.36)).toBe('kamikaze');
        expect(determineEnemyType(11, 0.49)).toBe('kamikaze');
      });

      it('can spawn fast enemies', () => {
        expect(determineEnemyType(11, 0.51)).toBe('fast');
        expect(determineEnemyType(11, 0.69)).toBe('fast');
      });

      it('spawns basic for high random values', () => {
        expect(determineEnemyType(11, 0.71)).toBe('basic');
        expect(determineEnemyType(11, 0.99)).toBe('basic');
      });
    });
  });

  describe('isTooCloseToCenter', () => {
    it('returns true when position is within margin', () => {
      expect(isTooCloseToCenter(100, 100, 100, 100, 50)).toBe(true);
      expect(isTooCloseToCenter(120, 120, 100, 100, 50)).toBe(true);
      expect(isTooCloseToCenter(80, 80, 100, 100, 50)).toBe(true);
    });

    it('returns false when position is outside margin', () => {
      expect(isTooCloseToCenter(200, 100, 100, 100, 50)).toBe(false);
      expect(isTooCloseToCenter(100, 200, 100, 100, 50)).toBe(false);
      expect(isTooCloseToCenter(200, 200, 100, 100, 50)).toBe(false);
    });

    it('returns false when only X is within margin', () => {
      expect(isTooCloseToCenter(100, 200, 100, 100, 50)).toBe(false);
    });

    it('returns false when only Y is within margin', () => {
      expect(isTooCloseToCenter(200, 100, 100, 100, 50)).toBe(false);
    });

    it('handles edge cases at margin boundary', () => {
      // Exactly at margin boundary
      expect(isTooCloseToCenter(150, 150, 100, 100, 50)).toBe(false); // abs(50) is not < 50
      expect(isTooCloseToCenter(149, 149, 100, 100, 50)).toBe(true);  // abs(49) < 50
    });
  });

  describe('positionsOverlap', () => {
    it('returns true when positions are identical', () => {
      expect(positionsOverlap(100, 100, 100, 100, 50)).toBe(true);
    });

    it('returns true when positions are within margin', () => {
      expect(positionsOverlap(100, 100, 120, 120, 50)).toBe(true);
      expect(positionsOverlap(100, 100, 80, 80, 50)).toBe(true);
    });

    it('returns false when positions are outside margin', () => {
      expect(positionsOverlap(100, 100, 200, 200, 50)).toBe(false);
      expect(positionsOverlap(0, 0, 100, 100, 50)).toBe(false);
    });

    it('returns false when only X overlaps', () => {
      expect(positionsOverlap(100, 100, 110, 200, 50)).toBe(false);
    });

    it('returns false when only Y overlaps', () => {
      expect(positionsOverlap(100, 100, 200, 110, 50)).toBe(false);
    });

    it('is symmetric', () => {
      expect(positionsOverlap(0, 0, 30, 30, 50)).toBe(
        positionsOverlap(30, 30, 0, 0, 50)
      );
    });
  });

  describe('getRandomGridPosition', () => {
    it('returns grid-aligned position', () => {
      const gridSize = 40;
      const mapWidthTiles = 50;

      for (let i = 0; i < 20; i++) {
        const pos = getRandomGridPosition(mapWidthTiles, gridSize);
        expect(pos.x % gridSize).toBe(0);
        expect(pos.y % gridSize).toBe(0);
      }
    });

    it('stays within map bounds', () => {
      const gridSize = 40;
      const mapWidthTiles = 50;
      const maxCoord = (mapWidthTiles - 1) * gridSize;

      for (let i = 0; i < 50; i++) {
        const pos = getRandomGridPosition(mapWidthTiles, gridSize);
        expect(pos.x).toBeGreaterThanOrEqual(0);
        expect(pos.x).toBeLessThanOrEqual(maxCoord);
        expect(pos.y).toBeGreaterThanOrEqual(0);
        expect(pos.y).toBeLessThanOrEqual(maxCoord);
      }
    });

    it('generates varied positions', () => {
      const gridSize = 40;
      const mapWidthTiles = 50;

      const positions = Array.from({ length: 20 }, () =>
        getRandomGridPosition(mapWidthTiles, gridSize)
      );

      const uniqueX = new Set(positions.map(p => p.x));
      const uniqueY = new Set(positions.map(p => p.y));

      expect(uniqueX.size).toBeGreaterThan(1);
      expect(uniqueY.size).toBeGreaterThan(1);
    });
  });
});
