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
import { MiniMap } from './MiniMap';
import { PerkManager } from './PerkManager';
import { yandex } from './YandexSDK';

export class Game {
    private app: Application;
    public world: Container;
    private camera!: Camera;
    private miniMap!: MiniMap;
    private perkManager!: PerkManager; // Добавлено // Добавлено
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
    private voidOverlay!: Graphics; // Оверлей для урона

    private manualMiningTimer: number = 0;
    private isGameOver: boolean = false;
    private isGameStarted: boolean = false; 
    private currentMineMultiplier: number = 1;
    
    private gridSize = GameConfig.GAME.GRID_SIZE;
    private mapWidthTiles = GameConfig.GAME.MAP_WIDTH_TILES; 
    private mapSizePixel = 0; 
    private voidDamageTimer: number = 0;
    private lowHpTimer: number = 0;
    
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
        // 1. Сначала базовые системы без зависимостей
        this.inputSystem = new InputSystem(this.app.stage);
        this.inputSystem.init(this.app.screen);
        
        window.addEventListener('resize', () => {
            this.resize(this.app.screen.width, this.app.screen.height);
        });

        this.inputSystem.onToggleBuildMode = () => {
             this.buildingSystem.setTool('wall');
        };
        
        // Убрали сброс на ПКМ, так как это стрельба
        /*
        this.inputSystem.onRightClick = () => {
            this.buildingSystem.setTool('wall'); 
        };
        */
        
        this.soundManager = new SoundManager();
        this.worldBoundary = new WorldBoundary(this.mapSizePixel);
        this.world.addChild(this.worldBoundary);
        
        // 2. Генерация мира
        this.drawGrid();
        this.generateResources();
        this.generateRocks();

        // 3. Системы управления ресурсами и UI
                this.resourceManager = new ResourceManager();
                this.uiManager = new UIManager((tool) => this.buildingSystem.setTool(tool));
                this.uiManager.init();
                        this.uiManager.onLanguageChange = (lang) => {
                            this.resourceManager.setLanguage(lang);
                            this.waveManager.setLanguage(); // Добавлено
                        };
                        this.resourceManager.setLanguage(this.uiManager.currentLang);        
                // 4. BuildingSystem (нужна для игрока и врагов)
                this.buildingSystem = new BuildingSystem(this.app, this.world);
                this.buildingSystem.setSoundManager(this.soundManager);
                this.buildingSystem.setResources(this.resources, this.resourceManager);
                this.buildingSystem.setRocks(this.rocks);
                this.buildingSystem.onBuildingDestroyed = (x, y) => {
                    this.createExplosion(x + 20, y + 20, 0x555555, 15);
                };
        
                // 5. Игрок
                this.player = new Player(this.mapSizePixel);
                this.world.addChild(this.player);
                this.player.onShoot = (sx, sy, tx, ty) => {
                    this.spawnProjectile(sx, sy, tx, ty, this.player.damage);
                    this.soundManager.playShoot(); // Добавил звук
                    this.spawnShell(sx, sy);       // Добавил вылет гильзы
                };
                this.player.checkCollision = (x, y) => this.buildingSystem.isOccupied(x, y);
                
                // Ставим игрока рядом с центром
                const coreGridX = Math.floor((this.mapSizePixel / 2) / 40) * 40;
                const coreGridY = Math.floor((this.mapSizePixel / 2) / 40) * 40;
                this.player.x = coreGridX + 20; 
                this.player.y = coreGridY + 80;
        
                // 6. Камера и привязка игрока
                this.camera = new Camera(this.world, this.app.screen);
                this.camera.follow(this.player);
                this.buildingSystem.setPlayer(this.player);
        
                // 7. Ядро
                this.coreBuilding = this.buildingSystem.spawnCore(coreGridX, coreGridY);
        
                // 8. Магазин и волны
                        this.upgradeManager = new UpgradeManager(this.uiManager, this.resourceManager);
                        
                        // Связываем проверку технологий с UI
                        this.uiManager.checkUnlock = (type) => this.upgradeManager.isBuildingUnlocked(type);
                        this.uiManager.updateButtonsState(); // Обновляем сразу при старте
                
