import { Container, Graphics, Ticker } from 'pixi.js';
import type { Building } from './Building';

export class Enemy extends Container {
    private body: Graphics;
    private target: Container; 
    private speed: number = 2; 
    
    // Функция теперь возвращает ЗДАНИЕ, если мы в него врезались, или null
    private checkCollision: (x: number, y: number) => Building | null;
    
    public hp: number = 3; 
    public isDead: boolean = false;
    
    // Атака
    private attackTimer: number = 0;
    private attackSpeed: number = 60; // 1 удар в секунду
    private damage: number = 5; // Урон по стенам

    constructor(target: Container, checkCollision: (x: number, y: number) => Building | null) {
        super();
        this.target = target;
        this.checkCollision = checkCollision;

        this.body = new Graphics();
        this.body.rect(-12, -12, 24, 24); 
        this.body.fill(0xFF0000); 
        this.addChild(this.body);
    }

    public takeDamage(amount: number) {
        this.hp -= amount;
        this.body.tint = 0xFFFFFF;
        setTimeout(() => { this.body.tint = 0xFFFFFF; }, 50); 
        if (this.hp <= 0) {
            this.isDead = true;
        }
    }

    public update(ticker: Ticker) {
        if (!this.target) return;

        // Если есть кулдаун атаки - уменьшаем его
        if (this.attackTimer > 0) this.attackTimer -= ticker.deltaTime;

        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 5) return;

        const vx = (dx / dist);
        const vy = (dy / dist);

        const moveX = vx * this.speed * ticker.deltaTime;
        const moveY = vy * this.speed * ticker.deltaTime;

        // Проверяем коллизию по X
        const buildingX = this.isColliding(this.x + moveX, this.y);
        if (!buildingX) {
            this.x += moveX;
        } else {
            // Уперлись в здание по X - АТАКУЕМ!
            this.attackBuilding(buildingX);
        }

        // Проверяем коллизию по Y
        const buildingY = this.isColliding(this.x, this.y + moveY);
        if (!buildingY) {
            this.y += moveY;
        } else {
            // Уперлись в здание по Y - АТАКУЕМ!
            this.attackBuilding(buildingY);
        }
    }

    private attackBuilding(building: Building) {
        if (this.attackTimer <= 0) {
            building.takeDamage(this.damage);
            this.attackTimer = this.attackSpeed;
            
            // Визуальный рывок при ударе
            const originalScale = this.scale.x;
            this.scale.set(originalScale * 1.2);
            setTimeout(() => this.scale.set(originalScale), 100);
        }
    }

    private isColliding(newX: number, newY: number): Building | null {
        return this.checkCollision(newX, newY);
    }
}