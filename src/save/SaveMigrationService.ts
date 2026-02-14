import type { PerkId } from '../types/GameContent';

export const SAVE_VERSION = '3.0.0';

export interface YandexDataV3 {
  saveVersion: string;
  wave: number;
  biomass: number;
  tech: string[];
  upgrades: {
    damage: number;
    speed: number;
    mine: number;
    regen: number;
    thorns: number;
    magnet: number;
  };
  records?: {
    waves?: number;
    score?: number;
  };
  v3?: {
    discoveredMutators: string[];
    perksUnlocked: PerkId[];
    eliteKills: number;
  };
  meta?: {
    createdAt: number;
    updatedAt: number;
    build: string;
  };
}

export interface SaveMigrator {
  from: string;
  to: string;
  migrate(input: unknown): YandexDataV3;
}

const clampNumber = (value: unknown, fallback = 0): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.floor(value));
};

const asStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
};

const migrateLegacyAny = (input: unknown, version: string): YandexDataV3 => {
  const data = (input && typeof input === 'object') ? (input as Record<string, unknown>) : {};
  const upgrades = (data.upgrades && typeof data.upgrades === 'object') ? (data.upgrades as Record<string, unknown>) : {};
  const now = Date.now();

  return {
    saveVersion: version,
    wave: clampNumber(data.wave, 1),
    biomass: clampNumber(data.biomass, 0),
    tech: asStringArray(data.tech),
    upgrades: {
      damage: clampNumber(upgrades.damage, 1),
      speed: clampNumber(upgrades.speed, 1),
      mine: clampNumber(upgrades.mine, 1),
      regen: clampNumber(upgrades.regen, 0),
      thorns: clampNumber(upgrades.thorns, 0),
      magnet: clampNumber(upgrades.magnet, 0),
    },
    records: {
      waves: clampNumber((data.records as any)?.waves, 0),
      score: clampNumber((data.records as any)?.score, 0),
    },
    v3: {
      discoveredMutators: [],
      perksUnlocked: [],
      eliteKills: 0,
    },
    meta: {
      createdAt: clampNumber((data.meta as any)?.createdAt, now),
      updatedAt: now,
      build: version,
    },
  };
};

const MIGRATORS: SaveMigrator[] = [
  {
    from: '2.x',
    to: '2.6.0',
    migrate(input: unknown): YandexDataV3 {
      return migrateLegacyAny(input, '2.6.0');
    },
  },
  {
    from: '2.6.0',
    to: SAVE_VERSION,
    migrate(input: unknown): YandexDataV3 {
      const base = migrateLegacyAny(input, SAVE_VERSION);
      if ((input as any)?.v3 && typeof (input as any).v3 === 'object') {
        const source = (input as any).v3;
        base.v3 = {
          discoveredMutators: asStringArray(source.discoveredMutators),
          perksUnlocked: asStringArray(source.perksUnlocked) as PerkId[],
          eliteKills: clampNumber(source.eliteKills, 0),
        };
      }
      return base;
    },
  },
];

export class SaveMigrationService {
  private readonly migrators: SaveMigrator[];

  constructor(migrators: SaveMigrator[] = MIGRATORS) {
    this.migrators = migrators;
  }

  public toCurrent(input: unknown): YandexDataV3 {
    const withVersion = this.ensureVersion(input);
    if (withVersion.saveVersion === SAVE_VERSION) {
      return this.normalizeCurrent(withVersion);
    }

    if (withVersion.saveVersion.startsWith('2.')) {
      const stepOne = this.migrators.find(m => m.from === '2.x' && m.to === '2.6.0');
      const stepTwo = this.migrators.find(m => m.from === '2.6.0' && m.to === SAVE_VERSION);
      const prep = stepOne ? stepOne.migrate(withVersion) : migrateLegacyAny(withVersion, '2.6.0');
      return stepTwo ? stepTwo.migrate(prep) : migrateLegacyAny(prep, SAVE_VERSION);
    }

    console.warn(`[SaveMigration] Unknown saveVersion "${withVersion.saveVersion}", applying safe defaults`);
    return migrateLegacyAny(withVersion, SAVE_VERSION);
  }

  private normalizeCurrent(input: Record<string, unknown>): YandexDataV3 {
    const base = migrateLegacyAny(input, SAVE_VERSION);
    const v3 = (input.v3 && typeof input.v3 === 'object') ? (input.v3 as Record<string, unknown>) : {};
    return {
      ...base,
      v3: {
        discoveredMutators: asStringArray(v3.discoveredMutators),
        perksUnlocked: asStringArray(v3.perksUnlocked) as PerkId[],
        eliteKills: clampNumber(v3.eliteKills, 0),
      },
    };
  }

  private ensureVersion(input: unknown): Record<string, unknown> & { saveVersion: string } {
    const data = (input && typeof input === 'object') ? (input as Record<string, unknown>) : {};
    const rawVersion = data.saveVersion;
    if (typeof rawVersion === 'string' && rawVersion.length > 0) {
      return data as Record<string, unknown> & { saveVersion: string };
    }
    return { ...data, saveVersion: '2.x' } as Record<string, unknown> & { saveVersion: string };
  }
}

export const saveMigrationService = new SaveMigrationService();
