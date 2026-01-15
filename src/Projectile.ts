import { Container, Graphics, Ticker } from 'pixi.js';

export class Projectile extends Container {
    private graphics: Graphics;
    private trail: Graphics; // Хвост
    private speed: number = 10;
    private vx: number = 0;
    private vy: number = 0;
    
    public damage: number = 0; 
    public shouldDestroy: boolean = false;
    public isEnemy: boolean = false;

    // Для трейла сохраняем последние позиции (упрощенно - просто линию назад)
    private lastX: number = 0;
    private lastY: number = 0;

    constructor() {
        super();
        
        // Сначала трейл, чтобы он был ПОД пулей
        this.trail = new Graphics();
        this.addChild(this.trail);

        this.graphics = new Graphics();
        this.graphics.circle(0, 0, 4);
        this.addChild(this.graphics);
    }

    public init(x: number, y: number, targetX: number, targetY: number, damage: number, isEnemy: boolean = false) {
        this.x = x;
        this.y = y;
        this.lastX = x;
        this.lastY = y;
        this.damage = damage;
        this.isEnemy = isEnemy;
        this.shouldDestroy = false;
        this.visible = true;

        // Цвет
        this.graphics.clear();
        this.graphics.circle(0, 0, 4);
        this.graphics.fill(isEnemy ? 0x00FF00 : 0xFFFF00);
        
        // Очищаем старый трейл
        this.trail.clear();

        // Вычисляем скорость
        const dx = targetX - x;
        const dy = targetY - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
            this.vx = (dx / dist) * this.speed;
            this.vy = (dy / dist) * this.speed;
        } else {
            this.vx = this.speed; // Fallback
            this.vy = 0;
        }
    }

    public update(ticker: Ticker) {
        // Запоминаем позицию для трейла
        this.lastX = this.x;
        this.lastY = this.y;

        this.x += this.vx * ticker.deltaTime;
        this.y += this.vy * ticker.deltaTime;

        // Рисуем трейл от прошлой позиции к текущей (смаз)
        // Чтобы он был длиннее, можно хранить историю, но пока сделаем просто "Motion Blur" линию
        this.trail.clear();
        // Длина хвоста зависит от скорости. Рисуем линию назад.
        this.trail.moveTo(0, 0); // В локальных координатах пули это (0,0)
        this.trail.lineTo(this.lastX - this.x, this.lastY - this.y); // Линия назад
        this.trail.stroke({ width: 3, color: this.isEnemy ? 0x00FF00 : 0xFFFF00, alpha: 0.5 });


        if (Math.abs(this.x) > 5000 || Math.abs(this.y) > 5000) {
            this.shouldDestroy = true;
        }
    }
}
