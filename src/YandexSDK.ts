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
    private player: any = null;
    private leaderboard: any = null;
    public isReady: boolean = false;

    constructor() {
        this.init();
    }

    private async init() {
        try {
            // @ts-ignore
            if (window.YaGames) {
                // @ts-ignore
                this.ysdk = await window.YaGames.init();
                this.isReady = true;
                console.log('Yandex SDK initialized');
                
                // Авторизация для сохранений
                try {
                    this.player = await this.ysdk.getPlayer();
                } catch (e) {
                    console.warn('Player not authorized', e);
                    // Можно вызвать this.ysdk.auth.openAuthDialog(), но лучше по кнопке
                }

                // Инициализация лидерборда
                try {
                    this.leaderboard = await this.ysdk.getLeaderboards();
                } catch (e) {
                    console.warn('Leaderboard error', e);
                }
            } else {
                console.warn('Yandex SDK not found (local dev mode)');
            }
        } catch (e) {
            console.error('Yandex SDK init failed', e);
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
            // В дев-режиме сразу даем награду для теста
            console.log('[DEV] Mock Reward Video watched');
            onReward();
            return;
        }
        this.ysdk.adv.showRewardedVideo({
            callbacks: {
                onOpen: () => {
                    // Можно поставить игру на паузу
                },
                onRewarded: () => {
                    onReward();
                },
                onClose: () => {
                    // Снять с паузы
                },
                onError: (e: any) => {
                    console.error('Reward video error', e);
                }
            }
        });
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

    public async setLeaderboardScore(score: number) {
        if (!this.ysdk || !this.leaderboard) return;
        try {
            // 'maxWave' - название лидерборда в консоли Яндекса
            await this.leaderboard.setLeaderboardScore('maxWave', score);
        } catch (e) {
            console.error('Leaderboard set error', e);
        }
    }
}

export const yandex = new YandexSDK();
