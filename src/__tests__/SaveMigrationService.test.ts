import { describe, expect, it } from 'vitest';
import { SAVE_VERSION, SaveMigrationService } from '../save/SaveMigrationService';

describe('SaveMigrationService', () => {
  const service = new SaveMigrationService();

  it('migrates legacy 2.x save to 3.0.0', () => {
    const legacy = {
      wave: 18,
      biomass: 250,
      tech: ['tesla', 'sniper'],
      upgrades: { damage: 3, speed: 2, mine: 4, regen: 1, thorns: 0, magnet: 2 },
    };

    const migrated = service.toCurrent(legacy);
    expect(migrated.saveVersion).toBe(SAVE_VERSION);
    expect(migrated.wave).toBe(18);
    expect(migrated.tech).toContain('tesla');
    expect(migrated.v3?.discoveredMutators).toEqual([]);
  });

  it('keeps valid 3.0 save stable', () => {
    const v3 = {
      saveVersion: SAVE_VERSION,
      wave: 40,
      biomass: 500,
      tech: ['missile'],
      upgrades: { damage: 6, speed: 4, mine: 5, regen: 2, thorns: 1, magnet: 3 },
      v3: { discoveredMutators: ['fog'], perksUnlocked: ['overdrive'], eliteKills: 7 },
    };

    const migrated = service.toCurrent(v3);
    expect(migrated.saveVersion).toBe(SAVE_VERSION);
    expect(migrated.v3?.discoveredMutators).toContain('fog');
    expect(migrated.v3?.eliteKills).toBe(7);
  });

  it('handles broken payload with safe defaults', () => {
    const migrated = service.toCurrent({ wave: 'bad', upgrades: null });
    expect(migrated.saveVersion).toBe(SAVE_VERSION);
    expect(migrated.wave).toBe(1);
    expect(migrated.upgrades.damage).toBe(1);
    expect(migrated.tech).toEqual([]);
  });
});
