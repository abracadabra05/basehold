export const GameConfig = {
    PLAYER: {
        BASE_SPEED: 3, 
        START_HP: 100,  // Было 10
        HIT_RADIUS: 25,
    },
    ENEMIES: {
        // reward - биомасса, score - очки
        BASIC: { speed: 2, hp: 5, damage: 10, radius: 15, color: 0xFF0000, reward: 5, score: 10 },
        FAST: { speed: 3.5, hp: 3, damage: 5, radius: 12, color: 0xF1C40F, reward: 8, score: 15 },
        TANK: { speed: 1.0, hp: 40, damage: 30, radius: 20, color: 0x8B0000, reward: 25, score: 50 },
        BOSS: { speed: 0.6, hp: 1000, damage: 150, radius: 60, color: 0x2c3e50, reward: 500, score: 1000, attackRange: 50 },
        KAMIKAZE: { speed: 4.5, hp: 5, damage: 100, radius: 12, color: 0xff6b6b, reward: 10, score: 20 },
        SHOOTER: { speed: 1.5, hp: 15, damage: 15, radius: 15, color: 0x2ecc71, reward: 15, score: 30, attackRange: 250 },
        // v2.0 Enemies
        HEALER: { speed: 1.8, hp: 20, damage: 5, radius: 14, color: 0x00FF88, reward: 30, score: 40, healRange: 150, healAmount: 2 },
        SPLITTER: { speed: 2.2, hp: 25, damage: 15, radius: 18, color: 0x9B59B6, reward: 20, score: 35, splitCount: 2 },
        SHIELDBEARER: { speed: 1.2, hp: 50, damage: 20, radius: 22, color: 0x3498DB, reward: 40, score: 60, shieldRange: 100 },
        MINIBOSS: { speed: 0.8, hp: 300, damage: 50, radius: 45, color: 0xE67E22, reward: 150, score: 300 },
    },
    WAVES: {
        SPAWN_RADIUS: 1500, // Увеличил с 800 до 1500 (за пределы экрана/границ)
        BOSS_WAVE_INTERVAL: 10,
        PATTERNS: {
            // [waveNum]: { type: EnemyType, countMultiplier: number, messageKey: string }
            5: { type: 'fast', countMultiplier: 2.0, messageKey: 'wave_pattern_speed' },
            7: { type: 'shooter', countMultiplier: 1.5, messageKey: 'wave_pattern_ranged' },
            15: { type: 'kamikaze', countMultiplier: 2.5, messageKey: 'wave_pattern_explosive' },
            20: { type: 'tank', countMultiplier: 1.0, messageKey: 'wave_pattern_heavy' }
        }
    },
    GAME: {
        GRID_SIZE: 40,
        MAP_WIDTH_TILES: 60,
        VOID_DAMAGE_INTERVAL: 30,
    },
    BUILDINGS: {
        wall: { hp: 200, cost: 10, energy: 0, unlocked: true },
        drill: { hp: 50, cost: 50, energy: -5, unlocked: true },
        generator: { hp: 40, cost: 100, energy: 20, unlocked: true },
        core: { hp: 1000, cost: 0, energy: 50, capacity: 1000, unlocked: true },
        turret: { hp: 100, cost: 30, energy: -10, range: 250, damage: 3, fireRate: 30, unlocked: true },
        
        // Unlockable
        battery: { hp: 100, cost: 150, energy: 0, capacity: 2000, unlocked: false, researchCost: 200 },
        sniper: { hp: 60, cost: 75, energy: -15, range: 500, damage: 30, fireRate: 120, unlocked: false, researchCost: 300 },
        minigun: { hp: 150, cost: 120, energy: -20, range: 200, damage: 1.5, fireRate: 4, unlocked: false, researchCost: 500 },
        laser: { hp: 80, cost: 200, energy: -5, range: 300, damage: 50, fireRate: 60, unlocked: false, researchCost: 800 },
        // v2.0 Buildings
        tesla: { hp: 120, cost: 80, energy: -25, range: 200, damage: 15, fireRate: 45, chainCount: 3, unlocked: false, researchCost: 600 },
        slowfield: { hp: 80, cost: 50, energy: -10, range: 150, slowAmount: 0.5, unlocked: false, researchCost: 400 },
    },
    PERKS: [
        { id: 'double_shot', key: 'perk_double_shot', icon: '⚔️' },
        { id: 'vampirism', key: 'perk_vampirism', icon: '🩸' },
        { id: 'explosive_rounds', key: 'perk_explosive', icon: '💥' },
        { id: 'faster_reload', key: 'perk_reload', icon: '⚡' },
        { id: 'shield_core', key: 'perk_shield', icon: '🛡️' },
        { id: 'auto_repair', key: 'perk_repair', icon: '🔧' },
        // v2.0 Perks
        { id: 'ricochet', key: 'perk_ricochet', icon: '↩️' },
        { id: 'critical_hit', key: 'perk_critical', icon: '💀' },
        { id: 'slow_bullets', key: 'perk_slow_bullets', icon: '🐌' },
        { id: 'life_steal', key: 'perk_life_steal', icon: '💚' }
    ]
};
