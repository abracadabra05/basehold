import { Container, Graphics, Ticker } from 'pixi.js';

export class Enemy extends Container {
    private body: Graphics;
    private target: Container; 
    private speed: number = 2; 
    private checkCollision: (x: number, y: number) => boolean;
    
    public hp: number = 3; // 3 попадания
    public isDead: boolean = false;

    constructor(target: Container, checkCollision: (x: number, y: number) => boolean) {
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
        
        // Эффект мигания белым при попадании
        this.body.tint = 0xFFFFFF;
        setTimeout(() => { this.body.tint = 0xFFFFFF; /* Сброс тинта сложнее в v8, пока оставим так или упростим */ }, 50);
        // В Pixi v8 tint работает немного иначе, но пока оставим простую логику:
        // Если HP <= 0, ставим флаг смерти
        if (this.hp <= 0) {
            this.isDead = true;
        }
    }

    public update(ticker: Ticker) {
        if (!this.target) return;

        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 5) return;

        const vx = (dx / dist);
        const vy = (dy / dist);

        const moveX = vx * this.speed * ticker.deltaTime;
        const moveY = vy * this.speed * ticker.deltaTime;

        if (!this.isColliding(this.x + moveX, this.y)) {
            this.x += moveX;
        }

        if (!this.isColliding(this.x, this.y + moveY)) {
            this.y += moveY;
        }
    }

    private isColliding(newX: number, newY: number): boolean {
        return this.checkCollision(newX, newY);
    }
}