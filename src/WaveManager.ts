import { Ticker } from 'pixi.js';
import type { ResourceManager } from './ResourceManager';
import type { UIManager } from './UIManager';
import { Translations } from './Localization';
import { Z_INDEX } from './UIConstants';
import { calculateEnemyCount, calculateSkipBonus, shouldOpenShop } from './logic/WaveLogic';

export class WaveManager {
    private spawnCallback: (waveNum: number, count: number) => void;
    private onOpenShopCallback: () => void;
    private resourceManager: ResourceManager;
    private uiManager: UIManager;

    private waveTimer: number = 0;
    private timeBetweenWaves: number = 10000;
    private prepTime: number = 30000;

    public waveCount: number = 1;

    // UI
    private container: HTMLDivElement;
    private timerText: HTMLDivElement;
    private skipButton: HTMLButtonElement;

    private isPaused: boolean = false;
    public isPrepPhase: boolean = true;
    public isBossActive: boolean = false;
    private isActive: boolean = false; // Блокирует обновления до старта игры

    private isMobile: boolean = false;

    constructor(
        resourceManager: ResourceManager,
        uiManager: UIManager,
        spawnCallback: (waveNum: number, count: number) => void,
        onOpenShopCallback: () => void
    ) {
        this.resourceManager = resourceManager;
        this.uiManager = uiManager;
        this.spawnCallback = spawnCallback;
        this.onOpenShopCallback = onOpenShopCallback;

        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || ('ontouchstart' in window);

        // Main container
        this.container = document.createElement('div');
        Object.assign(this.container.style, {
            position: 'absolute',
            top: this.uiManager.isMobileDevice ? '25px' : '55px', // Will be overridden by UIManager but good default
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            pointerEvents: 'none',
            zIndex: `${Z_INDEX.WAVE_PANEL}`
        });
        document.body.appendChild(this.container);

        // Timer text - compact size
        this.timerText = document.createElement('div');
        Object.assign(this.timerText.style, {
            fontSize: this.isMobile ? '12px' : '14px',
            fontWeight: '700',
            color: 'white',
            textShadow: '0 1px 4px rgba(0,0,0,0.8)',
            letterSpacing: '0.5px',
            fontFamily: "'Segoe UI', sans-serif",
            textAlign: 'center'
        });
        this.container.appendChild(this.timerText);

        // Skip button - verify subtle
        this.skipButton = document.createElement('button');
        this.skipButton.innerText = this.isMobile ? "SKIP >>" : "SKIP NEXT WAVE >>";
        Object.assign(this.skipButton.style, {
            marginTop: '2px',
            padding: this.isMobile ? '2px 8px' : '6px 12px',
            minHeight: this.isMobile ? '20px' : '32px',
            fontSize: this.isMobile ? '9px' : '10px',
            cursor: 'pointer',
            backgroundColor: 'rgba(0, 0, 0, 0.2)', // Very transparent dark
            color: 'rgba(255, 255, 255, 0.8)', // Visible text
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '12px',
            transition: 'all 0.2s',
            pointerEvents: 'auto',
            backdropFilter: 'blur(2px)',
            textTransform: 'uppercase',
            fontWeight: 'bold',
            touchAction: 'manipulation'
        });

        this.skipButton.onpointerdown = () => this.skipButton.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        this.skipButton.onpointerup = () => this.skipButton.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
        this.skipButton.onclick = (e) => { e.preventDefault(); this.skipWait(); };
        this.skipButton.ontouchstart = (e) => { e.preventDefault(); this.skipWait(); };

        this.container.appendChild(this.skipButton);
    }

    public get isShopOpen(): boolean { return this.isPaused; }

    public setActive(active: boolean) {
        this.isActive = active;
    }

    public resume() {
        this.isPaused = false;
        this.startWave();
    }

    public skipWait() {
        if (this.isPaused) return;

        let timeLeftSeconds = 0;

        if (this.isPrepPhase) {
            timeLeftSeconds = Math.ceil(this.prepTime / 1000);
            this.prepTime = 0;
        } else {
            const remaining = this.timeBetweenWaves - this.waveTimer;
            if (remaining > 0) {
                timeLeftSeconds = Math.ceil(remaining / 1000);
                this.waveTimer = this.timeBetweenWaves;
            }
        }

        if (timeLeftSeconds > 0) {
            const bonus = calculateSkipBonus(timeLeftSeconds);
            this.resourceManager.addBiomass(bonus);

            const originalText = this.skipButton.innerText;
            // const originalBg = this.skipButton.style.backgroundColor;

            this.skipButton.innerText = `+${bonus} 🧬`;
            this.skipButton.style.backgroundColor = '#8e44ad';

            setTimeout(() => {
                this.skipButton.innerText = originalText;
                this.skipButton.style.backgroundColor = '#27ae60';
            }, 1000);
        }
    }

