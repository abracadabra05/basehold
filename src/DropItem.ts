import { Container, Graphics, Ticker } from 'pixi.js';

export class DropItem extends Container {
    private graphics: Graphics;
    public value: number;
    public isMagnetized: boolean = false;
    public speed: number = 0;
    public acceleration: number = 0.5;

    constructor(x: number, y: number, value: number) {
        super();
        this.x = x;
        this.y = y;
        this.value = value;

        this.graphics = new Graphics();
        // Рисуем маленькую сферу
        this.graphics.circle(0, 0, 5).fill(0x9b59b6); // Фиолетовый (Biomass)
        this.graphics.stroke({ width: 1, color: 0xFFFFFF });
        this.addChild(this.graphics);
    }

    public update(ticker: Ticker, playerX: number, playerY: number, magnetRadius: number) {
        if (this.isMagnetized) {
            // Летим к игроку
            const dx = playerX - this.x;
            const dy = playerY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 10) return; // Готов к подбору

            this.speed += this.acceleration * ticker.deltaTime;
            // Ограничим скорость
            if (this.speed > 15) this.speed = 15;

            const vx = (dx / dist) * this.speed * ticker.deltaTime;
            const vy = (dy / dist) * this.speed * ticker.deltaTime;

            this.x += vx;
            this.y += vy;
        } else {
            // Проверяем, не попали ли в радиус магнита
            const dx = playerX - this.x;
            const dy = playerY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < magnetRadius) {
                this.isMagnetized = true;
            }
        }
        
        // Легкая анимация пульсации
        this.graphics.scale.set(1 + Math.sin(Date.now() / 200) * 0.1);
    }
}
