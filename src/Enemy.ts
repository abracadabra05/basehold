import { Container, Graphics, Ticker } from 'pixi.js';

export class Enemy extends Container {
    private body: Graphics;
    private target: Container; // Цель (игрок)
    private speed: number = 2; // Медленнее игрока
    private checkCollision: (x: number, y: number) => boolean;

    constructor(target: Container, checkCollision: (x: number, y: number) => boolean) {
        super();
        this.target = target;
        this.checkCollision = checkCollision;

        // Рисуем врага (Красный квадрат)
        this.body = new Graphics();
        this.body.rect(-12, -12, 24, 24); // Чуть меньше игрока (24x24)
        this.body.fill(0xFF0000); // Красный
        this.addChild(this.body);
    }

    public update(ticker: Ticker) {
        if (!this.target) return;

        // Вектор к игроку
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Если уже очень близко — стоим (чтобы не дрожать внутри игрока)
        if (dist < 5) return;

        // Нормализуем вектор (делаем длину 1)
        const vx = (dx / dist);
        const vy = (dy / dist);

        // Вычисляем смещение
        const moveX = vx * this.speed * ticker.deltaTime;
        const moveY = vy * this.speed * ticker.deltaTime;

        // Простая физика: пробуем шагнуть по X, потом по Y
        // Если стена — не идем.
        if (!this.isColliding(this.x + moveX, this.y)) {
            this.x += moveX;
        }

        if (!this.isColliding(this.x, this.y + moveY)) {
            this.y += moveY;
        }
    }

    private isColliding(newX: number, newY: number): boolean {
        // Проверяем центр врага (упрощенно)
        // Можно улучшить, проверяя углы, как у игрока, но для тысяч врагов центр дешевле
        return this.checkCollision(newX, newY);
    }
}