import { Application, Container, Graphics, FederatedPointerEvent, Ticker } from 'pixi.js';
import { Building, type BuildingType } from './Building';
import type { ResourceNode } from './ResourceNode';
import type { ResourceManager } from './ResourceManager';
import type { Enemy } from './Enemy';
import type { SoundManager } from './SoundManager';
import type { ToolType } from './UIManager'; // Импорт нового типа

const BUILDING_COSTS: Record<BuildingType, number> = {
    'wall': 10,
    'drill': 50,
    'generator': 100,
    'turret': 30
};

export class BuildingSystem {
    private world: Container;
    private app: Application;
    private ghost: Graphics;
    private gridSize: number = 40;
    
    private buildings: Map<string, Building>; 
    private player: Container | null = null;
    
    // Теперь храним ToolType
    private selectedTool: ToolType = 'wall';
    
    private resources: ResourceNode[] = [];
    private resourceManager: ResourceManager | null = null;
    private isDragging: boolean = false;
    private soundManager: SoundManager | null = null;

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
    public setResources(resources: ResourceNode[], manager: ResourceManager) {
        this.resources = resources;
        this.resourceManager = manager;
    }
    
    // Обновили сигнатуру: принимает ToolType
    public setTool(tool: ToolType) { 
        this.selectedTool = tool; 
    }
    
    public setPlayer(player: Container) { this.player = player; }

    public update(ticker: Ticker, enemies: Enemy[], spawnProjectile: any) {
        let totalProduction = 10;
        let totalConsumption = 0;
        this.buildings.forEach(b => {
            totalProduction += b.energyProduction;
            totalConsumption += b.energyConsumption;
        });
        let efficiency = totalConsumption > totalProduction ? totalProduction / totalConsumption : 1.0;
        if (this.resourceManager) this.resourceManager.updateEnergy(totalProduction, totalConsumption);

        this.buildings.forEach((building, key) => {
            if (building.isDestroyed) {
                this.world.removeChild(building);
                this.buildings.delete(key);
                this.soundManager?.playHit(); 
            } else {
                building.update(ticker, enemies, spawnProjectile, efficiency);
            }
        });
    }

    public getBuildingAt(worldX: number, worldY: number): Building | null {
        const gridX = Math.floor(worldX / this.gridSize) * this.gridSize;
        const gridY = Math.floor(worldY / this.gridSize) * this.gridSize;
        return this.buildings.get(`${gridX},${gridY}`) || null;
    }

    public isOccupied(worldX: number, worldY: number): boolean {
        return this.getBuildingAt(worldX, worldY) !== null;
    }
    
    private initInput() {
        this.app.stage.eventMode = 'static';
        this.app.stage.hitArea = this.app.screen;
        this.app.stage.on('pointermove', (e) => { 
            this.updateGhost(e); 
            if (this.isDragging) this.handleAction(); // Переименовали placeBuilding в handleAction
        });
        this.app.stage.on('pointerdown', (e) => {
            if (e.button === 0) {
                this.isDragging = true;
                this.handleAction();
            }
        });
        this.app.stage.on('pointerup', () => { this.isDragging = false; });
        this.app.stage.on('pointerupoutside', () => { this.isDragging = false; });
    }

    private updateGhost(e: FederatedPointerEvent) {
        const pos = this.getMouseGridPosition(e);
        this.ghost.x = pos.x;
        this.ghost.y = pos.y;
        this.ghost.clear();
        this.ghost.rect(0, 0, this.gridSize, this.gridSize);
        
        // РЕЖИМ РЕМОНТА
        if (this.selectedTool === 'repair') {
            const building = this.getBuildingAt(pos.x, pos.y);
            if (building && building.hp < building.maxHp) {
                this.ghost.fill({ color: 0xFFFF00, alpha: 0.5 }); // Желтый (можно чинить)
            } else {
                this.ghost.clear(); // Нечего чинить
            }
            return;
        }

        // РЕЖИМ СНОСА
        if (this.selectedTool === 'demolish') {
            const building = this.getBuildingAt(pos.x, pos.y);
            if (building) {
                this.ghost.fill({ color: 0xFF0000, alpha: 0.7 }); // Ярко красный (удалить)
            } else {
                this.ghost.clear();
            }
            return;
        }

        // РЕЖИМ СТРОИТЕЛЬСТВА
        const type = this.selectedTool as BuildingType; // Приводим к типу здания
        const cost = BUILDING_COSTS[type];
        const canAfford = this.resourceManager ? this.resourceManager.hasMetal(cost) : false;
        const isPlaceable = this.canBuildAt(pos.x, pos.y);

        if (isPlaceable && canAfford) {
            let color = 0x00FF00;
            if (type === 'drill') color = 0x3498db;
            if (type === 'generator') color = 0xe67e22;
            if (type === 'turret') color = 0x2ecc71; 
            this.ghost.fill({ color: color, alpha: 0.5 });
        } else {
            this.ghost.fill({ color: 0xFF0000, alpha: 0.5 });
        }
    }

