import { describe, it, expect } from 'vitest';
import { GameConfig } from '../GameConfig';

describe('GameConfig', () => {
  describe('ENEMIES', () => {
    it('all enemies have required properties', () => {
      for (const [name, config] of Object.entries(GameConfig.ENEMIES)) {
        expect(config.hp, `${name} should have hp`).toBeGreaterThan(0);
        expect(config.speed, `${name} should have speed`).toBeGreaterThan(0);
        expect(config.damage, `${name} should have damage`).toBeGreaterThan(0);
        expect(config.reward, `${name} should have reward`).toBeGreaterThanOrEqual(0);
        expect(config.radius, `${name} should have radius`).toBeGreaterThan(0);
        expect(config.color, `${name} should have color`).toBeDefined();
        expect(config.score, `${name} should have score`).toBeGreaterThan(0);
      }
    });

    it('boss has more HP than basic enemy', () => {
      expect(GameConfig.ENEMIES.BOSS.hp).toBeGreaterThan(GameConfig.ENEMIES.BASIC.hp);
    });

    it('boss has more HP than tank', () => {
      expect(GameConfig.ENEMIES.BOSS.hp).toBeGreaterThan(GameConfig.ENEMIES.TANK.hp);
    });

    it('fast enemy is faster than basic', () => {
      expect(GameConfig.ENEMIES.FAST.speed).toBeGreaterThan(GameConfig.ENEMIES.BASIC.speed);
    });

    it('tank is slower than basic', () => {
      expect(GameConfig.ENEMIES.TANK.speed).toBeLessThan(GameConfig.ENEMIES.BASIC.speed);
    });

    it('kamikaze has high damage', () => {
      expect(GameConfig.ENEMIES.KAMIKAZE.damage).toBeGreaterThan(GameConfig.ENEMIES.BASIC.damage);
    });

    it('boss gives more reward than basic', () => {
      expect(GameConfig.ENEMIES.BOSS.reward).toBeGreaterThan(GameConfig.ENEMIES.BASIC.reward);
    });
  });

  describe('BUILDINGS', () => {
    it('all buildings have required base properties', () => {
      for (const [name, config] of Object.entries(GameConfig.BUILDINGS)) {
        expect(config.hp, `${name} should have hp`).toBeGreaterThan(0);
        expect(config.cost, `${name} should have cost`).toBeGreaterThanOrEqual(0);
        expect(typeof config.energy, `${name} should have energy`).toBe('number');
        expect(typeof config.unlocked, `${name} should have unlocked`).toBe('boolean');
      }
    });

    it('core has highest HP among buildings', () => {
      for (const [name, config] of Object.entries(GameConfig.BUILDINGS)) {
        if (name !== 'core') {
          expect(GameConfig.BUILDINGS.core.hp, `core should have more HP than ${name}`)
            .toBeGreaterThan(config.hp);
        }
      }
    });

    it('core is unlocked by default', () => {
      expect(GameConfig.BUILDINGS.core.unlocked).toBe(true);
    });

    it('wall is unlocked by default', () => {
      expect(GameConfig.BUILDINGS.wall.unlocked).toBe(true);
    });

    it('advanced buildings are locked by default', () => {
      expect(GameConfig.BUILDINGS.sniper.unlocked).toBe(false);
      expect(GameConfig.BUILDINGS.minigun.unlocked).toBe(false);
      expect(GameConfig.BUILDINGS.laser.unlocked).toBe(false);
    });

    it('turret buildings have range and fireRate', () => {
      const turrets = ['turret', 'sniper', 'minigun', 'laser', 'tesla'] as const;
      for (const name of turrets) {
        const config = GameConfig.BUILDINGS[name] as any;
        expect(config.range, `${name} should have range`).toBeGreaterThan(0);
        expect(config.fireRate, `${name} should have fireRate`).toBeGreaterThan(0);
        expect(config.damage, `${name} should have damage`).toBeGreaterThan(0);
      }
    });
  });

  describe('PLAYER', () => {
    it('has valid base speed', () => {
      expect(GameConfig.PLAYER.BASE_SPEED).toBeGreaterThan(0);
    });

    it('has valid starting HP', () => {
      expect(GameConfig.PLAYER.START_HP).toBeGreaterThan(0);
    });

    it('has valid hit radius', () => {
      expect(GameConfig.PLAYER.HIT_RADIUS).toBeGreaterThan(0);
    });
  });

  describe('WAVES', () => {
    it('has spawn radius', () => {
      expect(GameConfig.WAVES.SPAWN_RADIUS).toBeGreaterThan(0);
    });

    it('has boss wave interval', () => {
      expect(GameConfig.WAVES.BOSS_WAVE_INTERVAL).toBe(10);
    });

    it('has valid patterns', () => {
      expect(GameConfig.WAVES.PATTERNS).toBeDefined();
      expect(Object.keys(GameConfig.WAVES.PATTERNS).length).toBeGreaterThan(0);
    });
  });

  describe('PERKS', () => {
    it('all perks have required properties', () => {
      for (const perk of GameConfig.PERKS) {
        expect(perk.id, 'perk should have id').toBeDefined();
        expect(perk.key, 'perk should have key').toBeDefined();
        expect(perk.icon, 'perk should have icon').toBeDefined();
      }
    });

    it('perk ids are unique', () => {
      const ids = GameConfig.PERKS.map(p => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });
});
