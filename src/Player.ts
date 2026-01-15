import { Container, Graphics, Ticker } from 'pixi.js';

export class Player extends Container {
    private baseSpeed: number = 5; 
    public speedMultiplier: number = 1.0;

    // Графика
    private bodyContainer: Container; // Вращающаяся часть
    private bodyGraphics: Graphics;
    private hpBar: Graphics; // Неподвижная часть

    private checkCollision: (x: number, y: number) => boolean;
    private onShoot: (x: number, y: number, tx: number, ty: number) => void;

    public maxHp: number = 10;
    public hp: number = 10;
    private invulnerableTimer: number = 0;
    private invulnerableTime: number = 60; 
    private fireCooldown: number = 0;
    private fireRate: number = 10;

    public get rotationAngle(): number {
        return this.bodyContainer.rotation;
    }
    
    public set rotationAngle(val: number) {
        this.bodyContainer.rotation = val;
    }

    constructor(
        checkCollision: (x: number, y: number) => boolean,
        onShoot: (x: number, y: number, tx: number, ty: number) => void
    ) {
        super();
        this.checkCollision = checkCollision;
        this.onShoot = onShoot;
        
        // 1. Создаем контейнер для тела, который будем вращать
        this.bodyContainer = new Container();
        this.addChild(this.bodyContainer);

        // 2. Рисуем тело в этом контейнере
        this.bodyGraphics = new Graphics();
        
        // КРУГЛОЕ ТЕЛО (Радиус 16)
        this.bodyGraphics.circle(0, 0, 16).fill(0xFFD700); 
        this.bodyGraphics.stroke({ width: 2, color: 0xDAA520 }); 

        // ПУШКА (Сдвинута вперед)
        this.bodyGraphics.rect(10, -6, 18, 12).fill(0x333333); 
        this.bodyGraphics.stroke({ width: 1, color: 0x000000 });

        this.bodyContainer.addChild(this.bodyGraphics);

        // 3. Полоска HP (Добавляем в this, а не в bodyContainer, чтобы не вращалась)
        this.hpBar = new Graphics();
        this.hpBar.y = -30; 
        this.addChild(this.hpBar);
        this.updateHpBar();
    }

    public lookAt(targetX: number, targetY: number) {
        // Вращаем ТОЛЬКО контейнер тела
        const angle = Math.atan2(targetY - this.y, targetX - this.x);
        this.bodyContainer.rotation = angle;
    }

    public tryShoot(targetX: number, targetY: number) {
        if (this.fireCooldown <= 0) {
            // Точка вылета пули (с учетом поворота)
            const angle = this.bodyContainer.rotation;
            const barrelLen = 25;
            const spawnX = this.x + Math.cos(angle) * barrelLen;
            const spawnY = this.y + Math.sin(angle) * barrelLen;

            this.onShoot(spawnX, spawnY, targetX, targetY);
            
            // Отдача (визуальная)
            this.bodyGraphics.x = -5;
            this.fireCooldown = this.fireRate; 
        }
    }

    public handleMovement(vector: {x: number, y: number}, deltaTime: number) {
        if (vector.x !== 0 || vector.y !== 0) {
            const currentSpeed = this.baseSpeed * this.speedMultiplier;

            // Вектор уже нормализован InputSystem
            const moveX = vector.x * currentSpeed * deltaTime;
            const moveY = vector.y * currentSpeed * deltaTime;

            // Коллизия (проверяем по кругу)
            if (!this.isColliding(this.x + moveX, this.y)) this.x += moveX;
            if (!this.isColliding(this.x, this.y + moveY)) this.y += moveY;
        }
    }

    public update(ticker: Ticker) {
        if (this.fireCooldown > 0) this.fireCooldown -= ticker.deltaTime;

        // Плавное возвращение отдачи
        if (this.bodyGraphics.x < 0) {
            this.bodyGraphics.x += 0.5 * ticker.deltaTime;
            if (this.bodyGraphics.x > 0) this.bodyGraphics.x = 0;
        }

        if (this.invulnerableTimer > 0) {
            this.invulnerableTimer -= ticker.deltaTime;
            this.alpha = 0.5; 
        } else {
            this.alpha = 1.0;
        }
        
        // Movement logic moved to handleMovement called from Game.ts
    }

    public takeDamage(amount: number) {
        if (this.invulnerableTimer > 0) return; 
        this.hp -= amount;
        this.invulnerableTimer = this.invulnerableTime; 
        this.updateHpBar();
    }

    private updateHpBar() {
        this.hpBar.clear();
        this.hpBar.rect(-20, -4, 40, 6).fill(0x000000);
        
        const pct = Math.max(0, this.hp / this.maxHp);
        const width = 38 * pct; 
        
        let color = 0x2ecc71;
        if (pct < 0.5) color = 0xf1c40f;
        if (pct < 0.25) color = 0xe74c3c;

        this.hpBar.rect(-19, -3, width, 4).fill(color);
    }

    private isColliding(newX: number, newY: number): boolean {
        const r = 7; 
        const d = r * 0.707;

        return this.checkCollision(newX + r, newY) || 
               this.checkCollision(newX - r, newY) || 
               this.checkCollision(newX, newY + r) || 
               this.checkCollision(newX, newY - r) || 
               
               this.checkCollision(newX + d, newY + d) || 
               this.checkCollision(newX + d, newY - d) || 
               this.checkCollision(newX - d, newY + d) || 
               this.checkCollision(newX - d, newY - d);
    }
}