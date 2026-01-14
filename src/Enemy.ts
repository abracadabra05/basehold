import { Container, Graphics, Ticker } from "pixi.js";
import type { Building } from "./Building";

// Добавляем 'boss'
export type EnemyType = "basic" | "fast" | "tank" | "boss";

export class Enemy extends Container {
  private body: Graphics;
  private target: Container;
  private speed: number = 2;
  private checkCollision: (x: number, y: number) => Building | null;

  public hp: number = 3;
  public isDead: boolean = false;

  private attackTimer: number = 0;
  private attackSpeed: number = 60;
  private damage: number = 5;
  public type: EnemyType;

  // НОВОЕ ПОЛЕ: Радиус для попадания пуль
  public hitboxRadius: number = 15;

  constructor(
    target: Container,
    checkCollision: (x: number, y: number) => Building | null,
    type: EnemyType = "basic",
  ) {
    super();
    this.target = target;
    this.checkCollision = checkCollision;
    this.type = type;

    this.body = new Graphics();

    switch (type) {
      case "basic":
        this.speed = 2;
        this.hp = 3;
        this.damage = 5;
        this.hitboxRadius = 15; // Стандартный
        this.body.rect(-12, -12, 24, 24).fill(0xff0000);
        break;

      case "fast":
        this.speed = 3.5;
        this.hp = 1;
        this.damage = 2;
        this.hitboxRadius = 12; // Маленький
        this.body.rect(-8, -8, 16, 16).fill(0xf1c40f);
        break;

      case "tank":
        this.speed = 1.0;
        this.hp = 15;
        this.damage = 20;
        this.hitboxRadius = 20; // Чуть больше
        this.body.rect(-16, -16, 32, 32).fill(0x8b0000);
        break;

      case "boss":
        this.speed = 0.6;
        this.hp = 500;
        this.damage = 100;
        this.attackSpeed = 120;
        this.hitboxRadius = 45; // ОГРОМНЫЙ ХИТБОКС (почти всё тело)

        this.body.rect(-40, -40, 80, 80).fill(0x2c3e50);
        this.body.stroke({ width: 4, color: 0x9b59b6 });
        break;
    }

    this.addChild(this.body);
  }

  public takeDamage(amount: number) {
    this.hp -= amount;
    this.body.tint = 0xffffff;
    setTimeout(() => {
      this.body.tint = 0xffffff;
    }, 50); // Тинт в v8 сбрасывается иначе, но оставим логику
    if (this.hp <= 0) {
      this.isDead = true;
    }
  }

  public update(ticker: Ticker) {
    if (!this.target) return;

    if (this.attackTimer > 0) this.attackTimer -= ticker.deltaTime;

    // --- ИСПРАВЛЕНИЕ НАЧАЛО ---
    let targetX = this.target.x;
    let targetY = this.target.y;

    // Если у цели есть свойство 'buildingType' (значит это Здание),
    // смещаем точку прицеливания в центр клетки (40 / 2 = 20).
    // Используем 'in' для безопасной проверки свойства в JS/TS
    if ("buildingType" in this.target) {
      targetX += 20;
      targetY += 20;
    }

    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    // Для босса дистанция атаки больше, так как он большой
    const attackRange = this.type === "boss" ? 50 : 5;
    if (dist < attackRange) return;

    const vx = dx / dist;
    const vy = dy / dist;
    const moveX = vx * this.speed * ticker.deltaTime;
    const moveY = vy * this.speed * ticker.deltaTime;

    const buildingX = this.isColliding(this.x + moveX, this.y);
    if (!buildingX) this.x += moveX;
    else this.attackBuilding(buildingX);

    const buildingY = this.isColliding(this.x, this.y + moveY);
    if (!buildingY) this.y += moveY;
    else this.attackBuilding(buildingY);
  }

  private attackBuilding(building: Building) {
    if (this.attackTimer <= 0) {
      building.takeDamage(this.damage);
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
