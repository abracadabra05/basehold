import { Ticker } from 'pixi.js';

export class WaveManager {
    // Изменили тип колбека
    private spawnCallback: (waveNum: number, count: number) => void;
    private waveTimer: number = 0;
    private timeBetweenWaves: number = 600; 
    public waveCount: number = 1; // Public, если пригодится
    private uiElement: HTMLElement;

    constructor(spawnCallback: (waveNum: number, count: number) => void) {
        this.spawnCallback = spawnCallback;
        
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

    public update(ticker: Ticker) {
        this.waveTimer += ticker.deltaTime;

        const timeLeft = Math.ceil((this.timeBetweenWaves - this.waveTimer) / 60);
        this.uiElement.innerText = `💀 Wave ${this.waveCount} in: ${timeLeft}s`;

        if (this.waveTimer >= this.timeBetweenWaves) {
            this.startWave();
        }
    }

    private startWave() {
        this.waveTimer = 0;
        
        // Сложность растет быстрее
        const enemiesToSpawn = 3 + Math.floor(this.waveCount * 1.5);
        
        console.log(`Wave ${this.waveCount} started!`);
        
        // Передаем номер волны
        this.spawnCallback(this.waveCount, enemiesToSpawn);
        
        this.waveCount++;
    }
}