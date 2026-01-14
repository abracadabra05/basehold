import { Container, Graphics, Ticker } from "pixi.js";

export class Projectile extends Container {
  private speed: number = 10;
  private vx: number;
  private vy: number;
  public damage: number; // Убираем = 1, теперь это задается в конструкторе
  public shouldDestroy: boolean = false;

  // Добавляем damage в конструктор
  constructor(
    x: number,
    y: number,
    targetX: number,
    targetY: number,
    damage: number,
  ) {
    super();
    this.x = x;
    this.y = y;
    this.damage = damage; // Запоминаем урон

    const g = new Graphics();
    g.circle(0, 0, 4);
    g.fill(0xffff00);
    this.addChild(g);

    const dx = targetX - x;
    const dy = targetY - y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    this.vx = (dx / dist) * this.speed;
    this.vy = (dy / dist) * this.speed;
  }

  public update(ticker: Ticker) {
    this.x += this.vx * ticker.deltaTime;
    this.y += this.vy * ticker.deltaTime;

    if (Math.abs(this.x) > 5000 || Math.abs(this.y) > 5000) {
      this.shouldDestroy = true;
    }
  }
}
