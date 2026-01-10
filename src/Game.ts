import { Application, Container, Graphics } from 'pixi.js';
import { Camera } from './Camera';
import { Player } from './Player';
import { BuildingSystem } from './BuildingSystem';
import { UIManager } from './UIManager';
import { ResourceManager } from './ResourceManager';
import { ResourceNode } from './ResourceNode';
import { Enemy } from './Enemy';
import { WaveManager } from './WaveManager'; // <--- Импорт

export class Game {
    private app: Application;
    public world: Container;
    private camera!: Camera;
    public player!: Player; // <--- Public (нужен для определения позиции спавна)
    private buildingSystem!: BuildingSystem;
    private uiManager!: UIManager;
    public resourceManager!: ResourceManager;
    public resources: ResourceNode[] = [];
    public enemies: Enemy[] = [];
    
    private waveManager!: WaveManager; // <--- Менеджер волн

    constructor(app: Application) {
        this.app = app;
        this.world = new Container();
        this.app.stage.addChild(this.world);
    }

    public init() {
        this.drawGrid();

        this.resourceManager = new ResourceManager();
        this.resourceManager.addMetal(50); 
        this.generateResources();

        this.buildingSystem = new BuildingSystem(this.app, this.world);
        this.buildingSystem.setResources(this.resources, this.resourceManager);

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

        // --- Инициализация волн ---
        this.waveManager = new WaveManager((count) => {
            this.spawnWave(count);
        });
        // --------------------------

        this.app.ticker.add((ticker) => {
            this.player.update(ticker);
            this.camera.update();
            this.buildingSystem.update(ticker);
            this.enemies.forEach(enemy => enemy.update(ticker));
            
            // Обновляем таймер волны
            this.waveManager.update(ticker);
        });
    }

    // Логика спавна группы врагов
    private spawnWave(count: number) {
        const spawnRadius = 800; // Спавним за пределами экрана (примерно)

        for (let i = 0; i < count; i++) {
            // Случайный угол
            const angle = Math.random() * Math.PI * 2;
            
            // Координаты вокруг игрока
            const x = this.player.x + Math.cos(angle) * spawnRadius;
            const y = this.player.y + Math.sin(angle) * spawnRadius;

            this.spawnEnemy(x, y);
        }
    }

    // Сделали PUBLIC, чтобы можно было вызывать откуда угодно
    public spawnEnemy(x: number, y: number) {
        const enemy = new Enemy(
            this.player, 
            this.buildingSystem.isOccupied.bind(this.buildingSystem)
        );
        enemy.x = x;
        enemy.y = y;
        
        this.world.addChild(enemy);
        this.enemies.push(enemy);
    }

    private generateResources() {
        const gridSize = 40;
        for (let i = 0; i < 20; i++) {
            const node = new ResourceNode(gridSize);
            let rx = Math.floor(Math.random() * 100) * gridSize;
            let ry = Math.floor(Math.random() * 100) * gridSize;
            if (Math.abs(rx - 200) < 200 && Math.abs(ry - 200) < 200) continue; 
            node.x = rx;
            node.y = ry;
            this.world.addChild(node);
            this.resources.push(node);
        }
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