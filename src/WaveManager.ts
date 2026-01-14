import { Ticker } from 'pixi.js';

export class WaveManager {
    private spawnCallback: (waveNum: number, count: number) => void;
    private onOpenShopCallback: () => void;
    
    // ВРЕМЯ В МИЛЛИСЕКУНДАХ (ms)
    private waveTimer: number = 0;
    private timeBetweenWaves: number = 10000; // 10 секунд
    private prepTime: number = 30000;         // 30 секунд
    
    public waveCount: number = 1;
    private uiElement: HTMLElement;
    
    private isPaused: boolean = false;
    private isPrepPhase: boolean = true;

    constructor(
        spawnCallback: (waveNum: number, count: number) => void,
        onOpenShopCallback: () => void
    ) {
        this.spawnCallback = spawnCallback;
        this.onOpenShopCallback = onOpenShopCallback;
        
        this.uiElement = document.createElement('div');
        this.uiElement.style.position = 'absolute';
        this.uiElement.style.top = '20px';
        this.uiElement.style.right = '20px';
        this.uiElement.style.color = 'red';
        this.uiElement.style.fontFamily = 'Arial, sans-serif';
        this.uiElement.style.fontSize = '24px';
        this.uiElement.style.fontWeight = 'bold';
        this.uiElement.style.textShadow = '2px 2px 0 #000';
        document.body.appendChild(this.uiElement);
    }

    public get isShopOpen(): boolean { return this.isPaused; }

    public resume() {
        this.isPaused = false;
        this.startWave();
    }

    public update(ticker: Ticker) {
        if (this.isPaused) return;

        // Используем deltaMS (прошедшее время в миллисекундах)
        const dt = ticker.deltaMS; 

        // Фаза подготовки
        if (this.isPrepPhase) {
            this.prepTime -= dt;
            
            // Делим на 1000, чтобы получить секунды
            const timeLeft = Math.ceil(this.prepTime / 1000);
            this.uiElement.innerText = `🛡️ Prep Time: ${Math.max(0, timeLeft)}s`;
            this.uiElement.style.color = '#3498db';

            if (this.prepTime <= 0) {
                this.isPrepPhase = false;
                this.startWave();
            }
            return;
        }

        // Фаза волны
        this.waveTimer += dt;
        const timeLeft = Math.ceil((this.timeBetweenWaves - this.waveTimer) / 1000);
        this.uiElement.innerText = `💀 Wave ${this.waveCount} in: ${Math.max(0, timeLeft)}s`;
        this.uiElement.style.color = 'red';

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
        const enemiesToSpawn = 3 + Math.floor(this.waveCount * 1.5);
        console.log(`Wave ${this.waveCount} started!`);
        this.spawnCallback(this.waveCount, enemiesToSpawn);
        this.waveCount++;
    }
}