/**
 * Game constants extracted from various source files for centralized configuration.
 * These constants are used across multiple modules and should be changed here.
 */

export const GRID = {
  /** Size of each grid cell in pixels */
  SIZE: 40,
  /** Width of the map in tiles */
  MAP_WIDTH_TILES: 60,
} as const;

export const TIMING = {
  /** Frames between void damage ticks (0.5 sec at 60fps) */
  VOID_DAMAGE_INTERVAL: 30,
  /** Frames between low HP warning flashes (1 sec at 60fps) */
  LOW_HP_FLASH_INTERVAL: 60,
  /** Seconds of preparation time before each wave */
  WAVE_PREP_TIME: 40,
  /** Waves between shop openings */
  SHOP_OPEN_INTERVAL: 5,
  /** Waves between boss spawns */
  BOSS_WAVE_INTERVAL: 10,
  /** Wave number for mini-boss first appearance */
  MINIBOSS_FIRST_WAVE: 5,
  /** Enemy attack speed in frames */
  ENEMY_ATTACK_SPEED: 60,
  /** Boss/shooter attack speed in frames */
  RANGED_ATTACK_SPEED: 120,
  /** Healer heal interval in frames */
  HEAL_INTERVAL: 60,
} as const;

export const COMBAT = {
  /** Damage multiplier when enemy is shielded */
  SHIELD_DAMAGE_REDUCTION: 0.5,
  /** Critical hit damage multiplier */
  CRITICAL_MULTIPLIER: 2.0,
  /** Maximum range for ricochet to find next target */
  RICOCHET_RANGE: 200,
  /** Damage multiplier for ricocheted projectiles */
  RICOCHET_DAMAGE_MULT: 0.5,
  /** Kamikaze explosion radius */
  KAMIKAZE_EXPLOSION_RADIUS: 100,
  /** Chain lightning damage multiplier */
  CHAIN_DAMAGE_MULT: 0.7,
  /** Chain lightning max range */
  CHAIN_RANGE: 150,
  /** Void damage per tick when player is outside map */
  VOID_DAMAGE: 5,
  /** Player collision radius */
  PLAYER_COLLISION_RADIUS: 14,
  /** Minimum distance from player for enemy to stop */
  ENEMY_MIN_PLAYER_DISTANCE: 25,
} as const;

export const VISUALS = {
  /** HP bar shows green when HP is above this percentage */
  HP_BAR_GREEN_THRESHOLD: 0.5,
  /** HP bar shows yellow when HP is above this percentage (below goes red) */
  HP_BAR_YELLOW_THRESHOLD: 0.25,
  /** Low HP warning threshold percentage */
  LOW_HP_WARNING_THRESHOLD: 0.3,
  /** Number of particles for standard explosion */
  EXPLOSION_PARTICLE_COUNT: 10,
  /** Number of particles for large explosion */
  LARGE_EXPLOSION_PARTICLE_COUNT: 20,
  /** Number of particles for boss death explosion */
  BOSS_EXPLOSION_PARTICLE_COUNT: 30,
  /** Mining visual scale pulse amount */
  MINING_PULSE: 0.1,
  /** Recoil reset speed per frame */
  RECOIL_RECOVERY_SPEED: 0.5,
  /** Recoil distance when firing */
  RECOIL_DISTANCE: 5,
} as const;

export const SPAWNING = {
  /** Distance from core where enemies spawn */
  SPAWN_RADIUS: 1500,
  /** Number of resource nodes to generate */
  RESOURCE_NODE_COUNT: 40,
  /** Number of rocks to generate */
  ROCK_COUNT: 20,
  /** Minimum distance from center for resource nodes */
  RESOURCE_CENTER_MARGIN: 200,
  /** Minimum distance from center for rocks */
  ROCK_CENTER_MARGIN: 300,
  /** Minimum distance between rocks and resources */
  ROCK_RESOURCE_MARGIN: 50,
} as const;

export const PICKUP = {
  /** Base pickup radius for drops */
  BASE_PICKUP_RADIUS: 50,
  /** Actual touch/collect radius */
  COLLECT_RADIUS: 20,
  /** Drop chance for regular enemies */
  DROP_CHANCE: 0.7,
} as const;

export const ENDLESS_MODE = {
  /** Wave number when endless mode activates */
  START_WAVE: 51,
  /** Difficulty increase per wave after endless mode starts */
  DIFFICULTY_INCREASE_PER_WAVE: 0.05,
} as const;

export const UPGRADE = {
  /** Base cost for upgrades */
  BASE_COST: 50,
  /** Maximum upgrade level */
  MAX_LEVEL: 10,
  /** Damage increase per upgrade */
  DAMAGE_INCREASE: 1,
  /** Mine multiplier increase per upgrade */
  MINE_MULTIPLIER_INCREASE: 0.5,
  /** Speed increase per upgrade */
  SPEED_INCREASE: 0.5,
  /** Magnet radius increase per upgrade */
  MAGNET_RADIUS_INCREASE: 100,
} as const;

export const PLAYER = {
  /** Base movement speed */
  BASE_SPEED: 3,
  /** Starting HP */
  START_HP: 100,
  /** Hit radius for collision detection */
  HIT_RADIUS: 25,
  /** Base fire rate in frames */
  BASE_FIRE_RATE: 10,
  /** Invulnerability duration after taking damage */
  INVULNERABLE_FRAMES: 60,
  /** Barrel length for projectile spawn */
  BARREL_LENGTH: 25,
} as const;
