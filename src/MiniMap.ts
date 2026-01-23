import { Application, Container, Graphics } from 'pixi.js';
import type { Player } from './Player';
import type { Enemy } from './Enemy';
import type { ResourceNode } from './ResourceNode';
import type { Building } from './Building';
import { Z_INDEX } from './UIConstants';

export class MiniMap {
    private container: Container;
    private bg: Graphics;
    private dots: Graphics;
    private nightOverlay: Graphics;
    private size: number;
    private scale: number;
    private isMobile: boolean;

    constructor(app: Application, mapSize: number) {
        // Adaptive size based on screen width
        this.isMobile = app.screen.width <= 800;
        this.size = this.isMobile ? 80 : 100;
        this.scale = this.size / mapSize;

        this.container = new Container();
        this.container.x = app.screen.width - this.size - 15;
        this.container.y = 15;
        this.container.zIndex = Z_INDEX.MINIMAP;
        
        // Маска для круглой формы
        const mask = new Graphics();
        mask.circle(this.size / 2, this.size / 2, this.size / 2).fill(0xFFFFFF);
        this.container.mask = mask;
        this.container.addChild(mask);

        // Фон
        this.bg = new Graphics();
        this.bg.rect(0, 0, this.size, this.size)
            .fill({ color: 0x000000, alpha: 0.8 }); // Чуть темнее фон
        this.container.addChild(this.bg);

        this.dots = new Graphics();
        this.container.addChild(this.dots);
        
        // Оверлей ночи (внутри карты, поверх точек)
        this.nightOverlay = new Graphics();
        this.nightOverlay.rect(0, 0, this.size, this.size).fill({ color: 0x000010, alpha: 0 });
        this.container.addChild(this.nightOverlay);
        
        // Рамка (поверх маски, чтобы была видна)
        const border = new Graphics();
        border.circle(this.size / 2, this.size / 2, this.size / 2).stroke({ width: 2, color: 0x3498db });
        this.container.addChild(border);

        app.stage.addChild(this.container);
    }

    public setDarkness(alpha: number) {
        // Затемняем карту ночью, но не полностью (макс 0.7)
        this.nightOverlay.clear();
        this.nightOverlay.rect(0, 0, this.size, this.size).fill({ color: 0x000010, alpha: alpha * 0.7 });
    }

    public update(player: Player, enemies: Enemy[], resources: ResourceNode[], core: Building | null) {
        this.dots.clear();

        // Ресурсы (Синие)
        for (const res of resources) {
            this.dots.circle(res.x * this.scale, res.y * this.scale, 2).fill(0x3498db);
        }

        // Ядро (Голубой квадрат)
        if (core && !core.isDestroyed) {
            const cs = 6;
            this.dots.rect(core.x * this.scale - cs/2, core.y * this.scale - cs/2, cs, cs).fill(0x00FFFF);
        }

        // Враги (Красные)
        for (const enemy of enemies) {
            this.dots.circle(enemy.x * this.scale, enemy.y * this.scale, 2).fill(0xe74c3c);
        }

        // Игрок (Зеленый)
        this.dots.circle(player.x * this.scale, player.y * this.scale, 3).fill(0x2ecc71);
    }
    
    public resize(width: number) {
        // Recalculate size based on screen width
        this.isMobile = width <= 800;
        // Keep same size for now, just reposition
        this.container.x = width - this.size - 15;
    }
}
