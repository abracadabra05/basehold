import { Application, Container, Graphics } from 'pixi.js';
import type { Player } from './Player';
import type { Enemy } from './Enemy';
import type { ResourceNode } from './ResourceNode';

export class MiniMap {
    private container: Container;
    private bg: Graphics;
    private dots: Graphics;
    private size: number = 150; // Размер миникарты в пикселях
    private scale: number;

    constructor(app: Application, mapSize: number) {
        this.scale = this.size / mapSize;

        this.container = new Container();
        this.container.x = app.screen.width - this.size - 20;
        this.container.y = 20;
        
        // Фон
        this.bg = new Graphics();
        this.bg.rect(0, 0, this.size, this.size)
            .fill({ color: 0x000000, alpha: 0.5 })
            .stroke({ width: 2, color: 0x3498db });
        this.container.addChild(this.bg);

        this.dots = new Graphics();
        this.container.addChild(this.dots);

        app.stage.addChild(this.container);
    }

    public update(player: Player, enemies: Enemy[], resources: ResourceNode[]) {
        // Жесткая привязка к правому краю каждый кадр для надежности
        // this.container.parent.screen.width доступен через app.screen, но здесь у нас нет ссылки на app
        // Мы передадим screenWidth в update, или оставим как есть, но в Game.ts будем дергать resize каждый кадр? 
        // Нет, это дорого.
        
        // Лучше: В Game.ts передадим ширину экрана в update.
        
        this.dots.clear();

        // Ресурсы (Синие)
        for (const res of resources) {
            this.dots.circle(res.x * this.scale, res.y * this.scale, 2).fill(0x3498db);
        }

        // Враги (Красные)
        for (const enemy of enemies) {
            this.dots.circle(enemy.x * this.scale, enemy.y * this.scale, 2).fill(0xe74c3c);
        }

        // Ядро (Голубое)
        // Можно пройтись по зданиям, но это может быть дорого.
        // Достаточно показать ядро один раз или знать его позицию. 
        // Но для простоты пока покажем игрока.

        // Игрок (Зеленый)
        this.dots.circle(player.x * this.scale, player.y * this.scale, 3).fill(0x2ecc71);
        
        // Рамка видимости (опционально)
    }
    
    public resize(screenWidth: number) {
        this.container.x = screenWidth - this.size - 20;
    }
}
