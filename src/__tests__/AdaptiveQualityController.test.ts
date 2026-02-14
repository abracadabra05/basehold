import { beforeEach, describe, expect, it } from 'vitest';
import { graphicsSettings } from '../GraphicsSettings';
import { AdaptiveQualityController } from '../performance/AdaptiveQualityController';

describe('AdaptiveQualityController', () => {
  beforeEach(() => {
    graphicsSettings.setQuality('high');
  });

  it('switches to low quality after sustained low FPS', () => {
    const controller = new AdaptiveQualityController({
      sampleWindow: 10,
      lowFpsThreshold: 50,
      highFpsThreshold: 58,
    });

    for (let i = 0; i < 10; i++) controller.recordFrame(28); // ~35 fps
    expect(graphicsSettings.quality).toBe('low');
  });

  it('switches back to high quality after sustained high FPS', () => {
    graphicsSettings.setQuality('low');
    const controller = new AdaptiveQualityController({
      sampleWindow: 10,
      lowFpsThreshold: 45,
      highFpsThreshold: 55,
    });

    for (let i = 0; i < 10; i++) controller.recordFrame(14); // ~71 fps
    expect(graphicsSettings.quality).toBe('high');
  });
});
