import { Container, Graphics, Ticker } from "pixi.js";

export class Particle extends Container {
  private g: Graphics;
  private vx: number;
  private vy: number;
  private life: number = 1.0; // Жизнь от 1.0 до 0.0
  private decay: number; // Скорость исчезновения

  public isDead: boolean = false;

  constructor(
    x: number,
    y: number,
    color: number,
    size: number = 4,
    speed: number = 2,
    lifeTime: number = 30,
  ) {
    super();
    this.x = x;
    this.y = y;

    // Случайное направление
    const angle = Math.random() * Math.PI * 2;
    // Случайная скорость
    const spd = Math.random() * speed;

    this.vx = Math.cos(angle) * spd;
    this.vy = Math.sin(angle) * spd;

    this.decay = 1 / lifeTime; // Если lifeTime 30 кадров, то decay ~0.033

    this.g = new Graphics();
    this.g.rect(-size / 2, -size / 2, size, size); // Центрируем
    this.g.fill(color);
    this.addChild(this.g);
  }

  public update(ticker: Ticker) {
    this.x += this.vx * ticker.deltaTime;
    this.y += this.vy * ticker.deltaTime;

    // Замедление (трение воздуха)
    this.vx *= 0.95;
    this.vy *= 0.95;

    // Исчезновение
    this.life -= this.decay * ticker.deltaTime;
    this.alpha = this.life;
    this.scale.set(this.life); // Уменьшаем размер

    if (this.life <= 0) {
      this.isDead = true;
    }
  }
}
