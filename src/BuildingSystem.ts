import {
  Application,
  Container,
  Graphics,
  FederatedPointerEvent,
  Ticker,
} from "pixi.js";
import { Building, type BuildingType } from "./Building";
import type { ResourceNode } from "./ResourceNode";
import type { ResourceManager } from "./ResourceManager";
import type { Enemy } from "./Enemy";
import type { SoundManager } from "./SoundManager";
import type { ToolType } from "./UIManager";

const BUILDING_COSTS: Record<BuildingType, number> = {
  wall: 10,
  drill: 50,
  generator: 100,
  turret: 30, // Обычная
  sniper: 75, // Снайпер
  minigun: 120, // Пулемет
  core: 0,
};

export class BuildingSystem {
  private world: Container;
  private app: Application;
  private ghost: Graphics;
  private gridSize: number = 40;

  private buildings: Map<string, Building>;
  private player: Container | null = null;
  private selectedTool: ToolType = "wall";
  private resources: ResourceNode[] = [];
  private resourceManager: ResourceManager | null = null;
  private isDragging: boolean = false;
  private soundManager: SoundManager | null = null;
  private isPaused: boolean = false;

  // Публичный колбек для эффектов
  public onBuildingDestroyed?: (x: number, y: number) => void;

  constructor(app: Application, world: Container) {
    this.app = app;
    this.world = world;
    this.buildings = new Map();
    this.ghost = new Graphics();
    this.ghost.rect(0, 0, this.gridSize, this.gridSize);
    this.world.addChild(this.ghost);
    this.initInput();
  }

  public setSoundManager(sm: SoundManager) {
    this.soundManager = sm;
  }
  public setResources(resources: ResourceNode[], manager: ResourceManager) {
    this.resources = resources;
    this.resourceManager = manager;
  }
  public setTool(tool: ToolType) {
    this.selectedTool = tool;
  }
  public setPlayer(player: Container) {
    this.player = player;
  }
  public setPaused(paused: boolean) {
    this.isPaused = paused;
    this.ghost.visible = !paused;
  }

