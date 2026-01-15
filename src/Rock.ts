import { Container, Graphics } from 'pixi.js';

export class Rock extends Container {
    public radius: number;

    constructor(radius: number) {
        super();
        this.radius = radius;

        const g = new Graphics();
        // Рисуем камень
        g.circle(0, 0, radius).fill(0x555555);
        // Детали (тени)
        g.circle(-radius/3, -radius/3, radius/2).fill(0x666666);
        g.stroke({ width: 2, color: 0x222222 });
        
        this.addChild(g);
    }
}
