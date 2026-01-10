import { Application, Container, Graphics, FederatedPointerEvent, Ticker } from 'pixi.js';
import { Building, type BuildingType } from './Building';
import type { ResourceNode } from './ResourceNode';
import type { ResourceManager } from './ResourceManager';
import type { Enemy } from './Enemy';

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
    private selectedType: BuildingType = 'wall';
    
    private resources: ResourceNode[] = [];
    private resourceManager: ResourceManager | null = null;

    // Флаг для рисования линией
    private isDragging: boolean = false;

    constructor(app: Application, world: Container) {
        this.app = app;
        this.world = world;
        this.buildings = new Map();

        this.ghost = new Graphics();
        this.ghost.rect(0, 0, this.gridSize, this.gridSize);
        this.world.addChild(this.ghost);

        this.initInput();
    }

    public setResources(resources: ResourceNode[], manager: ResourceManager) {
        this.resources = resources;
        this.resourceManager = manager;
    }

    public setBuildingType(type: BuildingType) {
        this.selectedType = type;
    }

    public setPlayer(player: Container) {
        this.player = player;
    }

    public update(
        ticker: Ticker, 
        enemies: Enemy[], 
        spawnProjectile: (x: number, y: number, tx: number, ty: number) => void
    ) {
        this.buildings.forEach(building => {
            building.update(ticker, enemies, spawnProjectile);
        });
    }

    private initInput() {
        this.app.stage.eventMode = 'static';
        this.app.stage.hitArea = this.app.screen;

        // ДВИЖЕНИЕ МЫШИ
        this.app.stage.on('pointermove', (e) => { 
            this.updateGhost(e); 
            
            // Если мышь зажата -> пытаемся строить
            if (this.isDragging) {
                this.placeBuilding();
            }
        });

        // НАЖАТИЕ
        this.app.stage.on('pointerdown', (e) => {
            if (e.button === 0) {
                this.isDragging = true;
                this.placeBuilding();
            }
        });

        // ОТПУСКАНИЕ (и выход за пределы экрана)
        this.app.stage.on('pointerup', () => { this.isDragging = false; });
        this.app.stage.on('pointerupoutside', () => { this.isDragging = false; });
    }

    private updateGhost(e: FederatedPointerEvent) {
        const pos = this.getMouseGridPosition(e);
        this.ghost.x = pos.x;
        this.ghost.y = pos.y;
        this.ghost.clear();
        this.ghost.rect(0, 0, this.gridSize, this.gridSize);
        
        const cost = BUILDING_COSTS[this.selectedType];
        const canAfford = this.resourceManager ? this.resourceManager.hasMetal(cost) : false;
        const isPlaceable = this.canBuildAt(pos.x, pos.y);

        if (isPlaceable && canAfford) {
            let color = 0x00FF00;
            if (this.selectedType === 'drill') color = 0x3498db;
            if (this.selectedType === 'generator') color = 0xe67e22;
            if (this.selectedType === 'turret') color = 0x2ecc71;
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

    private canBuildAt(x: number, y: number): boolean {
        const key = `${x},${y}`;
        if (this.buildings.has(key)) return false;

        if (this.player) {
            const buildRect = { x: x, y: y, w: this.gridSize, h: this.gridSize };
            const playerRect = { x: this.player.x - 16, y: this.player.y - 16, w: 32, h: 32 };
            const overlap = (
                buildRect.x < playerRect.x + playerRect.w &&
                buildRect.x + buildRect.w > playerRect.x &&
                buildRect.y < playerRect.y + playerRect.h &&
                buildRect.y + buildRect.h > playerRect.y
            );
            if (overlap) return false;
        }
        return true;
    }

    private placeBuilding() {
        const x = this.ghost.x;
        const y = this.ghost.y;

        // Если здесь уже построено или нельзя строить - выходим
        if (!this.canBuildAt(x, y)) return;

        const cost = BUILDING_COSTS[this.selectedType];
        if (this.resourceManager && !this.resourceManager.hasMetal(cost)) return;

        // Списываем средства
        if (this.resourceManager) this.resourceManager.spendMetal(cost);

        const building = new Building(this.selectedType, this.gridSize);
        building.x = x;
        building.y = y;

        if (this.selectedType === 'drill' && this.resourceManager) {
            // Для буров проверка центра тоже полезна, но пока оставим по сетке (exact match)
            // Бур занимает клетку целиком, и руда занимает клетку целиком в логике (x,y)
            const ore = this.resources.find(r => r.x === x && r.y === y);
            if (ore) building.startMining(this.resourceManager);
        }

        this.world.addChild(building);
        this.buildings.set(`${x},${y}`, building);
    }

    public isOccupied(worldX: number, worldY: number): boolean {
        const gridX = Math.floor(worldX / this.gridSize) * this.gridSize;
        const gridY = Math.floor(worldY / this.gridSize) * this.gridSize;
        return this.buildings.has(`${gridX},${gridY}`);
    }
}