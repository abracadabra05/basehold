import { Application, Container, Graphics, FederatedPointerEvent } from 'pixi.js';

export class BuildingSystem {
    private world: Container;
    private app: Application;
    private ghost: Graphics;
    private gridSize: number = 40;
    private buildings: Map<string, Graphics>;
    private player: Container | null = null; // Ссылка на игрока

    constructor(app: Application, world: Container) {
        this.app = app;
        this.world = world;
        this.buildings = new Map();

        this.ghost = new Graphics();
        this.ghost.rect(0, 0, this.gridSize, this.gridSize);
        this.world.addChild(this.ghost);

        this.initInput();
    }

    // Метод для получения ссылки на игрока
    public setPlayer(player: Container) {
        this.player = player;
    }

    private initInput() {
        this.app.stage.eventMode = 'static';
        this.app.stage.hitArea = this.app.screen;

        this.app.stage.on('pointermove', (e) => {
            this.updateGhost(e);
        });

        this.app.stage.on('pointerdown', (e) => {
            if (e.button === 0) {
                this.placeBuilding();
            }
        });
    }

    private updateGhost(e: FederatedPointerEvent) {
        const pos = this.getMouseGridPosition(e);
        this.ghost.x = pos.x;
        this.ghost.y = pos.y;

        // Визуализация: Красный - нельзя, Зеленый - можно
        this.ghost.clear();
        this.ghost.rect(0, 0, this.gridSize, this.gridSize);
        
        if (this.canBuildAt(pos.x, pos.y)) {
            this.ghost.fill({ color: 0x00FF00, alpha: 0.5 }); // Зеленый
        } else {
            this.ghost.fill({ color: 0xFF0000, alpha: 0.5 }); // Красный
        }
    }

    private getMouseGridPosition(e: FederatedPointerEvent) {
        const localPos = this.world.toLocal(e.global);
        const snapX = Math.floor(localPos.x / this.gridSize) * this.gridSize;
        const snapY = Math.floor(localPos.y / this.gridSize) * this.gridSize;
        return { x: snapX, y: snapY };
    }

    // Главная проверка возможности строительства
    private canBuildAt(x: number, y: number): boolean {
        // 1. Проверка: занята ли клетка зданием
        const key = `${x},${y}`;
        if (this.buildings.has(key)) return false;

        // 2. Проверка: стоит ли тут игрок
        if (this.player) {
            // Клетка, которую хотим построить
            const buildRect = { x: x, y: y, w: this.gridSize, h: this.gridSize };
            
            // Игрок (центр в x,y, размер 32x32)
            // Координаты левого верхнего угла игрока:
            const playerRect = { 
                x: this.player.x - 16, 
                y: this.player.y - 16, 
                w: 32, 
                h: 32 
            };

            // Пересекаются ли прямоугольники?
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

        // Используем ту же проверку перед строительством
        if (!this.canBuildAt(x, y)) {
            // Можно добавить звук ошибки
            return;
        }

        const building = new Graphics();
        building.rect(0, 0, this.gridSize, this.gridSize);
        building.fill(0x888888);
        building.stroke({ width: 2, color: 0x000000 });
        
        building.x = x;
        building.y = y;

        this.world.addChild(building);
        this.buildings.set(`${x},${y}`, building);
    }

    public isOccupied(worldX: number, worldY: number): boolean {
        const gridX = Math.floor(worldX / this.gridSize) * this.gridSize;
        const gridY = Math.floor(worldY / this.gridSize) * this.gridSize;
        return this.buildings.has(`${gridX},${gridY}`);
    }
}