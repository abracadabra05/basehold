export interface YandexData {
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
}

export class YandexSDK {
    private ysdk: any = null;
    private leaderboard: any = null;
    private player: any = null; // Восстанавливаем
    public isReady: boolean = false;
    public lang: 'ru' | 'en' = 'en'; 

    constructor() {
        // Init вызывается вручную в main.ts
    }

    public async init(): Promise<void> {
        try {
            // @ts-ignore
            if (window.YaGames) {
                // @ts-ignore
                this.ysdk = await window.YaGames.init();
                this.isReady = true;
                
                const env = this.ysdk.environment;
                if (env && env.i18n && env.i18n.lang === 'ru') {
                    this.lang = 'ru';
                }
                console.log(`Yandex SDK initialized. Lang: ${this.lang}`);
                
                try {
                    await this.ysdk.getPlayer();
                } catch (e) {
                    console.warn('Player not authorized (local dev?)', e);
                }

                try {
                    // Используем getLeaderboards() как раньше, но с защитой
                    this.leaderboard = await this.ysdk.getLeaderboards();
                } catch (e) {
                    console.warn('Leaderboard error (local dev?)', e);
                }
            } else {
                console.warn('Yandex SDK not found (local dev mode)');
            }
        } catch (e) {
            console.error('Yandex SDK init failed (offline?)', e);
            // Не блокируем игру, если SDK не загрузился
        }
    }

    public async saveData(data: YandexData) {
        if (!this.player) return;
        try {
            await this.player.setData(data);
            console.log('Data saved');
        } catch (e) {
            console.error('Save error', e);
        }
    }

    public async loadData(): Promise<YandexData | null> {
        if (!this.player) return null;
        try {
            const data = await this.player.getData();
            if (Object.keys(data).length === 0) return null;
            return data as YandexData;
        } catch (e) {
            console.error('Load error', e);
            return null;
        }
    }

    public gameReady() {
        if (this.ysdk && this.ysdk.features && this.ysdk.features.LoadingAPI) {
            this.ysdk.features.LoadingAPI.ready();
            console.log('Game Ready sent');
        } else {
            console.log('[DEV] Game Ready (mock)');
        }
    }

    public showFullscreenAdv(onClose: () => void) {
        if (!this.ysdk) {
            onClose();
            return;
        }
        this.ysdk.adv.showFullscreenAdv({
            callbacks: {
                onClose: (_wasShown: boolean) => {
                    onClose();
                },
                onError: (error: any) => {
                    console.error('Adv error', error);
                    onClose();
                }
            }
        });
    }

    public showRewardedVideo(onReward: () => void) {
        if (!this.ysdk) {
            console.log('[DEV] Mock Reward Video watched');
            onReward();
            return;
        }
        this.ysdk.adv.showRewardedVideo({
            callbacks: {
                onOpen: () => { },
                onRewarded: () => {
                    onReward();
                },
                onClose: () => { },
                onError: (e: any) => {
                    console.error('Reward video error', e);
                }
            }
        });
    }

    public async setLeaderboardScore(score: number) {
        if (!this.ysdk || !this.leaderboard) return;
        try {
            await this.leaderboard.setLeaderboardScore('maxWave', score);
        } catch (e) {
            console.error('Leaderboard set error', e);
        }
    }
}

export const yaSdk = new YandexSDK();