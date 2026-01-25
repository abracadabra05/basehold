import { describe, it, expect } from 'vitest';
import {
  calculateUpgradeCost,
  canAffordUpgrade,
  isMaxLevel,
  calculateNewDamage,
  calculateNewMineMultiplier,
  calculateNewSpeed,
  calculateNewMagnetRadius,
  getResearchCost,
  isInitiallyUnlocked
} from '../logic/UpgradeLogic';

describe('UpgradeLogic', () => {
  describe('calculateUpgradeCost', () => {
    it('level 0 costs 50 biomass', () => {
      expect(calculateUpgradeCost(0)).toBe(50);
    });

    it('level 1 costs 50 biomass', () => {
      expect(calculateUpgradeCost(1)).toBe(50);
    });

    it('level 2 costs 100 biomass', () => {
      expect(calculateUpgradeCost(2)).toBe(100);
    });

    it('level 5 costs 250 biomass', () => {
      expect(calculateUpgradeCost(5)).toBe(250);
    });

    it('level 10 costs 500 biomass', () => {
      expect(calculateUpgradeCost(10)).toBe(500);
    });

    it('scales linearly', () => {
      const costs = [1, 2, 3, 4, 5].map(calculateUpgradeCost);
      for (let i = 1; i < costs.length; i++) {
        expect(costs[i] - costs[i - 1]).toBe(50);
      }
    });
  });

  describe('canAffordUpgrade', () => {
    it('returns true when biomass equals cost', () => {
      expect(canAffordUpgrade(50, 1)).toBe(true);
    });

    it('returns true when biomass exceeds cost', () => {
      expect(canAffordUpgrade(100, 1)).toBe(true);
    });

    it('returns false when biomass is less than cost', () => {
      expect(canAffordUpgrade(40, 1)).toBe(false);
    });

    it('works with higher levels', () => {
      expect(canAffordUpgrade(200, 5)).toBe(false);
      expect(canAffordUpgrade(250, 5)).toBe(true);
      expect(canAffordUpgrade(300, 5)).toBe(true);
    });
  });

  describe('isMaxLevel', () => {
    it('returns true at level 10', () => {
      expect(isMaxLevel(10)).toBe(true);
    });

    it('returns true above max level', () => {
      expect(isMaxLevel(11)).toBe(true);
      expect(isMaxLevel(100)).toBe(true);
    });

    it('returns false below max level', () => {
      expect(isMaxLevel(0)).toBe(false);
      expect(isMaxLevel(5)).toBe(false);
      expect(isMaxLevel(9)).toBe(false);
    });

    it('accepts custom max level', () => {
      expect(isMaxLevel(5, 5)).toBe(true);
      expect(isMaxLevel(4, 5)).toBe(false);
    });
  });

  describe('calculateNewDamage', () => {
    it('adds 1 to current damage', () => {
      expect(calculateNewDamage(1)).toBe(2);
      expect(calculateNewDamage(5)).toBe(6);
      expect(calculateNewDamage(10)).toBe(11);
    });
  });

  describe('calculateNewMineMultiplier', () => {
    it('adds 0.5 to current multiplier', () => {
      expect(calculateNewMineMultiplier(1)).toBe(1.5);
      expect(calculateNewMineMultiplier(1.5)).toBe(2);
      expect(calculateNewMineMultiplier(2)).toBe(2.5);
    });
  });

  describe('calculateNewSpeed', () => {
    it('adds 0.5 to current speed', () => {
      expect(calculateNewSpeed(3)).toBe(3.5);
      expect(calculateNewSpeed(3.5)).toBe(4);
      expect(calculateNewSpeed(5)).toBe(5.5);
    });
  });

  describe('calculateNewMagnetRadius', () => {
    it('adds 100 to current radius', () => {
      expect(calculateNewMagnetRadius(0)).toBe(100);
      expect(calculateNewMagnetRadius(100)).toBe(200);
      expect(calculateNewMagnetRadius(300)).toBe(400);
    });
  });

  describe('getResearchCost', () => {
    it('returns research cost if present', () => {
      expect(getResearchCost({ researchCost: 500 })).toBe(500);
    });

    it('returns 0 if no research cost', () => {
      expect(getResearchCost({})).toBe(0);
    });

    it('returns 0 if research cost is undefined', () => {
      expect(getResearchCost({ researchCost: undefined })).toBe(0);
    });
  });

  describe('isInitiallyUnlocked', () => {
    it('returns true if unlocked is true', () => {
      expect(isInitiallyUnlocked({ unlocked: true })).toBe(true);
    });

    it('returns false if unlocked is false', () => {
      expect(isInitiallyUnlocked({ unlocked: false })).toBe(false);
    });

    it('returns false if unlocked is undefined', () => {
      expect(isInitiallyUnlocked({})).toBe(false);
    });
  });
});
