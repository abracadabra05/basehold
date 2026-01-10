import { Container, Graphics, Ticker } from 'pixi.js';

export class Player extends Container {
    private keys: { [key: string]: boolean } = {};
    private speed: number = 5; // Скорость бега
    private body: Graphics;

    constructor() {
        super();
        
        // Рисуем игрока (желтый квадрат 32x32)
        this.body = new Graphics();
        this.body.rect(-16, -16, 32, 32); // Центрируем (0,0 будет в центре квадрата)
        this.body.fill(0xFFD700); // Золотой цвет
        this.addChild(this.body);

        this.initInput();
    }

    private initInput() {
        // Нажатие
        window.addEventListener('keydown', (e) => { 
            this.keys[e.code] = true; 
        });

        // Отпускание
        window.addEventListener('keyup', (e) => { 
            this.keys[e.code] = false; 
        });

        // ФИКС: Сброс всех кнопок при потере фокуса (Alt+Tab или клик вне окна)
        window.addEventListener('blur', () => {
            this.keys = {}; 
        });
    }

    public update(ticker: Ticker) {
        // Нормализация диагонального движения (чтобы по диагонали не бежал быстрее)
        let dx = 0;
        let dy = 0;

        if (this.keys['KeyW'] || this.keys['ArrowUp']) dy -= 1;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) dy += 1;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) dx -= 1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) dx += 1;

        if (dx !== 0 || dy !== 0) {
            // Длина вектора
            const length = Math.sqrt(dx * dx + dy * dy);
            // Нормализация и умножение на скорость
            this.x += (dx / length) * this.speed * ticker.deltaTime;
            this.y += (dy / length) * this.speed * ticker.deltaTime;
        }
    }
}