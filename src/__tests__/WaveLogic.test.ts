import { describe, it, expect } from 'vitest';
import {
  calculateEnemyCount,
  isBossWave,
  isMiniBossWave,
  shouldOpenShop,
  calculateSkipBonus,
  shouldActivateEndlessMode,
  calculateEndlessDifficultyMultiplier,
  getWavePattern,
  calculateBreakDuration
} from '../logic/WaveLogic';

describe('WaveLogic', () => {
  describe('calculateEnemyCount', () => {
    it('wave 1 has 4 enemies', () => {
      expect(calculateEnemyCount(1)).toBe(4);
    });

    it('wave 2 has 6 enemies', () => {
      expect(calculateEnemyCount(2)).toBe(6);
    });

    it('wave 10 has 18 enemies', () => {
      expect(calculateEnemyCount(10)).toBe(18);
    });

    it('wave 20 has 33 enemies', () => {
      expect(calculateEnemyCount(20)).toBe(33);
    });

    it('enemy count increases with wave number', () => {
      const counts = [1, 5, 10, 20].map(calculateEnemyCount);
      for (let i = 1; i < counts.length; i++) {
        expect(counts[i]).toBeGreaterThan(counts[i - 1]);
      }
    });
  });

  describe('isBossWave', () => {
    it('returns true for wave 10, 20, 30', () => {
      expect(isBossWave(10)).toBe(true);
      expect(isBossWave(20)).toBe(true);
      expect(isBossWave(30)).toBe(true);
    });

    it('returns false for non-boss waves', () => {
      expect(isBossWave(1)).toBe(false);
      expect(isBossWave(5)).toBe(false);
      expect(isBossWave(15)).toBe(false);
      expect(isBossWave(25)).toBe(false);
    });

    it('returns false for wave 0', () => {
      expect(isBossWave(0)).toBe(false);
    });

    it('returns false for negative waves', () => {
      expect(isBossWave(-10)).toBe(false);
    });
  });

  describe('isMiniBossWave', () => {
    it('returns true for wave 5, 15, 25', () => {
      expect(isMiniBossWave(5)).toBe(true);
      expect(isMiniBossWave(15)).toBe(true);
      expect(isMiniBossWave(25)).toBe(true);
    });

    it('returns false for boss waves', () => {
      expect(isMiniBossWave(10)).toBe(false);
      expect(isMiniBossWave(20)).toBe(false);
    });

    it('returns false for early waves', () => {
      expect(isMiniBossWave(1)).toBe(false);
      expect(isMiniBossWave(4)).toBe(false);
    });

    it('returns false for wave 0', () => {
      expect(isMiniBossWave(0)).toBe(false);
    });
  });

  describe('shouldOpenShop', () => {
    it('returns true for waves 5, 10, 15, etc after wave 1', () => {
      expect(shouldOpenShop(5)).toBe(true);
      expect(shouldOpenShop(10)).toBe(true);
      expect(shouldOpenShop(15)).toBe(true);
    });

    it('returns false for wave 1', () => {
      expect(shouldOpenShop(1)).toBe(false);
    });

    it('returns false for non-shop waves', () => {
      expect(shouldOpenShop(2)).toBe(false);
      expect(shouldOpenShop(3)).toBe(false);
      expect(shouldOpenShop(7)).toBe(false);
    });
  });

  describe('calculateSkipBonus', () => {
    it('returns double the seconds remaining', () => {
      expect(calculateSkipBonus(10)).toBe(20);
      expect(calculateSkipBonus(5)).toBe(10);
    });

    it('returns minimum of 1', () => {
      expect(calculateSkipBonus(0)).toBe(1);
      expect(calculateSkipBonus(0.4)).toBe(1);
    });

    it('floors the result', () => {
      expect(calculateSkipBonus(3.5)).toBe(7);
    });
  });

  describe('shouldActivateEndlessMode', () => {
    it('returns true for wave 51', () => {
      expect(shouldActivateEndlessMode(51)).toBe(true);
    });

    it('returns false for wave 50', () => {
      expect(shouldActivateEndlessMode(50)).toBe(false);
    });

    it('returns false for wave 52', () => {
      expect(shouldActivateEndlessMode(52)).toBe(false);
    });

    it('returns false for early waves', () => {
      expect(shouldActivateEndlessMode(1)).toBe(false);
      expect(shouldActivateEndlessMode(25)).toBe(false);
    });
  });

  describe('calculateEndlessDifficultyMultiplier', () => {
    it('returns 1.0 for waves before endless mode', () => {
      expect(calculateEndlessDifficultyMultiplier(1)).toBe(1.0);
      expect(calculateEndlessDifficultyMultiplier(50)).toBe(1.0);
    });

    it('returns 1.05 for wave 51', () => {
      expect(calculateEndlessDifficultyMultiplier(51)).toBeCloseTo(1.05);
    });

    it('returns 1.10 for wave 52', () => {
      expect(calculateEndlessDifficultyMultiplier(52)).toBeCloseTo(1.10);
    });

    it('scales with wave number', () => {
      expect(calculateEndlessDifficultyMultiplier(60)).toBeCloseTo(1.50);
      expect(calculateEndlessDifficultyMultiplier(100)).toBeCloseTo(3.50);
    });
  });

  describe('getWavePattern', () => {
    const patterns = {
      5: { type: 'fast', countMultiplier: 2.0, messageKey: 'wave_pattern_speed' },
      7: { type: 'shooter', countMultiplier: 1.5, messageKey: 'wave_pattern_ranged' }
    };

    it('returns pattern if exists', () => {
      const result = getWavePattern(5, patterns);
      expect(result).toEqual(patterns[5]);
    });

    it('returns null if pattern does not exist', () => {
      expect(getWavePattern(1, patterns)).toBeNull();
      expect(getWavePattern(10, patterns)).toBeNull();
    });
  });

  describe('calculateBreakDuration', () => {
    it('returns 20000ms for any wave', () => {
      expect(calculateBreakDuration(1)).toBe(20000);
      expect(calculateBreakDuration(10)).toBe(20000);
      expect(calculateBreakDuration(50)).toBe(20000);
    });
  });
});
