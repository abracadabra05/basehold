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
import { yaSdk } from './YandexSDK';
import { StatsTracker } from './StatsTracker';
import { AchievementManager } from './AchievementManager';
import { Pathfinder } from './Pathfinder';
import { graphicsSettings } from './GraphicsSettings';
import { determineEnemyType } from './logic/SpawnLogic';
import { calculateEndlessDifficultyMultiplier, calculateWaveEnemyStatMultiplier } from './logic/WaveLogic';
import {
    applyWaveMutatorCount,
    applyWaveMutatorEnemyStats,
    applyWaveMutatorSpawnRadius,
    getScheduledWaveMutator,
    type ActiveWaveMutator,
    type WaveMutatorConfig,
} from './logic/WaveMutatorLogic';
import { AdaptiveQualityController } from './performance/AdaptiveQualityController';
import type { PerkId } from './types/GameContent';

export class Game {
    private app: Application;
    public world: Container;
    private camera!: Camera;
    private miniMap!: MiniMap;
    private perkManager!: PerkManager;
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

    public score: number = 0; // Добавлено

    private gridSize = GameConfig.GAME.GRID_SIZE;
    private mapWidthTiles = GameConfig.GAME.MAP_WIDTH_TILES;
    private mapSizePixel = 0;
    private voidDamageTimer: number = 0;
    private lowHpTimer: number = 0;
    private canRevive: boolean = true; // Один раз за игру

