/**
 * Pure functions for wave system calculations.
 * These functions have no side effects and can be easily tested.
 */

import { TIMING, ENDLESS_MODE } from '../constants/GameConstants';

/**
 * Calculates the number of enemies to spawn for a wave.
 * Formula: 3 + floor(waveNumber * 1.5)
 * @param waveNumber - Current wave number (1-based)
 * @returns Number of enemies to spawn
 */
export function calculateEnemyCount(waveNumber: number): number {
  return 3 + Math.floor(waveNumber * 1.5);
}

/**
 * Checks if the given wave is a boss wave.
 * Boss waves occur every 10 waves.
 * @param waveNumber - Wave number to check
 * @returns true if this is a boss wave
 */
export function isBossWave(waveNumber: number): boolean {
  return waveNumber > 0 && waveNumber % TIMING.BOSS_WAVE_INTERVAL === 0;
}

/**
 * Checks if the given wave is a mini-boss wave.
 * Mini-boss waves occur at waves 5, 15, 25, 35, etc.
 * @param waveNumber - Wave number to check
 * @returns true if this is a mini-boss wave
 */
export function isMiniBossWave(waveNumber: number): boolean {
  return waveNumber >= TIMING.MINIBOSS_FIRST_WAVE && waveNumber % 10 === 5;
}

/**
 * Checks if the shop should open after this wave.
 * Shop opens every 5 waves, starting after wave 1.
 * @param waveNumber - Wave number to check
 * @returns true if shop should open
 */
export function shouldOpenShop(waveNumber: number): boolean {
  return waveNumber > 1 && waveNumber % TIMING.SHOP_OPEN_INTERVAL === 0;
}

/**
 * Calculates bonus biomass for skipping wave preparation time.
 * @param secondsRemaining - Seconds left in preparation phase
 * @returns Bonus biomass amount
 */
export function calculateSkipBonus(secondsRemaining: number): number {
  return Math.max(1, Math.floor(secondsRemaining * 2));
}

/**
 * Checks if endless mode should activate.
 * @param waveNumber - Current wave number
 * @returns true if endless mode should activate
 */
export function shouldActivateEndlessMode(waveNumber: number): boolean {
  return waveNumber === ENDLESS_MODE.START_WAVE;
}

/**
 * Calculates the difficulty multiplier for endless mode.
 * @param waveNumber - Current wave number
 * @returns Difficulty multiplier (1.0 = normal, higher = harder)
 */
export function calculateEndlessDifficultyMultiplier(waveNumber: number): number {
  if (waveNumber < ENDLESS_MODE.START_WAVE) return 1.0;
  return 1.0 + (waveNumber - 50) * ENDLESS_MODE.DIFFICULTY_INCREASE_PER_WAVE;
}

/**
 * Wave pattern type definition
 */
export interface WavePattern {
  type: string;
  countMultiplier: number;
  messageKey: string;
}

/**
 * Gets the special pattern for a wave if one exists.
 * @param waveNumber - Wave number to check
 * @param patterns - Map of wave patterns
 * @returns Pattern if exists, null otherwise
 */
export function getWavePattern(
  waveNumber: number,
  patterns: Record<number, WavePattern>
): WavePattern | null {
  return patterns[waveNumber] || null;
}

/**
 * Calculates the next wave break duration based on wave number.
 * @param waveNumber - Current wave number
 * @returns Break duration in milliseconds
 */
export function calculateBreakDuration(_waveNumber: number): number {
  // Fixed 20 second break after each wave
  return 20000;
}
