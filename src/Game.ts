import { Application, Container, Graphics } from 'pixi.js';
import { Camera } from './Camera';

export class Game {
    private app: Application;
    public world: Container;
    private camera!: Camera; // ! означает, что мы инициализируем это позже (в init)

    constructor(app: Application) {
        this.app = app;
        this.world = new Container();
        
        // Начальная позиция мира
        this.world.x = 100;
        this.world.y = 100;
        
        this.app.stage.addChild(this.world);
    }

    public init() {
        this.drawGrid();
        
        // Создаем камеру
        this.camera = new Camera(this.world);

        // Добавляем камеру в главный цикл обновлений Pixi (выполняется каждый кадр)
        this.app.ticker.add((ticker) => {
            this.camera.update(ticker);
        });
    }

    private drawGrid() {
        const gridSize = 40;
        const mapSize = 100;
        const color = 0x444444;

        const g = new Graphics();

        for (let x = 0; x <= mapSize; x++) {
            g.rect(x * gridSize, 0, 1, mapSize * gridSize); 
            g.fill(color);
        }

        for (let y = 0; y <= mapSize; y++) {
            g.rect(0, y * gridSize, mapSize * gridSize, 1);
            g.fill(color);
        }

        this.world.addChild(g);
    }
}