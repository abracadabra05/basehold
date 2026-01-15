import { Container, Graphics, Ticker } from "pixi.js";
import { GameConfig } from "./GameConfig";

export class Player extends Container {
    public moveSpeed: number = GameConfig.PLAYER.BASE_SPEED;
    public maxHp: number = GameConfig.PLAYER.START_HP;
    public hp: number = GameConfig.PLAYER.START_HP;
    public damage: number = 1;
    
    // ПЕРКИ
    public bulletsPerShot: number = 1;
    public vampirism: number = 0;
    public hasShield: boolean = false;
    private shieldHP: number = 0;
    
    private bodyContainer: Container;
    private bodyGraphics: Graphics;
    private hpBar: Graphics;
    
    private mapSize: number;
    private invulnerableTimer: number = 0;
    private invulnerableTime: number = 60;
    private fireCooldown: number = 0;
    public fireRate: number = 10;
    
    public onShoot?: (x: number, y: number, tx: number, ty: number) => void;
    public checkCollision?: (x: number, y: number) => boolean;

    constructor(mapSize: number) {
        super();
        this.mapSize = mapSize;
        
        this.bodyContainer = new Container();
        this.addChild(this.bodyContainer);

        this.bodyGraphics = new Graphics();
        this.bodyGraphics.circle(0, 0, 16).fill(0xFFD700); 
        this.bodyGraphics.stroke({ width: 2, color: 0xDAA520 }); 
        this.bodyGraphics.rect(10, -6, 18, 12).fill(0x333333); 
        this.bodyGraphics.stroke({ width: 1, color: 0x000000 });
        this.bodyContainer.addChild(this.bodyGraphics);

        this.hpBar = new Graphics();
        this.hpBar.y = -30; 
        this.addChild(this.hpBar);
        this.updateHpBar();
        
        this.x = mapSize / 2;
        this.y = mapSize / 2;
    }

    public get rotationAngle(): number {
        return this.bodyContainer.rotation;
    }
    
    public set rotationAngle(val: number) {
        this.bodyContainer.rotation = val;
    }

    public lookAt(targetX: number, targetY: number) {
        const angle = Math.atan2(targetY - this.y, targetX - this.x);
        this.bodyContainer.rotation = angle;
    }

    public tryShoot(targetX: number, targetY: number) {
        if (this.fireCooldown <= 0) {
            const angle = this.bodyContainer.rotation;
            const barrelLen = 25;

            // Выстрел(ы)
            for (let i = 0; i < this.bulletsPerShot; i++) {
                // Если пуль больше одной, добавляем разброс
                let finalAngle = angle;
                if (this.bulletsPerShot > 1) {
                    finalAngle += (i - (this.bulletsPerShot - 1) / 2) * 0.2;
                }

                const spawnX = this.x + Math.cos(finalAngle) * barrelLen;
                const spawnY = this.y + Math.sin(finalAngle) * barrelLen;

                if (this.onShoot) {
                    // Рассчитываем новую цель на основе измененного угла для правильной траектории
                    const tx = spawnX + Math.cos(finalAngle) * 500;
                    const ty = spawnY + Math.sin(finalAngle) * 500;
                    this.onShoot(spawnX, spawnY, tx, ty);
                }
            }
            
            this.bodyGraphics.x = -5;
            this.fireCooldown = this.fireRate; 
        }
    }

    public handleMovement(vector: {x: number, y: number}, deltaTime: number) {
        if (vector.x !== 0 || vector.y !== 0) {
            const moveX = vector.x * this.moveSpeed * deltaTime;
            const moveY = vector.y * this.moveSpeed * deltaTime;

            if (!this.isColliding(this.x + moveX, this.y)) this.x += moveX;
            if (!this.isColliding(this.x, this.y + moveY)) this.y += moveY;
            
            this.x = Math.max(0, Math.min(this.mapSize, this.x));
            this.y = Math.max(0, Math.min(this.mapSize, this.y));
        }
    }

    public update(ticker: Ticker) {
        if (this.fireCooldown > 0) this.fireCooldown -= ticker.deltaTime;

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
        const color = pct > 0.5 ? 0x2ecc71 : pct > 0.25 ? 0xf1c40f : 0xe74c3c;
        this.hpBar.rect(-19, -3, 38 * pct, 4).fill(color);
    }

    private isColliding(newX: number, newY: number): boolean {
        if (!this.checkCollision) return false;
        // Используем радиус 14 для коллизии игрока (чуть меньше визуального 16)
        const r = 14; 
        const steps = 8; // Проверяем 8 точек по кругу
        for (let i = 0; i < steps; i++) {
            const angle = (i / steps) * Math.PI * 2;
            const px = newX + Math.cos(angle) * r;
            const py = newY + Math.sin(angle) * r;
            if (this.checkCollision(px, py)) return true;
        }
        return false;
    }
}
