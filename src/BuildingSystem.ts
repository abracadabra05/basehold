import { Application, Container, Graphics, FederatedPointerEvent, Ticker } from 'pixi.js';
import { Building, type BuildingType } from './Building';
import type { ResourceNode } from './ResourceNode';
import type { ResourceManager } from './ResourceManager';
import type { Enemy } from './Enemy';
import type { SoundManager } from './SoundManager';
import type { ToolType } from './UIManager';
import type { Rock } from './Rock';

const BUILDING_COSTS: Record<BuildingType, number> = {
    'wall': 10,
    'drill': 50,
    'generator': 100,
    'turret': 30,    
    'sniper': 75,    
    'minigun': 120,
    'battery': 150, // <--- Дорого, но полезно
    'laser': 200,   // <--- Очень дорого
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
    private resources: ResourceNode[] = [];
    private rocks: Rock[] = [];
    private resourceManager: ResourceManager | null = null;
    private isDragging: boolean = false;
    private soundManager: SoundManager | null = null;
    private isPaused: boolean = false;

    // Параметры базы
    private regenAmount: number = 0;
    private regenTimer: number = 0;
    private thornsDamage: number = 0;

    // Публичный колбек для эффектов
    public onBuildingDestroyed?: (x: number, y: number) => void;

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
    public setTool(tool: ToolType) { this.selectedTool = tool; }
    public setPlayer(player: Container) { this.player = player; }
    public setPaused(paused: boolean) { 
        this.isPaused = paused; 
        this.ghost.visible = !paused;
    }

    public update(
        ticker: Ticker, 
        enemies: Enemy[], 
        spawnProjectile: (x: number, y: number, tx: number, ty: number, damage: number) => void
    ) {
        let totalProduction = 0;
        let totalConsumption = 0;
        let totalCapacity = 0; // <--- ЕМКОСТЬ

        this.buildings.forEach(b => {
            totalProduction += b.energyProduction;
            totalConsumption += b.energyConsumption;
            totalCapacity += b.energyCapacity;
        });
        
        let efficiency = 1.0;
        // Если потребление выше производства, проверяем батарею
        if (totalConsumption > totalProduction) {
            // Если батарея пуста (isBlackout), эффективность падает
            if (this.resourceManager && this.resourceManager.isBlackout) {
                efficiency = totalProduction / totalConsumption;
            } else {
                // Если батарея есть, работаем на 100%, но тратим заряд (это делает ResourceManager.updateBattery)
                efficiency = 1.0;
            }
        }

        // Обновляем статистику и батарею
        if (this.resourceManager) {
            this.resourceManager.setEnergyStats(totalProduction, totalConsumption, totalCapacity);
            // deltaMS в секундах
            this.resourceManager.updateBattery(ticker.deltaMS / 1000);
        }

        // Регенерация только если есть энергия (efficiency > 0.5)
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

    const type = this.selectedTool as BuildingType;
    const cost = BUILDING_COSTS[type] || 0;
    const canAfford = this.resourceManager
      ? this.resourceManager.hasMetal(cost)
      : false;
    const isPlaceable = this.canBuildAt(pos.x, pos.y);

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
        return this.getBuildingAt(worldX, worldY) !== null;
    }
    
    private initInput() {
        this.app.stage.eventMode = 'static';
        this.app.stage.hitArea = this.app.screen;
        this.app.stage.on('pointermove', (e) => { 
            if (this.isPaused) return;
            this.updateGhost(e); 
            if (this.isDragging) this.handleAction();
        });
        this.app.stage.on('pointerdown', (e) => {
            if (this.isPaused) return;
            if (e.button === 0) {
                this.isDragging = true;
                this.handleAction();
            }
        });
        this.app.stage.on('pointerup', () => { this.isDragging = false; });
        this.app.stage.on('pointerupoutside', () => { this.isDragging = false; });
    }

      this.ghost.fill({ color: color, alpha: 0.5 });
    } else {
      this.ghost.fill({ color: 0xff0000, alpha: 0.5 });
    }
  }

        const pos = this.getMouseGridPosition(e);
        this.ghost.x = pos.x;
        this.ghost.y = pos.y;
        this.ghost.clear();
        this.ghost.rect(0, 0, this.gridSize, this.gridSize);
        
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
        } else {
            this.ghost.fill({ color: 0xFF0000, alpha: 0.5 });
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
    return true;
  }

    private canBuildAt(x: number, y: number): boolean {
        const key = `${x},${y}`;
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
            const buildRect = { x: x, y: y, w: this.gridSize, h: this.gridSize };
            const playerRect = { x: this.player.x - 16, y: this.player.y - 16, w: 32, h: 32 };
            const overlap = (buildRect.x < playerRect.x + playerRect.w && buildRect.x + buildRect.w > playerRect.x && buildRect.y < playerRect.y + playerRect.h && buildRect.y + buildRect.h > playerRect.y);
            if (overlap) return false;
        }
        return true;
    }
    this.soundManager?.playBuild();
    this.world.addChild(building);
    this.buildings.set(`${x},${y}`, building);
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
        building.thornsDamage = this.thornsDamage; 
        if (type === 'drill' && this.resourceManager) {
            const ore = this.resources.find(r => r.x === x && r.y === y);
            if (ore) building.startMining(this.resourceManager);
        }
        this.soundManager?.playBuild();
        this.world.addChild(building);
        this.buildings.set(`${x},${y}`, building);
    }

    public spawnCore(x: number, y: number) {
        const building = new Building('core', this.gridSize);
        building.x = x;
        building.y = y;
        building.thornsDamage = this.thornsDamage;
        this.world.addChild(building);
        this.buildings.set(`${x},${y}`, building);
        return building;
    }

    public get activeBuildings(): Building[] {
        return Array.from(this.buildings.values());
    }
}