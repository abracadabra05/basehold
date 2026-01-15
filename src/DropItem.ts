import { Container, Graphics, Ticker } from 'pixi.js';

export class DropItem extends Container {
    private graphics: Graphics;
    public value: number;
    public type: 'biomass' | 'data_core'; // Добавлено

    constructor(x: number, y: number, value: number, type: 'biomass' | 'data_core' = 'biomass') {
        super();
        this.x = x;
        this.y = y;
        this.value = value;
        this.type = type;

        this.graphics = new Graphics();
        this.addChild(this.graphics);
        this.draw();
    }

    private draw() {
        this.graphics.clear();
        if (this.type === 'data_core') {
            this.graphics.circle(0, 0, 12).fill({ color: 0x3498db, alpha: 0.3 });
            this.graphics.circle(0, 0, 6).fill(0x3498db).stroke({ width: 2, color: 0xFFFFFF });
            // Анимация свечения в будущем
        } else {
            this.graphics.circle(0, 0, 6).fill(0x2ecc71); 
            this.graphics.circle(0, 0, 3).fill(0x27ae60);
        }
    }
}
