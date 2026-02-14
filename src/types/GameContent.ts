export const ENEMY_TYPES = [
  'basic',
  'fast',
  'tank',
  'boss',
  'kamikaze',
  'shooter',
  'healer',
  'splitter',
  'shieldbearer',
  'miniboss',
  'saboteur',
  'juggernaut',
  'phasewalker',
] as const;

export type EnemyType = (typeof ENEMY_TYPES)[number];

export const BUILDING_TYPES = [
  'wall',
  'drill',
  'generator',
  'turret',
  'core',
  'sniper',
  'minigun',
  'battery',
  'laser',
  'tesla',
  'slowfield',
  'radar',
  'missile',
  'repairhub',
] as const;

export type BuildingType = (typeof BUILDING_TYPES)[number];

export const PERK_IDS = [
  'double_shot',
  'vampirism',
  'explosive_rounds',
  'faster_reload',
  'shield_core',
  'auto_repair',
  'ricochet',
  'critical_hit',
  'slow_bullets',
  'life_steal',
  'overdrive',
  'salvage',
  'nanoburst',
  'hunter_protocol',
] as const;

export type PerkId = (typeof PERK_IDS)[number];

export const WAVE_MUTATORS = ['fog', 'overcharge', 'swarm'] as const;
export type WaveMutatorType = (typeof WAVE_MUTATORS)[number];
