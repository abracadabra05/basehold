import { Container, Graphics, Ticker } from 'pixi.js';

export class Player extends Container {
    private keys: { [key: string]: boolean } = {};
    private speed: number = 5; 
    private body: Graphics;
    private checkCollision: (x: number, y: number) => boolean; // Функция проверки

    // Принимаем функцию проверки коллизий в конструкторе
    constructor(checkCollision: (x: number, y: number) => boolean) {
        super();
        this.checkCollision = checkCollision;
        
        // Рисуем игрока (32x32)
        this.body = new Graphics();
        this.body.rect(-16, -16, 32, 32); 
        this.body.fill(0xFFD700); 
        this.addChild(this.body);

        this.initInput();
    }

    private initInput() {
        window.addEventListener('keydown', (e) => { this.keys[e.code] = true; });
        window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
        window.addEventListener('blur', () => { this.keys = {}; });
    }

    public update(ticker: Ticker) {
        let dx = 0;
        let dy = 0;

        if (this.keys['KeyW'] || this.keys['ArrowUp']) dy -= 1;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) dy += 1;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) dx -= 1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) dx += 1;

        if (dx !== 0 || dy !== 0) {
            const length = Math.sqrt(dx * dx + dy * dy);
            const moveX = (dx / length) * this.speed * ticker.deltaTime;
            const moveY = (dy / length) * this.speed * ticker.deltaTime;

            // Пробуем двигаться по X
            if (!this.isColliding(this.x + moveX, this.y)) {
                this.x += moveX;
            }

            // Пробуем двигаться по Y (отдельно, чтобы можно было скользить вдоль стен)
            if (!this.isColliding(this.x, this.y + moveY)) {
                this.y += moveY;
            }
        }
    }

    // Проверяем 4 угла игрока. Если хоть один внутри стены -> True
    private isColliding(newX: number, newY: number): boolean {
        const size = 15; // Чуть меньше 16, чтобы не застревать в стыках
        
        // Левый верхний, Правый верхний, Левый нижний, Правый нижний
        return this.checkCollision(newX - size, newY - size) ||
               this.checkCollision(newX + size, newY - size) ||
               this.checkCollision(newX - size, newY + size) ||
               this.checkCollision(newX + size, newY + size);
    }
}