import { Container, Graphics } from 'pixi.js';

// Экспортируем тип
export type BuildingType = 'wall' | 'drill' | 'generator';

export class Building extends Container {
    public buildingType: BuildingType;

    constructor(type: BuildingType, size: number) {
        super();
        this.buildingType = type;

        const g = new Graphics();
        
        switch (type) {
            case 'wall':
                g.rect(0, 0, size, size);
                g.fill(0x888888);
                g.stroke({ width: 2, color: 0x000000 });
                break;
            case 'drill':
                g.rect(0, 0, size, size);
                g.fill(0x3498db);
                g.circle(size / 2, size / 2, size / 4);
                g.fill(0xffffff); 
                break;
            case 'generator':
                g.rect(0, 0, size, size);
                g.fill(0xe67e22); 
                g.moveTo(size / 2, 5);
                g.lineTo(size / 2, size - 5);
                g.stroke({ width: 4, color: 0xffff00 });
                break;
        }

        this.addChild(g);
    }
}