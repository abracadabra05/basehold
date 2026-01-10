import { Container, Graphics, Ticker } from 'pixi.js';

export class Projectile extends Container {
    private speed: number = 10;
    private vx: number;
    private vy: number;
    public damage: number = 1;
    public shouldDestroy: boolean = false; // Флаг для удаления

    constructor(x: number, y: number, targetX: number, targetY: number) {
        super();
        this.x = x;
        this.y = y;

        // Рисуем пулю
        const g = new Graphics();
        g.circle(0, 0, 4);
        g.fill(0xFFFF00); // Желтый
        this.addChild(g);

        // Вычисляем направление
        const dx = targetX - x;
        const dy = targetY - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        this.vx = (dx / dist) * this.speed;
        this.vy = (dy / dist) * this.speed;
    }

    public update(ticker: Ticker) {
        this.x += this.vx * ticker.deltaTime;
        this.y += this.vy * ticker.deltaTime;

        // Если улетела слишком далеко — удаляем (оптимизация)
        if (Math.abs(this.x) > 5000 || Math.abs(this.y) > 5000) {
            this.shouldDestroy = true;
        }
    }
}