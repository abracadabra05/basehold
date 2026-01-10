// ... импорты ... (без изменений)
import { Application, Container, Graphics, FederatedPointerEvent } from 'pixi.js';
import { Camera } from './Camera';
import { Player } from './Player';
import { BuildingSystem } from './BuildingSystem';
import { UIManager } from './UIManager';
import { ResourceManager } from './ResourceManager';
import { ResourceNode } from './ResourceNode';
import { Enemy, type EnemyType } from './Enemy';
import { WaveManager } from './WaveManager';
import { Projectile } from './Projectile';
import { UpgradeManager } from './UpgradeManager';
import { SoundManager } from './SoundManager';
import { WorldBoundary } from './WorldBoundary';

export class Game {
    // ... поля ...
    // (Все поля как были)
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
    private upgradeManager!: UpgradeManager;
    private soundManager!: SoundManager;
    private worldBoundary!: WorldBoundary;
    private manualMiningTimer: number = 0;
    private isGameOver: boolean = false;
    private isRightMouseDown: boolean = false;
    private lastMousePosition: { x: number, y: number } = { x: 0, y: 0 };
    private currentDamage: number = 1;
    private currentMineMultiplier: number = 1;
    private gridSize = 40;
    private mapWidthTiles = 60; 
    private mapSizePixel = 0; 
    private voidDamageTimer: number = 0;

    constructor(app: Application) {
        this.app = app;
        this.world = new Container();
        this.app.stage.addChild(this.world);
        this.mapSizePixel = this.mapWidthTiles * this.gridSize;
    }

    public init() {
        document.addEventListener('contextmenu', event => event.preventDefault());

        this.soundManager = new SoundManager();
        this.worldBoundary = new WorldBoundary(this.mapSizePixel);
        this.world.addChild(this.worldBoundary);
        this.drawGrid();
        
        this.resourceManager = new ResourceManager();
        this.resourceManager.addMetal(100); 
        this.generateResources();

        // 1. Настраиваем магазин
        this.upgradeManager = new UpgradeManager(this.resourceManager);
        this.upgradeManager.onDamageUpgrade = (val) => { this.currentDamage = val; this.soundManager.playBuild(); };
        this.upgradeManager.onMineSpeedUpgrade = (mul) => { this.currentMineMultiplier = mul; this.soundManager.playBuild(); };
        this.upgradeManager.onMoveSpeedUpgrade = (mul) => { this.player.speedMultiplier = mul; this.soundManager.playBuild(); };
        
        // Когда магазин закрывают -> продолжаем волны
        this.upgradeManager.setOnClose(() => {
            this.waveManager.resume();
        });

        this.buildingSystem = new BuildingSystem(this.app, this.world);
        this.buildingSystem.setSoundManager(this.soundManager);
        this.buildingSystem.setResources(this.resources, this.resourceManager);
        this.uiManager = new UIManager((tool) => { this.buildingSystem.setTool(tool); });

        this.player = new Player(
            this.buildingSystem.isOccupied.bind(this.buildingSystem),
            (x, y, tx, ty) => { this.spawnProjectile(x, y, tx, ty); this.soundManager.playShoot(); }
        );
        this.player.x = this.mapSizePixel / 2;
        this.player.y = this.mapSizePixel / 2;
        this.world.addChild(this.player);
        this.buildingSystem.setPlayer(this.player);

        this.camera = new Camera(this.world, this.app.screen);
        this.camera.follow(this.player);

        // 2. Настраиваем Менеджер Волн
        this.waveManager = new WaveManager(
            // Колбек спавна (как и раньше)
            (waveNum, count) => {
                if (!this.isGameOver) this.spawnWave(waveNum, count);
            },
            // Колбек открытия магазина (НОВЫЙ)
            () => {
                this.soundManager.playBuild(); // Звук открытия
                this.upgradeManager.show();
            }
        );

        this.initInput();

                this.app.ticker.add((ticker) => {

                    if (this.isGameOver || this.waveManager.isShopOpen) return;

        

                    this.player.update(ticker);
            if (this.isRightMouseDown) {
                const worldPos = this.world.toLocal(this.lastMousePosition);
                this.player.tryShoot(worldPos.x, worldPos.y);
            }
            this.camera.update();
            this.buildingSystem.update(ticker, this.enemies, (x, y, tx, ty) => {
                this.spawnProjectile(x, y, tx, ty);
                this.soundManager.playTurretShoot();
            });
            this.enemies.forEach(enemy => enemy.update(ticker));
            this.waveManager.update(ticker);
            this.updateProjectiles(ticker);
            this.cleanUp();
            this.handleManualMining(ticker);
            this.checkPlayerHit();
            this.checkVoidDamage(ticker);
        });
    }

