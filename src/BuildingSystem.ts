import { Application, Container, Graphics, FederatedPointerEvent } from 'pixi.js';

export class BuildingSystem {
    private world: Container;
    private app: Application;
    private ghost: Graphics; // Полупрозрачный квадрат (курсор)
    private gridSize: number = 40;
    private buildings: Map<string, Graphics>; // Храним построенное (ключ = "x,y")

    constructor(app: Application, world: Container) {
        this.app = app;
        this.world = world;
        this.buildings = new Map();

        // Создаем "призрака"
        this.ghost = new Graphics();
        this.ghost.rect(0, 0, this.gridSize, this.gridSize);
        this.ghost.fill({ color: 0x00FF00, alpha: 0.5 }); // Зеленый, полупрозрачный
        this.world.addChild(this.ghost);

        this.initInput();
    }

    private initInput() {
        // Включаем интерактивность для сцены (чтобы ловить движения мыши)
        this.app.stage.eventMode = 'static';
        this.app.stage.hitArea = this.app.screen;

        // Движение мыши -> двигаем призрака
        this.app.stage.on('pointermove', (e) => {
            this.updateGhostPosition(e);
        });

        // Клик -> строим
        this.app.stage.on('pointerdown', (e) => {
            // Строим только на левый клик (button === 0)
            if (e.button === 0) {
                this.placeBuilding();
            }
        });
    }

    private updateGhostPosition(e: FederatedPointerEvent) {
        const pos = this.getMouseGridPosition(e);
        this.ghost.x = pos.x;
        this.ghost.y = pos.y;
    }

    private getMouseGridPosition(e: FederatedPointerEvent) {
        // Переводим координаты экрана (глобальные) в координаты мира (локальные)
        // Это автоматически учитывает сдвиг камеры!
        const localPos = this.world.toLocal(e.global);

        // Округляем до сетки
        // Math.floor(105 / 40) * 40 = 2 * 40 = 80
        const snapX = Math.floor(localPos.x / this.gridSize) * this.gridSize;
        const snapY = Math.floor(localPos.y / this.gridSize) * this.gridSize;

        return { x: snapX, y: snapY };
    }

    private placeBuilding() {
        const x = this.ghost.x;
        const y = this.ghost.y;
        const key = `${x},${y}`;

        // Проверяем, нет ли тут уже здания
        if (this.buildings.has(key)) {
            console.log("Здесь уже занято!");
            return;
        }

        // Создаем новое здание
        const building = new Graphics();
        building.rect(0, 0, this.gridSize, this.gridSize);
        building.fill(0x888888); // Серый цвет (стена)
        building.stroke({ width: 2, color: 0x000000 }); // Обводка
        
        building.x = x;
        building.y = y;

        // Добавляем в мир и в память
        this.world.addChild(building);
        this.buildings.set(key, building);
        
        console.log(`Построено на ${key}`);
    }
}