import { Container, Graphics, Ticker } from 'pixi.js';
import type { Building } from './Building';
import { GameConfig } from './GameConfig';
import type { Pathfinder, PathPoint } from './Pathfinder';

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

    // Pathfinding
    private pathfinder: Pathfinder | null = null;
    private currentPath: PathPoint[] = [];
    private pathRecalcTimer: number = 0;
    private pathRecalcInterval: number = 60; // Recalculate every ~1 second
    private currentWaypointIndex: number = 0;

    constructor(
        target: Container,
        player: Container,
        checkCollision: (x: number, y: number) => Building | null,
        type: EnemyType = 'basic',
        pathfinder: Pathfinder | null = null
    ) {
        super();
        this.target = target;
        this.player = player;
        this.checkCollision = checkCollision;
        this.type = type;
        this.pathfinder = pathfinder;

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
                this.body.moveTo(0, -stats.radius).lineTo(stats.radius, -stats.radius / 2).lineTo(stats.radius, stats.radius / 2).lineTo(0, stats.radius).lineTo(-stats.radius, stats.radius / 2).lineTo(-stats.radius, -stats.radius / 2).fill(color);
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

    // Stuck detection
    private stuckTimer: number = 0;
    private slideDirection: number = 1; // 1 = clockwise, -1 = counter-clockwise

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

        // ATTACK LOGIC
        let isAttacking = false;

        if (dist < this.attackRange) {
            // Shooter logic
            if (this.type === 'shooter') {
                this.vx = 0;
                this.vy = 0;

                if (this.attackTimer <= 0) {
                    if (this.onShoot) {
                        this.onShoot(this.x, this.y, targetX, targetY, this.damage);
                    }
                    this.attackTimer = this.attackSpeed;
                }
                return;
            }

            // Melee/Boss Logic - Check line-of-sight before attacking!
            const dirX = dx / dist;
            const dirY = dy / dist;
            const checkDist = Math.min(dist, 20);
            const checkX = this.x + dirX * checkDist;
            const checkY = this.y + dirY * checkDist;

            const obstacle = this.checkCollision(checkX, checkY);

            // If obstacle exists and it's NOT the target — don't attack core through wall
            if (obstacle && obstacle !== this.target) {
                // Don't attack indestructible rocks — navigate around instead
                if (obstacle.hp === Infinity || !isFinite(obstacle.hp)) {
                    // Will be handled by movement below
                } else {
                    this.attackBuilding(obstacle);
                    return;
                }
            } else if (!obstacle) {
                // Clear line of sight — can attack
                this.vx = 0;
                this.vy = 0;
                isAttacking = true;

                if (this.attackTimer <= 0) {
                    const originalScale = this.scale.x;
                    this.scale.set(originalScale * 1.1);
                    setTimeout(() => this.scale.set(originalScale), 100);

                    if ('takeDamage' in this.target) {
                        (this.target as any).takeDamage(this.damage);
                    } else if (this.target === this.player) {
                        (this.player as any).takeDamage(this.damage);
                    }

                    if (this.onHit) this.onHit();
                    this.attackTimer = this.attackSpeed;
                }
            }
            // If obstacle is indestructible and blocks us, fall through to movement
        }

        if (!isAttacking) {
            this.moveToTarget(ticker, targetX, targetY, dist);
        }
    }

    /**
     * Movement with A* pathfinding.
     * Uses pathfinder to compute waypoints around rocks, with fallback to direct movement.
     */
    private moveToTarget(ticker: Ticker, targetX: number, targetY: number, distToTarget: number) {
        const effectiveSpeed = this.speed * this.speedMultiplier;
        const prevX = this.x;
        const prevY = this.y;

        // --- Path recalculation ---
        this.pathRecalcTimer += ticker.deltaTime;
        if (this.pathRecalcTimer >= this.pathRecalcInterval || this.currentPath.length === 0) {
            this.pathRecalcTimer = 0;
            this.recalculatePath(targetX, targetY);
        }

        // --- Follow path waypoints ---
        if (this.currentPath.length > 0 && this.currentWaypointIndex < this.currentPath.length) {
            const wp = this.currentPath[this.currentWaypointIndex];
            const wpDx = wp.x - this.x;
            const wpDy = wp.y - this.y;
            const wpDist = Math.sqrt(wpDx * wpDx + wpDy * wpDy);

            if (wpDist < 15) {
                // Reached waypoint — advance
                this.currentWaypointIndex++;
                if (this.currentWaypointIndex >= this.currentPath.length) {
                    // Reached end of path
                    this.currentPath = [];
                    this.currentWaypointIndex = 0;
                }
            } else {
                // Move toward waypoint
                const dirX = wpDx / wpDist;
                const dirY = wpDy / wpDist;
                const moveX = dirX * effectiveSpeed * ticker.deltaTime;
                const moveY = dirY * effectiveSpeed * ticker.deltaTime;

                // Collision check on each axis
                const checkDist = this.hitboxRadius + 5;

                const collisionX = this.isColliding(this.x + moveX + dirX * checkDist, this.y);
                const collisionY = this.isColliding(this.x, this.y + moveY + dirY * checkDist);

                if (!collisionX) {
                    const distToPlayer = Math.sqrt(Math.pow(this.x + moveX - this.player.x, 2) + Math.pow(this.y - this.player.y, 2));
                    if (distToPlayer > 25) this.x += moveX;
                } else if (collisionX && !(collisionX.hp === Infinity || !isFinite(collisionX.hp))) {
                    // Hit a destructible building — attack it
                    this.attackBuilding(collisionX);
                }

                if (!collisionY) {
                    const distToPlayer = Math.sqrt(Math.pow(this.x - this.player.x, 2) + Math.pow(this.y + moveY - this.player.y, 2));
                    if (distToPlayer > 25) this.y += moveY;
                } else if (collisionY && !(collisionY.hp === Infinity || !isFinite(collisionY.hp))) {
                    this.attackBuilding(collisionY);
                }
            }
        } else {
            // No path — fallback: direct movement with slide
            this.moveDirectFallback(ticker, targetX, targetY, distToTarget, effectiveSpeed);
        }

        // --- Stuck detection ---
        const movedDist = Math.abs(this.x - prevX) + Math.abs(this.y - prevY);
        if (movedDist < 0.5) {
            this.stuckTimer += ticker.deltaTime;
            if (this.stuckTimer > 30) {
                // Stuck — force path recalculation and flip slide direction
                this.slideDirection *= -1;
                this.stuckTimer = 0;
                this.pathRecalcTimer = this.pathRecalcInterval; // Force recalc next frame
                this.currentPath = [];
            }
        } else {
            this.stuckTimer = 0;
        }
        this.vx = this.x - prevX;
        this.vy = this.y - prevY;
    }

    private recalculatePath(targetX: number, targetY: number) {
        if (this.pathfinder) {
            this.currentPath = this.pathfinder.findPath(this.x, this.y, targetX, targetY);
            this.currentWaypointIndex = 0;

            // Skip first waypoints that are very close (prevent jitter)
            while (this.currentWaypointIndex < this.currentPath.length - 1) {
                const wp = this.currentPath[this.currentWaypointIndex];
                const d = Math.sqrt(Math.pow(wp.x - this.x, 2) + Math.pow(wp.y - this.y, 2));
                if (d < 15) {
                    this.currentWaypointIndex++;
                } else {
                    break;
                }
            }
        } else {
            // No pathfinder — direct path
            this.currentPath = [{ x: targetX, y: targetY }];
            this.currentWaypointIndex = 0;
        }
    }

    /** Fallback direct movement with slide for when pathfinding has no result */
    private moveDirectFallback(ticker: Ticker, targetX: number, targetY: number, dist: number, effectiveSpeed: number) {
        if (dist < 1) return;

        const dirX = (targetX - this.x) / dist;
        const dirY = (targetY - this.y) / dist;
        const moveX = dirX * effectiveSpeed * ticker.deltaTime;
        const moveY = dirY * effectiveSpeed * ticker.deltaTime;
        const checkDist = this.hitboxRadius + 5;

        const collisionX = this.isColliding(this.x + moveX + dirX * checkDist, this.y);
        const collisionY = this.isColliding(this.x, this.y + moveY + dirY * checkDist);

        const isRockX = collisionX && (collisionX.hp === Infinity || !isFinite(collisionX.hp));
        const isRockY = collisionY && (collisionY.hp === Infinity || !isFinite(collisionY.hp));

        if (!collisionX) {
            this.x += moveX;
        } else if (isRockX) {
            const slideY = dirY !== 0 ? Math.sign(dirY) : this.slideDirection;
            const slideAmount = effectiveSpeed * ticker.deltaTime;
            if (!this.isColliding(this.x, this.y + slideY * (checkDist + slideAmount))) {
                this.y += slideY * slideAmount;
            }
        } else {
            this.attackBuilding(collisionX);
        }

        if (!collisionY) {
            this.y += moveY;
        } else if (isRockY) {
            const slideX = dirX !== 0 ? Math.sign(dirX) : this.slideDirection;
            const slideAmount = effectiveSpeed * ticker.deltaTime;
            if (!this.isColliding(this.x + slideX * (checkDist + slideAmount), this.y)) {
                this.x += slideX * slideAmount;
            }
        } else {
            this.attackBuilding(collisionY);
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
