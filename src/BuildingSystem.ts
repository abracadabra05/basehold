import { Application, Container, Graphics, FederatedPointerEvent, Ticker } from 'pixi.js';
import { Building, type BuildingType } from './Building';
import type { ResourceNode } from './ResourceNode';
import type { ResourceManager } from './ResourceManager';

export class BuildingSystem {
    private world: Container;
    private app: Application;
    private ghost: Graphics;
    private gridSize: number = 40;
    
    private buildings: Map<string, Building>; 
    private player: Container | null = null;
    private selectedType: BuildingType = 'wall';
    
    // Новые ссылки
    private resources: ResourceNode[] = [];
    private resourceManager: ResourceManager | null = null;

    constructor(app: Application, world: Container) {
        this.app = app;
        this.world = world;
        this.buildings = new Map();

        this.ghost = new Graphics();
        this.ghost.rect(0, 0, this.gridSize, this.gridSize);
        this.world.addChild(this.ghost);

        this.initInput();
    }

    // Передаем данные игры в систему
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

    // Главный цикл обновлений зданий
    public update(ticker: Ticker) {
        // Проходим по всем зданиям и обновляем их
        this.buildings.forEach(building => {
            building.update(ticker);
        });
    }

    private initInput() {
        this.app.stage.eventMode = 'static';
        this.app.stage.hitArea = this.app.screen;

        this.app.stage.on('pointermove', (e) => { this.updateGhost(e); });
        this.app.stage.on('pointerdown', (e) => {
            if (e.button === 0) this.placeBuilding();
        });
    }

    private updateGhost(e: FederatedPointerEvent) {
        const pos = this.getMouseGridPosition(e);
        this.ghost.x = pos.x;
        this.ghost.y = pos.y;
        this.ghost.clear();
        this.ghost.rect(0, 0, this.gridSize, this.gridSize);
        
        if (this.canBuildAt(pos.x, pos.y)) {
            let color = 0x00FF00;
            if (this.selectedType === 'drill') color = 0x3498db;
            if (this.selectedType === 'generator') color = 0xe67e22;
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
            const playerRect = { 
                x: this.player.x - 16, 
                y: this.player.y - 16, 
                w: 32, 
                h: 32 
            };
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
        if (!this.canBuildAt(x, y)) return;

        const building = new Building(this.selectedType, this.gridSize);
        building.x = x;
        building.y = y;

        // ЛОГИКА БУРА
        if (this.selectedType === 'drill' && this.resourceManager) {
            // Проверяем, есть ли под нами руда
            // (Сравниваем координаты. Так как всё привязано к сетке, точное сравнение работает)
            const ore = this.resources.find(r => r.x === x && r.y === y);
            
            if (ore) {
                console.log("Бур установлен на руду!");
                building.startMining(this.resourceManager);
            } else {
                console.log("Бур установлен в пустую землю (нет руды).");
            }
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