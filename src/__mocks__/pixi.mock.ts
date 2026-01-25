/**
 * Mock for Pixi.js - used in unit tests to avoid WebGL dependencies
 */
import { vi } from 'vitest';

export const mockContainer = {
  addChild: vi.fn(),
  removeChild: vi.fn(),
  children: [],
  x: 0,
  y: 0,
  visible: true,
  destroy: vi.fn(),
};

export const mockGraphics = {
  rect: vi.fn().mockReturnThis(),
  fill: vi.fn().mockReturnThis(),
  circle: vi.fn().mockReturnThis(),
  clear: vi.fn().mockReturnThis(),
  destroy: vi.fn(),
};

export const mockApplication = {
  stage: mockContainer,
  screen: { width: 800, height: 600 },
  ticker: {
    add: vi.fn(),
    remove: vi.fn(),
  },
  renderer: {
    resize: vi.fn(),
  },
};

export const mockTicker = {
  deltaTime: 1,
  deltaMS: 16.67,
};

// Reset all mocks
export function resetPixiMocks() {
  vi.clearAllMocks();
  mockContainer.children = [];
  mockContainer.x = 0;
  mockContainer.y = 0;
}
