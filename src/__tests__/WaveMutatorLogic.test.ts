import { describe, expect, it } from 'vitest';
import {
  applyWaveMutatorCount,
  applyWaveMutatorEnemyStats,
  applyWaveMutatorSpawnRadius,
  getScheduledWaveMutator,
} from '../logic/WaveMutatorLogic';

describe('WaveMutatorLogic', () => {
  const schedule = [
    { type: 'fog' as const, startsAtWave: 8, interval: 7, messageKey: 'wave_mutator_fog' },
    { type: 'overcharge' as const, startsAtWave: 12, interval: 8, messageKey: 'wave_mutator_overcharge' },
    { type: 'swarm' as const, startsAtWave: 16, interval: 6, messageKey: 'wave_mutator_swarm' },
  ];

  it('returns mutator when wave matches schedule', () => {
    expect(getScheduledWaveMutator(8, schedule)?.type).toBe('fog');
    expect(getScheduledWaveMutator(12, schedule)?.type).toBe('overcharge');
    expect(getScheduledWaveMutator(16, schedule)?.type).toBe('swarm');
  });

  it('returns null when no mutator is scheduled', () => {
    expect(getScheduledWaveMutator(9, schedule)).toBeNull();
  });

  it('applies swarm count modifier', () => {
    expect(applyWaveMutatorCount(20, 'swarm')).toBe(29);
    expect(applyWaveMutatorCount(20, null)).toBe(20);
  });

  it('applies fog radius modifier', () => {
    expect(applyWaveMutatorSpawnRadius(1500, 'fog')).toBe(1170);
    expect(applyWaveMutatorSpawnRadius(1500, null)).toBe(1500);
  });

  it('applies overcharge enemy stats modifier', () => {
    const boosted = applyWaveMutatorEnemyStats(100, 20, 'overcharge');
    expect(boosted.hp).toBe(120);
    expect(boosted.damage).toBe(25);
  });
});
