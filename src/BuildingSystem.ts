import { Application, Container, Graphics, FederatedPointerEvent, Ticker } from 'pixi.js';
import { Building, type BuildingType } from './Building';
import type { ResourceNode } from './ResourceNode';
import type { ResourceManager } from './ResourceManager';
import type { Enemy } from './Enemy';
import type { SoundManager } from './SoundManager';
import type { ToolType } from './UIManager';
import type { Rock } from './Rock';
import { GameConfig } from './GameConfig';
import { VirtualJoystick } from './VirtualJoystick';

const BUILDING_COSTS: Record<BuildingType, number> = {
    'wall': 10,
    'drill': 50,
    'generator': 100,
    'turret': 30,    
    'sniper': 75,    
    'minigun': 120,
    'battery': 150, 
    'laser': 200,   
    'core': 0
};

export class BuildingSystem {
    private world: Container;
    private app: Application;
    private ghost: Graphics;
    private gridSize: number = 40;
    
    private buildings: Map<string, Building>; 
    private player: Container | null = null;
    private selectedTool: ToolType = 'wall';
    private isToolActive: boolean = true; // false = ничего в руках, клики игнорируются
    private resources: ResourceNode[] = [];
    private rocks: Rock[] = [];
    private resourceManager: ResourceManager | null = null;
    private isDragging: boolean = false;
    private soundManager: SoundManager | null = null;
    private isPaused: boolean = false;
    private activeBuildPointerId: number | null = null;

    private regenAmount: number = 0;
    private regenTimer: number = 0;
    private thornsDamage: number = 0;

    public onBuildingDestroyed?: (x: number, y: number) => void;
    public checkUnlock?: (type: string) => boolean; // Добавлено

    constructor(app: Application, world: Container) {
        this.app = app;
        this.world = world;
        this.buildings = new Map();
        this.ghost = new Graphics();
        this.ghost.rect(0, 0, this.gridSize, this.gridSize);
        this.world.addChild(this.ghost);
        this.initInput();
    }

    public setSoundManager(sm: SoundManager) { this.soundManager = sm; }
    public setRegenAmount(amount: number) { this.regenAmount = amount; }
    public setThornsDamage(damage: number) { 
        this.thornsDamage = damage; 
        this.buildings.forEach(b => b.thornsDamage = damage);
    }
    public setResources(resources: ResourceNode[], manager: ResourceManager) {
        this.resources = resources;
        this.resourceManager = manager;
    }
    public setRocks(rocks: Rock[]) {
        this.rocks = rocks;
    }
    public setTool(tool: ToolType) { this.selectedTool = tool; this.isToolActive = true; }
    public setToolActive(active: boolean) { this.isToolActive = active; this.ghost.visible = active && !this.isPaused; }
    public setPlayer(player: Container) { this.player = player; }
    public setPaused(paused: boolean) { 
        this.isPaused = paused; 
        this.ghost.visible = !paused;
    }

    public reset() {
        this.buildings.forEach(b => this.world.removeChild(b));
        this.buildings.clear();
        this.ghost.visible = true;
        this.isPaused = false;
        // Параметры регенерации сбрасывать не обязательно, если они сохраняются как прокачка
        // Но если прокачка должна сбрасываться при рестарте (рогалик), то сбрасываем.
        // Пока сбросим.
        this.regenAmount = 0;
        this.thornsDamage = 0;
    }