    private getMouseGridPosition(e: FederatedPointerEvent) {
        const localPos = this.world.toLocal(e.global);
        const snapX = Math.floor(localPos.x / this.gridSize) * this.gridSize;
        const snapY = Math.floor(localPos.y / this.gridSize) * this.gridSize;
        return { x: snapX, y: snapY };
    }

    // Главный метод действия
    private handleAction() {
        const x = this.ghost.x;
        const y = this.ghost.y;

        // 1. РЕМОНТ
        if (this.selectedTool === 'repair') {
            const building = this.getBuildingAt(x, y);
            if (building && building.hp < building.maxHp) {
                // Цена ремонта: 1 металл за 10 HP (или просто 1 за клик)
                // Сделаем просто: 5 металла за полную починку или потихоньку?
                // Сделаем по клику +10 HP за 2 металла
                const repairCost = 2;
                if (this.resourceManager && this.resourceManager.hasMetal(repairCost)) {
                    this.resourceManager.spendMetal(repairCost);
                    building.repair(20); // Чиним 20 HP
                    this.soundManager?.playBuild(); // Звук (можно другой добавить)
                }
            }
            return;
        }

        // 2. СНОС
        if (this.selectedTool === 'demolish') {
            const building = this.getBuildingAt(x, y);
            if (building) {
                const key = `${x},${y}`;
                const originalCost = BUILDING_COSTS[building.buildingType];
                // Возврат 50%
                this.resourceManager?.addMetal(Math.floor(originalCost * 0.5));
                
                this.world.removeChild(building);
                this.buildings.delete(key);
                this.soundManager?.playMine(); // Звук (как будто разобрали)
            }
            return;
        }

        // 3. СТРОИТЕЛЬСТВО
        this.placeBuilding(x, y);
    }

    private canBuildAt(x: number, y: number): boolean {
        const key = `${x},${y}`;
        if (this.buildings.has(key)) return false;
        if (this.player) {
            const buildRect = { x: x, y: y, w: this.gridSize, h: this.gridSize };
            const playerRect = { x: this.player.x - 16, y: this.player.y - 16, w: 32, h: 32 };
            const overlap = (buildRect.x < playerRect.x + playerRect.w && buildRect.x + buildRect.w > playerRect.x && buildRect.y < playerRect.y + playerRect.h && buildRect.y + buildRect.h > playerRect.y);
            if (overlap) return false;
        }
        return true;
    }

    private placeBuilding(x: number, y: number) {
        if (!this.canBuildAt(x, y)) return;
        const type = this.selectedTool as BuildingType;
        const cost = BUILDING_COSTS[type];
        
        if (this.resourceManager && !this.resourceManager.hasMetal(cost)) {
            // this.soundManager?.playError();  // Слишком часто играет при драге
            return;
        }
        if (this.resourceManager) this.resourceManager.spendMetal(cost);

        const building = new Building(type, this.gridSize);
        building.x = x;
        building.y = y;
        if (type === 'drill' && this.resourceManager) {
            const ore = this.resources.find(r => r.x === x && r.y === y);
            if (ore) building.startMining(this.resourceManager);
        }
        this.soundManager?.playBuild();
        this.world.addChild(building);
        this.buildings.set(`${x},${y}`, building);
    }
}