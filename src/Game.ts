import { Application, Container, Graphics } from 'pixi.js';
import { Camera } from './Camera';
import { Player } from './Player';
import { BuildingSystem } from './BuildingSystem'; // <--- Добавили

export class Game {
    private app: Application;
    public world: Container;
    private camera!: Camera;
    private player!: Player;
    private buildingSystem!: BuildingSystem; // <--- Добавили

    constructor(app: Application) {
        this.app = app;
        this.world = new Container();
        this.app.stage.addChild(this.world);
    }

    public init() {
        this.drawGrid();

        this.player = new Player();
        this.player.x = 200;
        this.player.y = 200;
        this.world.addChild(this.player);
        
        this.camera = new Camera(this.world, this.app.screen);
        this.camera.follow(this.player);

        // Инициализируем систему строительства
        this.buildingSystem = new BuildingSystem(this.app, this.world); // <--- Добавили

        this.app.ticker.add((ticker) => {
            this.player.update(ticker);
            this.camera.update();
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