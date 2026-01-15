import { Application, Container, Graphics, Ticker } from 'pixi.js';
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
import { Particle, type ParticleType } from './Particle';
import { Building } from './Building';
import { DropItem } from './DropItem';
import { FloatingText } from './FloatingText';
import { Rock } from './Rock';
import { LightingSystem } from './LightingSystem';
import { GameConfig } from './GameConfig';
import { InputSystem } from './InputSystem';
import { ObjectPool } from './ObjectPool';
import { Translations } from './Localization';

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
    public particles: Particle[] = [];    
    public dropItems: DropItem[] = []; 
    public floatingTexts: FloatingText[] = [];
    public rocks: Rock[] = [];
    
    private waveManager!: WaveManager;
    private upgradeManager!: UpgradeManager;
    private soundManager!: SoundManager;
    private worldBoundary!: WorldBoundary;
    private lightingSystem!: LightingSystem;
    private inputSystem!: InputSystem;

    private projectilePool!: ObjectPool<Projectile>;
    private particlePool!: ObjectPool<Particle>;
    
    private coreBuilding!: Building; 

    private manualMiningTimer: number = 0;
    private isGameOver: boolean = false;
    private isGameStarted: boolean = false; 
    private currentDamage: number = 1;
    private currentMineMultiplier: number = 1;
    
    private gridSize = GameConfig.GAME.GRID_SIZE;
    private mapWidthTiles = GameConfig.GAME.MAP_WIDTH_TILES; 
    private mapSizePixel = 0; 
    private voidDamageTimer: number = 0;
    
    private magnetRadius: number = 0;

    constructor(app: Application) {
        this.app = app;
        this.world = new Container();
        this.app.stage.addChild(this.world);
        this.mapSizePixel = this.mapWidthTiles * this.gridSize;

        this.projectilePool = new ObjectPool<Projectile>(
            () => new Projectile(),
            (p) => { p.shouldDestroy = false; } 
        );

        this.particlePool = new ObjectPool<Particle>(
            () => new Particle(),
            (p) => { p.isDead = false; }
        );
    }

    private t(key: string): string {
        const lang = this.uiManager?.currentLang || 'en';
        return (Translations[lang] as any)[key] || key;
    }

    public init() {
        this.inputSystem = new InputSystem(this.app.stage);
        this.inputSystem.init(this.app.screen);
        this.inputSystem.onSpacePressed = () => this.waveManager.skipWait();
        this.inputSystem.onToggleBuildMode = () => {
             this.buildingSystem.setTool('wall');
        };

        this.soundManager = new SoundManager();
        this.worldBoundary = new WorldBoundary(this.mapSizePixel);
        this.world.addChild(this.worldBoundary);
        this.drawGrid();
        
        this.resourceManager = new ResourceManager();
        this.resourceManager.addMetal(100); 
        this.generateResources();
        this.generateRocks(); 

        this.uiManager = new UIManager((tool) => { this.buildingSystem.setTool(tool); });

        this.upgradeManager = new UpgradeManager(this.resourceManager, this.uiManager);
        this.upgradeManager.onDamageUpgrade = (val) => { this.currentDamage = val; this.soundManager.playBuild(); };
        this.upgradeManager.onMineSpeedUpgrade = (mul) => { this.currentMineMultiplier = mul; this.soundManager.playBuild(); };
        this.upgradeManager.onMoveSpeedUpgrade = (mul) => { this.player.speedMultiplier = mul; this.soundManager.playBuild(); };
        this.upgradeManager.onRegenUpgrade = (val) => { this.buildingSystem.setRegenAmount(val); this.soundManager.playBuild(); };
        this.upgradeManager.onThornsUpgrade = (val) => { this.buildingSystem.setThornsDamage(val); this.soundManager.playBuild(); };
        this.upgradeManager.onMagnetUpgrade = (val) => { this.magnetRadius = val; this.soundManager.playBuild(); };

        this.upgradeManager.setOnClose(() => {
            this.waveManager.resume();
            this.uiManager.setPaused(false);
            this.buildingSystem.setPaused(false);
        });

        this.buildingSystem = new BuildingSystem(this.app, this.world);
        this.buildingSystem.setSoundManager(this.soundManager);
        this.buildingSystem.setResources(this.resources, this.resourceManager);
        this.buildingSystem.setRocks(this.rocks);
        
        this.buildingSystem.onBuildingDestroyed = (x, y) => {
            this.createExplosion(x, y, 0x888888, 20);
            this.camera.shake(5, 0.2); 
        };

        this.uiManager.onStartGame = (skipTutorial) => {
            // Update resource manager language
            this.resourceManager.setLanguage(this.uiManager.currentLang);
            
            if (skipTutorial) {
                this.isGameStarted = true;
                this.uiManager.showGameHUD();
            } else {
                this.uiManager.showTutorial(() => {
                    this.isGameStarted = true;
                    this.uiManager.showGameHUD();
                });
            }
        };

        const checkCollision = (x: number, y: number): boolean => {
            if (this.buildingSystem.isOccupied(x, y)) return true;
            for (const rock of this.rocks) {
                const dx = x - rock.x;
                const dy = y - rock.y;
                if (dx*dx + dy*dy < rock.radius * rock.radius) return true;
            }
            return false;
        };

        this.player = new Player(
            checkCollision,
            (x, y, tx, ty) => { 
                this.spawnProjectile(x, y, tx, ty); 
                this.soundManager.playShoot();
                this.spawnShell(x, y); 
            }
        );
        this.player.x = this.mapSizePixel / 2;
        this.player.y = this.mapSizePixel / 2;
        
        const coreX = Math.floor(this.player.x / 40) * 40;
        const coreY = Math.floor(this.player.y / 40) * 40;
        this.coreBuilding = this.buildingSystem.spawnCore(coreX, coreY);
        this.player.x += 60;
        this.world.addChild(this.player);
        this.buildingSystem.setPlayer(this.player);

        this.camera = new Camera(this.world, this.app.screen);
        this.camera.follow(this.player);

        this.waveManager = new WaveManager(
            this.resourceManager, 
            (waveNum, count) => { 
                if (!this.isGameOver && this.isGameStarted) {
                    this.spawnWave(waveNum, count); 
                    this.uiManager.updateWave(waveNum);
                }
            },
            () => { 
                this.soundManager.playBuild();
                this.upgradeManager.show();
                this.uiManager.setPaused(true);
                this.buildingSystem.setPaused(true);
            }
        );

        this.lightingSystem = new LightingSystem();
        this.lightingSystem.darknessOverlay.zIndex = 9999;
        this.app.stage.sortableChildren = true;
        this.app.stage.addChild(this.lightingSystem.darknessOverlay);

        this.app.ticker.add((ticker) => {
            if (!this.isGameStarted) return;
            if (this.isGameOver || this.waveManager.isShopOpen) return;

            this.player.update(ticker);
            
            const moveVec = this.inputSystem.getMovementVector();
            this.player.handleMovement(moveVec, ticker.deltaTime);

            const worldPos = this.inputSystem.getMouseWorldPosition(this.world);
            const aimVec = this.inputSystem.getAimVector();
            
            if (aimVec) {
                this.player.rotationAngle = Math.atan2(aimVec.y, aimVec.x);
            } else {
                this.player.lookAt(worldPos.x, worldPos.y);
            }

            if (this.inputSystem.isShooting()) {
                if (aimVec) {
                     const targetX = this.player.x + aimVec.x * 100;
                     const targetY = this.player.y + aimVec.y * 100;
                     this.player.tryShoot(targetX, targetY);
                } else {
                     this.player.tryShoot(worldPos.x, worldPos.y);
                }
            }
            
            this.camera.update(ticker);
            
            this.buildingSystem.update(ticker, this.enemies, (x, y, tx, ty, damage) => {
                if (damage > 20) { 
                    if (!this.resourceManager.consumeCharge(50)) {
                    }
                }
                
                this.spawnProjectile(x, y, tx, ty, damage);
                this.soundManager.playTurretShoot();
                this.spawnShell(x, y); 
            });

            this.enemies.forEach(enemy => enemy.update(ticker));
            this.waveManager.update(ticker);
            this.updateProjectiles(ticker);
            this.cleanUp();
            this.handleManualMining(ticker);
            this.checkPlayerHit();
            this.checkVoidDamage(ticker);
            this.updateParticles(ticker);
            this.updateDrops(ticker); 
            this.updateFloatingTexts(ticker); 

            this.lightingSystem.update(ticker.deltaMS, this.app.screen.width, this.app.screen.height);
            this.lightingSystem.clearLights();
            
            const pScreen = this.world.toGlobal({x: this.player.x, y: this.player.y});
            this.lightingSystem.renderLight(pScreen.x, pScreen.y, 350, this.player.rotationAngle, 1.2); 

            for (const b of this.buildingSystem.activeBuildings) {
                const bPos = this.world.toGlobal({x: b.x + 20, y: b.y + 20});
                if (['turret', 'sniper', 'minigun'].includes(b.buildingType)) {
                    this.lightingSystem.renderLight(bPos.x, bPos.y, 450, b.rotationAngle, 0.8);
                } else if (b.buildingType === 'laser') {
                    this.lightingSystem.renderLight(bPos.x, bPos.y, 600, b.rotationAngle, 0.3);
                } else if (b.buildingType === 'core') {
                    this.lightingSystem.renderLight(bPos.x, bPos.y, 300);
                } else if (b.buildingType === 'generator' || b.buildingType === 'battery') {
                    this.lightingSystem.renderLight(bPos.x, bPos.y, 100);
                }
            }
            
            this.uiManager.updateTime(this.lightingSystem.cycleProgress);

            const info = this.buildingSystem.getBuildingInfoAt(worldPos.x, worldPos.y);
            this.uiManager.showBuildingInfo(info);

            this.uiManager.updateHUD(
                { hp: this.player.hp, maxHp: this.player.maxHp },
                (this.coreBuilding && !this.coreBuilding.isDestroyed) ? { hp: this.coreBuilding.hp, maxHp: this.coreBuilding.maxHp } : null
            );

            if (this.coreBuilding && this.coreBuilding.isDestroyed) {
                this.gameOver();
            }
        });
    }
  }

    public spawnFloatingText(x: number, y: number, text: string, color: string = '#ffffff', size: number = 16) {
        const ft = new FloatingText(x, y, text, color, size);
        this.world.addChild(ft);
        this.floatingTexts.push(ft);
    }

    public spawnShell(x: number, y: number) {
        this.createParticle(x, y, 0, 'shell');
    }

    public createParticle(x: number, y: number, color: number, type: ParticleType = 'explosion') {
        const p = this.particlePool.get();
        p.init(x, y, color, type);
        this.world.addChild(p);
        this.particles.push(p);
    }
    
    public createExplosion(x: number, y: number, color: number, count: number = 10) {
        for (let i = 0; i < count; i++) {
            this.createParticle(x, y, color, 'explosion');
        }
      }
    }
  }

    private updateParticles(ticker: Ticker) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.update(ticker);
            if (p.isDead) {
                this.world.removeChild(p);
                this.particlePool.return(p);
                this.particles.splice(i, 1);
            }
        }
    }

    private updateFloatingTexts(ticker: Ticker) {
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.update(ticker);
            if (ft.destroyed) { 
                this.floatingTexts.splice(i, 1);
            }
        }
    }

    private updateDrops(ticker: Ticker) {
        const pickupRadius = 50; 
        const effectiveMagnet = Math.max(pickupRadius, this.magnetRadius);

        for (let i = this.dropItems.length - 1; i >= 0; i--) {
            const drop = this.dropItems[i];
            drop.update(ticker, this.player.x, this.player.y, effectiveMagnet);

            const dx = this.player.x - drop.x;
            const dy = this.player.y - drop.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 20) { 
                this.resourceManager.addBiomass(drop.value);
                this.soundManager.playMine(); 
                this.spawnFloatingText(drop.x, drop.y, `+${drop.value}`, '#9b59b6', 14);
                this.world.removeChild(drop);
                this.dropItems.splice(i, 1);
            }
        }
    }

    private spawnWave(waveNum: number, count: number) {
        if (!this.coreBuilding || this.coreBuilding.isDestroyed) return;
        const spawnRadius = GameConfig.WAVES.SPAWN_RADIUS;

        if (waveNum % GameConfig.WAVES.BOSS_WAVE_INTERVAL === 0) {
            const angle = Math.random() * Math.PI * 2;
            this.spawnEnemy(this.coreBuilding.x + Math.cos(angle) * spawnRadius, this.coreBuilding.y + Math.sin(angle) * spawnRadius, 'boss');
            
            for (let i = 0; i < 5; i++) {
                const a = angle + (Math.random() - 0.5) * 0.5; 
                this.spawnEnemy(this.coreBuilding.x + Math.cos(a) * spawnRadius, this.coreBuilding.y + Math.sin(a) * spawnRadius, 'kamikaze');
            }
            return;
        }

        for (let i = 0; i < count; i++) {
            let type: EnemyType = 'basic';
            const rand = Math.random();
            if (waveNum === 1) type = 'basic';
            else if (waveNum <= 3) { if (rand < 0.3) type = 'fast'; else type = 'basic'; }
            else { 
                if (rand < 0.15) type = 'tank'; 
                else if (rand < 0.3) type = 'shooter'; 
                else if (rand < 0.45) type = 'kamikaze'; 
                else if (rand < 0.7) type = 'fast'; 
                else type = 'basic'; 
            }

        this.world.removeChild(enemy);
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

    public spawnEnemy(x: number, y: number, type: EnemyType) {
        const target = (this.coreBuilding && !this.coreBuilding.isDestroyed) ? this.coreBuilding : this.player;
        const enemy = new Enemy(target, this.buildingSystem.getBuildingAt.bind(this.buildingSystem), type);
        enemy.x = x; enemy.y = y;
        
        enemy.onShoot = (sx, sy, tx, ty, dmg) => {
            this.spawnProjectile(sx, sy, tx, ty, dmg, true); 
            this.soundManager.playShoot();
        };
        
        enemy.onExplode = (ex, ey, dmg, radius) => {
            this.createExplosion(ex, ey, 0xFF4500, 20); 
            this.camera.shake(10, 0.5);
            this.soundManager.playHit();
            
            const pdx = this.player.x - ex;
            const pdy = this.player.y - ey;
            if (pdx*pdx + pdy*pdy < radius*radius) {
                this.player.takeDamage(dmg);
            }
            
            for (const b of this.buildingSystem.activeBuildings) {
                const bdx = (b.x + 20) - ex;
                const bdy = (b.y + 20) - ey;
                if (bdx*bdx + bdy*bdy < radius*radius) {
                    b.takeDamage(dmg);
                }
            }
        };

        this.world.addChild(enemy);
        this.enemies.push(enemy);
    }
    
    private spawnProjectile(x: number, y: number, tx: number, ty: number, damage?: number, isEnemy: boolean = false) {
        const dmg = damage !== undefined ? damage : this.currentDamage;
        const p = this.projectilePool.get();
        p.init(x, y, tx, ty, dmg, isEnemy);
        this.world.addChild(p);
        this.projectiles.push(p);
    }
    
    private updateProjectiles(ticker: Ticker) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.update(ticker);
            
            let hit = false;
            
            if (p.isEnemy) {
                const pdx = p.x - this.player.x;
                const pdy = p.y - this.player.y;
                if (pdx*pdx + pdy*pdy < 15*15) { 
                    this.player.takeDamage(p.damage);
                    hit = true;
                    this.spawnFloatingText(this.player.x, this.player.y, `-${p.damage}`, '#FF0000');
                }
                else {
                    const b = this.buildingSystem.getBuildingAt(p.x, p.y);
                    if (b) {
                        b.takeDamage(p.damage);
                        hit = true;
                        this.spawnFloatingText(b.x+20, b.y, `-${p.damage}`, '#FF0000');
                    }
                }
            } 
            else {
                for (const enemy of this.enemies) {
                    if (enemy.isDead) continue;
                    const dx = p.x - enemy.x;
                    const dy = p.y - enemy.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist < enemy.hitboxRadius + 4) {
                        enemy.takeDamage(p.damage);
                        const isCrit = p.damage > 5;
                        const color = isCrit ? '#e74c3c' : '#ffffff';
                        const size = isCrit ? 24 : 14;
                        this.spawnFloatingText(enemy.x, enemy.y, Math.floor(p.damage).toString(), color, size);
                        hit = true;
                        break; 
                    }
                }
            }

            if (hit || p.shouldDestroy) {
                this.world.removeChild(p);
                this.projectilePool.return(p);
                this.projectiles.splice(i, 1);
            }
        }
    }

    private checkPlayerHit() {
        for (const enemy of this.enemies) {
            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 25) {
                this.player.takeDamage(1);
                this.soundManager.playHit();
                this.spawnFloatingText(this.player.x, this.player.y, "-1", "#FF0000", 20);
                this.camera.shake(10, 0.3);
                if (this.player.hp <= 0) this.gameOver();
            }
        }
    }

    private checkVoidDamage(ticker: Ticker) {
        const x = this.player.x;
        const y = this.player.y;
        if (x < 0 || y < 0 || x > this.mapSizePixel || y > this.mapSizePixel) {
            this.voidDamageTimer += ticker.deltaTime;
            if (this.voidDamageTimer >= GameConfig.GAME.VOID_DAMAGE_INTERVAL) {
                this.voidDamageTimer = 0;
                this.player.takeDamage(1);
                this.soundManager.playHit();
                this.spawnFloatingText(this.player.x, this.player.y, "-1", "#FF0000", 20);
                this.camera.shake(5, 0.2);
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
        Object.assign(overlay.style, {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            background: 'rgba(5, 5, 10, 0.95)',
            backdropFilter: 'blur(15px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            color: 'white', zIndex: '5000', fontFamily: "'Segoe UI', sans-serif"
        });

        const waves = Math.max(0, this.waveManager.waveCount - 1);

        overlay.innerHTML = `
            <h1 style="font-size: 100px; margin: 0; color: #ff4757; text-transform: uppercase; letter-spacing: 10px; font-weight: 900; text-shadow: 0 0 50px rgba(255, 71, 87, 0.5);">${this.t('game_over')}</h1>
            <div style="font-size: 24px; color: #bdc3c7; margin: 20px 0 60px 0; text-transform: uppercase; letter-spacing: 4px; font-weight: 300;">
                ${this.t('waves_survived')} <span style="color: #fff; font-weight: bold; font-size: 40px; text-shadow: 0 0 20px white;">${waves}</span>
            </div>
            <button id="restart-btn" style="
                padding: 20px 80px; font-size: 20px; font-weight: 900; cursor: pointer; 
                background: transparent; color: #ff4757; border: 3px solid #ff4757; 
                border-radius: 6px; text-transform: uppercase; letter-spacing: 5px;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            ">${this.t('restart')}</button>
        `;

        document.body.appendChild(overlay);
        const btn = document.getElementById('restart-btn');
        if (btn) {
            btn.onclick = () => location.reload();
            btn.onmouseenter = () => { btn.style.background = '#ff4757'; btn.style.color = '#fff'; btn.style.transform = 'scale(1.05)'; btn.style.boxShadow = '0 0 40px rgba(255, 71, 87, 0.6)'; };
            btn.onmouseleave = () => { btn.style.background = 'transparent'; btn.style.color = '#ff4757'; btn.style.transform = 'scale(1)'; btn.style.boxShadow = 'none'; };
        }
    }

    private handleManualMining(ticker: Ticker) {
        let onResource = false;
        const halfGrid = 20;
        for (const res of this.resources) {
            const resourceCenterX = res.x + halfGrid;
            const resourceCenterY = res.y + halfGrid;
            const dx = this.player.x - resourceCenterX;
            const dy = this.player.y - resourceCenterY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 30) {
                if (!this.buildingSystem.isOccupied(res.x, res.y)) {
                    onResource = true;
                    break;
                }
            }
        }
        if (onResource) {
            this.manualMiningTimer += ticker.deltaTime;
            if (this.manualMiningTimer >= (30 / this.currentMineMultiplier)) {
                this.manualMiningTimer = 0;
                this.resourceManager.addMetal(1);
                this.soundManager.playMine();
                this.createExplosion(this.player.x, this.player.y, 0xFFFF00, 5);
                this.spawnFloatingText(this.player.x, this.player.y - 30, "+1", "#FFFF00", 16);
                this.player.scale.set(1.1);
                setTimeout(() => this.player.scale.set(1.0), 50);
            }
        } else {
            this.manualMiningTimer = 0;
        }
    }

    private cleanUp() {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            if (this.enemies[i].isDead) {
                const enemy = this.enemies[i];
                let reward = 5;
                let explosionColor = 0xAA0000;
                let explosionSize = 15;
                const configKey = enemy.type.toUpperCase() as keyof typeof GameConfig.ENEMIES;
                const stats = GameConfig.ENEMIES[configKey];
                if (stats) reward = stats.reward;
                if (enemy.type === 'tank') { this.camera.shake(5, 0.2); }
                if (enemy.type === 'boss') {
                    explosionColor = 0x9b59b6; explosionSize = 50; this.camera.shake(20, 1.0);
                }
                const drop = new DropItem(enemy.x, enemy.y, reward);
                this.world.addChild(drop);
                this.dropItems.push(drop);
                this.createExplosion(enemy.x, enemy.y, explosionColor, explosionSize);
                this.world.removeChild(enemy);
                this.enemies.splice(i, 1);
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
            node.x = rx; node.y = ry;
            this.world.addChild(node);
            this.resources.push(node);
        }
    }

    private generateRocks() {
        for (let i = 0; i < 20; i++) {
            const radius = 20 + Math.random() * 20;
            const rock = new Rock(radius);
            let rx = Math.random() * this.mapSizePixel;
            let ry = Math.random() * this.mapSizePixel;
            const centerX = this.mapSizePixel / 2;
            const centerY = this.mapSizePixel / 2;
            if (Math.abs(rx - centerX) < 300 && Math.abs(ry - centerY) < 300) continue;
            let overlap = false;
            for (const res of this.resources) {
                if (Math.abs(res.x - rx) < 50 && Math.abs(res.y - ry) < 50) {
                    overlap = true; break;
                }
            }
            if (overlap) continue;
            rock.x = rx; rock.y = ry;
            this.world.addChild(rock);
            this.rocks.push(rock);
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
