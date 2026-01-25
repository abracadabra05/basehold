/**
 * Pure functions for resource calculations.
 * These functions have no side effects and can be easily tested.
 */

/**
 * Calculates the new battery charge after a time delta.
 * @param current - Current battery charge
 * @param max - Maximum battery capacity
 * @param produced - Energy produced per tick
 * @param consumed - Energy consumed per tick
 * @param deltaTime - Time delta
 * @returns New battery charge (clamped between 0 and max)
 */
export function calculateBatteryCharge(
  current: number,
  max: number,
  produced: number,
  consumed: number,
  deltaTime: number
): number {
  const net = produced - consumed;
  const newCharge = current + net * deltaTime;
  return Math.max(0, Math.min(max, newCharge));
}

/**
 * Checks if the system is in blackout state.
 * @param charge - Current battery charge
 * @returns true if system is in blackout (no power)
 */
export function isBlackout(charge: number): boolean {
  return charge <= 0;
}

/**
 * Calculates energy efficiency ratio.
 * @param produced - Energy produced per tick
 * @param consumed - Energy consumed per tick
 * @returns Efficiency ratio (0-1), where 1 means full efficiency
 */
export function calculateEfficiency(produced: number, consumed: number): number {
  if (consumed === 0) return 1;
  return Math.min(1, produced / consumed);
}

/**
 * Determines the energy status for UI display.
 * @param charge - Current battery charge
 * @param capacity - Maximum battery capacity
 * @param produced - Energy produced per tick
 * @param consumed - Energy consumed per tick
 * @returns Status key for localization
 */
export function getEnergyStatus(
  charge: number,
  capacity: number,
  produced: number,
  consumed: number
): 'blackout' | 'draining' | 'charging' | 'charged' {
  if (charge <= 0) return 'blackout';
  const net = produced - consumed;
  if (net < 0) return 'draining';
  if (charge < capacity) return 'charging';
  return 'charged';
}

/**
 * Calculates the battery charge percentage.
 * @param charge - Current battery charge
 * @param capacity - Maximum battery capacity
 * @returns Percentage as integer (0-100)
 */
export function getBatteryPercentage(charge: number, capacity: number): number {
  if (capacity <= 0) return 0;
  return Math.floor((charge / capacity) * 100);
}

/**
 * Checks if a resource milestone was crossed.
 * Milestones are at every 100 units.
 * @param oldValue - Previous value
 * @param newValue - New value
 * @returns true if a milestone was crossed
 */
export function crossedMilestone(oldValue: number, newValue: number): boolean {
  return Math.floor(newValue / 100) > Math.floor(oldValue / 100);
}
