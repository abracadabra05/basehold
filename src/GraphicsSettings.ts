/**
 * Graphics Quality Settings for BaseHold v2.5
 * Allows players to switch between High and Low graphics for performance.
 */

export type GraphicsQuality = 'high' | 'low';

export interface GraphicsConfig {
    particleMultiplier: number;   // 1.0 = full, 0.3 = reduced
    showShells: boolean;          // Shell casings from player gun
    showTrails: boolean;          // Projectile trails
    lightingEnabled: boolean;     // Day-night lighting system
    buildingAnimations: boolean;  // Building idle animations
    projectileGlow: boolean;      // Glow effects on projectiles
    maxParticles: number;         // Hard cap on particles
    maxProjectiles: number;       // Hard cap on projectiles
}

const QUALITY_PRESETS: Record<GraphicsQuality, GraphicsConfig> = {
    high: {
        particleMultiplier: 1.0,
        showShells: true,
        showTrails: true,
        lightingEnabled: true,
        buildingAnimations: true,
        projectileGlow: true,
        maxParticles: 500,
        maxProjectiles: 200,
    },
    low: {
        particleMultiplier: 0.3,
        showShells: false,
        showTrails: false,
        lightingEnabled: false,
        buildingAnimations: false,
        projectileGlow: false,
        maxParticles: 100,
        maxProjectiles: 100,
    }
};

class GraphicsSettingsManager {
    private _quality: GraphicsQuality = 'high';
    private _config: GraphicsConfig = { ...QUALITY_PRESETS.high };

    constructor() {
        this.load();
    }

    public get quality(): GraphicsQuality {
        return this._quality;
    }

    public get config(): GraphicsConfig {
        return this._config;
    }

    public setQuality(quality: GraphicsQuality): void {
        this._quality = quality;
        this._config = { ...QUALITY_PRESETS[quality] };
        this.save();
    }

    private save(): void {
        try {
            localStorage.setItem('basehold_graphics', this._quality);
        } catch (_) { /* ignore */ }
    }

    private load(): void {
        try {
            const saved = localStorage.getItem('basehold_graphics') as GraphicsQuality | null;
            if (saved && (saved === 'high' || saved === 'low')) {
                this._quality = saved;
                this._config = { ...QUALITY_PRESETS[saved] };
            }
        } catch (_) { /* ignore */ }
    }
}

/** Global singleton */
export const graphicsSettings = new GraphicsSettingsManager();
