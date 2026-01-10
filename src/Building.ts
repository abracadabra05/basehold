import { Container, Graphics, Ticker } from 'pixi.js';
import type { ResourceManager } from './ResourceManager'; // Импортируем только тип

export type BuildingType = 'wall' | 'drill' | 'generator';

export class Building extends Container {
    public buildingType: BuildingType;
    private resourceManager: ResourceManager | null = null;
    private isMining: boolean = false;
    private mineTimer: number = 0;
    private mineSpeed: number = 60; // Добываем раз в 60 тиков (примерно 1 сек при 60 FPS)

    constructor(type: BuildingType, size: number) {
        super();
        this.buildingType = type;

        const g = new Graphics();
        
        switch (type) {
            case 'wall':
                g.rect(0, 0, size, size);
                g.fill(0x888888);
                g.stroke({ width: 2, color: 0x000000 });
                break;
            case 'drill':
                g.rect(0, 0, size, size);
                g.fill(0x3498db);
                g.circle(size / 2, size / 2, size / 4);
                g.fill(0xffffff); 
                break;
            case 'generator':
                g.rect(0, 0, size, size);
                g.fill(0xe67e22); 
                g.moveTo(size / 2, 5);
                g.lineTo(size / 2, size - 5);
                g.stroke({ width: 4, color: 0xffff00 });
                break;
        }

        this.addChild(g);
    }

    // Настраиваем бур: даем ему доступ к складу ресурсов
    public startMining(resourceManager: ResourceManager) {
        this.resourceManager = resourceManager;
        this.isMining = true;
    }

    // Этот метод будет вызываться 60 раз в секунду
    public update(ticker: Ticker) {
        if (this.isMining && this.resourceManager) {
            // ticker.deltaTime обычно около 1.0
            this.mineTimer += ticker.deltaTime;

            if (this.mineTimer >= this.mineSpeed) {
                this.mineTimer = 0;
                this.resourceManager.addMetal(1); // +1 Металл
                
                // Визуальный эффект (дергаем бур)
                this.scale.set(1.1);
                setTimeout(() => this.scale.set(1.0), 50);
            }
        }
    }
}