    public update(
        ticker: Ticker, 
        enemies: Enemy[], 
        spawnProjectile: (x: number, y: number, tx: number, ty: number, damage: number) => void
    ) {
        let totalProduction = 0;
        let totalConsumption = 0;
        let totalCapacity = 0;

        this.buildings.forEach(b => {
            totalProduction += b.energyProduction;
            totalConsumption += b.energyConsumption;
            totalCapacity += b.energyCapacity;
        });
        
        let efficiency = 1.0;
        if (totalConsumption > totalProduction) {
            if (this.resourceManager && this.resourceManager.isBlackout) {
                efficiency = totalProduction / totalConsumption;
            } else {
                efficiency = 1.0;
            }
        }

        if (this.resourceManager) {
            this.resourceManager.setEnergyStats(totalProduction, totalConsumption, totalCapacity);
            this.resourceManager.updateBattery(ticker.deltaMS / 1000);
        }

        if (this.regenAmount > 0 && efficiency > 0.5) {
            this.regenTimer += ticker.deltaTime;
            if (this.regenTimer >= 60) {
                this.regenTimer = 0;
                this.buildings.forEach(b => {
                    if (b.hp < b.maxHp) b.repair(this.regenAmount);
                });
            }
        }

        this.buildings.forEach((building, key) => {
            if (building.isDestroyed) {
                if (this.onBuildingDestroyed) {
                    this.onBuildingDestroyed(building.x, building.y);
                }
                
                this.world.removeChild(building);
                this.buildings.delete(key);
                this.soundManager?.playHit(); 
            } else {
                building.update(ticker, enemies, spawnProjectile, efficiency);
            }
        });
    }

    public getBuildingInfoAt(worldX: number, worldY: number) {
        const b = this.getBuildingAt(worldX, worldY);
        if (!b) return null;

        let energyStr = '';
        if (b.energyProduction > 0) energyStr = `+${b.energyProduction}`;
        else if (b.energyConsumption > 0) energyStr = `-${b.energyConsumption}`;
        
        if (b.energyCapacity > 0) energyStr += ` [Cap: ${b.energyCapacity}]`;

        return {
            name: b.buildingType,
            hp: b.hp,
            maxHp: b.maxHp,
            damage: (['turret', 'sniper', 'minigun', 'laser'].includes(b.buildingType)) ? b.damage : undefined,
            energy: energyStr || undefined
        };
    }

    public isOccupied(worldX: number, worldY: number): boolean {
        for (const b of this.buildings.values()) {
            if (worldX >= b.x && worldX <= b.x + this.gridSize &&
                worldY >= b.y && worldY <= b.y + this.gridSize) {
                return true;
            }
        }
        
        for (const rock of this.rocks) {
            const dx = worldX - rock.x;
            const dy = worldY - rock.y;
            if (dx * dx + dy * dy < (rock.radius + 5) ** 2) return true;
        }
        return false;
    }

    public getBuildingAt(x: number, y: number): Building | null {
        const gx = Math.floor(x / this.gridSize) * this.gridSize;
        const gy = Math.floor(y / this.gridSize) * this.gridSize;
        return this.buildings.get(`${gx},${gy}`) || null;
    }
    
    private initInput() {
        this.app.stage.eventMode = 'static';
        this.app.stage.hitArea = this.app.screen;
        this.app.stage.on('pointermove', (e) => { 
            if (this.isPaused) return;
            if (this.activeBuildPointerId !== null && e.pointerId !== this.activeBuildPointerId) return;
            if (this.isBuildInputBlocked(e)) {
                this.isDragging = false;
                this.activeBuildPointerId = null;
                return;
            }
            if ((e as any).pointerType === 'touch') {
                this.ghost.visible = true;
            }
            this.updateGhost(e); 
            if (this.isDragging) this.handleAction();
        });
        this.app.stage.on('pointerdown', (e) => {
            if (this.isPaused) return;
            if (this.isBuildInputBlocked(e)) return;
            if (e.button === 0) {
                this.activeBuildPointerId = e.pointerId;
                this.isDragging = true;
                if ((e as any).pointerType === 'touch') {
                    this.ghost.visible = true;
                }
                this.updateGhost(e);
                this.handleAction();
            }
        });
        this.app.stage.on('pointerup', (e) => {
            if (this.activeBuildPointerId === e.pointerId) {
                this.activeBuildPointerId = null;
            }
            this.isDragging = false;
            if ((e as any).pointerType === 'touch') {
                this.ghost.visible = false;
            }
        });
        this.app.stage.on('pointerupoutside', (e) => {
            if (this.activeBuildPointerId === e.pointerId) {
                this.activeBuildPointerId = null;
            }
            this.isDragging = false;
            if ((e as any).pointerType === 'touch') {
                this.ghost.visible = false;
            }
        });
    }

