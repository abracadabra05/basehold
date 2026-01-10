import { Container, Graphics, Ticker } from 'pixi.js';
import type { ResourceManager } from './ResourceManager';
import type { Enemy } from './Enemy';

export type BuildingType = 'wall' | 'drill' | 'generator' | 'turret';

export class Building extends Container {
    public buildingType: BuildingType;
    private resourceManager: ResourceManager | null = null;
    
    // Майнинг
    private isMining: boolean = false;
    private mineTimer: number = 0;
    private mineSpeed: number = 60; 

    // Бой
    private range: number = 200;
    private cooldown: number = 0;
    private fireRate: number = 30;

    // Энергия
    public energyConsumption: number = 0;
    public energyProduction: number = 0;

    constructor(type: BuildingType, size: number) {
        super();
        this.buildingType = type;

        // Настройка параметров энергии
        switch (type) {
            case 'wall':
                // Стены не требуют энергии
                break;
            case 'drill':
                this.energyConsumption = 5; // Потребляет 5
                break;
            case 'turret':
                this.energyConsumption = 10; // Потребляет 10
                break;
            case 'generator':
                this.energyProduction = 20; // Производит 20
                break;
        }

        const g = new Graphics();
        // ... (Код отрисовки оставим прежним, он не менялся) ...
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
            case 'turret':
                g.rect(0, 0, size, size);
                g.fill(0x2ecc71); 
                g.circle(size / 2, size / 2, size / 3);
                g.fill(0x2c3e50);
                g.rect(size / 2 - 2, 0, 4, size / 2);
                g.fill(0x000000);
                break;
        }
        this.addChild(g);
    }

    public startMining(resourceManager: ResourceManager) {
        this.resourceManager = resourceManager;
        this.isMining = true;
    }

    // Добавили параметр efficiency (0.0 - 1.0)
    public update(
        ticker: Ticker, 
        enemies: Enemy[], 
        spawnProjectile: (x: number, y: number, tx: number, ty: number) => void,
        efficiency: number // <--- НОВЫЙ ПАРАМЕТР
    ) {
        // Если энергии нет (efficiency = 0), здание не работает (кроме стен)
        if (efficiency <= 0 && this.buildingType !== 'wall') return;

        // ЛОГИКА БУРА
        if (this.isMining && this.resourceManager) {
            // Скорость зависит от эффективности. Если энергии мало — копаем медленно.
            this.mineTimer += ticker.deltaTime * efficiency;

            if (this.mineTimer >= this.mineSpeed) {
                this.mineTimer = 0;
                this.resourceManager.addMetal(1);
                
                this.scale.set(1.1);
                setTimeout(() => this.scale.set(1.0), 50);
            }
        }

        // ЛОГИКА ТУРЕЛИ
        if (this.buildingType === 'turret') {
            if (this.cooldown > 0) {
                // Перезарядка тоже замедляется при нехватке энергии
                this.cooldown -= ticker.deltaTime * efficiency;
            } else {
                const target = this.findTarget(enemies);
                if (target) {
                    spawnProjectile(this.x + 20, this.y + 20, target.x, target.y);
                    this.cooldown = this.fireRate;
                }
            }
        }
    }

    private findTarget(enemies: Enemy[]): Enemy | null {
        // (Тут код поиска цели без изменений)
        let closest: Enemy | null = null;
        let minDist = Infinity;
        for (const enemy of enemies) {
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= this.range && dist < minDist) {
                minDist = dist;
                closest = enemy;
            }
        }
        return closest;
    }
}