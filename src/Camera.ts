import { Container, Ticker } from 'pixi.js';

export class Camera {
  private world: Container;
  private target: Container | null = null;
  private appScreen: { width: number; height: number };

    // Параметры тряски
    private shakeTimer: number = 0;
    private shakeIntensity: number = 0;

    constructor(world: Container, appScreen: { width: number, height: number }) {
        this.world = world;
        this.appScreen = appScreen;
    }

  public follow(target: Container) {
    this.target = target;
  }

    // Метод запуска тряски
    // intensity: сила (например, 5 - слабо, 20 - сильно)
    // duration: длительность в секундах (например, 0.5)
    public shake(intensity: number, duration: number) {
        this.shakeIntensity = intensity;
        this.shakeTimer = duration;
    }

    public update(ticker: Ticker) {
        if (!this.target) return;

        const screenCenterX = this.appScreen.width / 2;
        const screenCenterY = this.appScreen.height / 2;

        let targetX = -this.target.x + screenCenterX;
        let targetY = -this.target.y + screenCenterY;

        // Применяем тряску
        if (this.shakeTimer > 0) {
            this.shakeTimer -= ticker.deltaTime / 60; // Переводим тики в секунды (примерно)
            
            // Случайное смещение
            const offsetX = (Math.random() - 0.5) * this.shakeIntensity;
            const offsetY = (Math.random() - 0.5) * this.shakeIntensity;
            
            targetX += offsetX;
            targetY += offsetY;

            // Плавно затухаем тряску
            if (this.shakeTimer <= 0) {
                this.shakeTimer = 0;
                this.shakeIntensity = 0;
            }
        }

        // Жесткая привязка (без интерполяции, чтобы не мылило при тряске)
        this.world.x = targetX;
        this.world.y = targetY;
    }
    
    public resize(width: number, height: number) {
        this.appScreen.width = width;
        this.appScreen.height = height;
    }
}
