import { Container, Graphics, Ticker } from 'pixi.js';
import type { Building } from './Building';
import { GameConfig } from './GameConfig';

export type EnemyType = 'basic' | 'fast' | 'tank' | 'boss' | 'kamikaze' | 'shooter' | 'healer' | 'splitter' | 'shieldbearer' | 'miniboss';

export class Enemy extends Container {
    private body: Graphics;
    private target: Container; 
    private player: Container; // Добавили поле
    private speed: number = 2; 
    private checkCollision: (x: number, y: number) => Building | null;
    
    public hp: number = 3; 
    public isDead: boolean = false;
    
    public vx: number = 0;
    public vy: number = 0;

    private attackTimer: number = 0;
    private attackSpeed: number = 60;
    public damage: number = 5; 
    public type: EnemyType;
    public hitboxRadius: number = 15; 
    
    private attackRange: number = 5;

    // Колбеки
    public onShoot?: (x: number, y: number, tx: number, ty: number, damage: number) => void;
    public onExplode?: (x: number, y: number, damage: number, radius: number) => void;
    public onHit?: () => void;
    public onSplit?: (x: number, y: number, count: number) => void;
    public onHeal?: (enemies: Enemy[]) => void;

    // Special abilities
    private healRange: number = 0;
    private healAmount: number = 0;
    private healTimer: number = 0;
    private shieldRange: number = 0;
    public isShielded: boolean = false;
    public splitCount: number = 0;
    public speedMultiplier: number = 1.0;

    constructor(
        target: Container, 
        player: Container, // Добавили аргумент
        checkCollision: (x: number, y: number) => Building | null,
        type: EnemyType = 'basic'
    ) {
        super();
        this.target = target;
        this.player = player; // Сохранили
        this.checkCollision = checkCollision;
        this.type = type;

        this.body = new Graphics();
        
        // Получаем конфиг для данного типа
        const configKey = type.toUpperCase() as keyof typeof GameConfig.ENEMIES;
        const stats = GameConfig.ENEMIES[configKey];

        if (stats) {
            this.speed = stats.speed;
            this.hp = stats.hp;
            this.damage = stats.damage;
            this.hitboxRadius = stats.radius;
            // attackRange берем из конфига если есть, иначе дефолт (5 для мили)
            if ('attackRange' in stats) {
                this.attackRange = (stats as any).attackRange;
            } else {
                this.attackRange = 5;
            }
            // attackSpeed пока хардкод или дефолт, можно добавить в конфиг позже
             if (type === 'boss' || type === 'shooter') {
                 this.attackSpeed = 120;
             }
             
             // Special stats for v2.0 enemies
             if ('healRange' in stats) {
                 this.healRange = (stats as any).healRange;
                 this.healAmount = (stats as any).healAmount;
             }
             if ('shieldRange' in stats) {
                 this.shieldRange = (stats as any).shieldRange;
             }
             if ('splitCount' in stats) {
                 this.splitCount = (stats as any).splitCount;
             }

             // Рисуем тело
             const color = stats.color;
             if (type === 'boss') {
                 this.body.rect(-40, -40, 80, 80).fill(color).stroke({ width: 4, color: 0x9b59b6 });
             } else if (type === 'miniboss') {
                 this.body.rect(-30, -30, 60, 60).fill(color).stroke({ width: 3, color: 0xffffff });
             } else if (type === 'kamikaze') {
                 this.body.circle(0, 0, stats.radius).fill(color);
             } else if (type === 'shooter') {
                 this.body.moveTo(0, -15).lineTo(10, 10).lineTo(-10, 10).fill(color);
             } else if (type === 'healer') {
                 // Cross shape for healer
                 this.body.rect(-5, -15, 10, 30).fill(color);
                 this.body.rect(-15, -5, 30, 10).fill(color);
             } else if (type === 'splitter') {
                 // Diamond shape
                 this.body.moveTo(0, -stats.radius).lineTo(stats.radius, 0).lineTo(0, stats.radius).lineTo(-stats.radius, 0).fill(color);
             } else if (type === 'shieldbearer') {
                 // Shield shape
                 this.body.moveTo(0, -stats.radius).lineTo(stats.radius, -stats.radius/2).lineTo(stats.radius, stats.radius/2).lineTo(0, stats.radius).lineTo(-stats.radius, stats.radius/2).lineTo(-stats.radius, -stats.radius/2).fill(color);
                 this.body.circle(0, 0, stats.radius * 1.5).stroke({ width: 2, color: 0x00FFFF, alpha: 0.5 });
             } else {
                 // Basic, Fast, Tank - прямоугольники
                 const s = stats.radius * 2; // примерно под размер радиуса
                 this.body.rect(-stats.radius, -stats.radius, s, s).fill(color);
             }
        }
        
        this.addChild(this.body);
    }
    