    public setLanguage() {
        // Принудительно обновляем текст таймера
        // Просто вызовем update с delta=0, чтобы перерисовать текст
        // Но update меняет логику времени.
        // Лучше просто обновить текст вручную.

        if (this.isPaused) {
            this.timerText.innerHTML = `<span style="color: #f1c40f">${this.t('wave_shop')}</span>`;
        } else if (this.isBossActive) {
            this.timerText.innerHTML = `<span style="color: #e74c3c">${this.t('wave_boss')}</span>`;
        } else if (this.isPrepPhase) {
            const timeLeft = Math.ceil(this.prepTime / 1000);
            this.timerText.innerHTML = `
                <div style="color: #3498db; font-size: 11px; margin-bottom: -2px;">${this.t('wave_prep')}</div>
                <div style="font-size: 20px; font-weight: 900;">${Math.max(0, timeLeft)}</div>
            `;
            const bonus = calculateSkipBonus(timeLeft);
            this.skipButton.innerText = `${this.t('wave_skip')} (+${bonus} 🧬)`;
        } else {
            this.timerText.innerHTML = `<span style="color: #e74c3c; font-size: 11px;">${this.t('wave_active')}</span> <span style="font-size: 16px; font-weight: 900;">${this.waveCount}</span>`;
        }
    }

    private t(key: string): string {
        const lang = this.uiManager.currentLang;
        return (Translations[lang] as any)[key] || key;
    }

    public reset() {
        this.waveCount = 1;
        this.waveTimer = 0;
        this.isPaused = false;
        this.isBossActive = false;
        this.isPrepPhase = true;
        this.prepTime = 30000;
        this.timeBetweenWaves = 10000;
        this.update(new Ticker()); // Обновляем UI сразу
    }

    public update(ticker: Ticker) {
        // Полностью блокируем обновления если игра не активна
        if (!this.isActive) {
            this.skipButton.style.display = 'none';
            return;
        }

        if (this.isPaused) {
            this.skipButton.style.display = 'none';
            this.timerText.innerHTML = `<span style="color: #f1c40f">${this.t('wave_shop')}</span>`;
            return;
        }

        if (this.isBossActive) {
            this.skipButton.style.display = 'none';
            this.timerText.innerHTML = `<span style="color: #e74c3c">${this.t('wave_boss')}</span>`;
            return;
        }

        const dt = ticker.deltaMS;

        // ФАЗА ПОДГОТОВКИ (МЕЖДУ ВОЛНАМИ)
        if (this.isPrepPhase) {
            this.skipButton.style.display = 'block';
            this.prepTime -= dt;
            const timeLeft = Math.ceil(this.prepTime / 1000);

            this.timerText.innerHTML = `
                <div style="color: #3498db; font-size: 11px; margin-bottom: -2px;">${this.t('wave_prep')}</div>
                <div style="font-size: 20px; font-weight: 900;">${Math.max(0, timeLeft)}</div>
            `;

            const bonus = calculateSkipBonus(timeLeft);
            this.skipButton.innerText = `${this.t('wave_skip')} (+${bonus} 🧬)`;

            if (this.prepTime <= 0) {
                this.startWave();
            }
            return;
        }

        // ФАЗА ВОЛНЫ (БОЙ)
        this.waveTimer += dt;

        this.timerText.innerHTML = `<span style="color: #e74c3c; font-size: 11px;">${this.t('wave_active')}</span> <span style="font-size: 16px; font-weight: 900;">${this.waveCount}</span>`;
        this.skipButton.style.display = 'none';

        // 5 секунд после спавна волны переходим в ожидание следующей
        if (this.waveTimer > 5000) {
            this.isPrepPhase = true;
            // Увеличиваем сложность времени
            const nextBreak = 20000; // 20 сек передышка
            this.prepTime = nextBreak;
            this.waveTimer = 0;
        }
    }

    private startWave() {
        this.isPrepPhase = false;
        this.waveTimer = 0;
        this.timeBetweenWaves = 5000;

        const enemiesToSpawn = calculateEnemyCount(this.waveCount);
        this.spawnCallback(this.waveCount, enemiesToSpawn);

        if (this.waveCount > 1 && shouldOpenShop(this.waveCount)) {
            this.isPaused = true;
            this.onOpenShopCallback();
        }

        this.waveCount++;
    }

    public resetWave() {
        this.waveCount = Math.max(1, this.waveCount - 1); // Откатываем на 1 назад
        this.isPrepPhase = true;
        this.prepTime = 10000; // Даем 10 сек на подготовку перед рестартом
        this.timerText.innerHTML = `
            <div style="color: #3498db; font-size: 11px; margin-bottom: -2px;">${this.t('wave_prep')}</div>
            <div style="font-size: 20px; font-weight: 900;">10</div>
        `;
        this.skipButton.style.display = 'block';
    }
}