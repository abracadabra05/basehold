export const GameConfig = {
    PLAYER: {
        BASE_SPEED: 3, 
        START_HP: 100,  // Было 10
        HIT_RADIUS: 25,
    },
    ENEMIES: {
        // reward - сколько биомассы падает (примерно)
        BASIC: { speed: 2, hp: 5, damage: 10, radius: 15, color: 0xFF0000, reward: 5 }, // HP: 3->5, Dmg: 5->10
        FAST: { speed: 3.5, hp: 3, damage: 5, radius: 12, color: 0xF1C40F, reward: 8 }, // HP: 1->3, Dmg: 2->5
        TANK: { speed: 1.0, hp: 40, damage: 30, radius: 20, color: 0x8B0000, reward: 25 }, // HP: 15->40, Dmg: 20->30
        BOSS: { speed: 0.6, hp: 1000, damage: 150, radius: 60, color: 0x2c3e50, reward: 500, attackRange: 50 }, // HP: 500->1000, Dmg: 100->150, Reward++
        KAMIKAZE: { speed: 4.5, hp: 5, damage: 100, radius: 12, color: 0xff6b6b, reward: 10 }, // Dmg: 50->100
        SHOOTER: { speed: 1.5, hp: 15, damage: 15, radius: 15, color: 0x2ecc71, reward: 15, attackRange: 250 }, // Dmg: 5->15
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
