export const GameConfig = {
    PLAYER: {
        BASE_SPEED: 3, // Assuming base speed which gets multiplied
        START_HP: 10,  // From Player.ts (need to verify, but usually reasonable default)
        HIT_RADIUS: 25,
    },
    ENEMIES: {
        BASIC: { speed: 2, hp: 3, damage: 5, radius: 15, color: 0xFF0000, reward: 5 },
        FAST: { speed: 3.5, hp: 1, damage: 2, radius: 12, color: 0xF1C40F, reward: 3 },
        TANK: { speed: 1.0, hp: 15, damage: 20, radius: 20, color: 0x8B0000, reward: 15 },
        BOSS: { speed: 0.6, hp: 500, damage: 100, radius: 60, color: 0x2c3e50, reward: 100, attackRange: 50 },
        KAMIKAZE: { speed: 4.0, hp: 2, damage: 50, radius: 12, color: 0xff6b6b, reward: 5 },
        SHOOTER: { speed: 1.5, hp: 5, damage: 5, radius: 15, color: 0x2ecc71, reward: 8, attackRange: 250 },
    },
    WAVES: {
        SPAWN_RADIUS: 800,
        BOSS_WAVE_INTERVAL: 10,
    },
    GAME: {
        GRID_SIZE: 40,
        MAP_WIDTH_TILES: 60,
        VOID_DAMAGE_INTERVAL: 30,
    }
};
