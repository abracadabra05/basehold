import { describe, it, expect } from 'vitest';
import {
  calculateBatteryCharge,
  isBlackout,
  calculateEfficiency,
  getEnergyStatus,
  getBatteryPercentage,
  crossedMilestone
} from '../logic/ResourceLogic';

describe('ResourceLogic', () => {
  describe('calculateBatteryCharge', () => {
    it('increases when production exceeds consumption', () => {
      const result = calculateBatteryCharge(50, 100, 10, 5, 1);
      expect(result).toBe(55);
    });

    it('decreases when consumption exceeds production', () => {
      const result = calculateBatteryCharge(50, 100, 5, 10, 1);
      expect(result).toBe(45);
    });

    it('does not exceed max capacity', () => {
      const result = calculateBatteryCharge(95, 100, 20, 0, 1);
      expect(result).toBe(100);
    });

    it('does not go below zero', () => {
      const result = calculateBatteryCharge(5, 100, 0, 20, 1);
      expect(result).toBe(0);
    });

    it('handles zero delta time', () => {
      const result = calculateBatteryCharge(50, 100, 10, 5, 0);
      expect(result).toBe(50);
    });

    it('handles balanced production and consumption', () => {
      const result = calculateBatteryCharge(50, 100, 10, 10, 1);
      expect(result).toBe(50);
    });

    it('handles fractional delta time', () => {
      const result = calculateBatteryCharge(50, 100, 10, 0, 0.5);
      expect(result).toBe(55);
    });
  });

  describe('isBlackout', () => {
    it('returns true when charge is zero', () => {
      expect(isBlackout(0)).toBe(true);
    });

    it('returns true when charge is negative', () => {
      expect(isBlackout(-1)).toBe(true);
    });

    it('returns false when charge is positive', () => {
      expect(isBlackout(1)).toBe(false);
    });

    it('returns false when charge is large', () => {
      expect(isBlackout(1000)).toBe(false);
    });
  });

  describe('calculateEfficiency', () => {
    it('returns 1 when no consumption', () => {
      expect(calculateEfficiency(10, 0)).toBe(1);
    });

    it('returns 1 when production equals consumption', () => {
      expect(calculateEfficiency(10, 10)).toBe(1);
    });

    it('returns 1 when production exceeds consumption', () => {
      expect(calculateEfficiency(20, 10)).toBe(1);
    });

    it('returns ratio when consumption exceeds production', () => {
      expect(calculateEfficiency(5, 10)).toBe(0.5);
    });

    it('returns 0 when no production but has consumption', () => {
      expect(calculateEfficiency(0, 10)).toBe(0);
    });
  });

  describe('getEnergyStatus', () => {
    it('returns blackout when charge is zero', () => {
      expect(getEnergyStatus(0, 100, 10, 5)).toBe('blackout');
    });

    it('returns draining when net is negative', () => {
      expect(getEnergyStatus(50, 100, 5, 10)).toBe('draining');
    });

    it('returns charging when not at capacity', () => {
      expect(getEnergyStatus(50, 100, 10, 5)).toBe('charging');
    });

    it('returns charged when at capacity', () => {
      expect(getEnergyStatus(100, 100, 10, 5)).toBe('charged');
    });

    it('returns charged when over capacity', () => {
      expect(getEnergyStatus(150, 100, 10, 5)).toBe('charged');
    });
  });

  describe('getBatteryPercentage', () => {
    it('returns 0 when capacity is zero', () => {
      expect(getBatteryPercentage(50, 0)).toBe(0);
    });

    it('returns 0 when charge is zero', () => {
      expect(getBatteryPercentage(0, 100)).toBe(0);
    });

    it('returns 50 when half charged', () => {
      expect(getBatteryPercentage(50, 100)).toBe(50);
    });

    it('returns 100 when fully charged', () => {
      expect(getBatteryPercentage(100, 100)).toBe(100);
    });

    it('floors the result', () => {
      expect(getBatteryPercentage(33, 100)).toBe(33);
      expect(getBatteryPercentage(66.7, 100)).toBe(66);
    });
  });

  describe('crossedMilestone', () => {
    it('returns true when crossing 100 threshold', () => {
      expect(crossedMilestone(99, 100)).toBe(true);
    });

    it('returns true when crossing 200 threshold', () => {
      expect(crossedMilestone(199, 201)).toBe(true);
    });

    it('returns false when staying within same milestone', () => {
      expect(crossedMilestone(50, 99)).toBe(false);
    });

    it('returns false when values are equal', () => {
      expect(crossedMilestone(100, 100)).toBe(false);
    });

    it('returns true when skipping multiple milestones', () => {
      expect(crossedMilestone(50, 250)).toBe(true);
    });
  });
});
