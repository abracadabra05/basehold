import { Ticker } from 'pixi.js';
import type { ResourceManager } from './ResourceManager';

export class WaveManager {
    private spawnCallback: (waveNum: number, count: number) => void;
    private onOpenShopCallback: () => void;
    private resourceManager: ResourceManager; 
    
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

    constructor(
        resourceManager: ResourceManager, 
        spawnCallback: (waveNum: number, count: number) => void,
        onOpenShopCallback: () => void
    ) {
        this.resourceManager = resourceManager;
        this.spawnCallback = spawnCallback;
        this.onOpenShopCallback = onOpenShopCallback;
        
        // Главный контейнер (Панель)
        this.container = document.createElement('div');
        this.container.style.position = 'absolute';
        this.container.style.top = '20px';
        this.container.style.right = '190px'; // Было 20px, сдвигаем левее миникарты (150px + отступы)
        this.container.style.padding = '12px 15px';
        this.container.style.background = 'rgba(20, 20, 20, 0.9)';
        this.container.style.border = '1px solid #444';
        this.container.style.borderRadius = '8px';
        this.container.style.color = 'white';
        this.container.style.fontFamily = "'Segoe UI', sans-serif";
        this.container.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';
        this.container.style.minWidth = '160px';
        this.container.style.textAlign = 'center';
        document.body.appendChild(this.container);

        // Текст таймера
        this.timerText = document.createElement('div');
        this.timerText.style.fontSize = '18px';
        this.timerText.style.fontWeight = 'bold';
        this.timerText.style.marginBottom = '8px';
        this.container.appendChild(this.timerText);

        // Кнопка пропуска
        this.skipButton = document.createElement('button');
        this.skipButton.innerText = "Start Now (+Bonus)";
        this.skipButton.style.width = '100%';
        this.skipButton.style.padding = '8px';
        this.skipButton.style.fontSize = '13px';
        this.skipButton.style.cursor = 'pointer';
        this.skipButton.style.backgroundColor = '#27ae60';
        this.skipButton.style.color = 'white';
        this.skipButton.style.border = 'none';
        this.skipButton.style.borderRadius = '4px';
        this.skipButton.style.transition = 'background 0.2s';
        
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

    public update(ticker: Ticker) {
        if (this.isPaused) {
            this.skipButton.style.display = 'none';
            this.timerText.innerText = "SHOPPING...";
            this.timerText.style.color = '#f1c40f';
            return;
        }

        const dt = ticker.deltaMS; 

        if (this.isPrepPhase) {
            this.skipButton.style.display = 'block';
            this.prepTime -= dt;
            const timeLeft = Math.ceil(this.prepTime / 1000);
            this.timerText.innerText = `🛡️ Prep: ${Math.max(0, timeLeft)}s`;
            this.timerText.style.color = '#3498db';

            if (this.prepTime <= 0) {
                this.isPrepPhase = false;
                this.startWave();
            }
            return;
        }

        this.waveTimer += dt;
        const timeLeft = Math.ceil((this.timeBetweenWaves - this.waveTimer) / 1000);
        this.timerText.innerText = `💀 Wave ${this.waveCount}: ${Math.max(0, timeLeft)}s`;
        this.timerText.style.color = '#e74c3c';
        
        this.skipButton.style.display = 'block';

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