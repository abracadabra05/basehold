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
    private player: any = null;

    // Техническое название лидерборда в консоли Yandex Games
    private readonly LEADERBOARD_NAME = 'maxWave';

    public isReady: boolean = false;
    public isYandexEnvironment: boolean = false;
    public lang: 'ru' | 'en' = 'en';

    public onPause?: () => void;
    public onResume?: () => void;

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

                // Подписываемся на события паузы/возобновления
                this.ysdk.on('game_api_pause', () => {
                    console.log('Yandex pause event received');
                    if (this.onPause) this.onPause();
                });

                this.ysdk.on('game_api_resume', () => {
                    console.log('Yandex resume event received');
                    if (this.onResume) this.onResume();
                });
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
            this.isYandexEnvironment = false; // Принудительно включаем локальный режим
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

    public gameplayStart() {
        if (this.isYandexEnvironment && this.ysdk?.features?.GameplayAPI) {
            this.ysdk.features.GameplayAPI.start();
            console.log('Gameplay Start sent to Yandex');
        } else {
            console.log('[DEV] Gameplay Start (mock)');
        }
    }

    public gameplayStop() {
        if (this.isYandexEnvironment && this.ysdk?.features?.GameplayAPI) {
            this.ysdk.features.GameplayAPI.stop();
            console.log('Gameplay Stop sent to Yandex');
        } else {
            console.log('[DEV] Gameplay Stop (mock)');
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

    public showRewardedVideo(onReward: () => void, onOpen?: () => void, onClose?: () => void) {
        if (!this.ysdk) {
            console.log('[DEV] Mock Reward Video watched');
            if (onOpen) onOpen();
            setTimeout(() => {
                onReward();
                if (onClose) onClose();
            }, 1000);
            return;
        }
        this.ysdk.adv.showRewardedVideo({
            callbacks: {
                onOpen: () => { if (onOpen) onOpen(); },
                onRewarded: () => {
                    onReward();
                },
                onClose: () => { if (onClose) onClose(); },
                onError: (e: any) => {
                    console.error('Reward video error', e);
                    if (onClose) onClose();
                }
            }
        });
    }

    public async getLeaderboardEntries(limit: number = 10): Promise<LeaderboardEntry[]> {
        if (this.isYandexEnvironment && this.ysdk?.leaderboards) {
            try {
                // Новый API: ysdk.leaderboards.getEntries()
                const result = await this.ysdk.leaderboards.getEntries(this.LEADERBOARD_NAME, {
                    quantityTop: limit,
                    includeUser: true,
                    quantityAround: 3
                });
                return result.entries.map((e: any) => ({
                    rank: e.rank,
                    score: e.score,
                    player: { name: e.player.publicName || 'Пользователь скрыт' }
                }));
            } catch (e) {
                console.warn('Failed to get Yandex leaderboard, falling back to local', e);
                // Fallback to local logic below
            }
        }

        // ЛОКАЛЬНЫЙ РЕЖИМ (или если лидерборд недоступен)
        console.log('[YandexSDK] Fetching local leaderboard. Environment:', this.isYandexEnvironment);
        const raw = localStorage.getItem('basehold_leaderboard');
        let entries = raw ? JSON.parse(raw) : [];

        console.log('[YandexSDK] Entries:', entries);

        entries.sort((a: any, b: any) => b.score - a.score);
        return entries.slice(0, limit).map((e: any, index: number) => ({
            rank: index + 1,
            score: e.score,
            player: { name: e.name || 'You' }
        }));
    }

    public async setLeaderboardScore(score: number) {
        if (this.isYandexEnvironment && this.ysdk?.leaderboards) {
            try {
                // Проверяем доступность метода для пользователя
                const canSet = await this.ysdk.isAvailableMethod('leaderboards.setScore');
                if (canSet) {
                    // Новый API: ysdk.leaderboards.setScore()
                    await this.ysdk.leaderboards.setScore(this.LEADERBOARD_NAME, score);
                    console.log(`[Yandex] Leaderboard score set: ${score}`);
                } else {
                    console.warn('Leaderboard setScore not available (user not authorized)');
                }
            } catch (e) {
                console.warn('Leaderboard set error (fallback to local)', e);
            }
        }

        // Всегда сохраняем локально как fallback для неавторизованных
        console.log(`[Local] Leaderboard score set: ${score}`);
        const raw = localStorage.getItem('basehold_leaderboard');
        let entries = raw ? JSON.parse(raw) : [];

        // Добавляем новый результат
        entries.push({ name: 'You', score: score });

        // Сортируем и режем
        entries.sort((a: any, b: any) => b.score - a.score);
        entries = entries.slice(0, 20);

        localStorage.setItem('basehold_leaderboard', JSON.stringify(entries));
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