    private isBuildInputBlocked(e: FederatedPointerEvent): boolean {
        if (VirtualJoystick.activeCount() > 1) return true;
        if (VirtualJoystick.isTouchCaptured(e.pointerId)) return true;
        return this.isPointerOverUI(e);
    }

    private isPointerOverUI(e: FederatedPointerEvent): boolean {
        if (typeof document === 'undefined') return false;
        const el = document.elementFromPoint(e.global.x, e.global.y);
        if (!el) return false;
        // Используем canvas вместо view для v8
        return el !== this.app.canvas && el.tagName !== 'CANVAS';
    }

    private updateGhost(e: FederatedPointerEvent) {
        const pos = this.getMouseGridPosition(e);
        this.ghost.x = pos.x;
        this.ghost.y = pos.y;
        this.ghost.clear();
        this.ghost.removeChildren(); 
        
        // Рисуем сетку 3x3 вокруг курсора для удобства
        this.ghost.rect(0, 0, this.gridSize, this.gridSize);
        this.ghost.stroke({ width: 2, color: 0xFFFFFF, alpha: 0.8 }); // Основной квадрат
        
        // Соседние клетки (яркий крестик)
        const ghostGrid = new Graphics();
        const gs = this.gridSize;
        // Линии сетки
        ghostGrid.moveTo(-gs, 0).lineTo(gs*2, 0); // Верхняя горизонталь
        ghostGrid.moveTo(-gs, gs).lineTo(gs*2, gs); // Нижняя горизонталь
        ghostGrid.moveTo(0, -gs).lineTo(0, gs*2); // Левая вертикаль
        ghostGrid.moveTo(gs, -gs).lineTo(gs, gs*2); // Правая вертикаль
        
        ghostGrid.stroke({ width: 1, color: 0x00FFFF, alpha: 0.5 }); // Голубой цвет, 50% прозрачности
        this.ghost.addChild(ghostGrid);
        
        if (this.selectedTool === 'repair') {
            const building = this.getBuildingAt(pos.x, pos.y);
            this.ghost.fill(building && building.hp < building.maxHp ? { color: 0xFFFF00, alpha: 0.5 } : { alpha: 0 });
            return;
        }
        if (this.selectedTool === 'demolish') {
             const building = this.getBuildingAt(pos.x, pos.y);
             this.ghost.fill(building ? { color: 0xFF0000, alpha: 0.7 } : { alpha: 0 });
             return;
        }

        const type = this.selectedTool as BuildingType; 
        const cost = BUILDING_COSTS[type] || 0;
        const canAfford = this.resourceManager ? this.resourceManager.hasMetal(cost) : false;
        const isPlaceable = this.canBuildAt(pos.x, pos.y);

        if (isPlaceable && canAfford) {
            let color = 0x00FF00;
            if (type === 'drill') color = 0x3498db;
            if (type === 'generator') color = 0xe67e22;
            if (type === 'turret') color = 0x2ecc71; 
            if (type === 'sniper') color = 0x555555; 
            if (type === 'minigun') color = 0x8e44ad; 
            if (type === 'battery') color = 0x2ecc71;
            if (type === 'laser') color = 0xe74c3c;
            
            this.ghost.fill({ color: color, alpha: 0.5 });

            // РИСУЕМ РАДИУС
            const stats = (GameConfig.BUILDINGS as any)[type];
            if (stats && stats.range) {
                const rangeG = new Graphics();
                rangeG.circle(this.gridSize / 2, this.gridSize / 2, stats.range);
                rangeG.fill({ color: color, alpha: 0.1 });
                rangeG.stroke({ width: 1, color: color, alpha: 0.3 });
                this.ghost.addChild(rangeG);
            }
        } else {
            this.ghost.fill({ color: 0xFF0000, alpha: 0.5 });
        }
    }

