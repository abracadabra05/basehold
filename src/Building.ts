// ... импорты ...
import { Container, Graphics, Ticker } from 'pixi.js';
import type { ResourceManager } from './ResourceManager';
import type { Enemy } from './Enemy';

export type BuildingType = 'wall' | 'drill' | 'generator' | 'turret';

export class Building extends Container {
    // ... поля остаются те же ...
    public buildingType: BuildingType;
    private resourceManager: ResourceManager | null = null;
    public hp: number;
    public maxHp: number;
    private hpBar: Graphics;
    private isMining: boolean = false;
    private mineTimer: number = 0;
    private mineSpeed: number = 60; 
    private range: number = 200;
    private cooldown: number = 0;
    private fireRate: number = 30;
    public energyConsumption: number = 0;
    public energyProduction: number = 0;
    public isDestroyed: boolean = false;

    constructor(type: BuildingType, size: number) {
        super();
        this.buildingType = type;

        // ... настройка HP и switch (type) ... 
        // (Оставь весь код конструктора и switch без изменений, он длинный, копировать не буду, 
        // главное убедись, что maxHp задается корректно)
        switch (type) {
            case 'wall': this.maxHp = 100; this.energyConsumption = 0; break;
            case 'drill': this.maxHp = 30; this.energyConsumption = 5; break;
            case 'turret': this.maxHp = 50; this.energyConsumption = 10; break;
            case 'generator': this.maxHp = 20; this.energyProduction = 20; break;
            default: this.maxHp = 10;
        }
        this.hp = this.maxHp;

        const g = new Graphics();
        // ... (код отрисовки графики тот же) ...
        switch (type) {
            case 'wall':
                g.rect(0, 0, size, size).fill(0x888888).stroke({ width: 2, color: 0x000000 });
                g.rect(5, 5, 10, 5).fill(0x666666); g.rect(20, 20, 10, 5).fill(0x666666);
                break;
            case 'drill': g.rect(0, 0, size, size).fill(0x3498db).circle(size / 2, size / 2, size / 4).fill(0xffffff); break;
            case 'generator': g.rect(0, 0, size, size).fill(0xe67e22).moveTo(size / 2, 5).lineTo(size / 2, size - 5).stroke({ width: 4, color: 0xffff00 }); break;
            case 'turret': g.rect(0, 0, size, size).fill(0x2ecc71).circle(size / 2, size / 2, size / 3).fill(0x2c3e50).rect(size / 2 - 2, 0, 4, size / 2).fill(0x000000); break;
        }
        this.addChild(g);

        this.hpBar = new Graphics();
        this.hpBar.y = -10;
        this.hpBar.visible = false;
        this.addChild(this.hpBar);
    }

    public startMining(resourceManager: ResourceManager) {
        this.resourceManager = resourceManager;
        this.isMining = true;
    }

    public takeDamage(amount: number) {
        this.hp -= amount;
        this.updateHpBar();
        this.tint = 0xFFaaaa;
        setTimeout(() => this.tint = 0xFFFFFF, 50);
        if (this.hp <= 0) this.isDestroyed = true;
    }

    // <--- НОВЫЙ МЕТОД: Починка
    public repair(amount: number) {
        this.hp += amount;
        if (this.hp > this.maxHp) this.hp = this.maxHp;
        
        // Зеленая вспышка при починке
        this.tint = 0x00FF00;
        setTimeout(() => this.tint = 0xFFFFFF, 100);
        
        this.updateHpBar();
    }

    private updateHpBar() {
        if (this.hp < this.maxHp) {
            this.hpBar.visible = true;
            this.hpBar.clear();
            this.hpBar.rect(0, 0, 40, 4);
            this.hpBar.fill(0x000000);
            const pct = Math.max(0, this.hp / this.maxHp);
            const color = pct > 0.5 ? 0x00FF00 : pct > 0.25 ? 0xFFFF00 : 0xFF0000;
            this.hpBar.rect(0, 0, 40 * pct, 4);
            this.hpBar.fill(color);
        } else {
            this.hpBar.visible = false;
        }
    }

    // ... update, findTarget ... (без изменений)
    public update(ticker: Ticker, enemies: Enemy[], spawnProjectile: any, efficiency: number) {
        if (efficiency <= 0 && this.buildingType !== 'wall') return;
        if (this.isMining && this.resourceManager) {
            this.mineTimer += ticker.deltaTime * efficiency;
            if (this.mineTimer >= this.mineSpeed) {
                this.mineTimer = 0;
                this.resourceManager.addMetal(1);
            }
        }
        if (this.buildingType === 'turret') {
            if (this.cooldown > 0) {
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