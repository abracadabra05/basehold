import { Ticker } from 'pixi.js';

export class WaveManager {
    private spawnCallback: (count: number) => void;
    private waveTimer: number = 0;
    private timeBetweenWaves: number = 600; // 600 тиков = ~10 секунд (при 60 FPS)
    private waveCount: number = 1;
    private uiElement: HTMLElement;

    constructor(spawnCallback: (count: number) => void) {
        this.spawnCallback = spawnCallback;
        
        // UI таймера волны
        this.uiElement = document.createElement('div');
        this.uiElement.style.position = 'absolute';
        this.uiElement.style.top = '20px';
        this.uiElement.style.right = '20px'; // Справа сверху
        this.uiElement.style.color = 'red';
        this.uiElement.style.fontFamily = 'Arial, sans-serif';
        this.uiElement.style.fontSize = '24px';
        this.uiElement.style.fontWeight = 'bold';
        this.uiElement.style.textShadow = '2px 2px 0 #000';
        document.body.appendChild(this.uiElement);
    }

    public update(ticker: Ticker) {
        this.waveTimer += ticker.deltaTime;

        // Обратный отсчет для игрока
        const timeLeft = Math.ceil((this.timeBetweenWaves - this.waveTimer) / 60);
        this.uiElement.innerText = `💀 Wave ${this.waveCount} in: ${timeLeft}s`;

        if (this.waveTimer >= this.timeBetweenWaves) {
            this.startWave();
        }
    }

    private startWave() {
        this.waveTimer = 0;
        
        // Формула сложности: 3 врага + номер волны.
        // 1 волна = 4 врага
        // 2 волна = 5 врагов
        const enemiesToSpawn = 3 + this.waveCount;
        
        console.log(`Wave ${this.waveCount} started! Spawning ${enemiesToSpawn} enemies.`);
        
        this.spawnCallback(enemiesToSpawn);
        
        this.waveCount++;
    }
}