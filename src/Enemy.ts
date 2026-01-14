import { Container, Graphics, Ticker } from 'pixi.js';
import type { Building } from './Building';

export type EnemyType = 'basic' | 'fast' | 'tank' | 'boss';

export class Enemy extends Container {
    private body: Graphics;
    private target: Container; 
    private speed: number = 2; 
    private checkCollision: (x: number, y: number) => Building | null;
    
    public hp: number = 3; 
    public isDead: boolean = false;
    
    // НОВЫЕ ПУБЛИЧНЫЕ ПОЛЯ СКОРОСТИ (для упреждения)
    public vx: number = 0;
    public vy: number = 0;

    private attackTimer: number = 0;
    private attackSpeed: number = 60; 
    private damage: number = 5; 
    public type: EnemyType;
    public hitboxRadius: number = 15; 

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
        
        switch (type) {
            case 'basic':
                this.speed = 2; this.hp = 3; this.damage = 5; this.hitboxRadius = 15;
                this.body.rect(-12, -12, 24, 24).fill(0xFF0000); 
                break;
            case 'fast':
                this.speed = 3.5; this.hp = 1; this.damage = 2; this.hitboxRadius = 12;
                this.body.rect(-8, -8, 16, 16).fill(0xF1C40F); 
                break;
            case 'tank':
                this.speed = 1.0; this.hp = 15; this.damage = 20; this.hitboxRadius = 20;
                this.body.rect(-16, -16, 32, 32).fill(0x8B0000); 
                break;
            case 'boss': 
                this.speed = 0.6; this.hp = 500; this.damage = 100; this.attackSpeed = 120; this.hitboxRadius = 45;
                this.body.rect(-40, -40, 80, 80).fill(0x2c3e50).stroke({ width: 4, color: 0x9b59b6 });
                break;
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

        let targetX = this.target.x;
        let targetY = this.target.y;
        if ('buildingType' in this.target) { targetX += 20; targetY += 20; }
        
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        const attackRange = this.type === 'boss' ? 50 : 5;
        
        // Если дошли до атаки - стоим
        if (dist < attackRange) {
            this.vx = 0;
            this.vy = 0;
            return;
        }

        const dirX = dx / dist;
        const dirY = dy / dist;

        // Обновляем текущую скорость (с учетом времени кадра)
        // Но для предсказания нам нужен вектор скорости за 1 тик
        this.vx = dirX * this.speed;
        this.vy = dirY * this.speed;

        const moveX = this.vx * ticker.deltaTime;
        const moveY = this.vy * ticker.deltaTime;

        const buildingX = this.isColliding(this.x + moveX, this.y);
        if (!buildingX) this.x += moveX; 
        else this.attackBuilding(buildingX);

        const buildingY = this.isColliding(this.x, this.y + moveY);
        if (!buildingY) this.y += moveY; 
        else this.attackBuilding(buildingY);
    }

    private attackBuilding(building: Building) {
        // Когда атакуем - мы стоим на месте
        this.vx = 0; 
        this.vy = 0;
        
        if (this.attackTimer <= 0) {
            building.takeDamage(this.damage);
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
