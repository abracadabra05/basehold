import type { WaveMutatorType } from '../types/GameContent';

export interface WaveMutatorConfig {
  type: WaveMutatorType;
  startsAtWave: number;
  interval: number;
  messageKey: string;
}

export interface ActiveWaveMutator {
  type: WaveMutatorType;
  messageKey: string;
}

export function getScheduledWaveMutator(
  waveNumber: number,
  schedule: WaveMutatorConfig[]
): ActiveWaveMutator | null {
  for (const item of schedule) {
    if (waveNumber >= item.startsAtWave && (waveNumber - item.startsAtWave) % item.interval === 0) {
      return { type: item.type, messageKey: item.messageKey };
    }
  }
  return null;
}

export function applyWaveMutatorCount(baseCount: number, mutator: WaveMutatorType | null): number {
  if (!mutator) return baseCount;
  if (mutator === 'swarm') return Math.ceil(baseCount * 1.45);
  return baseCount;
}

export function applyWaveMutatorSpawnRadius(baseRadius: number, mutator: WaveMutatorType | null): number {
  if (!mutator) return baseRadius;
  if (mutator === 'fog') return Math.floor(baseRadius * 0.78);
  return baseRadius;
}

export function applyWaveMutatorEnemyStats(
  hp: number,
  damage: number,
  mutator: WaveMutatorType | null
): { hp: number; damage: number } {
  if (!mutator) return { hp, damage };
  if (mutator === 'overcharge') {
    return { hp: hp * 1.2, damage: damage * 1.25 };
  }
  return { hp, damage };
}
