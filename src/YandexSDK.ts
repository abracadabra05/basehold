import { SAVE_VERSION, saveMigrationService, type YandexDataV3 } from './save/SaveMigrationService';

export type YandexData = YandexDataV3;

export interface LeaderboardEntry {
    rank: number;
    score: number;
    player: { name: string };
    isCurrentUser?: boolean;
}

export class YandexSDK {
    private ysdk: any = null;
    private player: any = null;
    private payments: any = null;

    // v3 leaderboard season: use new IDs to start from clean boards
    private readonly LEADERBOARD_SEASON = 'v3s1';
    private readonly LEADERBOARD_WAVES = 'maxwavev3';
    private readonly LEADERBOARD_SCORE = 'maxscorev3';
    private readonly LEADERBOARD_ALIASES: Record<'waves' | 'score', string[]> = {
        waves: [this.LEADERBOARD_WAVES],
        score: [this.LEADERBOARD_SCORE]
    };

    public isReady: boolean = false;
    public isYandexEnvironment: boolean = false;
    public lang: 'ru' | 'en' = 'en';

    public onPause?: () => void;
    public onResume?: () => void;
    private leaderboardQueue: Promise<void> = Promise.resolve();
    private lastLeaderboardSubmitAt: number = 0;
    private readonly LEADERBOARD_SUBMIT_COOLDOWN_MS = 1100;

    constructor() { }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private async waitLeaderboardCooldown(): Promise<void> {
        const now = Date.now();
        const elapsed = now - this.lastLeaderboardSubmitAt;
        const waitMs = this.LEADERBOARD_SUBMIT_COOLDOWN_MS - elapsed;
        if (waitMs > 0) {
            await this.sleep(waitMs);
        }
    }

    private isRateLimitError(e: any): boolean {
        const message = typeof e === 'string' ? e : (e?.message || String(e));
        return message.includes('no more than once per second');
    }

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
                await this.initSafeStorage();

                try {
                    this.player = await this.ysdk.getPlayer();
                } catch (e) {
                    console.warn('Player not authorized (guest mode)');
                }
                void this.initPayments();

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

