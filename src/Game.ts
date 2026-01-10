import { Application, Container, Graphics } from 'pixi.js';
import { Camera } from './Camera';
import { Player } from './Player';

export class Game {
    private app: Application;
    public world: Container;
    private camera!: Camera;
    private player!: Player;

    constructor(app: Application) {
        this.app = app;
        this.world = new Container();
        this.app.stage.addChild(this.world);
    }

    public init() {
        this.drawGrid();

        // 1. Создаем игрока и добавляем в мир
        this.player = new Player();
        this.player.x = 200; // Стартовая позиция
        this.player.y = 200;
        this.world.addChild(this.player);
        
        // 2. Создаем камеру
        this.camera = new Camera(this.world, this.app.screen);
        this.camera.follow(this.player);

        // 3. Главный цикл
        this.app.ticker.add((ticker) => {
            this.player.update(ticker); // Двигаем игрока
            this.camera.update();       // Камера летит за игроком
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