    private magnetRadius: number = 0;
    private statsTracker: StatsTracker = new StatsTracker();
    private achievementManager: AchievementManager = new AchievementManager();
    private isEndlessMode: boolean = false;
    private endlessDifficultyMultiplier: number = 1.0;
    private resizeTimeout: ReturnType<typeof setTimeout> | null = null;
    private rockBlocker: Building | null = null; // Indestructible blocker for rock collisions
    private pathfinder: Pathfinder = new Pathfinder();
    private activeWaveMutator: ActiveWaveMutator | null = null;
    private adaptiveQualityController: AdaptiveQualityController = new AdaptiveQualityController();
    private salvageBonusMultiplier: number = 1.0;
    private eliteDamageMultiplier: number = 1.0;
    private waveStatMultiplier: number = 1.0;

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
        this.initEventListeners();
        this.initInputSystem();
        this.initWorld();
        this.initManagers();
        this.initBuildingSystem();
        const corePosition = this.initPlayer();
        this.initCore(corePosition);
        this.initUpgradesAndWaves();
        this.initUICallbacks();
        this.initLightingAndOverlays();
        this.initGameLoop();
    }

    private initEventListeners(): void {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseGame();
            } else {
                this.resumeGame();
            }
        });

        window.addEventListener('resize', () => {
            // Debounce resize events to prevent rapid-fire updates
            if (this.resizeTimeout) {
                clearTimeout(this.resizeTimeout);
            }
            this.resizeTimeout = setTimeout(() => {
                this.resize(this.app.screen.width, this.app.screen.height);
            }, 100);
        });

        yaSdk.onPause = () => this.pauseGame();
        yaSdk.onResume = () => this.resumeGame();
    }

    private initInputSystem(): void {
        this.inputSystem = new InputSystem(this.app.stage);
        this.inputSystem.init(this.app.screen);

        this.inputSystem.onToggleBuildMode = () => {
            this.buildingSystem.setTool('wall');
        };

        this.inputSystem.onNumberPressed = (index) => {
            this.uiManager.selectByIndex(index);
        };

        this.inputSystem.onSpacePressed = () => {
            if (this.waveManager && this.waveManager.isPrepPhase) {
                this.waveManager.skipWait();
            }
        };
    }

    private initWorld(): void {
        this.soundManager = new SoundManager();
        this.worldBoundary = new WorldBoundary(this.mapSizePixel);
        this.world.addChild(this.worldBoundary);

        this.drawGrid();
        this.generateResources();
        this.generateRocks();
        this.rebuildPathfinderGrid();
    }

    private initManagers(): void {
        this.resourceManager = new ResourceManager();
        this.resourceManager.onResourceMined = (amount) => {
            this.statsTracker.addResources(amount);
        };
        this.resourceManager.onEnergyMilestone = (amount) => {
            this.achievementManager.addProgress('energy', Math.floor(amount));
        };

        this.uiManager = new UIManager((tool) => this.buildingSystem.setTool(tool));

        this.achievementManager.setLanguage(this.uiManager.currentLang);
        this.achievementManager.onUnlock = (achievement) => {
            this.achievementManager.showUnlockNotification(achievement, document.body);
            this.soundManager.playBuild();
        };

        this.uiManager.onShowAchievements = () => {
            this.achievementManager.showUI(document.body);
        };

        this.resourceManager.setLanguage(this.uiManager.currentLang);
    }

    private initBuildingSystem(): void {
        this.buildingSystem = new BuildingSystem(this.app, this.world);
        this.buildingSystem.setSoundManager(this.soundManager);
        this.buildingSystem.setResources(this.resources, this.resourceManager);
        this.buildingSystem.setRocks(this.rocks);

        this.buildingSystem.onBuildingDestroyed = (x, y) => {
            this.createExplosion(x + 20, y + 20, 0x555555, 15);
            this.pathfinder.unblockWorld(x, y);
        };

        this.buildingSystem.onBuildingPlaced = (_, x, y) => {
            this.statsTracker.addBuilding();
            this.achievementManager.addProgress('build');
            this.pathfinder.blockWorld(x, y);
        };

        this.buildingSystem.onChainLightning = (x, y, targets) => {
            this.soundManager.playTurretShoot();
            let lastX = x;
            let lastY = y;
            for (const target of targets) {
                const steps = 3;
                for (let s = 0; s <= steps; s++) {
                    const px = lastX + (target.x - lastX) * (s / steps);
                    const py = lastY + (target.y - lastY) * (s / steps);
                    this.createParticle(px, py, 0x9B59B6, 'spark');
                }
                lastX = target.x;
                lastY = target.y;
            }
        };
    }

    /** Rebuild pathfinder grid from current rocks and buildings */
    private rebuildPathfinderGrid(): void {
        this.pathfinder.resetGrid();

        // Block rock tiles
        for (const rock of this.rocks) {
            this.pathfinder.blockRock(rock);
        }

        // Block building tiles (walls, turrets, etc.)
        if (this.buildingSystem) {
            for (const building of this.buildingSystem.activeBuildings) {
                this.pathfinder.blockWorld(building.x, building.y);
            }
        }
    }

    private initPlayer(): { x: number; y: number } {
        this.player = new Player(this.mapSizePixel);
        this.world.addChild(this.player);

        this.player.onShoot = (sx, sy, tx, ty) => {
            this.spawnProjectile(sx, sy, tx, ty, this.player.damage);
            this.soundManager.playShoot();
            this.spawnShell(sx, sy);
        };

        this.player.checkCollision = (x, y) => this.buildingSystem.isOccupied(x, y);

        const coreGridX = Math.floor((this.mapSizePixel / 2) / 40) * 40;
        const coreGridY = Math.floor((this.mapSizePixel / 2) / 40) * 40;
        this.player.x = coreGridX + 20;
        this.player.y = coreGridY + 80;

        this.camera = new Camera(this.world, this.app.screen);
        this.camera.follow(this.player);
        this.buildingSystem.setPlayer(this.player);

        return { x: coreGridX, y: coreGridY };
    }

    private initCore(position: { x: number; y: number }): void {
        this.coreBuilding = this.buildingSystem.spawnCore(position.x, position.y);
    }

    private initUpgradesAndWaves(): void {
        this.upgradeManager = new UpgradeManager(this.uiManager, this.resourceManager);
        this.upgradeManager.onPauseRequest = () => { if (this.soundManager) this.soundManager.setMute(true); };
        this.upgradeManager.onResumeRequest = () => { if (this.soundManager) this.soundManager.setMute(false); };

        this.waveManager = new WaveManager(
            this.resourceManager,
            this.uiManager,
            (waveNum: number, count: number) => {
                if (!this.isGameOver && this.isGameStarted) {
                    this.spawnWave(waveNum, count);
                    this.uiManager.updateWave(waveNum);
                    this.statsTracker.setWave(waveNum);
                    this.achievementManager.addProgress('wave', waveNum);
                }
            },
            () => {
                this.soundManager.playBuild();
                this.upgradeManager.show();
                this.uiManager.setPaused(true);
                this.buildingSystem.setPaused(true);
            }
        );

        const checkUnlock = (type: string) => this.upgradeManager.isBuildingUnlocked(type);
        this.uiManager.checkUnlock = checkUnlock;
        this.buildingSystem.checkUnlock = checkUnlock;

        this.uiManager.init();

        this.upgradeManager.onUnlock = () => {
            this.uiManager.updateButtonsState();
            this.soundManager.playBuild();
            this.spawnFloatingText(this.player.x, this.player.y - 50, this.t('tech_unlocked'), '#2ecc71', 24);
        };

        this.upgradeManager.onUpgrade = (type: string) => {
            if (type === 'damage') this.player.damage += 1;
            if (type === 'mine') this.currentMineMultiplier += 0.5;
            if (type === 'speed') this.player.moveSpeed += 0.5;
            if (type === 'regen') this.buildingSystem.setRegenAmount(this.upgradeManager.regenLevel);
            if (type === 'thorns') this.buildingSystem.setThornsDamage(this.upgradeManager.thornsLevel);
            if (type === 'magnet') this.magnetRadius += 100;
        };

        this.upgradeManager.setOnClose(() => {
            this.uiManager.setPaused(false);
            this.buildingSystem.setPaused(false);
            this.waveManager.resume();
            this.isGameStarted = true;
            if (this.soundManager) this.soundManager.resume();
            yaSdk.gameplayStart();
        });
    }

    private initUICallbacks(): void {
        this.uiManager.onStartGame = (skipTutorial) => {
            this.resourceManager.setLanguage(this.uiManager.currentLang);
            if (skipTutorial) this.startGame();
            else this.uiManager.showTutorial(() => this.startGame());
        };

        this.uiManager.onLanguageChange = (lang) => {
            this.resourceManager.setLanguage(lang);
            this.waveManager.setLanguage();
            this.achievementManager.setLanguage(lang);
        };

        this.uiManager.onRevive = () => this.revivePlayer();
        this.uiManager.onRestart = () => this.restartGame();
        this.uiManager.onPause = () => this.pauseGame();
        this.uiManager.onResume = () => this.resumeGame();
        this.uiManager.onMute = (muted) => this.soundManager.setMute(muted);
        this.uiManager.onVolumeChange = (volume) => this.soundManager.setVolume(volume);
        this.uiManager.getMutedState = () => this.soundManager.getMuted();
        this.uiManager.getVolume = () => this.soundManager.getVolume();


        this.uiManager.onShowLocked = () => {
            this.soundManager.playError();
            this.spawnFloatingText(this.player.x, this.player.y - 50, this.t('locked'), '#e74c3c', 20);
        };

        this.uiManager.onDeselect = () => {
            this.buildingSystem.setToolActive(false);
        };
    }

    private initLightingAndOverlays(): void {
        this.miniMap = new MiniMap(this.app, this.mapSizePixel);
        this.perkManager = new PerkManager(this.uiManager);

        this.lightingSystem = new LightingSystem();
        this.lightingSystem.darknessOverlay.zIndex = 5000;
        this.app.stage.sortableChildren = true;
        this.app.stage.addChild(this.lightingSystem.darknessOverlay);

        this.voidOverlay = new Graphics();
        this.voidOverlay.rect(0, 0, this.app.screen.width, this.app.screen.height).fill({ color: 0xFF0000, alpha: 0 });
        this.voidOverlay.zIndex = 8000;
        this.voidOverlay.visible = false;
        this.app.stage.addChild(this.voidOverlay);
    }

    private initGameLoop(): void {
        this.app.ticker.add((ticker) => {
            this.adaptiveQualityController.recordFrame(ticker.deltaMS);
            if (!this.isGameStarted) return;
            if (this.waveManager.isShopOpen) return;

            if (this.isGameOver) {
                this.camera.update(ticker);
                this.updateParticles(ticker);
                this.lightingSystem.update(ticker.deltaMS, this.app.screen.width, this.app.screen.height);
                return;
            }

            this.updatePlayer(ticker);
            this.updateSystems(ticker);
            this.updateVisuals(ticker);
            this.checkGameOver();
        });
    }

    private updatePlayer(ticker: Ticker): void {
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
    }

    private updateSystems(ticker: Ticker): void {
        this.camera.update(ticker);
        this.miniMap.resize(this.app.screen.width);
        this.miniMap.update(this.player, this.enemies, this.resources, this.coreBuilding);

        this.buildingSystem.update(ticker, this.enemies, (x, y, tx, ty, damage) => {
            this.spawnProjectile(x, y, tx, ty, damage);
            this.soundManager.playTurretShoot();
            this.spawnShell(x, y);
        });

        this.enemies.forEach(enemy => {
            enemy.speedMultiplier = this.buildingSystem.getSlowFactorAt(enemy.x, enemy.y);
            enemy.update(ticker);
            enemy.updateAuras(this.enemies);
        });

        this.waveManager.update(ticker);
        this.updateProjectiles(ticker);
        this.cleanUp();
        this.handleManualMining(ticker);
        this.checkPlayerHit();
        this.checkVoidDamage(ticker);

        if (this.player.hp < this.player.maxHp * 0.3 && this.player.hp > 0) {
            this.lowHpTimer += ticker.deltaTime;
            if (this.lowHpTimer >= 60) {
                this.lowHpTimer = 0;
                this.soundManager.playHeartbeat();
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
    }

    private updateVisuals(ticker: Ticker): void {
        // Lighting (skip when graphics quality is low)
        if (graphicsSettings.config.lightingEnabled) {
            this.lightingSystem.update(ticker.deltaMS, this.app.screen.width, this.app.screen.height);
            this.lightingSystem.clearLights();

            this.miniMap.setDarkness(this.lightingSystem.currentAlpha);

            const pScreen = this.world.toGlobal({ x: this.player.x, y: this.player.y });
            this.lightingSystem.renderLight(pScreen.x, pScreen.y, 350, this.player.rotationAngle, 1.2);

            for (const b of this.buildingSystem.activeBuildings) {
                const bPos = this.world.toGlobal({ x: b.x + 20, y: b.y + 20 });
                if (b.buildingType === 'laser') {
                    this.lightingSystem.renderLight(bPos.x, bPos.y, 600, b.rotationAngle, 0.3);
                } else if (['turret', 'sniper', 'minigun'].includes(b.buildingType)) {
                    this.lightingSystem.renderLight(bPos.x, bPos.y, 450, b.rotationAngle, 0.8);
                } else if (b.buildingType === 'core') {
                    this.lightingSystem.renderLight(bPos.x, bPos.y, 300);
                } else if (b.buildingType === 'generator' || b.buildingType === 'battery') {
                    this.lightingSystem.renderLight(bPos.x, bPos.y, 100);
                }
            }

            this.uiManager.updateTime(this.lightingSystem.cycleProgress);
        } else {
            this.miniMap.setDarkness(0);
            this.uiManager.updateTime(0);
            this.lightingSystem.darknessOverlay.visible = false;
        }

        const worldMouse = this.inputSystem.getMouseWorldPosition(this.world);
        const info = this.buildingSystem.getBuildingInfoAt(worldMouse.x, worldMouse.y);
        this.uiManager.showBuildingInfo(info);

        this.uiManager.updateHUD(
            { hp: this.player.hp, maxHp: this.player.maxHp },
            (this.coreBuilding && !this.coreBuilding.isDestroyed) ? { hp: this.coreBuilding.hp, maxHp: this.coreBuilding.maxHp } : null
        );
    }

    private checkGameOver(): void {
        if ((this.coreBuilding && this.coreBuilding.isDestroyed) || this.player.hp <= 0) {
            this.gameOver();
        }
    }

    private applyPerk(perkId: PerkId) {
        this.spawnFloatingText(this.player.x, this.player.y - 50, this.t('perk_activated'), '#3498db', 20);
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
                break;
            case 'auto_repair':
                this.buildingSystem.setRegenAmount(2);
                break;
            case 'explosive_rounds':
                this.player.explosiveRounds = true;
                break;
            // v2.0 Perks
            case 'ricochet':
                this.player.ricochet = true;
                break;
            case 'critical_hit':
                this.player.critChance += 0.2; // 20% chance per upgrade
                break;
            case 'slow_bullets':
                this.player.slowBullets = true;
                break;
            case 'life_steal':
                // Turrets heal themselves when dealing damage
                this.buildingSystem.setLifeSteal(true);
                break;
            case 'overdrive':
                this.player.fireRate = Math.max(2, this.player.fireRate * 0.8);
                this.player.moveSpeed += 0.6;
                break;
            case 'salvage':
                this.salvageBonusMultiplier = 1.35;
                break;
            case 'nanoburst':
                for (const building of this.buildingSystem.activeBuildings) {
                    building.repair(35);
                }
                break;
            case 'hunter_protocol':
                this.eliteDamageMultiplier = 1.25;
                break;
        }
    }

    public startGame() {
        this.isGameStarted = true;
        this.waveManager.setActive(true); // Активируем WaveManager
        this.uiManager.hideMenu();
        this.inputSystem.showControls();
        this.statsTracker.start();
        yaSdk.gameplayStart(); // Yandex GameplayAPI
        // Banner ads removed - per Yandex requirements, ads should only show after user action
    }

    public pauseGame() {
        this.isGameStarted = false;
        if (this.soundManager) this.soundManager.pause();
        yaSdk.gameplayStop(); // Yandex GameplayAPI
    }

    public resumeGame() {
        // Возобновляем только если не Game Over и не открыты меню
        if (!this.isGameOver && !this.uiManager.isSettingsOpen && !this.waveManager.isShopOpen) {
            this.isGameStarted = true;
            if (this.soundManager) this.soundManager.resume();
            yaSdk.gameplayStart(); // Yandex GameplayAPI
        }
    }

    public resize(width: number, height: number) {
        // Принудительно обновляем размеры рендера, если они рассинхронизировались
        this.app.renderer.resize(width, height);

        if (this.camera) {
            this.camera.resize(width, height);
            // Если экран узкий (мобилка), отдаляем камеру, чтобы видеть больше
            if (width < 800) {
                this.camera.setZoom(0.7);
            } else {
                this.camera.setZoom(1.0);
            }
        }
        if (this.miniMap) this.miniMap.resize(width);
        if (this.inputSystem) this.inputSystem.resize(this.app.screen); // Обновляем хитбокс без пересоздания контролов
        if (this.voidOverlay) {
            this.voidOverlay.clear().rect(0, 0, width, height).fill({ color: 0xFF0000, alpha: 0 });
        }

        // Обновляем позицию UI через CSS
        if (this.uiManager) this.uiManager.resize();
        if (this.resourceManager) this.resourceManager.resize();
    }

    private revivePlayer() {
        this.canRevive = false; // Одно воскрешение за сессию
        this.player.visible = true;
        this.player.hp = this.player.maxHp * 0.5;
        this.player.x = this.coreBuilding ? this.coreBuilding.x + 20 : this.mapSizePixel / 2;
        this.player.y = this.coreBuilding ? this.coreBuilding.y + 80 : this.mapSizePixel / 2;
        this.player.setInvulnerable(300); // 5 секунд

        // 2. Восстанавливаем ядро
        if (this.coreBuilding) {
            this.coreBuilding.isDestroyed = false;
            this.coreBuilding.hp = this.coreBuilding.maxHp * 0.5;
            this.coreBuilding.visible = true;
            this.coreBuilding.tint = 0xFFFFFF;
            this.coreBuilding.updateHpBar(); // Сброс визуального состояния полоски
        }

        // 3. Очищаем врагов
        this.enemies.forEach(e => {
            this.createExplosion(e.x, e.y, 0xFF0000, 10);
            this.world.removeChild(e);
        });
        this.enemies = [];

        // 4. Перезапускаем волну
        this.waveManager.resetWave();

        this.soundManager.playBuild();
        this.spawnFloatingText(this.player.x, this.player.y - 50, "REVIVED!", '#e67e22', 30);

        // 5. Снимаем флаг Game Over
        this.isGameOver = false;
    }

    // reasonCore: true если взорвалось ядро

    public restartGame() {
        this.isGameOver = false;
        this.isGameStarted = true;
        this.score = 0;
        this.canRevive = true;
        this.isEndlessMode = false;
        this.endlessDifficultyMultiplier = 1.0;
        this.waveStatMultiplier = 1.0;
        this.inputSystem.hideControls(); // Скрываем

        // Очистка
        this.enemies.forEach(e => this.world.removeChild(e));
        this.enemies = [];

        this.projectiles.forEach(p => this.world.removeChild(p));
        this.projectiles = [];

        this.particles.forEach(p => this.world.removeChild(p));
        this.particles = []; // Пул сам разберется, если мы просто скроем или переиспользуем? 
        // Лучше не удалять из world, а вернуть в пул. Но у нас нет метода returnAll.
        // Просто скроем и сбросим флаг isDead? Нет, лучше удалить и пусть пул наполнится заново или просто очистить массив.
        // Пул объектов у нас простой.

        this.dropItems.forEach(d => this.world.removeChild(d));
        this.dropItems = [];

        this.floatingTexts.forEach(f => this.world.removeChild(f));
        this.floatingTexts = [];

        // Сброс зданий
        this.buildingSystem.reset();

        // Сброс ресурсов и камней
        this.resources.forEach(r => this.world.removeChild(r));
        this.resources.length = 0;
        this.rocks.forEach(r => this.world.removeChild(r));
        this.rocks.length = 0;

        // Генерация нового мира
        this.generateResources();
        this.generateRocks();
        // Keep BuildingSystem references synced after world regeneration.
        this.buildingSystem.setResources(this.resources, this.resourceManager);
        this.buildingSystem.setRocks(this.rocks);
        this.rebuildPathfinderGrid();

        // Сброс игрока
        const coreGridX = Math.floor((this.mapSizePixel / 2) / 40) * 40;
        const coreGridY = Math.floor((this.mapSizePixel / 2) / 40) * 40;
        this.coreBuilding = this.buildingSystem.spawnCore(coreGridX, coreGridY);

        this.player.x = coreGridX + 20;
        this.player.y = coreGridY + 80;
        this.player.hp = this.player.maxHp = GameConfig.PLAYER.START_HP;
        this.player.visible = true;

        // v2.5: Сброс перков и статов игрока
        this.player.moveSpeed = GameConfig.PLAYER.BASE_SPEED;
        this.player.damage = 1;
        this.player.fireRate = 10;
        this.player.bulletsPerShot = 1;
        this.player.vampirism = 0;
        this.player.hasShield = false;
        this.player.ricochet = false;
        this.player.critChance = 0;
        this.player.slowBullets = false;
        this.player.explosiveRounds = false;
        this.currentMineMultiplier = 1;
        this.magnetRadius = 0;
        this.salvageBonusMultiplier = 1.0;
        this.eliteDamageMultiplier = 1.0;
        this.activeWaveMutator = null;

        // Сброс менеджеров
        this.resourceManager.reset();
        this.waveManager.reset();
        this.upgradeManager.reset();
        this.statsTracker.reset();

        this.isGameStarted = false; // Останавливаем игру
        this.waveManager.setActive(false); // Деактивируем WaveManager
        this.uiManager.showMenu(); // Показываем главное меню

        this.uiManager.updateHUD({ hp: this.player.hp, maxHp: this.player.maxHp }, { hp: this.coreBuilding.hp, maxHp: this.coreBuilding.maxHp });
        this.uiManager.updateScore(0);
        this.uiManager.updateWave(1);
    }

    public spawnFloatingText(x: number, y: number, text: string, color: string = '#ffffff', size: number = 16) {
        const ft = new FloatingText(x, y, text, color, size);
        this.world.addChild(ft);
        this.floatingTexts.push(ft);
    }

    public spawnShell(x: number, y: number) {
        if (!graphicsSettings.config.showShells) return;
        this.createParticle(x, y, 0, 'shell');
    }

    public createParticle(x: number, y: number, color: number, type: ParticleType = 'explosion') {
        // Hard cap on particles
        if (this.particles.length >= graphicsSettings.config.maxParticles) return;
        const p = this.particlePool.get();
        p.init(x, y, color, type);
        this.world.addChild(p);
        this.particles.push(p);
    }

    public createExplosion(x: number, y: number, color: number, count: number = 10) {
        const effectiveCount = Math.ceil(count * graphicsSettings.config.particleMultiplier);
        for (let i = 0; i < effectiveCount; i++) {
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
        this.activeWaveMutator = getScheduledWaveMutator(
            waveNum,
            (GameConfig.WAVES.MUTATORS || []) as WaveMutatorConfig[]
        );
        this.waveStatMultiplier = calculateWaveEnemyStatMultiplier(waveNum);
        const spawnRadius = applyWaveMutatorSpawnRadius(GameConfig.WAVES.SPAWN_RADIUS, this.activeWaveMutator?.type ?? null);
        const effectiveCount = applyWaveMutatorCount(count, this.activeWaveMutator?.type ?? null);

        if (this.activeWaveMutator) {
            this.spawnFloatingText(this.player.x, this.player.y - 130, this.t(this.activeWaveMutator.messageKey), '#8e44ad', 22);
            this.soundManager.playError();
        }

        // Check for endless mode activation (after wave 50)
        if (waveNum === 51 && !this.isEndlessMode) {
            this.isEndlessMode = true;
            this.spawnFloatingText(this.player.x, this.player.y - 100, this.t('endless_unlocked'), '#9b59b6', 28);
            this.soundManager.playBuild();
        }

        // Update endless mode difficulty scaling
        if (this.isEndlessMode) {
            this.endlessDifficultyMultiplier = calculateEndlessDifficultyMultiplier(waveNum);
        }

        // 1. Проверка на БОССА (каждые 10 волн)
        if (waveNum % GameConfig.WAVES.BOSS_WAVE_INTERVAL === 0) {
            this.spawnFloatingText(this.player.x, this.player.y - 100, `☠️ ${this.t('wave_boss_incoming')} ☠️`, '#e74c3c', 30);
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

        // 1.5. MINI-BOSS WAVE (волны 5, 15, 25, 35, etc.)
        if (waveNum >= 5 && waveNum % 10 === 5) {
            this.spawnFloatingText(this.player.x, this.player.y - 100, `⚔️ ${this.t('wave_miniboss')} ⚔️`, '#e67e22', 26);
            this.soundManager.playError();

            const angle = Math.random() * Math.PI * 2;
            this.spawnEnemy(this.coreBuilding.x + Math.cos(angle) * spawnRadius, this.coreBuilding.y + Math.sin(angle) * spawnRadius, 'miniboss');

            // Also spawn some escort enemies
            for (let i = 0; i < Math.floor(effectiveCount / 2); i++) {
                const a = angle + (Math.random() - 0.5) * 1.0;
                this.spawnEnemy(this.coreBuilding.x + Math.cos(a) * spawnRadius, this.coreBuilding.y + Math.sin(a) * spawnRadius, Math.random() < 0.5 ? 'fast' : 'shooter');
            }
            return;
        }

        // 2. Проверка на ОСОБЫЙ ПАТТЕРН
        const patterns = GameConfig.WAVES.PATTERNS as Record<number, { type: string; countMultiplier: number; messageKey: string }>;
        if (patterns[waveNum]) {
            const p = patterns[waveNum];
            this.spawnFloatingText(this.player.x, this.player.y - 100, this.t(p.messageKey), '#f1c40f', 24);
            this.soundManager.playError();

            const specialCount = Math.ceil(effectiveCount * p.countMultiplier);
            for (let i = 0; i < specialCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                this.spawnEnemy(this.coreBuilding.x + Math.cos(angle) * spawnRadius, this.coreBuilding.y + Math.sin(angle) * spawnRadius, p.type as EnemyType);
            }
            return;
        }

        // 3. ОБЫЧНАЯ ВОЛНА (Смешанная)
        for (let i = 0; i < effectiveCount; i++) {
            const type: EnemyType = determineEnemyType(waveNum, Math.random()) as EnemyType;

            const angle = Math.random() * Math.PI * 2;
            this.spawnEnemy(
                this.coreBuilding.x + Math.cos(angle) * spawnRadius,
                this.coreBuilding.y + Math.sin(angle) * spawnRadius,
                type
            );
        }
    }

    public spawnEnemy(x: number, y: number, type: EnemyType) {
        // Create rock blocker lazily - indestructible building for rock collisions
        if (!this.rockBlocker) {
            this.rockBlocker = new Building('wall', this.gridSize);
            this.rockBlocker.hp = Infinity;
            this.rockBlocker.maxHp = Infinity;
            this.rockBlocker.visible = false; // Invisible, just for collision
        }

        const enemy = new Enemy(this.coreBuilding, this.player, (ex, ey) => {
            // Check building collision
            const building = this.buildingSystem.getBuildingAt(ex, ey);
            if (building) return building;

            // Check rock collision - return indestructible blocker (not core!)
            if (this.buildingSystem.isRockAt(ex, ey)) {
                return this.rockBlocker; // Can't be damaged, just blocks movement
            }

            return null;
        }, type, this.pathfinder);

        enemy.x = x;
        enemy.y = y;

        // Apply endless mode scaling
        if (this.isEndlessMode && this.endlessDifficultyMultiplier > 1.0) {
            enemy.hp *= this.endlessDifficultyMultiplier;
            enemy.damage *= this.endlessDifficultyMultiplier;
        }

        if (this.waveStatMultiplier > 1.0) {
            enemy.hp *= this.waveStatMultiplier;
            enemy.damage *= this.waveStatMultiplier;
        }

        if (this.activeWaveMutator) {
            const boosted = applyWaveMutatorEnemyStats(enemy.hp, enemy.damage, this.activeWaveMutator.type);
            enemy.hp = boosted.hp;
            enemy.damage = boosted.damage;
        }

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
            if (dx * dx + dy * dy < rad * rad) this.player.takeDamage(dmg);

            this.buildingSystem.activeBuildings.forEach(b => {
                const bdx = b.x + 20 - ex;
                const bdy = b.y + 20 - ey;
                if (bdx * bdx + bdy * bdy < rad * rad) b.takeDamage(dmg);
            });
        };

        enemy.onSplit = (ex, ey, count) => {
            this.createExplosion(ex, ey, 0x9B59B6, 10);
            for (let i = 0; i < count; i++) {
                const offset = 30;
                const angle = (Math.PI * 2 / count) * i;
                this.spawnEnemy(ex + Math.cos(angle) * offset, ey + Math.sin(angle) * offset, 'fast');
            }
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
                // Попадание в игрока
                const dx = this.player.x - p.x;
                const dy = this.player.y - p.y;
                if (Math.sqrt(dx * dx + dy * dy) < 20) {
                    this.player.takeDamage(p.damage);
                    p.shouldDestroy = true;
                }

                // Попадание в здания
                if (!p.shouldDestroy) {
                    const building = this.buildingSystem.getBuildingAt(p.x, p.y);
                    if (building) {
                        building.takeDamage(p.damage);
                        p.shouldDestroy = true;
                        this.createParticle(p.x, p.y, 0x00FF00, 'spark');
                    }
                }
            } else {
                for (const enemy of this.enemies) {
                    const dx = enemy.x - p.x;
                    const dy = enemy.y - p.y;
                    if (Math.sqrt(dx * dx + dy * dy) < enemy.hitboxRadius) {
                        // Critical hit check
                        let finalDamage = p.damage;
                        let isCrit = false;
                        if (this.eliteDamageMultiplier > 1.0 && ['boss', 'miniboss', 'juggernaut', 'shieldbearer'].includes(enemy.type)) {
                            finalDamage *= this.eliteDamageMultiplier;
                        }
                        if (this.player.critChance > 0 && Math.random() < this.player.critChance) {
                            finalDamage *= 2;
                            isCrit = true;
                        }

                        enemy.takeDamage(finalDamage);
                        this.statsTracker.addDamage(finalDamage);

                        // Slow bullets effect
                        if (this.player.slowBullets) {
                            enemy.speedMultiplier = Math.min(enemy.speedMultiplier, 0.5);
                        }

                        // Vampirism effect - heal player on hit
                        if (this.player.vampirism > 0 && Math.random() < this.player.vampirism) {
                            this.player.hp = Math.min(this.player.hp + 1, this.player.maxHp);
                            this.spawnFloatingText(this.player.x, this.player.y - 20, '+1 HP', '#e74c3c', 12);
                        }

                        // Explosive rounds - AOE damage
                        if (this.player.explosiveRounds) {
                            this.createExplosion(enemy.x, enemy.y, 0xFF6600, 10);
                            for (const otherEnemy of this.enemies) {
                                if (otherEnemy === enemy) continue;
                                const aoeDx = otherEnemy.x - enemy.x;
                                const aoeDy = otherEnemy.y - enemy.y;
                                const aoeDist = Math.sqrt(aoeDx * aoeDx + aoeDy * aoeDy);
                                if (aoeDist < 60) {
                                    otherEnemy.takeDamage(finalDamage * 0.5);
                                    this.statsTracker.addDamage(finalDamage * 0.5);
                                }
                            }
                        }

                        // Visual feedback
                        const dmgColor = isCrit ? '#ff0000' : '#ffffff';
                        const dmgText = isCrit ? `${Math.floor(finalDamage)}!` : Math.floor(finalDamage).toString();
                        this.spawnFloatingText(enemy.x, enemy.y - 20, dmgText, dmgColor, isCrit ? 18 : 14);
                        this.createParticle(p.x, p.y, isCrit ? 0xff0000 : 0xffffff, 'spark');

                        // Ricochet check
                        if (this.player.ricochet && !p.hasRicocheted) {
                            // Find nearest enemy to bounce to
                            let nearestEnemy: Enemy | null = null;
                            let nearestDist = 200; // Max ricochet range

                            for (const otherEnemy of this.enemies) {
                                if (otherEnemy === enemy || otherEnemy.isDead) continue;
                                const edx = otherEnemy.x - enemy.x;
                                const edy = otherEnemy.y - enemy.y;
                                const edist = Math.sqrt(edx * edx + edy * edy);
                                if (edist < nearestDist) {
                                    nearestDist = edist;
                                    nearestEnemy = otherEnemy;
                                }
                            }

                            if (nearestEnemy) {
                                // Spawn a new ricochet projectile
                                const ricochetP = this.projectilePool.get();
                                ricochetP.init(enemy.x, enemy.y, nearestEnemy.x, nearestEnemy.y, p.damage * 0.5, false);
                                (ricochetP as any).hasRicocheted = true;
                                this.world.addChild(ricochetP);
                                this.projectiles.push(ricochetP);
                                this.createParticle(enemy.x, enemy.y, 0x00ff00, 'spark');
                            }
                        }

                        p.shouldDestroy = true;
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
                    this.player.takeDamage(enemy.damage);
                    this.soundManager.playEnemyHit();
                    this.camera.shake(5, 0.1);
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
        yaSdk.gameplayStop(); // Yandex GameplayAPI

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

        // Stop tracking and get stats
        this.statsTracker.stop();
        this.statsTracker.setWave(this.waveManager.waveCount);
        const stats = this.statsTracker.getStats();

        // Отправляем рекорды в оба лидерборда последовательно, чтобы избежать гонки вызовов SDK
        void (async () => {
            await yaSdk.setLeaderboardScore(this.waveManager.waveCount, 'waves');
            await yaSdk.setLeaderboardScore(this.score, 'score');
        })();

        // Show Game Over screen directly - ads will be shown when user clicks Restart (per Yandex requirements)
        setTimeout(() => {
            this.uiManager.showGameOver(this.canRevive, stats, (ms) => this.statsTracker.formatTime(ms));
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
                // Начисляем очки
                const scoreReward = GameConfig.ENEMIES[enemy.type.toUpperCase() as keyof typeof GameConfig.ENEMIES]?.score || 10;
                this.score += scoreReward;
                this.uiManager.updateScore(this.score);

                // Track stats and achievements
                const isBoss = enemy.type === 'boss' || enemy.type === 'miniboss';
                this.statsTracker.addKill(isBoss);
                this.achievementManager.addProgress('kill');
                if (isBoss) {
                    this.achievementManager.addProgress('boss_kill');
                }

                // Если это босс, то выпадать будет Data Core гарантированно
                if (enemy.type === 'boss') {
                    this.waveManager.isBossActive = false; // Снимаем паузу
                    const drop = new DropItem(enemy.x, enemy.y, 0, 'data_core');
                    this.world.addChild(drop);
                    this.dropItems.push(drop);
                } else if (enemy.type === 'miniboss') {
                    // Mini-boss drops bonus resources
                    const bonusMetal = Math.floor((100 + this.waveManager.waveCount * 5) * this.salvageBonusMultiplier);
                    this.resourceManager.addMetal(bonusMetal);
                    this.resourceManager.addBiomass(Math.floor(50 * this.salvageBonusMultiplier));
                    const bonusBio = Math.floor(50 * this.salvageBonusMultiplier);
                    this.spawnFloatingText(enemy.x, enemy.y - 30, `+${bonusMetal} 🔩 +${bonusBio} 🧬`, '#2ecc71', 18);
                } else {
                    // Шанс дропа обычных ресурсов повышен до 70%
                    if (Math.random() < 0.7) {
                        const reward = Math.floor((GameConfig.ENEMIES[enemy.type.toUpperCase() as keyof typeof GameConfig.ENEMIES]?.reward || 5) * this.salvageBonusMultiplier);
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
            let placed = false;
            for (let attempt = 0; attempt < 100; attempt++) {
                const rx = Math.floor(Math.random() * tiles) * gridSize;
                const ry = Math.floor(Math.random() * tiles) * gridSize;
                const centerX = this.mapSizePixel / 2;
                const centerY = this.mapSizePixel / 2;
                if (Math.abs(rx - centerX) < 200 && Math.abs(ry - centerY) < 200) continue;
                const node = new ResourceNode(gridSize);
                node.x = rx; node.y = ry;
                this.world.addChild(node);
                this.resources.push(node);
                placed = true;
                break;
            }
            if (!placed) break; // Map is too full, stop
        }
    }

    private generateRocks() {
        for (let i = 0; i < 20; i++) {
            let placed = false;
            for (let attempt = 0; attempt < 100; attempt++) {
                const radius = 20 + Math.random() * 20;
                const rx = Math.random() * this.mapSizePixel;
                const ry = Math.random() * this.mapSizePixel;
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
                const rock = new Rock(radius);
                rock.x = rx; rock.y = ry;
                this.world.addChild(rock);
                this.rocks.push(rock);
                placed = true;
                break;
            }
            if (!placed) break;
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
