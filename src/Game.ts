import { Application, Container, Graphics } from 'pixi.js';
import { Camera } from './Camera';
import { Player } from './Player';
import { BuildingSystem } from './BuildingSystem';
import { UIManager } from './UIManager'; // <--- Импорт

export class Game {
    private app: Application;
    public world: Container;
    private camera!: Camera;
    private player!: Player;
    private buildingSystem!: BuildingSystem;
    private uiManager!: UIManager; // <--- UI

    constructor(app: Application) {
        this.app = app;
        this.world = new Container();
        this.app.stage.addChild(this.world);
    }

    public init() {
        this.drawGrid();

        this.buildingSystem = new BuildingSystem(this.app, this.world);

        // Инициализируем UI и говорим ему: "Когда нажали кнопку, передай тип в buildingSystem"
        this.uiManager = new UIManager((type) => {
            this.buildingSystem.setBuildingType(type);
        });

        this.player = new Player(this.buildingSystem.isOccupied.bind(this.buildingSystem));
        this.player.x = 200;
        this.player.y = 200;
        this.world.addChild(this.player);
        
        this.buildingSystem.setPlayer(this.player);

        this.camera = new Camera(this.world, this.app.screen);
        this.camera.follow(this.player);

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