import { Application, Container, Graphics } from 'pixi.js';

export class Game {
    private app: Application;
    public world: Container; // Контейнер для всех объектов мира (камера будет двигать его)

    constructor(app: Application) {
        this.app = app;
        this.world = new Container();
        
        // Центрируем мир для начала, чтобы видеть сетку
        this.world.x = 0;
        this.world.y = 0;
        
        this.app.stage.addChild(this.world);
    }

    public init() {
        this.drawGrid();
    }

    private drawGrid() {
        const gridSize = 40; // Размер клетки (40x40 пикселей)
        const mapSize = 100; // Размер карты в клетках (100x100)
        const color = 0x444444; // Цвет линий (серый)

        const g = new Graphics();

        // Рисуем вертикальные линии
        for (let x = 0; x <= mapSize; x++) {
            // rect(x, y, width, height) - используем прямоугольники как тонкие линии для лучшей производительности
            g.rect(x * gridSize, 0, 1, mapSize * gridSize); 
            g.fill(color);
        }

        // Рисуем горизонтальные линии
        for (let y = 0; y <= mapSize; y++) {
            g.rect(0, y * gridSize, mapSize * gridSize, 1);
            g.fill(color);
        }

        this.world.addChild(g);
    }
}