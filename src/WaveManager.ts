import { Ticker } from 'pixi.js';
import type { ResourceManager } from './ResourceManager';
import type { UIManager } from './UIManager';
import { Translations } from './Localization';

export class WaveManager {
    private spawnCallback: (waveNum: number, count: number) => void;
    private onOpenShopCallback: () => void;
    private resourceManager: ResourceManager; 
    private uiManager: UIManager; // Добавлено
    
    private waveTimer: number = 0;
    private timeBetweenWaves: number = 10000; 
    private prepTime: number = 30000;         
    
    public waveCount: number = 1;
    
    // UI
    private container: HTMLDivElement;
    private timerText: HTMLDivElement;
    private skipButton: HTMLButtonElement; 
    
    private isPaused: boolean = false;
    private isPrepPhase: boolean = true;
    public isBossActive: boolean = false; 

    constructor(
        resourceManager: ResourceManager, 
        uiManager: UIManager, // Добавлен аргумент
        spawnCallback: (waveNum: number, count: number) => void,
        onOpenShopCallback: () => void
    ) {
        this.resourceManager = resourceManager;
        this.uiManager = uiManager; // Сохранили
        this.spawnCallback = spawnCallback;
        this.onOpenShopCallback = onOpenShopCallback;
        
        // Главный контейнер (Панель)
        this.container = document.createElement('div');
        Object.assign(this.container.style, {
            position: 'absolute', top: '60px', left: '50%', transform: 'translateX(-50%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            pointerEvents: 'none', zIndex: '1000'
        });
        document.body.appendChild(this.container);

        // Текст таймера
        this.timerText = document.createElement('div');
        Object.assign(this.timerText.style, {
            fontSize: '24px', fontWeight: '900', color: 'white',
            textShadow: '0 2px 4px rgba(0,0,0,0.8)', letterSpacing: '2px',
            fontFamily: "'Segoe UI', sans-serif"
        });
        this.container.appendChild(this.timerText);

        // Кнопка пропуска (делаем ее маленькой и аккуратной под таймером)
        this.skipButton = document.createElement('button');
        this.skipButton.innerText = "SKIP >>";
        Object.assign(this.skipButton.style, {
            marginTop: '5px', padding: '4px 12px', fontSize: '12px', cursor: 'pointer',
            backgroundColor: 'rgba(39, 174, 96, 0.8)', color: 'white', border: '1px solid #2ecc71',
            borderRadius: '12px', transition: 'all 0.2s', pointerEvents: 'auto',
            backdropFilter: 'blur(4px)', textTransform: 'uppercase', fontWeight: 'bold'
        });
        
        this.skipButton.onmouseenter = () => this.skipButton.style.backgroundColor = '#2ecc71';
        this.skipButton.onmouseleave = () => this.skipButton.style.backgroundColor = '#27ae60';
        this.skipButton.onclick = () => this.skipWait();
        
        this.container.appendChild(this.skipButton);
    }

    public get isShopOpen(): boolean { return this.isPaused; }

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
            const bonus = timeLeftSeconds * 2;
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

    private t(key: string): string {
        const lang = this.uiManager.currentLang;
        return (Translations[lang] as any)[key] || key;
    }

    public update(ticker: Ticker) {
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

        if (this.isPrepPhase) {
            this.skipButton.style.display = 'block';
            this.prepTime -= dt;
            const timeLeft = Math.ceil(this.prepTime / 1000);
            this.timerText.innerHTML = `<span style="color: #3498db; font-size: 14px;">${this.t('wave_prep')}</span><br>${Math.max(0, timeLeft)}`;

            if (this.prepTime <= 0) {
                this.isPrepPhase = false;
                this.startWave();
            }
            return;
        }

        this.waveTimer += dt;
        const timeLeft = Math.ceil((this.timeBetweenWaves - this.waveTimer) / 1000);
        
        this.timerText.innerHTML = `<span style="color: #e74c3c; font-size: 14px;">${this.t('wave_active')}</span> ${this.waveCount}`;
        
        this.skipButton.style.display = 'none'; // Во время волны скипать нечего

        if (this.waveTimer >= this.timeBetweenWaves) {
            if (this.waveCount > 1 && (this.waveCount - 1) % 5 === 0) {
                this.isPaused = true;
                this.waveTimer = 0; 
                this.onOpenShopCallback();
            } else {
                this.startWave();
            }
        }
    }

    private startWave() {
        this.waveTimer = 0;
        const nextBreak = 10000 + (this.waveCount * 1000);
        this.timeBetweenWaves = Math.min(nextBreak, 30000);

        const enemiesToSpawn = 3 + Math.floor(this.waveCount * 1.5);
        this.spawnCallback(this.waveCount, enemiesToSpawn);
        this.waveCount++;
    }
}