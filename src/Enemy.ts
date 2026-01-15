import { Container, Graphics, Ticker } from 'pixi.js';
import type { Building } from './Building';
import { GameConfig } from './GameConfig';

export type EnemyType = 'basic' | 'fast' | 'tank' | 'boss' | 'kamikaze' | 'shooter';

export class Enemy extends Container {
    private body: Graphics;
    private target: Container; 
    private speed: number = 2; 
    private checkCollision: (x: number, y: number) => Building | null;
    
    public hp: number = 3; 
    public isDead: boolean = false;
    
    public vx: number = 0;
    public vy: number = 0;

    private attackTimer: number = 0;
    private attackSpeed: number = 60; 
    private damage: number = 5; 
    public type: EnemyType;
    public hitboxRadius: number = 15; 
    
    private attackRange: number = 5;

    // Колбеки
    public onShoot?: (x: number, y: number, tx: number, ty: number, damage: number) => void;
    public onExplode?: (x: number, y: number, damage: number, radius: number) => void;

    constructor(
        target: Container, 
        checkCollision: (x: number, y: number) => Building | null,
        type: EnemyType = 'basic'
    ) {
        super();
        this.target = target;
        this.checkCollision = checkCollision;
        this.type = type;

        this.body = new Graphics();
        
        // Получаем конфиг для данного типа
        const configKey = type.toUpperCase() as keyof typeof GameConfig.ENEMIES;
        const stats = GameConfig.ENEMIES[configKey];

        if (stats) {
            this.speed = stats.speed;
            this.hp = stats.hp;
            this.damage = stats.damage;
            this.hitboxRadius = stats.radius;
            // attackRange берем из конфига если есть, иначе дефолт (5 для мили)
            if ('attackRange' in stats) {
                this.attackRange = (stats as any).attackRange;
            } else {
                this.attackRange = 5;
            }
            // attackSpeed пока хардкод или дефолт, можно добавить в конфиг позже
             if (type === 'boss' || type === 'shooter') {
                 this.attackSpeed = 120;
             }
             
             // Рисуем тело
             const color = stats.color;
             if (type === 'boss') {
                 this.body.rect(-40, -40, 80, 80).fill(color).stroke({ width: 4, color: 0x9b59b6 });
             } else if (type === 'kamikaze') {
                 this.body.circle(0, 0, stats.radius).fill(color);
             } else if (type === 'shooter') {
                 this.body.moveTo(0, -15).lineTo(10, 10).lineTo(-10, 10).fill(color);
             } else {
                 // Basic, Fast, Tank - прямоугольники
                 const s = stats.radius * 2; // примерно под размер радиуса
                 this.body.rect(-stats.radius, -stats.radius, s, s).fill(color);
             }
        }
        
        this.addChild(this.body);
    }
    
    public takeDamage(amount: number) { 
        this.hp -= amount; 
        this.body.tint = 0xFFFFFF; 
        setTimeout(() => { this.body.tint = 0xFFFFFF; }, 50); 
        if (this.hp <= 0) this.isDead = true; 
    }

    public update(ticker: Ticker) {
        if (!this.target) return;
        if (this.attackTimer > 0) this.attackTimer -= ticker.deltaTime;

        if (this.type === 'kamikaze') {
            this.body.scale.set(1 + Math.sin(Date.now() / 100) * 0.2);
        }

        let targetX = this.target.x;
        let targetY = this.target.y;
        
        if ('buildingType' in this.target) { targetX += 20; targetY += 20; }
        
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // ЛОГИКА АТАКИ
        if (dist < this.attackRange) {
            this.vx = 0;
            this.vy = 0;
            
            if (this.type === 'shooter') {
                if (this.attackTimer <= 0) {
                    if (this.onShoot) {
                        this.onShoot(this.x, this.y, targetX, targetY, this.damage);
                    }
                    this.attackTimer = this.attackSpeed;
                }
                return;
            }
            // Boss и другие милишники идут таранить, кроме момента самого удара
        }

        const dirX = dx / dist;
        const dirY = dy / dist;

        this.vx = dirX * this.speed;
        this.vy = dirY * this.speed;

        const moveX = this.vx * ticker.deltaTime;
        const moveY = this.vy * ticker.deltaTime;

        const checkDist = this.hitboxRadius + 5;
        const checkX = this.x + moveX + (dirX * checkDist);
        const checkY = this.y + moveY + (dirY * checkDist);

        const buildingX = this.isColliding(checkX, this.y); 
        if (!buildingX) {
             this.x += moveX; 
        } else {
             this.attackBuilding(buildingX);
        }

        const buildingY = this.isColliding(this.x, checkY);
        if (!buildingY) {
             this.y += moveY; 
        } else {
             this.attackBuilding(buildingY);
        }
    }
  }

    private attackBuilding(building: Building) {
        this.vx = 0; 
        this.vy = 0;
        
        if (this.type === 'kamikaze') {
            if (this.onExplode) {
                this.onExplode(this.x, this.y, this.damage, 100); 
            }
            this.isDead = true; 
            return;
        }

        if (this.attackTimer <= 0) {
            building.takeDamage(this.damage);
            
            if (building.thornsDamage > 0) {
                this.takeDamage(building.thornsDamage);
            }

            this.attackTimer = this.attackSpeed;
            const originalScale = this.scale.x;
            this.scale.set(originalScale * 1.1); 
            setTimeout(() => this.scale.set(originalScale), 100);
        }
    }

    private isColliding(newX: number, newY: number): Building | null { 
        return this.checkCollision(newX, newY); 
    }
}