    private async initSafeStorage(): Promise<void> {
        if (!this.isYandexEnvironment || !this.ysdk?.getStorage) return;
        try {
            const safeStorage = await this.ysdk.getStorage();
            // Avoid overriding if already replaced.
            const current = Object.getOwnPropertyDescriptor(window, 'localStorage');
            if (!current || current.get?.name !== 'get') {
                Object.defineProperty(window, 'localStorage', {
                    configurable: true,
                    get: () => safeStorage,
                });
            }
        } catch (e) {
            console.warn('safeStorage init failed', e);
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

    public showFullscreenAdv(onClose: () => void, onOpen?: () => void) {
        if (this.isYandexEnvironment && this.ysdk) {
            this.ysdk.adv.showFullscreenAdv({
                callbacks: {
                    onOpen: () => {
                        console.log('[Yandex] Fullscreen ad opened');
                        if (onOpen) onOpen();
                    },
                    onClose: (wasShown: boolean) => {
                        console.log(`[Yandex] Fullscreen ad closed. Was shown: ${wasShown}`);
                        onClose();
                    },
                    onError: (error: any) => {
                        console.error('Adv error', error);
                        onClose();
                    }
                }
            });
        } else {
            console.log('[DEV] Mock Fullscreen Ad shown');
            if (onOpen) onOpen();
            setTimeout(() => onClose(), 500);
        }
    }

    // Sticky Banner methods
    public async getBannerAdvStatus(): Promise<{ stickyAdvIsShowing: boolean; reason?: string }> {
        if (this.isYandexEnvironment && this.ysdk?.adv) {
            try {
                return await this.ysdk.adv.getBannerAdvStatus();
            } catch (e) {
                console.warn('getBannerAdvStatus error', e);
                return { stickyAdvIsShowing: false, reason: 'UNKNOWN' };
            }
        }
        return { stickyAdvIsShowing: false, reason: 'ADV_IS_NOT_CONNECTED' };
    }

    public async showBannerAdv(): Promise<void> {
        if (this.isYandexEnvironment && this.ysdk?.adv) {
            try {
                const status = await this.ysdk.adv.showBannerAdv();
                console.log('[Yandex] Banner shown:', status);
            } catch (e) {
                console.warn('showBannerAdv error', e);
            }
        } else {
            console.log('[DEV] Mock Banner Ad shown');
        }
    }

    public async hideBannerAdv(): Promise<void> {
        if (this.isYandexEnvironment && this.ysdk?.adv) {
            try {
                await this.ysdk.adv.hideBannerAdv();
                console.log('[Yandex] Banner hidden');
            } catch (e) {
                console.warn('hideBannerAdv error', e);
            }
        } else {
            console.log('[DEV] Mock Banner Ad hidden');
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

    public isAuthorized(): boolean {
        return !!this.player?.isAuthorized?.();
    }

    public async openAuthDialog(): Promise<boolean> {
        if (!this.isYandexEnvironment || !this.ysdk?.auth?.openAuthDialog) return false;
        try {
            await this.ysdk.auth.openAuthDialog();
            this.player = await this.ysdk.getPlayer();
            return true;
        } catch {
            return false;
        }
    }

    private async initPayments(): Promise<void> {
        if (!this.isYandexEnvironment || !this.ysdk?.getPayments) return;
        if (this.payments) return;
        try {
            this.payments = await this.ysdk.getPayments();
        } catch (e) {
            console.warn('Payments init error', e);
        }
    }

    public async getCatalog(): Promise<Array<{ id: string; title?: string; description?: string; price?: string }>> {
        if (!this.isYandexEnvironment) return [];
        await this.initPayments();
        if (!this.payments?.getCatalog) return [];
        try {
            const result = await this.payments.getCatalog();
            if (Array.isArray(result)) return result;
            if (Array.isArray(result?.products)) return result.products;
            return [];
        } catch (e) {
            console.warn('getCatalog failed', e);
            return [];
        }
    }

    public async purchaseProduct(productId: string): Promise<{ success: boolean; purchaseToken?: string }> {
        if (!this.isAuthorized()) {
            console.warn('Purchase blocked: user is not authorized');
            return { success: false };
        }
        if (!this.isYandexEnvironment) {
            console.log(`[DEV] Mock purchase success: ${productId}`);
            return { success: true, purchaseToken: `mock-${productId}` };
        }
        await this.initPayments();
        if (!this.payments?.purchase) return { success: false };
        try {
            const purchase = await this.payments.purchase({ id: productId });
            const token = purchase?.purchaseToken || purchase?.token || purchase?.id;
            return { success: true, purchaseToken: token };
        } catch (e) {
            console.warn('Purchase failed', e);
            return { success: false };
        }
    }

    public async consumePurchase(purchaseToken: string): Promise<void> {
        if (!this.isYandexEnvironment) return;
        await this.initPayments();
        if (!this.payments?.consumePurchase) return;
        try {
            await this.payments.consumePurchase(purchaseToken);
        } catch (e) {
            console.warn('Consume purchase failed', e);
        }
    }

    public async processPendingPurchases(
        onPurchase: (productId: string) => Promise<void> | void
    ): Promise<number> {
        if (!this.isYandexEnvironment) return 0;
        await this.initPayments();
        if (!this.payments?.getPurchases) return 0;
        try {
            const result = await this.payments.getPurchases();
            const purchases = Array.isArray(result) ? result : (Array.isArray(result?.purchases) ? result.purchases : []);
            let processed = 0;
            for (const p of purchases) {
                const productId = p?.productID || p?.productId || p?.id;
                const token = p?.purchaseToken || p?.token;
                if (!productId || !token) continue;
                try {
                    await onPurchase(productId);
                    await this.consumePurchase(token);
                    processed++;
                } catch (e) {
                    console.warn('Pending purchase process failed', e);
                }
            }
            return processed;
        } catch (e) {
            console.warn('getPurchases failed', e);
            return 0;
        }
    }

    public async getLeaderboardEntries(boardName: 'waves' | 'score' = 'waves', limit: number = 5): Promise<LeaderboardEntry[]> {
        const localKey = boardName === 'score'
            ? `basehold_leaderboard_score_${this.LEADERBOARD_SEASON}`
            : `basehold_leaderboard_${this.LEADERBOARD_SEASON}`;
        const aliases = this.LEADERBOARD_ALIASES[boardName];

        if (this.isYandexEnvironment && this.ysdk?.leaderboards) {
            for (const leaderboardKey of aliases) {
                try {
                    const result = await this.ysdk.leaderboards.getEntries(leaderboardKey, {
                        quantityTop: limit,
                        includeUser: true,
                        quantityAround: 0
                    });

                    const currentPlayerId = this.player?.getUniqueID?.() || null;

                    const topEntries: LeaderboardEntry[] = [];
                    let userEntry: LeaderboardEntry | null = null;

                    for (const e of result.entries) {
                        const isUser = currentPlayerId && e.player?.uniqueID === currentPlayerId;
                        const entry: LeaderboardEntry = {
                            rank: e.rank,
                            score: e.score,
                            player: { name: e.player.publicName || 'Пользователь скрыт' },
                            isCurrentUser: !!isUser
                        };

                        if (e.rank <= limit) {
                            topEntries.push(entry);
                            if (isUser) userEntry = entry;
                        } else if (isUser && !userEntry) {
                            userEntry = entry;
                        }
                    }

                    if (userEntry && !topEntries.find(e => e.isCurrentUser)) {
                        topEntries.push(userEntry);
                    }

                    return topEntries;
                } catch (e) {
                    console.warn(`[Yandex] Failed to get leaderboard "${leaderboardKey}"`, e);
                }
            }
        }

        // LOCAL/DEV MODE
        try {
            const raw = localStorage.getItem(localKey);
            let entries = raw ? JSON.parse(raw) : [];
            entries.sort((a: any, b: any) => b.score - a.score);

            const top: LeaderboardEntry[] = entries.slice(0, limit).map((e: any, index: number) => ({
                rank: index + 1,
                score: e.score,
                player: { name: e.name || 'You' },
                isCurrentUser: (e.name || 'You') === 'You'
            }));

            const userInTop = top.find(e => e.isCurrentUser);
            if (!userInTop) {
                const userIndex = entries.findIndex((e: any) => (e.name || 'You') === 'You');
                if (userIndex >= limit) {
                    top.push({
                        rank: userIndex + 1,
                        score: entries[userIndex].score,
                        player: { name: 'You' },
                        isCurrentUser: true
                    });
                }
            }

            return top;
        } catch (e) {
            console.warn('Local leaderboard fallback failed', e);
            return [];
        }


    }

    public async setLeaderboardScore(score: number, boardName: 'waves' | 'score' = 'waves'): Promise<boolean> {
        const run = async (): Promise<boolean> => {
            const localKey = boardName === 'score'
                ? `basehold_leaderboard_score_${this.LEADERBOARD_SEASON}`
                : `basehold_leaderboard_${this.LEADERBOARD_SEASON}`;
            const aliases = this.LEADERBOARD_ALIASES[boardName];
            const normalizedScore = Math.max(0, Math.floor(score));
            let yandexSaved = false;

            if (this.isYandexEnvironment && this.ysdk?.leaderboards) {
                try {
                    const canSet = await this.ysdk.isAvailableMethod('leaderboards.setScore');
                    if (canSet) {
                        await this.waitLeaderboardCooldown();

                        for (const leaderboardKey of aliases) {
                            try {
                                await this.ysdk.leaderboards.setScore(leaderboardKey, normalizedScore);
                                this.lastLeaderboardSubmitAt = Date.now();
                                console.log(`[Yandex] ${boardName} leaderboard score set (${leaderboardKey}): ${normalizedScore}`);
                                yandexSaved = true;
                                break;
                            } catch (e) {
                                if (this.isRateLimitError(e)) {
                                    await this.sleep(this.LEADERBOARD_SUBMIT_COOLDOWN_MS);
                                    try {
                                        await this.ysdk.leaderboards.setScore(leaderboardKey, normalizedScore);
                                        this.lastLeaderboardSubmitAt = Date.now();
                                        console.log(`[Yandex] ${boardName} leaderboard score set (${leaderboardKey}) after retry: ${normalizedScore}`);
                                        yandexSaved = true;
                                        break;
                                    } catch (retryError) {
                                        console.warn(`[Yandex] Failed to set leaderboard "${leaderboardKey}" after retry`, retryError);
                                        break;
                                    }
                                } else {
                                    console.warn(`[Yandex] Failed to set leaderboard "${leaderboardKey}"`, e);
                                }
                            }
                        }
                    } else {
                        console.warn('Leaderboard setScore not available (user not authorized)');
                    }
                } catch (e) {
                    console.warn('Leaderboard set error (fallback to local)', e);
                }
            }

            // Локальный fallback
            try {
                const raw = localStorage.getItem(localKey);
                let entries = raw ? JSON.parse(raw) : [];
                entries.push({ name: 'You', score: normalizedScore });
                entries.sort((a: any, b: any) => b.score - a.score);
                entries = entries.slice(0, 20);
                localStorage.setItem(localKey, JSON.stringify(entries));
            } catch (e) {
                console.warn('Local leaderboard save failed', e);
            }

            return yandexSaved;
        };

        const task = this.leaderboardQueue.then(run, run);
        this.leaderboardQueue = task.then(() => undefined, () => undefined);
        return task;
    }

    public async saveData(data: YandexData, flush: boolean = false) {
        const normalized: YandexData = {
            ...saveMigrationService.toCurrent(data),
            saveVersion: SAVE_VERSION,
            meta: {
                createdAt: data.meta?.createdAt ?? Date.now(),
                updatedAt: Date.now(),
                build: SAVE_VERSION,
            },
        };
        if (this.isYandexEnvironment && this.player) {
            try {
                await this.player.setData(normalized, flush);
            } catch (e) {
                console.error('Save error', e);
            }
        } else {
            try {
                localStorage.setItem('basehold_save', JSON.stringify(normalized));
            } catch (e) {
                console.warn('Local save failed', e);
            }
        }
    }

    public async saveStats(stats: { maxWave?: number; maxScore?: number }): Promise<void> {
        if (!this.isYandexEnvironment || !this.player?.setStats) return;
        const payload: Record<string, number> = {};
        if (typeof stats.maxWave === 'number') payload.maxWave = Math.max(0, Math.floor(stats.maxWave));
        if (typeof stats.maxScore === 'number') payload.maxScore = Math.max(0, Math.floor(stats.maxScore));
        if (Object.keys(payload).length === 0) return;
        try {
            await this.player.setStats(payload);
        } catch (e) {
            console.warn('saveStats failed', e);
        }
    }

    public async loadData(): Promise<YandexData | null> {
        if (this.isYandexEnvironment && this.player) {
            try {
                const data = await this.player.getData();
                if (Object.keys(data).length === 0) return null;
                return saveMigrationService.toCurrent(data);
            } catch (e) {
                console.error('Load error', e);
                return null;
            }
        } else {
            try {
                const raw = localStorage.getItem('basehold_save');
                if (!raw) return null;
                return saveMigrationService.toCurrent(JSON.parse(raw));
            } catch (e) {
                console.warn('Local load failed', e);
                return null;
            }
        }
    }
}

export const yaSdk = new YandexSDK();
