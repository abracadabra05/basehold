import { Container, Graphics, Ticker } from 'pixi.js';

export class Player extends Container {
    private keys: { [key: string]: boolean } = {};
    private speed: number = 5; 
    private body: Graphics;
    private hpBar: Graphics;
    private checkCollision: (x: number, y: number) => boolean;
    
    // Новое: Колбек для выстрела
    private onShoot: (x: number, y: number, tx: number, ty: number) => void;

    public maxHp: number = 10;
    public hp: number = 10;
    
    private invulnerableTimer: number = 0;
    private invulnerableTime: number = 60; 

    // Параметры оружия
    private fireCooldown: number = 0;
    private fireRate: number = 10; // Скорострельность (меньше = быстрее). 10 тиков = 6 выстрелов в сек.

    constructor(
        checkCollision: (x: number, y: number) => boolean,
        onShoot: (x: number, y: number, tx: number, ty: number) => void // <--- Принимаем функцию выстрела
    ) {
        super();
        this.checkCollision = checkCollision;
        this.onShoot = onShoot;
        
        this.body = new Graphics();
        this.body.rect(-16, -16, 32, 32); 
        this.body.fill(0xFFD700); 
        this.addChild(this.body);

        this.hpBar = new Graphics();
        this.hpBar.y = -25;
        this.addChild(this.hpBar);
        this.updateHpBar();

        this.initInput();
    }

    private initInput() {
        window.addEventListener('keydown', (e) => { this.keys[e.code] = true; });
        window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
        window.addEventListener('blur', () => { this.keys = {}; });
    }

    // Метод попытки выстрела (вызывается из Game.ts, если зажата ПКМ)
    public tryShoot(targetX: number, targetY: number) {
        if (this.fireCooldown <= 0) {
            // Стреляем!
            this.onShoot(this.x, this.y, targetX, targetY);
            this.fireCooldown = this.fireRate; // Сброс таймера
        }
    }

    public update(ticker: Ticker) {
        // Обновляем таймер стрельбы
        if (this.fireCooldown > 0) {
            this.fireCooldown -= ticker.deltaTime;
        }

        // Таймер неуязвимости
        if (this.invulnerableTimer > 0) {
            this.invulnerableTimer -= ticker.deltaTime;
            this.alpha = 0.5; 
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
        if (this.invulnerableTimer > 0) return; 

        this.hp -= amount;
        this.invulnerableTimer = this.invulnerableTime; 
        this.updateHpBar();
    }

    private updateHpBar() {
        this.hpBar.clear();
        this.hpBar.rect(-20, -5, 40, 6);
        this.hpBar.fill(0x000000);

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