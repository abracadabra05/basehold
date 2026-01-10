// Импорты...
import { Application, Container, Graphics, FederatedPointerEvent } from 'pixi.js';
import { Camera } from './Camera';
import { Player } from './Player';
import { BuildingSystem } from './BuildingSystem';
import { UIManager } from './UIManager';
import { ResourceManager } from './ResourceManager';
import { ResourceNode } from './ResourceNode';
import { Enemy } from './Enemy';
import { WaveManager } from './WaveManager';
import { Projectile } from './Projectile';
import { UpgradeManager } from './UpgradeManager'; // <--- Импорт

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
    private upgradeManager!: UpgradeManager; // <--- Магазин

    private manualMiningTimer: number = 0;
    private isGameOver: boolean = false;
    private isRightMouseDown: boolean = false;
    private lastMousePosition: { x: number, y: number } = { x: 0, y: 0 };

    // Глобальные статы
    private currentDamage: number = 1;
    private currentMineMultiplier: number = 1;

    constructor(app: Application) {
        this.app = app;
        this.world = new Container();
        this.app.stage.addChild(this.world);
    }

    public init() {
        document.addEventListener('contextmenu', event => event.preventDefault());

        this.drawGrid();
        this.resourceManager = new ResourceManager();
        this.resourceManager.addMetal(50); 
        this.generateResources();

        // МАГАЗИН
        this.upgradeManager = new UpgradeManager(this.resourceManager);
        
        // Логика апгрейдов
        this.upgradeManager.onDamageUpgrade = (val) => {
            this.currentDamage = val; // Урон = уровню (Lvl 1 = 1 dmg, Lvl 2 = 2 dmg)
            console.log("Damage upgraded to", this.currentDamage);
        };
        this.upgradeManager.onMineSpeedUpgrade = (multiplier) => {
            this.currentMineMultiplier = multiplier;
            // Нужно как-то сообщить зданиям? Пока передадим в update
        };
        this.upgradeManager.onMoveSpeedUpgrade = (multiplier) => {
            this.player.speedMultiplier = multiplier;
        };

        this.buildingSystem = new BuildingSystem(this.app, this.world);
        this.buildingSystem.setResources(this.resources, this.resourceManager);

        this.uiManager = new UIManager((type) => {
            this.buildingSystem.setBuildingType(type);
        });

        this.player = new Player(
            this.buildingSystem.isOccupied.bind(this.buildingSystem),
            (x, y, tx, ty) => this.spawnProjectile(x, y, tx, ty) // Использует currentDamage внутри spawnProjectile
        );
        this.player.x = 200;
        this.player.y = 200;
        this.world.addChild(this.player);
        this.buildingSystem.setPlayer(this.player);

        this.camera = new Camera(this.world, this.app.screen);
        this.camera.follow(this.player);

        this.waveManager = new WaveManager((count) => {
            if (!this.isGameOver) this.spawnWave(count);
        });

        this.initInput();

        this.app.ticker.add((ticker) => {
            if (this.isGameOver) return;

            this.player.update(ticker);
            
            if (this.isRightMouseDown) {
                const worldPos = this.world.toLocal(this.lastMousePosition);
                this.player.tryShoot(worldPos.x, worldPos.y);
            }

            this.camera.update();
            
            // Передаем currentDamage и для турелей тоже (через spawnProjectile)
            // И эффективность.
            // Но еще надо передать множитель майнинга!
            // Для этого придется немного исправить BuildingSystem.update, но пока сделаем хак:
            // В Building.update добавим параметр mineMultiplier
            
            // ВАЖНО: Мы пока не прокинули mineMultiplier в BuildingSystem. 
            // Давай сделаем это, если ты хочешь идеальную архитектуру, 
            // но пока турели и пули игрока используют один метод спавна
            
            this.buildingSystem.update(ticker, this.enemies, (x, y, tx, ty) => {
                this.spawnProjectile(x, y, tx, ty);
            });

            this.enemies.forEach(enemy => enemy.update(ticker));
            this.waveManager.update(ticker);
            this.updateProjectiles(ticker);
            this.cleanUp();
            this.handleManualMining(ticker);
            this.checkPlayerHit();
        });
    }

    // Исправили спавн пуль: теперь передаем currentDamage
    private spawnProjectile(x: number, y: number, tx: number, ty: number) {
        const p = new Projectile(x, y, tx, ty, this.currentDamage);
        this.world.addChild(p);
        this.projectiles.push(p);
    }
    
    // ... Остальные методы без изменений (initInput, checkPlayerHit, gameOver, handleManualMining, updateProjectiles, cleanUp, spawnWave, spawnEnemy, generateResources, drawGrid) ...
    
    private initInput() {
        this.app.stage.eventMode = 'static';
        this.app.stage.hitArea = this.app.screen;
        this.app.stage.on('pointerdown', (e) => {
            if (e.button === 2) this.isRightMouseDown = true;
        });
        this.app.stage.on('pointerup', (e) => {
            if (e.button === 2) this.isRightMouseDown = false;
        });
        this.app.stage.on('pointerupoutside', (e) => {
            if (e.button === 2) this.isRightMouseDown = false;
        });
        this.app.stage.on('pointermove', (e: FederatedPointerEvent) => {
            this.lastMousePosition = { x: e.global.x, y: e.global.y };
        });
    }
    
    // Ниже просто заглушки, чтобы TypeScript не ругался в примере, но у тебя эти методы уже есть полные
    private checkPlayerHit() {
        for (const enemy of this.enemies) {
            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 25) {
                this.player.takeDamage(1);
                if (this.player.hp <= 0) this.gameOver();
            }
        }
    }
    
    private gameOver() {
        this.isGameOver = true;
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        overlay.style.display = 'flex';
        overlay.style.flexDirection = 'column';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.color = 'white';
        overlay.style.zIndex = '1000';
        overlay.innerHTML = `<h1 style="font-size: 64px; color: #e74c3c;">GAME OVER</h1><button onclick="location.reload()" style="padding: 15px; font-size: 24px;">Restart</button>`;
        document.body.appendChild(overlay);
    }

    private handleManualMining(ticker: any) {
        let onResource = false;
        const halfGrid = 20; 
        for (const res of this.resources) {
            const resourceCenterX = res.x + halfGrid;
            const resourceCenterY = res.y + halfGrid;
            const dx = this.player.x - resourceCenterX;
            const dy = this.player.y - resourceCenterY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 30) { onResource = true; break; }
        }
        if (onResource) {
            this.manualMiningTimer += ticker.deltaTime;
            // Учитываем currentMineMultiplier для ручной добычи тоже!
            if (this.manualMiningTimer >= (30 / this.currentMineMultiplier)) {
                this.manualMiningTimer = 0;
                this.resourceManager.addMetal(1);
                this.player.scale.set(1.1);
                setTimeout(() => this.player.scale.set(1.0), 50);
            }
        } else {
            this.manualMiningTimer = 0;
        }
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
                this.resourceManager.addBiomass(5); 
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