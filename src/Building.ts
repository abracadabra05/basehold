import { Container, Graphics, Ticker } from 'pixi.js';
import type { ResourceManager } from './ResourceManager';
import type { Enemy } from './Enemy'; // Импорт типа Enemy

// Добавляем 'turret'
export type BuildingType = 'wall' | 'drill' | 'generator' | 'turret';

export class Building extends Container {
    public buildingType: BuildingType;
    private resourceManager: ResourceManager | null = null;
    private isMining: boolean = false;
    private mineTimer: number = 0;
    private mineSpeed: number = 60; 

    // Переменные для турели
    private range: number = 200;
    private cooldown: number = 0;
    private fireRate: number = 30; // Стреляем каждые 0.5 сек (30 тиков)

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
            case 'turret': // Вид турели
                g.rect(0, 0, size, size);
                g.fill(0x2ecc71); // Зеленый
                g.circle(size / 2, size / 2, size / 3);
                g.fill(0x2c3e50); // Темная башня
                // Дуло
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

    // Обновленный метод update с параметрами для боя
    public update(
        ticker: Ticker, 
        enemies: Enemy[], 
        spawnProjectile: (x: number, y: number, tx: number, ty: number) => void
    ) {
        // Логика бура
        if (this.isMining && this.resourceManager) {
            this.mineTimer += ticker.deltaTime;
            if (this.mineTimer >= this.mineSpeed) {
                this.mineTimer = 0;
                this.resourceManager.addMetal(1);
                this.scale.set(1.1);
                setTimeout(() => this.scale.set(1.0), 50);
            }
        }

        // Логика турели
        if (this.buildingType === 'turret') {
            if (this.cooldown > 0) {
                this.cooldown -= ticker.deltaTime;
            } else {
                // Ищем врага
                const target = this.findTarget(enemies);
                if (target) {
                    // Стреляем!
                    spawnProjectile(this.x + 20, this.y + 20, target.x, target.y); // +20 это центр (40/2)
                    this.cooldown = this.fireRate;
                }
            }
        }
    }

    private findTarget(enemies: Enemy[]): Enemy | null {
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