    private handleAction() {
        // Если инструмент не активен (ничего в руках) - ничего не делаем
        if (!this.isToolActive) return;

        const { x, y } = this.ghost;
        if (this.selectedTool === 'repair') {
            const building = this.getBuildingAt(x, y);
            if (building && building.hp < building.maxHp) {
                const repairCost = 2;
                if (this.resourceManager && this.resourceManager.hasMetal(repairCost)) {
                    this.resourceManager.spendMetal(repairCost);
                    building.repair(20); 
                    this.soundManager?.playBuild();
                }
            }
            return;
        }

        if (this.selectedTool === 'demolish') {
            const building = this.getBuildingAt(x, y);
            if (building && building.buildingType !== 'core') { 
                const originalCost = BUILDING_COSTS[building.buildingType];
                this.resourceManager?.addMetal(Math.floor(originalCost * 0.5));
                
                if (this.onBuildingDestroyed) this.onBuildingDestroyed(building.x, building.y);

                this.world.removeChild(building);
                this.buildings.delete(`${x},${y}`);
                this.soundManager?.playMine();
            }
            return;
        }

        this.placeBuilding(x, y);
    }

    private canBuildAt(x: number, y: number): boolean {
        const gx = Math.floor(x / this.gridSize) * this.gridSize;
        const gy = Math.floor(y / this.gridSize) * this.gridSize;
        const key = `${gx},${gy}`;
        
        if (this.buildings.has(key)) return false;

        const cx = x + this.gridSize / 2;
        const cy = y + this.gridSize / 2;
        for (const rock of this.rocks) {
            const dx = cx - rock.x;
            const dy = cy - rock.y;
            if (dx*dx + dy*dy < (20 + rock.radius) ** 2) return false;
        }

        const hasResource = this.resources.some(r => r.x === x && r.y === y);
        const type = this.selectedTool as BuildingType;

        if (hasResource) {
            if (type !== 'drill') return false;
        } else {
            if (type === 'drill') return false;
        }

        if (this.player) {
            const buildRect = { x: gx, y: gy, w: this.gridSize, h: this.gridSize };
            const playerRect = { x: this.player.x - 16, y: this.player.y - 16, w: 32, h: 32 };
            const overlap = (buildRect.x < playerRect.x + playerRect.w && buildRect.x + buildRect.w > playerRect.x && buildRect.y < playerRect.y + playerRect.h && buildRect.y + buildRect.h > playerRect.y);
            if (overlap) return false;
        }
        return true;
    }

    private placeBuilding(x: number, y: number) {
        if (!this.canBuildAt(x, y)) return;
        const type = this.selectedTool;
        if (type === 'repair' || type === 'demolish') return;

        // Проверка блокировки
        if (this.checkUnlock && !this.checkUnlock(type)) {
            // Можно добавить звук ошибки
            return;
        }

        const cost = BUILDING_COSTS[type as BuildingType];
        
        if (this.resourceManager && !this.resourceManager.hasMetal(cost)) return;
        if (this.resourceManager) this.resourceManager.spendMetal(cost);

        const gx = Math.floor(x / this.gridSize) * this.gridSize;
        const gy = Math.floor(y / this.gridSize) * this.gridSize;

        const building = new Building(type, this.gridSize);
        building.x = gx;
        building.y = gy;
        building.thornsDamage = this.thornsDamage; 
        if (type === 'drill' && this.resourceManager) {
            const ore = this.resources.find(r => r.x === gx && r.y === gy);
            if (ore) building.startMining(this.resourceManager);
        }
        this.soundManager?.playBuild();
        this.world.addChild(building);
        this.buildings.set(`${gx},${gy}`, building);
    }

    public spawnCore(x: number, y: number) {
        const gx = Math.floor(x / this.gridSize) * this.gridSize;
        const gy = Math.floor(y / this.gridSize) * this.gridSize;
        const building = new Building('core', this.gridSize);
        building.x = gx;
        building.y = gy;
        building.thornsDamage = this.thornsDamage;
        this.world.addChild(building);
        this.buildings.set(`${gx},${gy}`, building);
        return building;
    }

    public get activeBuildings(): Building[] {
        return Array.from(this.buildings.values());
    }

    private getMouseGridPosition(e: FederatedPointerEvent) {
        const worldPos = this.world.toLocal(e.global);
        return {
            x: Math.floor(worldPos.x / this.gridSize) * this.gridSize,
            y: Math.floor(worldPos.y / this.gridSize) * this.gridSize
        };
    }
}
