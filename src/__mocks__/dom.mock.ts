/**
 * Mock for DOM elements - used in unit tests
 */
import { vi } from 'vitest';

export function createMockElement(tagName: string = 'div') {
  return {
    tagName,
    style: {},
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
      toggle: vi.fn(),
      contains: vi.fn().mockReturnValue(false),
    },
    appendChild: vi.fn(),
    removeChild: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    setAttribute: vi.fn(),
    getAttribute: vi.fn(),
    textContent: '',
    innerHTML: '',
    children: [],
    parentNode: null,
  };
}

export function setupDocumentMocks() {
  vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
    return createMockElement(tagName) as unknown as HTMLElement;
  });

  vi.spyOn(document, 'getElementById').mockImplementation(() => {
    return createMockElement() as unknown as HTMLElement;
  });

  vi.spyOn(document, 'querySelector').mockImplementation(() => {
    return createMockElement() as unknown as HTMLElement;
  });
}

export function resetDomMocks() {
  vi.restoreAllMocks();
}
