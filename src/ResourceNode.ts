import { Container, Graphics } from "pixi.js";

export class ResourceNode extends Container {
    public resourceType: string = 'metal';
    public amount: number = 1000; 

    constructor(size: number) {
        super();
        
        const g = new Graphics();
        const cx = size / 2;
        const cy = size / 2;
        
        // Рисуем Кристалл (неправильный многоугольник)
        g.poly([
            cx, cy - 15,
            cx + 12, cy - 5,
            cx + 10, cy + 12,
            cx - 10, cy + 12,
            cx - 12, cy - 5
        ]);
        g.fill(0x34495e); // Темная основа
        g.stroke({ width: 2, color: 0x95a5a6 }); // Светлая обводка

        // Внутренний кристалл (яркий)
        g.poly([
            cx, cy - 8,
            cx + 6, cy - 2,
            cx + 4, cy + 8,
            cx - 4, cy + 8,
            cx - 6, cy - 2
        ]);
        g.fill(0xbdc3c7); // Светлый металл

        // Блик
        g.circle(cx - 3, cy - 3, 2).fill({color: 0xFFFFFF, alpha: 0.8});

        this.addChild(g);
    }
}
