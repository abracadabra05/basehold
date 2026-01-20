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

export interface LeaderboardEntry {
    rank: number;
    score: number;
    player: { name: string };
}

export class YandexSDK {
    private ysdk: any = null;
    private leaderboard: any = null;
    private player: any = null;
    
    public isReady: boolean = false;
    public isYandexEnvironment: boolean = false;
    public lang: 'ru' | 'en' = 'en';

    constructor() {}

    public async init(): Promise<void> {
        try {
            // @ts-ignore
            if (window.YaGames) {
                // @ts-ignore
                this.ysdk = await window.YaGames.init();
                this.isReady = true;
                this.isYandexEnvironment = true;
                
                const env = this.ysdk.environment;
                if (env && env.i18n && env.i18n.lang === 'ru') {
                    this.lang = 'ru';
                }
                console.log(`Yandex SDK initialized. Lang: ${this.lang}`);
                
                try {
                    this.player = await this.ysdk.getPlayer();
                } catch (e) {
                    console.warn('Player not authorized (guest mode)');
                }

                try {
                    this.leaderboard = await this.ysdk.getLeaderboards();
                } catch (e) {
                    console.warn('Leaderboard not available');
                }
            } else {
                console.log('[YandexSDK] Running in Local/Dev environment. Mocking SDK.');
                this.isYandexEnvironment = false;
                this.isReady = true;
                const userLang = navigator.language || (navigator as any).userLanguage;
                if (userLang.startsWith('ru')) this.lang = 'ru';
            }
        } catch (e) {
            console.error('Yandex SDK init failed', e);
            this.isReady = true;
            this.isYandexEnvironment = false;
        }
    }

    public gameReady() {
        if (this.isYandexEnvironment && this.ysdk?.features?.LoadingAPI) {
            this.ysdk.features.LoadingAPI.ready();
            console.log('Game Ready sent to Yandex');
        } else {
            console.log('[DEV] Game Ready (mock)');
        }
    }

    public showFullscreenAdv(onClose: () => void) {
        if (this.isYandexEnvironment && this.ysdk) {
            this.ysdk.adv.showFullscreenAdv({
                callbacks: {
                    onClose: (_wasShown: boolean) => onClose(),
                    onError: (error: any) => {
                        console.error('Adv error', error);
                        onClose();
                    }
                }
            });
        } else {
            console.log('[DEV] Mock Fullscreen Ad shown');
            onClose();
        }
    }

    public showRewardedVideo(onReward: () => void) {
        if (this.isYandexEnvironment && this.ysdk) {
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
        } else {
            console.log('[DEV] Mock Reward Video watched -> REWARD GRANTED');
            onReward();
        }
    }

    public async getLeaderboardEntries(limit: number = 10): Promise<LeaderboardEntry[]> {
        if (this.isYandexEnvironment && this.ysdk && this.leaderboard) {
            try {
                // Получаем топ игроков (maxWave)
                // Если таблица называется иначе, нужно поменять имя здесь
                const result = await this.leaderboard.getLeaderboardEntries('maxWave', { quantityTop: limit });
                return result.entries.map((e: any) => ({
                    rank: e.rank,
                    score: e.score,
                    player: { name: e.player.publicName || 'Anonymous' }
                }));
            } catch (e) {
                console.error('Failed to get Yandex leaderboard', e);
                return [];
            }
        } else {
            // ЛОКАЛЬНЫЙ РЕЖИМ
            const raw = localStorage.getItem('basehold_leaderboard');
            let entries = raw ? JSON.parse(raw) : [];
            
            // Если пусто, добавим фейковые данные для теста
            if (entries.length === 0) {
                entries = [
                    { name: 'Dev', score: 50 },
                    { name: 'Tester', score: 25 },
                    { name: 'Noob', score: 5 }
                ];
                localStorage.setItem('basehold_leaderboard', JSON.stringify(entries));
            }

            entries.sort((a: any, b: any) => b.score - a.score);
            return entries.slice(0, limit).map((e: any, index: number) => ({
                rank: index + 1,
                score: e.score,
                player: { name: e.name || 'You' }
            }));
        }
    }

    public async setLeaderboardScore(score: number) {
        if (this.isYandexEnvironment && this.ysdk && this.leaderboard) {
            try {
                await this.leaderboard.setLeaderboardScore('maxWave', score);
            } catch (e) {
                console.error('Leaderboard set error', e);
            }
        } else {
            console.log(`[DEV] Leaderboard score set: ${score}`);
            // Сохраняем локально
            const raw = localStorage.getItem('basehold_leaderboard');
            let entries = raw ? JSON.parse(raw) : [];
            
            // Добавляем новый результат
            entries.push({ name: 'You', score: score });
            
            // Сортируем и режем
            entries.sort((a: any, b: any) => b.score - a.score);
            entries = entries.slice(0, 20);
            
            localStorage.setItem('basehold_leaderboard', JSON.stringify(entries));
        }
    }

    public async saveData(data: YandexData) {
        if (this.isYandexEnvironment && this.player) {
            try {
                await this.player.setData(data);
            } catch (e) {
                console.error('Save error', e);
            }
        } else {
            localStorage.setItem('basehold_save', JSON.stringify(data));
        }
    }

    public async loadData(): Promise<YandexData | null> {
        if (this.isYandexEnvironment && this.player) {
            try {
                const data = await this.player.getData();
                if (Object.keys(data).length === 0) return null;
                return data as YandexData;
            } catch (e) {
                console.error('Load error', e);
                return null;
            }
        } else {
            const raw = localStorage.getItem('basehold_save');
            return raw ? JSON.parse(raw) : null;
        }
    }
}

export const yaSdk = new YandexSDK();