    public takeDamage(amount: number) {
        // If shielded, reduce damage by 50%
        const actualDamage = this.isShielded ? amount * 0.5 : amount;
        this.hp -= actualDamage;
        this.body.tint = this.isShielded ? 0x00FFFF : 0xFFFFFF;
        setTimeout(() => { this.body.tint = 0xFFFFFF; }, 50);
        if (this.hp <= 0) {
            // Handle splitter death
            if (this.type === 'splitter' && this.splitCount > 0 && this.onSplit) {
                this.onSplit(this.x, this.y, this.splitCount);
            }
            this.isDead = true;
        }
    }

    public heal(amount: number) {
        this.hp = Math.min(this.hp + amount, GameConfig.ENEMIES[this.type.toUpperCase() as keyof typeof GameConfig.ENEMIES]?.hp || this.hp);
        this.body.tint = 0x00FF00;
        setTimeout(() => { this.body.tint = 0xFFFFFF; }, 100);
    }

    public setShielded(shielded: boolean) {
        this.isShielded = shielded;
        this.body.alpha = shielded ? 0.8 : 1.0;
    }

    public updateAuras(enemies: Enemy[]) {
        // Healer aura
        if (this.type === 'healer' && this.healRange > 0) {
            this.healTimer++;
            if (this.healTimer >= 60) { // Heal every second
                this.healTimer = 0;
                for (const other of enemies) {
                    if (other === this || other.isDead) continue;
                    const dx = other.x - this.x;
                    const dy = other.y - this.y;
                    if (Math.sqrt(dx * dx + dy * dy) <= this.healRange) {
                        other.heal(this.healAmount);
                    }
                }
            }
        }

        // Shield bearer aura
        if (this.type === 'shieldbearer' && this.shieldRange > 0) {
            for (const other of enemies) {
                if (other === this || other.isDead) continue;
                const dx = other.x - this.x;
                const dy = other.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                // Shield enemies in front of the shieldbearer (towards core)
                if (dist <= this.shieldRange) {
                    other.setShielded(true);
                } else if (other.isShielded) {
                    other.setShielded(false);
                }
            }
        }
    }

    public update(ticker: Ticker) {
        if (!this.target) return;
        if (this.attackTimer > 0) this.attackTimer -= ticker.deltaTime;

        if (this.type === 'kamikaze') {
            this.body.scale.set(1 + Math.sin(Date.now() / 100) * 0.2);
        }

        let targetX = this.target.x;
        let targetY = this.target.y;
        
        if ('buildingType' in this.target) { targetX += 20; targetY += 20; }
        
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // ЛОГИКА АТАКИ
        if (dist < this.attackRange) {
            this.vx = 0;
            this.vy = 0;
            
            if (this.type === 'shooter') {
                if (this.attackTimer <= 0) {
                    if (this.onShoot) {
                        this.onShoot(this.x, this.y, targetX, targetY, this.damage);
                    }
                    this.attackTimer = this.attackSpeed;
                }
                return;
            }
            // Boss и другие милишники идут таранить, кроме момента самого удара
        }

        const dirX = dx / dist;
        const dirY = dy / dist;

        const effectiveSpeed = this.speed * this.speedMultiplier;
        this.vx = dirX * effectiveSpeed;
        this.vy = dirY * effectiveSpeed;

        const moveX = this.vx * ticker.deltaTime;
        const moveY = this.vy * ticker.deltaTime;

        const checkDist = this.hitboxRadius + 5;
        const checkX = this.x + moveX + (dirX * checkDist);
        const checkY = this.y + moveY + (dirY * checkDist);

        const buildingX = this.isColliding(checkX, this.y); 
        if (!buildingX) {
             const distToPlayer = Math.sqrt(Math.pow(checkX - this.player.x, 2) + Math.pow(this.y - this.player.y, 2));
             if (distToPlayer > 25 || this.type === 'boss') {
                this.x += moveX; 
             }
        } else {
             this.attackBuilding(buildingX);
        }

        const buildingY = this.isColliding(this.x, checkY);
        if (!buildingY) {
             const distToPlayer = Math.sqrt(Math.pow(this.x - this.player.x, 2) + Math.pow(checkY - this.player.y, 2));
             if (distToPlayer > 25 || this.type === 'boss') {
                this.y += moveY; 
             }
        } else {
             this.attackBuilding(buildingY);
        }
    }

    private attackBuilding(building: Building) {
        this.vx = 0; 
        this.vy = 0;
        
        if (this.type === 'kamikaze') {
            if (this.onExplode) {
                this.onExplode(this.x, this.y, this.damage, 100); 
            }
            this.isDead = true; 
            return;
        }

        if (this.attackTimer <= 0) {
            building.takeDamage(this.damage);
            if (this.onHit) this.onHit(); // Триггерим звук и тряску
            
            if (building.thornsDamage > 0) {
                this.takeDamage(building.thornsDamage);
            }

            this.attackTimer = this.attackSpeed;
            const originalScale = this.scale.x;
            this.scale.set(originalScale * 1.1); 
            setTimeout(() => this.scale.set(originalScale), 100);
        }
    }

    private isColliding(newX: number, newY: number): Building | null { 
        return this.checkCollision(newX, newY); 
    }
}