    // ... (Остальные методы без изменений) ...
    // Скопируй их из предыдущего шага, если нужно.
    // (spawnWave, spawnEnemy, spawnProjectile, initInput, checkPlayerHit, checkVoidDamage, gameOver, handleManualMining, updateProjectiles, cleanUp, generateResources, drawGrid)
    
    // ВАЖНО: Ниже приведены только методы, которые могли вызвать сомнения, остальные 1-в-1.
    
    private spawnWave(waveNum: number, count: number) {
        const spawnRadius = 800;
        for (let i = 0; i < count; i++) {
            let type: EnemyType = 'basic';
            const rand = Math.random();
            if (waveNum === 1) type = 'basic';
            else if (waveNum <= 3) { if (rand < 0.3) type = 'fast'; else type = 'basic'; }
            else { if (rand < 0.2) type = 'tank'; else if (rand < 0.5) type = 'fast'; else type = 'basic'; }

            const angle = Math.random() * Math.PI * 2;
            const x = this.player.x + Math.cos(angle) * spawnRadius;
            const y = this.player.y + Math.sin(angle) * spawnRadius;
            this.spawnEnemy(x, y, type);
        }
    }
    
    public spawnEnemy(x: number, y: number, type: EnemyType) {
        const enemy = new Enemy(this.player, this.buildingSystem.getBuildingAt.bind(this.buildingSystem), type);
        enemy.x = x; enemy.y = y;
        this.world.addChild(enemy);
        this.enemies.push(enemy);
    }
    
    private spawnProjectile(x: number, y: number, tx: number, ty: number) {
        const p = new Projectile(x, y, tx, ty, this.currentDamage);
        this.world.addChild(p);
        this.projectiles.push(p);
    }
    
    private initInput() {
        this.app.stage.eventMode = 'static';
        this.app.stage.hitArea = this.app.screen;
        this.app.stage.on('pointerdown', (e) => { if (e.button === 2) this.isRightMouseDown = true; });
        this.app.stage.on('pointerup', (e) => { if (e.button === 2) this.isRightMouseDown = false; });
        this.app.stage.on('pointerupoutside', (e) => { if (e.button === 2) this.isRightMouseDown = false; });
        this.app.stage.on('pointermove', (e: FederatedPointerEvent) => { this.lastMousePosition = { x: e.global.x, y: e.global.y }; });
    }
    
    private checkPlayerHit() {
        for (const enemy of this.enemies) {
            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 25) {
                this.player.takeDamage(1);
                this.soundManager.playHit();
                if (this.player.hp <= 0) this.gameOver();
            }
        }
    }
    
    private checkVoidDamage(ticker: any) {
        const x = this.player.x;
        const y = this.player.y;
        if (x < 0 || y < 0 || x > this.mapSizePixel || y > this.mapSizePixel) {
            this.voidDamageTimer += ticker.deltaTime;
            if (this.voidDamageTimer >= 30) {
                this.voidDamageTimer = 0;
                this.player.takeDamage(1);
                this.soundManager.playHit();
                if (this.player.hp <= 0) this.gameOver();
            }
        } else {
            this.voidDamageTimer = 0;
        }
    }
    
    private gameOver() {
        this.isGameOver = true;
        this.soundManager.playGameOver();
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
            if (this.manualMiningTimer >= (30 / this.currentMineMultiplier)) {
                this.manualMiningTimer = 0;
                this.resourceManager.addMetal(1);
                this.soundManager.playMine();
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
    
    private generateResources() {
        const gridSize = this.gridSize;
        const tiles = this.mapWidthTiles;
        for (let i = 0; i < 40; i++) {
            const node = new ResourceNode(gridSize);
            let rx = Math.floor(Math.random() * tiles) * gridSize;
            let ry = Math.floor(Math.random() * tiles) * gridSize;
            const centerX = this.mapSizePixel / 2;
            const centerY = this.mapSizePixel / 2;
            if (Math.abs(rx - centerX) < 200 && Math.abs(ry - centerY) < 200) continue; 
            node.x = rx;
            node.y = ry;
            this.world.addChild(node);
            this.resources.push(node);
        }
    }
    
    private drawGrid() {
        const gridSize = this.gridSize;
        const tiles = this.mapWidthTiles;
        const color = 0x444444;
        const g = new Graphics();
        for (let x = 0; x <= tiles; x++) { g.rect(x * gridSize, 0, 1, tiles * gridSize); g.fill(color); }
        for (let y = 0; y <= tiles; y++) { g.rect(0, y * gridSize, tiles * gridSize, 1); g.fill(color); }
        this.world.addChild(g);
    }
}