import { graphicsSettings } from '../GraphicsSettings';

export interface AdaptiveQualityConfig {
  sampleWindow: number;
  lowFpsThreshold: number;
  highFpsThreshold: number;
}

const DEFAULT_CONFIG: AdaptiveQualityConfig = {
  sampleWindow: 120,
  lowFpsThreshold: 42,
  highFpsThreshold: 56,
};

export class AdaptiveQualityController {
  private readonly config: AdaptiveQualityConfig;
  private samples: number[] = [];

  constructor(config: AdaptiveQualityConfig = DEFAULT_CONFIG) {
    this.config = config;
  }

  public recordFrame(deltaMs: number): void {
    if (!Number.isFinite(deltaMs) || deltaMs <= 0) return;
    this.samples.push(deltaMs);
    if (this.samples.length > this.config.sampleWindow) {
      this.samples.shift();
    }
    if (this.samples.length < this.config.sampleWindow) return;

    const avgDelta = this.samples.reduce((acc, value) => acc + value, 0) / this.samples.length;
    const fps = 1000 / avgDelta;

    if (graphicsSettings.quality === 'high' && fps < this.config.lowFpsThreshold) {
      graphicsSettings.setQuality('low');
      return;
    }

    if (graphicsSettings.quality === 'low' && fps > this.config.highFpsThreshold) {
      graphicsSettings.setQuality('high');
    }
  }
}
