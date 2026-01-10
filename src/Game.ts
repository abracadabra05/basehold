import { Application, Container, Graphics } from 'pixi.js';
import { Camera } from './Camera';
import { Player } from './Player';
import { BuildingSystem } from './BuildingSystem';
import { UIManager } from './UIManager';
import { ResourceManager } from './ResourceManager';
import { ResourceNode } from './ResourceNode';
import { Enemy } from './Enemy';
import { WaveManager } from './WaveManager';
import { Projectile } from './Projectile';

export class Game {
    private app: Application;
    public world: Container;
    private camera!: Camera;
    public player!: Player;
    private buildingSystem!: BuildingSystem;
    private uiManager!: UIManager;
    public resourceManager!: ResourceManager;
    public resources: ResourceNode[] = [];
    public enemies: Enemy[] = [];
    public projectiles: Projectile[] = [];
    
    private waveManager!: WaveManager;

    // Таймер для ручной добычи
    private manualMiningTimer: number = 0; 

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

        this.waveManager = new WaveManager((count) => {
            this.spawnWave(count);
        });

        this.app.ticker.add((ticker) => {
            this.player.update(ticker);
            this.camera.update();
            
            this.buildingSystem.update(ticker, this.enemies, (x, y, tx, ty) => {
                this.spawnProjectile(x, y, tx, ty);
            });

            this.enemies.forEach(enemy => enemy.update(ticker));
            this.waveManager.update(ticker);
            this.updateProjectiles(ticker);
            this.cleanUp();

            // <--- ЛОГИКА РУЧНОЙ ДОБЫЧИ
            this.handleManualMining(ticker);
        });
    }

    // <--- Новый метод: Ручная добыча
    private handleManualMining(ticker: any) {
        // Проверяем, стоит ли игрок на какой-либо руде
        // Игрок (200, 200), Руда (200, 200) -> расстояние 0. Радиус руды ~20
        let onResource = false;
        
        for (const res of this.resources) {
            const dx = this.player.x - res.x;
            const dy = this.player.y - res.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Если игрок стоит на руде (ближе 25 пикселей)
            if (dist < 25) {
                onResource = true;
                break; 
            }
        }

        if (onResource) {
            this.manualMiningTimer += ticker.deltaTime;
            // Добываем раз в 30 тиков (2 раза в секунду), быстрее бура, но требует присутствия
            if (this.manualMiningTimer >= 30) {
                this.manualMiningTimer = 0;
                this.resourceManager.addMetal(1);
                
                // Визуальный эффект: Игрок чуть подпрыгивает/пульсирует
                this.player.scale.set(1.1);
                setTimeout(() => this.player.scale.set(1.0), 50);
            }
        } else {
            this.manualMiningTimer = 0;
        }
    }

    private spawnProjectile(x: number, y: number, tx: number, ty: number) {
        const p = new Projectile(x, y, tx, ty);
        this.world.addChild(p);
        this.projectiles.push(p);
    }

    private updateProjectiles(ticker: any) {
        for (const p of this.projectiles) {
            p.update(ticker);
            for (const enemy of this.enemies) {
                if (enemy.isDead) continue;
                const dx = p.x - enemy.x;
                const dy = p.y - enemy.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 15) {
                    enemy.takeDamage(p.damage);
                    p.shouldDestroy = true;
                    break; 
                }
            }
        }
    }

    private cleanUp() {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            if (this.enemies[i].isDead) {
                // <--- НАЧИСЛЕНИЕ БИОМАССЫ ПРИ СМЕРТИ
                this.resourceManager.addBiomass(5); // +5 душ за врага
                
                this.world.removeChild(this.enemies[i]);
                this.enemies.splice(i, 1);
            }
        }

        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            if (this.projectiles[i].shouldDestroy) {
                this.world.removeChild(this.projectiles[i]);
                this.projectiles.splice(i, 1);
            }
        }
    }

    private spawnWave(count: number) {
        const spawnRadius = 800;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const x = this.player.x + Math.cos(angle) * spawnRadius;
            const y = this.player.y + Math.sin(angle) * spawnRadius;
            this.spawnEnemy(x, y);
        }
    }

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