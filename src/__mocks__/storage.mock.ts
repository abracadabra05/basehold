/**
 * Mock for localStorage - used in unit tests
 */
import { vi } from 'vitest';

export class MockStorage implements Storage {
  private store: Record<string, string> = {};

  get length(): number {
    return Object.keys(this.store).length;
  }

  clear(): void {
    this.store = {};
  }

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store);
    return keys[index] ?? null;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  setItem(key: string, value: string): void {
    this.store[key] = value;
  }
}

export function setupStorageMock() {
  const mockStorage = new MockStorage();

  vi.stubGlobal('localStorage', mockStorage);
  vi.stubGlobal('sessionStorage', new MockStorage());

  return mockStorage;
}

export function resetStorageMock() {
  vi.unstubAllGlobals();
}
