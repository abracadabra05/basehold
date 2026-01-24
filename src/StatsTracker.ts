export interface GameStats {
    enemiesKilled: number;
    buildingsBuilt: number;
    damageDealt: number;
    resourcesMined: number;
    timePlayedMs: number;
    waveReached: number;
    bossesKilled: number;
}

export class StatsTracker {
    private stats: GameStats = {
        enemiesKilled: 0,
        buildingsBuilt: 0,
        damageDealt: 0,
        resourcesMined: 0,
        timePlayedMs: 0,
        waveReached: 1,
        bossesKilled: 0
    };

    private startTime: number = 0;
    private isTracking: boolean = false;

    public start() {
        this.startTime = Date.now();
        this.isTracking = true;
    }

    public stop() {
        if (this.isTracking) {
            this.stats.timePlayedMs += Date.now() - this.startTime;
            this.isTracking = false;
        }
    }

    public reset() {
        this.stats = {
            enemiesKilled: 0,
            buildingsBuilt: 0,
            damageDealt: 0,
            resourcesMined: 0,
            timePlayedMs: 0,
            waveReached: 1,
            bossesKilled: 0
        };
        this.startTime = 0;
        this.isTracking = false;
    }

    public addKill(isBoss: boolean = false) {
        this.stats.enemiesKilled++;
        if (isBoss) this.stats.bossesKilled++;
    }

    public addBuilding() {
        this.stats.buildingsBuilt++;
    }

    public addDamage(amount: number) {
        this.stats.damageDealt += amount;
    }

    public addResources(amount: number) {
        this.stats.resourcesMined += amount;
    }

    public setWave(wave: number) {
        if (wave > this.stats.waveReached) {
            this.stats.waveReached = wave;
        }
    }

    public getStats(): GameStats {
        // Update time if still tracking
        if (this.isTracking) {
            const currentTime = Date.now() - this.startTime + this.stats.timePlayedMs;
            return { ...this.stats, timePlayedMs: currentTime };
        }
        return { ...this.stats };
    }

    public formatTime(ms: number): string {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
        }
        return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
    }
}
