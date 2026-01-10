import { Container, Graphics } from 'pixi.js';

export class WorldBoundary extends Container {
    private borderSize: number = 2000; // Ширина темной границы (насколько далеко она уходит визуально)
    
    constructor(mapSize: number) {
        super();

        const g = new Graphics();
        
        // Цвет тьмы (почти черный, слегка прозрачный)
        const color = 0x111111;
        const alpha = 0.9;

        // Рисуем 4 прямоугольника вокруг карты (Сверху, Снизу, Слева, Справа)
        
        // Верхний
        g.rect(-this.borderSize, -this.borderSize, mapSize + this.borderSize * 2, this.borderSize);
        // Нижний
        g.rect(-this.borderSize, mapSize, mapSize + this.borderSize * 2, this.borderSize);
        // Левый
        g.rect(-this.borderSize, 0, this.borderSize, mapSize);
        // Правый
        g.rect(mapSize, 0, this.borderSize, mapSize);

        g.fill({ color: color, alpha: alpha });
        
        // Красная линия самой границы
        g.rect(0, 0, mapSize, mapSize);
        g.stroke({ width: 5, color: 0xFF0000, alpha: 0.5 });

        this.addChild(g);
    }
}