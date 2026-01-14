// ... (импорты)
import { Container, Graphics, Ticker } from 'pixi.js';
import type { ResourceManager } from './ResourceManager';
import type { Enemy } from './Enemy';

export type BuildingType = 'wall' | 'drill' | 'generator' | 'turret' | 'core' | 'sniper' | 'minigun';

export class Building extends Container {
    public buildingType: BuildingType;
    private resourceManager: ResourceManager | null = null;
    
    public hp: number;
    public maxHp: number;
    private hpBar: Graphics;

    private isMining: boolean = false;
    private mineTimer: number = 0;
    private mineSpeed: number = 60; 

    // Боевые параметры
    private range: number = 200;
    private cooldown: number = 0;
    private fireRate: number = 30;
    private damage: number = 1; // Урон турели

    public energyConsumption: number = 0;
    public energyProduction: number = 0;
    public isDestroyed: boolean = false;

    constructor(type: BuildingType, size: number) {
        super();
        this.buildingType = type;

        switch (type) {
            case 'wall': this.maxHp = 100; this.energyConsumption = 0; break;
            case 'drill': this.maxHp = 30; this.energyConsumption = 5; break;
            case 'generator': this.maxHp = 20; this.energyProduction = 20; break;
            case 'core': this.maxHp = 500; this.energyProduction = 50; break;
            
            // --- ТУРЕЛИ ---
            case 'turret': // Обычная (баланс)
                this.maxHp = 50; 
                this.energyConsumption = 10; 
                this.range = 200;
                this.fireRate = 30; // 0.5 сек
                this.damage = 1;
                break;
            
            case 'sniper': // Снайпер (далеко, больно, медленно)
                this.maxHp = 40;
                this.energyConsumption = 15;
                this.range = 400; // На пол-экрана
                this.fireRate = 120; // 2 секунды перезарядка
                this.damage = 10; // Убивает обычных с 1 выстрела, танков калечит
                break;

            case 'minigun': // Пулемет (близко, быстро, слабо)
                this.maxHp = 60;
                this.energyConsumption = 20; // Жрет много энергии
                this.range = 150; 
                this.fireRate = 5; // Стреляет как бешеный (каждые 0.08 сек)
                this.damage = 0.5; // Слабый урон
                break;

            default: this.maxHp = 10;
        }
        this.hp = this.maxHp;

        const g = new Graphics();
        switch (type) {
            case 'wall': g.rect(0, 0, size, size).fill(0x888888).stroke({ width: 2, color: 0x000000 }); g.rect(5, 5, 10, 5).fill(0x666666); g.rect(20, 20, 10, 5).fill(0x666666); break;
            case 'drill': g.rect(0, 0, size, size).fill(0x3498db).circle(size / 2, size / 2, size / 4).fill(0xffffff); break;
            case 'generator': g.rect(0, 0, size, size).fill(0xe67e22).moveTo(size / 2, 5).lineTo(size / 2, size - 5).stroke({ width: 4, color: 0xffff00 }); break;
            case 'core': g.rect(0, 0, size, size).fill(0x00FFFF).circle(size / 2, size / 2, size / 3).fill(0xFFFFFF).stroke({ width: 3, color: 0x0000FF }); break;
            
            case 'turret': 
                g.rect(0, 0, size, size).fill(0x2ecc71); 
                g.circle(size / 2, size / 2, size / 3).fill(0x2c3e50);
                g.rect(size / 2 - 2, 0, 4, size / 2).fill(0x000000); 
                break;

            case 'sniper':
                g.rect(0, 0, size, size).fill(0x555555); // Серый корпус
                g.circle(size / 2, size / 2, size / 3).fill(0x222222);
                // Длинное дуло
                g.rect(size / 2 - 2, -10, 4, size + 10).fill(0x000000); 
                // Красная метка
                g.circle(size / 2, size / 2, 4).fill(0xFF0000);
                break;

            case 'minigun':
                g.rect(0, 0, size, size).fill(0x8e44ad); // Фиолетовый
                g.circle(size / 2, size / 2, size / 3).fill(0x222222);
                // Три дула
                g.circle(size / 2 - 5, 5, 3).fill(0x000000);
                g.circle(size / 2 + 5, 5, 3).fill(0x000000);
                g.circle(size / 2, 15, 3).fill(0x000000);
                break;
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

    public repair(amount: number) {
        this.hp += amount;
        if (this.hp > this.maxHp) this.hp = this.maxHp;
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

    public update(
        ticker: Ticker, 
        enemies: Enemy[], 
        // ИЗМЕНЕНИЕ: колбек теперь принимает 5-й аргумент: урон
        spawnProjectile: (x: number, y: number, tx: number, ty: number, damage: number) => void,
        efficiency: number
    ) {
        if (efficiency <= 0 && this.buildingType !== 'wall') return;

        if (this.isMining && this.resourceManager) {
            this.mineTimer += ticker.deltaTime * efficiency;
            if (this.mineTimer >= this.mineSpeed) {
                this.mineTimer = 0;
                this.resourceManager.addMetal(1);
            }
        }

        // Логика для всех стреляющих зданий
        if (this.buildingType === 'turret' || this.buildingType === 'sniper' || this.buildingType === 'minigun') {
            if (this.cooldown > 0) {
                this.cooldown -= ticker.deltaTime * efficiency;
            } else {
                const target = this.findTarget(enemies);
                if (target) {
                    // Передаем this.damage в снаряд
                    spawnProjectile(this.x + 20, this.y + 20, target.x, target.y, this.damage);
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