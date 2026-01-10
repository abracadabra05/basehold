import { Container, Graphics, Ticker } from 'pixi.js';
import type { Building } from './Building';

// Определяем типы врагов
export type EnemyType = 'basic' | 'fast' | 'tank';

export class Enemy extends Container {
    private body: Graphics;
    private target: Container; 
    private speed: number = 2; 
    private checkCollision: (x: number, y: number) => Building | null;
    
    public hp: number = 3; 
    public isDead: boolean = false;
    
    private attackTimer: number = 0;
    private attackSpeed: number = 60; 
    private damage: number = 5; 

    constructor(
        target: Container, 
        checkCollision: (x: number, y: number) => Building | null,
        type: EnemyType = 'basic' // <--- Новый параметр
    ) {
        super();
        this.target = target;
        this.checkCollision = checkCollision;

        this.body = new Graphics();
        
        // Настройка статов в зависимости от типа
        switch (type) {
            case 'basic':
                this.speed = 2;
                this.hp = 3;
                this.damage = 5;
                this.body.rect(-12, -12, 24, 24).fill(0xFF0000); // Красный
                break;

            case 'fast':
                this.speed = 3.5; // Очень быстрый
                this.hp = 1;      // Умирает с 1 удара
                this.damage = 2;  // Слабо бьет
                this.body.rect(-8, -8, 16, 16).fill(0xF1C40F); // Желтый, маленький
                break;

            case 'tank':
                this.speed = 1.0; // Медленный
                this.hp = 15;     // Живучий
                this.damage = 20; // Сносит стены (у стены 100 HP, снесет за 5 сек)
                this.body.rect(-16, -16, 32, 32).fill(0x8B0000); // Темно-бордовый, большой
                break;
        }
        
        this.addChild(this.body);
    }

    public takeDamage(amount: number) {
        this.hp -= amount;
        this.body.tint = 0xFFFFFF;
        setTimeout(() => { this.body.tint = 0xFFFFFF; }, 50); // Тинт в v8 сбрасывается иначе, но оставим логику
        if (this.hp <= 0) {
            this.isDead = true;
        }
    }

    public update(ticker: Ticker) {
        if (!this.target) return;

        if (this.attackTimer > 0) this.attackTimer -= ticker.deltaTime;

        // --- ИСПРАВЛЕНИЕ НАЧАЛО ---
        let targetX = this.target.x;
        let targetY = this.target.y;

        // Если у цели есть свойство 'buildingType' (значит это Здание),
        // смещаем точку прицеливания в центр клетки (40 / 2 = 20).
        // Используем 'in' для безопасной проверки свойства в JS/TS
        if ('buildingType' in this.target) {
            targetX += 20;
            targetY += 20;
        }
        
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        // --- ИСПРАВЛЕНИЕ КОНЕЦ ---

        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 5) return;

        const vx = (dx / dist);
        const vy = (dy / dist);

        const moveX = vx * this.speed * ticker.deltaTime;
        const moveY = vy * this.speed * ticker.deltaTime;

        const buildingX = this.isColliding(this.x + moveX, this.y);
        if (!buildingX) {
            this.x += moveX;
        } else {
            this.attackBuilding(buildingX);
        }

        const buildingY = this.isColliding(this.x, this.y + moveY);
        if (!buildingY) {
            this.y += moveY;
        } else {
            this.attackBuilding(buildingY);
        }
    }

    private attackBuilding(building: Building) {
        if (this.attackTimer <= 0) {
            building.takeDamage(this.damage);
            this.attackTimer = this.attackSpeed;
            
            const originalScale = this.scale.x;
            this.scale.set(originalScale * 1.2);
            setTimeout(() => this.scale.set(originalScale), 100);
        }
    }

    private isColliding(newX: number, newY: number): Building | null {
        return this.checkCollision(newX, newY);
    }
}