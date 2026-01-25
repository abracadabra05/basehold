/**
 * Pure functions for upgrade system calculations.
 * These functions have no side effects and can be easily tested.
 */

import { UPGRADE } from '../constants/GameConstants';

/**
 * Calculates the cost of an upgrade at a given level.
 * Formula: BASE_COST * level (or BASE_COST if level is 0)
 * @param level - Current upgrade level
 * @returns Cost in biomass
 */
export function calculateUpgradeCost(level: number): number {
  return UPGRADE.BASE_COST * (level === 0 ? 1 : level);
}

/**
 * Checks if the player can afford an upgrade.
 * @param biomass - Current biomass amount
 * @param level - Current upgrade level
 * @returns true if upgrade is affordable
 */
export function canAffordUpgrade(biomass: number, level: number): boolean {
  return biomass >= calculateUpgradeCost(level);
}

/**
 * Checks if an upgrade has reached maximum level.
 * @param level - Current upgrade level
 * @param maxLevel - Maximum level (default from constants)
 * @returns true if at max level
 */
export function isMaxLevel(level: number, maxLevel: number = UPGRADE.MAX_LEVEL): boolean {
  return level >= maxLevel;
}

/**
 * Calculates the new player damage after upgrade.
 * @param currentDamage - Current damage value
 * @returns New damage value
 */
export function calculateNewDamage(currentDamage: number): number {
  return currentDamage + UPGRADE.DAMAGE_INCREASE;
}

/**
 * Calculates the new mine speed multiplier after upgrade.
 * @param currentMultiplier - Current multiplier
 * @returns New multiplier
 */
export function calculateNewMineMultiplier(currentMultiplier: number): number {
  return currentMultiplier + UPGRADE.MINE_MULTIPLIER_INCREASE;
}

/**
 * Calculates the new player speed after upgrade.
 * @param currentSpeed - Current speed value
 * @returns New speed value
 */
export function calculateNewSpeed(currentSpeed: number): number {
  return currentSpeed + UPGRADE.SPEED_INCREASE;
}

/**
 * Calculates the new magnet radius after upgrade.
 * @param currentRadius - Current radius
 * @returns New radius
 */
export function calculateNewMagnetRadius(currentRadius: number): number {
  return currentRadius + UPGRADE.MAGNET_RADIUS_INCREASE;
}

/**
 * Gets research cost for a building type.
 * @param buildingConfig - Building configuration object
 * @returns Research cost or 0 if not researchable
 */
export function getResearchCost(buildingConfig: { researchCost?: number }): number {
  return buildingConfig.researchCost ?? 0;
}

/**
 * Checks if a building is initially unlocked.
 * @param buildingConfig - Building configuration object
 * @returns true if building starts unlocked
 */
export function isInitiallyUnlocked(buildingConfig: { unlocked?: boolean }): boolean {
  return buildingConfig.unlocked === true;
}
