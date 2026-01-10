import { Container, Graphics, Ticker } from 'pixi.js';

export class Player extends Container {
    private keys: { [key: string]: boolean } = {};
    private speed: number = 5; 
    private body: Graphics;
    private checkCollision: (x: number, y: number) => boolean;

    // Новые свойства для здоровья
    public maxHp: number = 10;
    public hp: number = 10;
    private hpBar: Graphics;
    
    // Неуязвимость после удара (i-frames)
    private invulnerableTimer: number = 0;
    private invulnerableTime: number = 60; // 1 секунда (60 тиков)

    constructor(checkCollision: (x: number, y: number) => boolean) {
        super();
        this.checkCollision = checkCollision;
        
        // Тело игрока
        this.body = new Graphics();
        this.body.rect(-16, -16, 32, 32); 
        this.body.fill(0xFFD700); 
        this.addChild(this.body);

        // Полоска здоровья (над головой)
        this.hpBar = new Graphics();
        this.hpBar.y = -25; // Сдвигаем вверх
        this.addChild(this.hpBar);
        this.updateHpBar();

        this.initInput();
    }

    private initInput() {
        window.addEventListener('keydown', (e) => { this.keys[e.code] = true; });
        window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
        window.addEventListener('blur', () => { this.keys = {}; });
    }

    public update(ticker: Ticker) {
        // Таймер неуязвимости
        if (this.invulnerableTimer > 0) {
            this.invulnerableTimer -= ticker.deltaTime;
            this.alpha = 0.5; // Мигаем (полупрозрачный)
        } else {
            this.alpha = 1.0;
        }

        // Движение
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

            if (!this.isColliding(this.x + moveX, this.y)) {
                this.x += moveX;
            }
            if (!this.isColliding(this.x, this.y + moveY)) {
                this.y += moveY;
            }
        }
    }

    public takeDamage(amount: number) {
        if (this.invulnerableTimer > 0) return; // Если под щитом - урон не проходит

        this.hp -= amount;
        this.invulnerableTimer = this.invulnerableTime; // Включаем щит
        this.updateHpBar();

        // Небольшой отброс камеры или эффекта можно добавить позже
        console.log(`Player hit! HP: ${this.hp}`);
    }

    private updateHpBar() {
        this.hpBar.clear();
        
        // Фон бара (черный)
        this.hpBar.rect(-20, -5, 40, 6);
        this.hpBar.fill(0x000000);

        // Жизнь (зеленая или красная, если мало)
        const pct = Math.max(0, this.hp / this.maxHp);
        const width = 40 * pct;
        
        const color = pct > 0.3 ? 0x00FF00 : 0xFF0000;
        
        this.hpBar.rect(-20, -5, width, 6);
        this.hpBar.fill(color);
    }

    private isColliding(newX: number, newY: number): boolean {
        const size = 15; 
        return this.checkCollision(newX - size, newY - size) ||
               this.checkCollision(newX + size, newY - size) ||
               this.checkCollision(newX - size, newY + size) ||
               this.checkCollision(newX + size, newY + size);
    }
}