                                this.upgradeManager.onUnlock = () => {
                                    this.uiManager.updateButtonsState();
                                    this.soundManager.playBuild(); // Звук успеха
                                    this.spawnFloatingText(this.player.x, this.player.y - 50, "TECH UNLOCKED!", '#2ecc71', 24);
                                };                
                        this.upgradeManager.onUpgrade = (type: string) => {
                            if (type === 'damage') this.player.damage += 1;
                            if (type === 'mine') this.currentMineMultiplier += 0.5;
                            if (type === 'speed') this.player.moveSpeed += 0.5;
                            if (type === 'regen') this.buildingSystem.setRegenAmount(1);
                            if (type === 'thorns') this.buildingSystem.setThornsDamage(1);
                            if (type === 'magnet') this.magnetRadius += 100;
                        };        
                        this.waveManager = new WaveManager(
                            this.resourceManager,
                            this.uiManager, // Добавлено
                            (waveNum: number, count: number) => { 
                                if (!this.isGameOver && this.isGameStarted) {                            this.spawnWave(waveNum, count); 
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
                
                this.upgradeManager.setOnClose(() => {
                    this.uiManager.setPaused(false);
                    this.buildingSystem.setPaused(false);
                    this.waveManager.resume();
                });
        
                        this.inputSystem.onSpacePressed = () => {
                            if (this.waveManager && this.waveManager.isPrepPhase) {
                                this.waveManager.skipWait();
                            }
                        };        
                this.uiManager.onStartGame = (skipTutorial) => {
            // Убеждаемся что при старте язык тоже верный
            this.resourceManager.setLanguage(this.uiManager.currentLang);
            if (skipTutorial) this.startGame();
            else this.uiManager.showTutorial(() => this.startGame());
        };
        
        this.uiManager.onRevive = () => this.revivePlayer();

        // 9. Освещение, Миникарта и основной цикл
        this.miniMap = new MiniMap(this.app, this.mapSizePixel);
        this.perkManager = new PerkManager(this.uiManager); // Добавлено
        
        this.lightingSystem = new LightingSystem();
        this.lightingSystem.darknessOverlay.zIndex = 9999;
        this.app.stage.sortableChildren = true;
        this.app.stage.addChild(this.lightingSystem.darknessOverlay);

        this.voidOverlay = new Graphics();
        this.voidOverlay.rect(0, 0, this.app.screen.width, this.app.screen.height).fill({ color: 0xFF0000, alpha: 0 });
        this.voidOverlay.zIndex = 10000; // Поверх всего
        this.voidOverlay.visible = false;
        this.app.stage.addChild(this.voidOverlay);

        this.app.ticker.add((ticker) => {
            if (!this.isGameStarted) return;
            
            // Если магазин открыт, не обновляем игру (пауза)
            if (this.waveManager.isShopOpen) return;

            // Если Game Over, обновляем ТОЛЬКО визуальные эффекты (камера, частицы)
            if (this.isGameOver) {
                this.camera.update(ticker);
                this.updateParticles(ticker);
                this.lightingSystem.update(ticker.deltaMS, this.app.screen.width, this.app.screen.height);
                return;
            }

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
            this.miniMap.resize(this.app.screen.width); // Обновляем позицию каждый кадр (дешевая операция)
            this.miniMap.update(this.player, this.enemies, this.resources);
            
            this.buildingSystem.update(ticker, this.enemies, (x, y, tx, ty, damage) => {
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
            
            // Эффект низкого здоровья (< 30%)
            if (this.player.hp < this.player.maxHp * 0.3 && this.player.hp > 0) {
                this.lowHpTimer += ticker.deltaTime;
                if (this.lowHpTimer >= 60) { // ~1 сек
                    this.lowHpTimer = 0;
                    this.soundManager.playHeartbeat();
                    // Красная вспышка (используем тот же voidOverlay, если он не занят, или лучше создать отдельный?)
                    // Если игрок в пустоте, voidOverlay уже мигает. Если нет - используем его для сердцебиения.
                    if (!this.voidOverlay.visible) {
                        this.voidOverlay.clear().rect(0, 0, this.app.screen.width, this.app.screen.height).fill({ color: 0xFF0000, alpha: 0.2 });
                        this.voidOverlay.visible = true;
                        setTimeout(() => { if (!this.voidOverlay.visible) return; this.voidOverlay.visible = false; }, 200);
                    }
                }
            }

            this.updateParticles(ticker);
            this.updateDrops(ticker); 
            this.updateFloatingTexts(ticker); 

            this.lightingSystem.update(ticker.deltaMS, this.app.screen.width, this.app.screen.height);
            this.lightingSystem.clearLights();
            
            const pScreen = this.world.toGlobal({x: this.player.x, y: this.player.y});
            this.lightingSystem.renderLight(pScreen.x, pScreen.y, 350, this.player.rotationAngle, 1.2); 

            for (const b of this.buildingSystem.activeBuildings) {
                const bPos = this.world.toGlobal({x: b.x + 20, y: b.y + 20});
                if (['turret', 'sniper', 'minigun', 'laser'].includes(b.buildingType)) {
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

            const worldMouse = this.inputSystem.getMouseWorldPosition(this.world);
            const info = this.buildingSystem.getBuildingInfoAt(worldMouse.x, worldMouse.y);
            this.uiManager.showBuildingInfo(info);

            this.uiManager.updateHUD(
                { hp: this.player.hp, maxHp: this.player.maxHp },
                (this.coreBuilding && !this.coreBuilding.isDestroyed) ? { hp: this.coreBuilding.hp, maxHp: this.coreBuilding.maxHp } : null
            );

            if ((this.coreBuilding && this.coreBuilding.isDestroyed) || this.player.hp <= 0) {
                this.gameOver();
            }
        });
    }

    private applyPerk(perkId: string) {
        this.spawnFloatingText(this.player.x, this.player.y - 50, "PERK ACTIVATED!", '#3498db', 20);
        this.soundManager.playBuild();

        switch (perkId) {
            case 'double_shot':
                this.player.bulletsPerShot += 1;
                break;
            case 'vampirism':
                this.player.vampirism += 0.1; // 10% шанс восстановить 1 HP
                break;
            case 'faster_reload':
                this.player.fireRate = Math.max(2, this.player.fireRate * 0.7);
                break;
            case 'shield_core':
                this.player.hasShield = true;
                // Можно добавить визуальный щит позже
                break;
            case 'auto_repair':
                this.buildingSystem.setRegenAmount(2);
                break;
        }
    }

    public startGame() {
        this.isGameStarted = true;
        this.uiManager.hideMenu();
    }

    public resize(width: number, height: number) {
        // Принудительно обновляем размеры рендера, если они рассинхронизировались
        this.app.renderer.resize(width, height);
        
        if (this.camera) this.camera.resize(width, height);
        if (this.miniMap) this.miniMap.resize(width);
        if (this.inputSystem) this.inputSystem.init(this.app.screen); // Обновляем хитбокс
        if (this.voidOverlay) {
            this.voidOverlay.clear().rect(0, 0, width, height).fill({ color: 0xFF0000, alpha: 0 });
        }
        
        // Обновляем позицию UI через CSS
        this.uiManager.resize();
    }

    private revivePlayer() {
        this.isGameOver = false;
        this.player.visible = true;
        this.player.hp = this.player.maxHp * 0.5;
        this.player.x = this.coreBuilding ? this.coreBuilding.x + 20 : this.mapSizePixel / 2;
        this.player.y = this.coreBuilding ? this.coreBuilding.y + 80 : this.mapSizePixel / 2;
        
        // Временная неуязвимость (хак через щит или таймер)
        // this.player.invulnerableTimer = 300; // Нужно сделать публичным
        
        this.soundManager.playBuild();
        this.spawnFloatingText(this.player.x, this.player.y - 50, "REVIVED!", '#e67e22', 30);
    }
    
    // reasonCore: true если взорвалось ядро

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
                if (drop.type === 'data_core') {
                    // ПАУЗА И ВЫБОР ПЕРКА
                    this.soundManager.playShoot(); // Звук открытия
                    this.perkManager.showSelection((perkId) => {
                        this.applyPerk(perkId);
                    });
                } else {
                    this.resourceManager.addBiomass(drop.value);
                    this.soundManager.playMine(); 
                    this.spawnFloatingText(drop.x, drop.y, `+${drop.value}`, '#9b59b6', 14);
                }
                this.world.removeChild(drop);
                this.dropItems.splice(i, 1);
            }
        }
    }

    private spawnWave(waveNum: number, count: number) {
        if (!this.coreBuilding || this.coreBuilding.isDestroyed) return;
        const spawnRadius = GameConfig.WAVES.SPAWN_RADIUS;

        // 1. Проверка на БОССА (каждые 10 волн)
        if (waveNum % GameConfig.WAVES.BOSS_WAVE_INTERVAL === 0) {
            this.spawnFloatingText(this.player.x, this.player.y - 100, "☠️ BOSS INCOMING ☠️", '#e74c3c', 30);
            this.soundManager.playError(); // Звук тревоги
            
            // Ставим паузу волн
            this.waveManager.isBossActive = true;
            
            const angle = Math.random() * Math.PI * 2;
            this.spawnEnemy(this.coreBuilding.x + Math.cos(angle) * spawnRadius, this.coreBuilding.y + Math.sin(angle) * spawnRadius, 'boss');
            
            for (let i = 0; i < 5; i++) {
                const a = angle + (Math.random() - 0.5) * 0.5; 
                this.spawnEnemy(this.coreBuilding.x + Math.cos(a) * spawnRadius, this.coreBuilding.y + Math.sin(a) * spawnRadius, 'kamikaze');
            }
            return;
        }

        // 2. Проверка на ОСОБЫЙ ПАТТЕРН
        const patterns = (GameConfig.WAVES as any).PATTERNS;
        if (patterns && patterns[waveNum]) {
            const p = patterns[waveNum];
            this.spawnFloatingText(this.player.x, this.player.y - 100, p.message, '#f1c40f', 24);
            this.soundManager.playError();

            const specialCount = Math.ceil(count * p.countMultiplier);
            for (let i = 0; i < specialCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                this.spawnEnemy(this.coreBuilding.x + Math.cos(angle) * spawnRadius, this.coreBuilding.y + Math.sin(angle) * spawnRadius, p.type);
            }
            return;
        }

        // 3. ОБЫЧНАЯ ВОЛНА (Смешанная)
        for (let i = 0; i < count; i++) {
            let type: EnemyType = 'basic';
            const rand = Math.random();
            
            if (waveNum <= 3) { 
                if (rand < 0.2) type = 'fast'; else type = 'basic'; 
            } else { 
                // Чем выше волна, тем больше сильных врагов
                if (rand < 0.1 + waveNum * 0.005) type = 'tank'; 
                else if (rand < 0.25 + waveNum * 0.005) type = 'shooter'; 
                else if (rand < 0.4 + waveNum * 0.005) type = 'kamikaze'; 
                else if (rand < 0.6) type = 'fast'; 
                else type = 'basic'; 
            }

            const angle = Math.random() * Math.PI * 2;
            this.spawnEnemy(
                this.coreBuilding.x + Math.cos(angle) * spawnRadius,
                this.coreBuilding.y + Math.sin(angle) * spawnRadius,
                type
            );
        }
    }

    public spawnEnemy(x: number, y: number, type: EnemyType) {
        const enemy = new Enemy(this.coreBuilding, this.player, (ex, ey) => {
            return this.buildingSystem.getBuildingAt(ex, ey);
        }, type);
        
        enemy.x = x;
        enemy.y = y;
        
        enemy.onShoot = (sx, sy, tx, ty, dmg) => this.spawnProjectile(sx, sy, tx, ty, dmg, true);
        enemy.onHit = () => {
            this.soundManager.playEnemyHit();
            this.camera.shake(3, 0.1); // Чуть меньше тряска для зданий
        };
        enemy.onExplode = (ex, ey, dmg, rad) => {
            this.createExplosion(ex, ey, 0xffaa00, 20);
            this.soundManager.playExplosion();
            
            const dx = this.player.x - ex;
            const dy = this.player.y - ey;
            if (dx*dx + dy*dy < rad*rad) this.player.takeDamage(dmg);
            
            this.buildingSystem.activeBuildings.forEach(b => {
                const bdx = b.x + 20 - ex;
                const bdy = b.y + 20 - ey;
                if (bdx*bdx + bdy*bdy < rad*rad) b.takeDamage(dmg);
            });
        };

        this.world.addChild(enemy);
        this.enemies.push(enemy);
    }

    public spawnProjectile(x: number, y: number, tx: number, ty: number, damage: number = 1, isEnemy: boolean = false) {
        const p = this.projectilePool.get();
        p.init(x, y, tx, ty, damage, isEnemy);
        this.world.addChild(p);
        this.projectiles.push(p);
    }

    private updateProjectiles(ticker: Ticker) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.update(ticker);

            if (p.isEnemy) {
                const dx = this.player.x - p.x;
                const dy = this.player.y - p.y;
                if (Math.sqrt(dx * dx + dy * dy) < 20) {
                    this.player.takeDamage(p.damage);
                    p.shouldDestroy = true;
                }
            } else {
                for (const enemy of this.enemies) {
                    const dx = enemy.x - p.x;
                    const dy = enemy.y - p.y;
                    if (Math.sqrt(dx * dx + dy * dy) < enemy.hitboxRadius) {
                        enemy.takeDamage(p.damage);
                        this.spawnFloatingText(enemy.x, enemy.y - 20, Math.floor(p.damage).toString(), '#ffffff', 14);
                        p.shouldDestroy = true;
                        this.createParticle(p.x, p.y, 0xffffff, 'spark');
                        break;
                    }
                }
            }

            if (p.shouldDestroy) {
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
            if (dist < 30) {
                if (this.player.hp > 0) {
                    this.player.takeDamage(1); 
                    this.soundManager.playEnemyHit();
                    this.camera.shake(5, 0.1); // Небольшая тряска
                }
            }
        }
    }

    private checkVoidDamage(ticker: Ticker) {
        const x = this.player.x;
        const y = this.player.y;
        const margin = 50; // Допуск, чтобы сразу не било на границе
        
        const isOut = x < -margin || x > this.mapSizePixel + margin || y < -margin || y > this.mapSizePixel + margin;

        if (isOut) {
            this.voidDamageTimer += ticker.deltaTime;
            // Пульсация красного экрана
            const alpha = 0.3 + Math.sin(Date.now() / 200) * 0.2;
            this.voidOverlay.clear().rect(0, 0, this.app.screen.width, this.app.screen.height).fill({ color: 0xFF0000, alpha: alpha });
            this.voidOverlay.visible = true;

            if (this.voidDamageTimer >= 30) { // Каждые 0.5 сек (при 60fps)
                this.voidDamageTimer = 0;
                this.player.takeDamage(5);
                this.spawnFloatingText(this.player.x, this.player.y - 20, this.t('void_damage'), '#ff0000', 20);
                this.soundManager.playHit(); // Звук удара
                this.camera.shake(5, 0.2);
            }
        } else {
            this.voidOverlay.visible = false;
            this.voidDamageTimer = 0;
        }
    }

    // reasonCore: true если взорвалось ядро
    private gameOver(reasonCore: boolean = false) {
        if (this.isGameOver) return;
        this.isGameOver = true;

        if (reasonCore) {
            // Эпичный взрыв ядра
            this.soundManager.playExplosion();
            this.camera.shake(30, 2.0); // Долгая мощная тряска
            
            // Серия взрывов по спирали
            let delay = 0;
            for (let i = 0; i < 20; i++) {
                setTimeout(() => {
                    if (!this.coreBuilding) return;
                    const angle = Math.random() * Math.PI * 2;
                    const dist = Math.random() * 300;
                    this.createExplosion(this.coreBuilding.x + Math.cos(angle) * dist, this.coreBuilding.y + Math.sin(angle) * dist, 0x00FFFF, 30);
                    this.soundManager.playExplosion();
                }, delay);
                delay += 100;
            }
            
            // Уничтожение всего живого
            setTimeout(() => {
                this.enemies.forEach(e => {
                    this.createExplosion(e.x, e.y, 0xFF0000, 10);
                    this.world.removeChild(e);
                });
                this.enemies = [];
                this.buildingSystem.activeBuildings.forEach(b => {
                    if (b !== this.coreBuilding) {
                        this.createExplosion(b.x, b.y, 0x555555, 10);
                        this.world.removeChild(b);
                    }
                });
                if (this.coreBuilding) this.coreBuilding.visible = false;
            }, 1000);

        } else {
            // Смерть игрока
            this.createExplosion(this.player.x, this.player.y, 0xffaa00, 40);
            this.createExplosion(this.player.x, this.player.y, 0xff0000, 20);
            this.camera.shake(15, 0.5);
            this.player.visible = false;
        }
        
        this.soundManager.playGameOver();
        
        // Отправляем рекорд
        yandex.setLeaderboardScore(this.waveManager.waveCount);
        
        setTimeout(() => {
            this.uiManager.showGameOver();
        }, 2500); 
    }

    private handleManualMining(ticker: Ticker) {
        let onResource = false;
        const halfGrid = 20;
        
        for (const res of this.resources) {
            const dx = this.player.x - (res.x + halfGrid);
            const dy = this.player.y - (res.y + halfGrid);
            if (Math.sqrt(dx * dx + dy * dy) < 60) {
                // ПРОВЕРКА: Если на ресурсе уже стоит здание (бур или что-то еще), пропускаем
                if (this.buildingSystem.getBuildingAt(res.x, res.y)) {
                    continue; 
                }

                onResource = true;
                this.manualMiningTimer += ticker.deltaTime;
                if (this.manualMiningTimer >= 30 / this.currentMineMultiplier) {
                    this.manualMiningTimer = 0;
                    const amount = 1;
                    this.resourceManager.addMetal(amount);
                    this.soundManager.playMine();
                    this.spawnFloatingText(res.x + 20, res.y, `+${amount}`, '#3498db', 14);
                    
                    this.createExplosion(this.player.x, this.player.y, 0xffff00, 5);
                    this.player.scale.set(1.1);
                    setTimeout(() => this.player.scale.set(1.0), 50);
                }
                break;
            }
        }
        
        if (!onResource) {
            this.manualMiningTimer = 0;
        }
    }

    private cleanUp() {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            if (enemy.isDead) {
                // Если это босс
                if (enemy.type === 'boss') {
                    this.waveManager.isBossActive = false; // Снимаем паузу
                    const drop = new DropItem(enemy.x, enemy.y, 0, 'data_core');
                    this.world.addChild(drop);
                    this.dropItems.push(drop);
                } else {
                    // Шанс дропа обычных ресурсов повышен до 70%
                    if (Math.random() < 0.7) {
                        const reward = GameConfig.ENEMIES[enemy.type.toUpperCase() as keyof typeof GameConfig.ENEMIES]?.reward || 5;
                        const drop = new DropItem(enemy.x, enemy.y, reward);
                        this.world.addChild(drop);
                        this.dropItems.push(drop);
                    }
                }
                this.createExplosion(enemy.x, enemy.y, 0xff0000, 10);
                this.soundManager.playExplosion();
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
            if (Math.abs(rx - centerX) < 200 && Math.abs(ry - centerY) < 200) {
                i--; continue;
            }
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
            if (Math.abs(rx - centerX) < 300 && Math.abs(ry - centerY) < 300) {
                i--; continue;
            }
            let overlap = false;
            for (const res of this.resources) {
                if (Math.abs(res.x - rx) < 50 && Math.abs(res.y - ry) < 50) {
                    overlap = true; break;
                }
            }
            if (overlap) {
                i--; continue;
            }
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
        for (let x = 0; x <= tiles; x++) { 
            g.rect(x * gridSize, 0, 1, tiles * gridSize); 
            g.fill(color); 
        }
        for (let y = 0; y <= tiles; y++) { 
            g.rect(0, y * gridSize, tiles * gridSize, 1); 
            g.fill(color); 
        }
        this.world.addChild(g);
    }
}
