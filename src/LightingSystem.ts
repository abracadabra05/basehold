import { Container, Graphics, AlphaFilter } from 'pixi.js';

export class LightingSystem {
    public darknessOverlay: Container;
    
    // Параметры цикла
    private time: number = 0.0; // СТАРТ УТРОМ
    private dayDuration: number = 60000; 
    
    private nightColor: number = 0x050510; 
    public currentAlpha: number = 0; 

    // Список источников света
    private lights: {x: number, y: number, radius: number, angle: number, cone: number}[] = [];

    public get cycleProgress(): number { return this.time; }

    constructor() {
        this.darknessOverlay = new Container();
        this.darknessOverlay.eventMode = 'none';
        this.darknessOverlay.filters = [new AlphaFilter()];
    }

    public update(deltaMS: number, width: number, height: number) {
        this.time += deltaMS / this.dayDuration;
        if (this.time >= 1) this.time = 0;

        // День/Ночь
        if (this.time < 0.25) this.currentAlpha = 0;
        else if (this.time < 0.4) this.currentAlpha = (this.time - 0.25) / 0.15 * 0.9;
        else if (this.time < 0.75) this.currentAlpha = 0.9;
        else this.currentAlpha = 1.0 - (this.time - 0.75) / 0.25;

        if (this.currentAlpha < 0) this.currentAlpha = 0;
        if (this.currentAlpha > 0.95) this.currentAlpha = 0.95;

        if (this.currentAlpha <= 0.01) {
            this.darknessOverlay.visible = false;
            return;
        }
        this.darknessOverlay.visible = true;

        this.darknessOverlay.removeChildren();

        // Тьма
        const bg = new Graphics();
        bg.rect(0, 0, width, height);
        bg.fill({ color: this.nightColor, alpha: this.currentAlpha });
        this.darknessOverlay.addChild(bg);

        // Свет
        const lightsGraphics = new Graphics();
        
        for (const light of this.lights) {
            // Если полный круг (cone >= 2PI)
            if (light.cone >= Math.PI * 2 - 0.1) {
                lightsGraphics.circle(light.x, light.y, light.radius).fill({ color: 0xFFFFFF, alpha: 1 });
            } else {
                // Конус (Фонарик)
                // arc(cx, cy, radius, startAngle, endAngle)
                // Pixi arc рисует линию? Нет, можно залить сектор.
                // Нам нужно moveTo(center), arc(...), lineTo(center)
                const startAngle = light.angle - light.cone / 2;
                const endAngle = light.angle + light.cone / 2;
                
                lightsGraphics.moveTo(light.x, light.y);
                lightsGraphics.arc(light.x, light.y, light.radius, startAngle, endAngle);
                lightsGraphics.lineTo(light.x, light.y);
                lightsGraphics.fill({ color: 0xFFFFFF, alpha: 1 });
            }
        }
        
        lightsGraphics.blendMode = 'erase';
        this.darknessOverlay.addChild(lightsGraphics);
    }
    
    // cone: ширина конуса в радианах (Math.PI/3 = 60 град). Если не задан - круг.
    public renderLight(screenX: number, screenY: number, radius: number, angle: number = 0, cone: number = 10) {
        this.lights.push({ x: screenX, y: screenY, radius: radius, angle: angle, cone: cone });
    }
    
    public clearLights() {
        this.lights = [];
    }

    public getTimeString(): string {
        const hour = Math.floor(this.time * 24);
        const minute = Math.floor((this.time * 24 % 1) * 60);
        return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    }
    
    public isNight(): boolean {
        return this.currentAlpha > 0.5;
    }
}