  public update(
    ticker: Ticker,
    enemies: Enemy[],
    // ИЗМЕНЕНИЕ: Тип колбека обновлен
    spawnProjectile: (
      x: number,
      y: number,
      tx: number,
      ty: number,
      damage: number,
    ) => void,
  ) {
    let totalProduction = 10;
    let totalConsumption = 0;
    this.buildings.forEach((b) => {
      totalProduction += b.energyProduction;
      totalConsumption += b.energyConsumption;
    });

    // Защита от деления на ноль, если потребление 0
    let efficiency = 1.0;
    if (totalConsumption > totalProduction) {
      efficiency = totalProduction / totalConsumption;
    }

    if (this.resourceManager)
      this.resourceManager.updateEnergy(totalProduction, totalConsumption);

    this.buildings.forEach((building, key) => {
      if (building.isDestroyed) {
        // Вызываем эффект ПЕРЕД удалением
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

  public getBuildingAt(worldX: number, worldY: number): Building | null {
    const gridX = Math.floor(worldX / this.gridSize) * this.gridSize;
    const gridY = Math.floor(worldY / this.gridSize) * this.gridSize;
    return this.buildings.get(`${gridX},${gridY}`) || null;
  }

  public isOccupied(worldX: number, worldY: number): boolean {
    return this.getBuildingAt(worldX, worldY) !== null;
  }

  private initInput() {
    this.app.stage.eventMode = "static";
    this.app.stage.hitArea = this.app.screen;
    this.app.stage.on("pointermove", (e) => {
      if (this.isPaused) return;
      this.updateGhost(e);
      if (this.isDragging) this.handleAction();
    });
    this.app.stage.on("pointerdown", (e) => {
      if (this.isPaused) return;
      if (e.button === 0) {
        this.isDragging = true;
        this.handleAction();
      }
    });
    this.app.stage.on("pointerup", () => {
      this.isDragging = false;
    });
    this.app.stage.on("pointerupoutside", () => {
      this.isDragging = false;
    });
  }

  private updateGhost(e: FederatedPointerEvent) {
    if (this.isPaused) {
      this.ghost.visible = false;
      return;
    }
    this.ghost.visible = true;

    const pos = this.getMouseGridPosition(e);
    this.ghost.x = pos.x;
    this.ghost.y = pos.y;
    this.ghost.clear();
    this.ghost.rect(0, 0, this.gridSize, this.gridSize);

    if (this.selectedTool === "repair") {
      const building = this.getBuildingAt(pos.x, pos.y);
      this.ghost.fill(
        building && building.hp < building.maxHp
          ? { color: 0xffff00, alpha: 0.5 }
          : { alpha: 0 },
      );
      return;
    }
    if (this.selectedTool === "demolish") {
      const building = this.getBuildingAt(pos.x, pos.y);
      this.ghost.fill(
        building ? { color: 0xff0000, alpha: 0.7 } : { alpha: 0 },
      );
      return;
    }

    const type = this.selectedTool as BuildingType;
    const cost = BUILDING_COSTS[type] || 0;
    const canAfford = this.resourceManager
      ? this.resourceManager.hasMetal(cost)
      : false;
    const isPlaceable = this.canBuildAt(pos.x, pos.y);

    if (isPlaceable && canAfford) {
      let color = 0x00ff00;
      if (type === "drill") color = 0x3498db;
      if (type === "generator") color = 0xe67e22;
      if (type === "turret") color = 0x2ecc71;
      // НОВЫЕ ЦВЕТА
      if (type === "sniper") color = 0x555555; // Серый
      if (type === "minigun") color = 0x8e44ad; // Фиолетовый

      this.ghost.fill({ color: color, alpha: 0.5 });
    } else {
      this.ghost.fill({ color: 0xff0000, alpha: 0.5 });
    }
  }

  private getMouseGridPosition(e: FederatedPointerEvent) {
    const localPos = this.world.toLocal(e.global);
    const snapX = Math.floor(localPos.x / this.gridSize) * this.gridSize;
    const snapY = Math.floor(localPos.y / this.gridSize) * this.gridSize;
    return { x: snapX, y: snapY };
  }

  private handleAction() {
    const x = this.ghost.x;
    const y = this.ghost.y;

    if (this.selectedTool === "repair") {
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

    if (this.selectedTool === "demolish") {
      const building = this.getBuildingAt(x, y);
      if (building && building.buildingType !== "core") {
        // Нельзя сносить ядро
        const originalCost = BUILDING_COSTS[building.buildingType];
        this.resourceManager?.addMetal(Math.floor(originalCost * 0.5));

        // Эффект сноса
        if (this.onBuildingDestroyed)
          this.onBuildingDestroyed(building.x, building.y);

        this.world.removeChild(building);
        this.buildings.delete(`${x},${y}`);
        this.soundManager?.playMine();
      }
      return;
    }

    this.placeBuilding(x, y);
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
        h: 32,
      };
      const overlap =
        buildRect.x < playerRect.x + playerRect.w &&
        buildRect.x + buildRect.w > playerRect.x &&
        buildRect.y < playerRect.y + playerRect.h &&
        buildRect.y + buildRect.h > playerRect.y;
      if (overlap) return false;
    }
    return true;
  }

  private placeBuilding(x: number, y: number) {
    if (!this.canBuildAt(x, y)) return;
    const type = this.selectedTool as BuildingType;
    const cost = BUILDING_COSTS[type];

    if (this.resourceManager && !this.resourceManager.hasMetal(cost)) return;
    if (this.resourceManager) this.resourceManager.spendMetal(cost);

    const building = new Building(type, this.gridSize);
    building.x = x;
    building.y = y;
    if (type === "drill" && this.resourceManager) {
      const ore = this.resources.find((r) => r.x === x && r.y === y);
      if (ore) building.startMining(this.resourceManager);
    }
    this.soundManager?.playBuild();
    this.world.addChild(building);
    this.buildings.set(`${x},${y}`, building);
  }

  public spawnCore(x: number, y: number) {
    const building = new Building("core", this.gridSize);
    building.x = x;
    building.y = y;
    this.world.addChild(building);
    this.buildings.set(`${x},${y}`, building);
    return building;
  }
}
