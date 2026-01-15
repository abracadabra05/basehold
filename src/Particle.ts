import { Container, Graphics, Ticker } from "pixi.js";

export type ParticleType = 'explosion' | 'shell' | 'spark';

export class Particle extends Container {
    private graphics: Graphics;
    public lifeTime: number = 0;
    private maxLifeTime: number = 0;
    private vx: number = 0;
    private vy: number = 0;
    private rotationSpeed: number = 0;
    public type: ParticleType = 'explosion';
    public isDead: boolean = false;

    constructor() {
        super();
        this.graphics = new Graphics();
        this.addChild(this.graphics);
    }

    public init(x: number, y: number, color: number, type: ParticleType = 'explosion') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.isDead = false;
        this.visible = true;
        this.alpha = 1;
        this.rotation = 0;
        this.scale.set(1);

        this.graphics.clear();

        if (type === 'explosion' || type === 'spark') {
            this.lifeTime = (type === 'spark' ? 10 : 30) + Math.random() * 20;
            this.maxLifeTime = this.lifeTime;
            
            const size = (type === 'spark' ? 2 : 3) + Math.random() * 5;
            this.graphics.rect(-size/2, -size/2, size, size).fill(color);
            
            const angle = Math.random() * Math.PI * 2;
            const speed = (type === 'spark' ? 4 : 2) + Math.random() * 4;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.rotationSpeed = 0;
        } else {
            // SHELL (Гильза)
            this.lifeTime = 120 + Math.random() * 60;
            this.maxLifeTime = this.lifeTime;
            
            this.graphics.rect(-2, -1, 4, 2).fill(0xF1C40F); 
            
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            
            this.rotationSpeed = (Math.random() - 0.5) * 0.5;
        }
    }

    public update(ticker: Ticker) {
        this.lifeTime -= ticker.deltaTime;

        if (this.type === 'explosion') {
            this.x += this.vx * ticker.deltaTime;
            this.y += this.vy * ticker.deltaTime;
            this.vx *= 0.9;
            this.vy *= 0.9;
            
            // Fade out last 50% of life
            if (this.lifeTime < this.maxLifeTime * 0.5) {
                this.alpha = this.lifeTime / (this.maxLifeTime * 0.5);
            }
        } 
        else if (this.type === 'shell') {
            this.x += this.vx * ticker.deltaTime;
            this.y += this.vy * ticker.deltaTime;
            this.rotation += this.rotationSpeed * ticker.deltaTime;
            
            this.vx *= 0.85;
            this.vy *= 0.85;
            this.rotationSpeed *= 0.9;

            if (this.lifeTime < 30) this.alpha = this.lifeTime / 30;
        }

        if (this.lifeTime <= 0) {
            this.isDead = true;
            this.visible = false; // Скрываем, пока лежит в пуле
        }
    }
}