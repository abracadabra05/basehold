import { Container, Graphics, Ticker } from 'pixi.js';
import type { ResourceManager } from './ResourceManager';
import type { Enemy } from './Enemy';

export type BuildingType = 'wall' | 'drill' | 'generator' | 'turret' | 'core' | 'sniper' | 'minigun' | 'battery' | 'laser';

export class Building extends Container {
    public buildingType: BuildingType;
    private resourceManager: ResourceManager | null = null;
    
    private turretHead: Container; 
    private muzzleFlash: Graphics; 
    private recoilOffset: number = 0; 

    public hp: number;
    public maxHp: number;
    private hpBar: Graphics;

    public isMining: boolean = false;
    public mineTimer: number = 0;
    public mineSpeed: number = 60; 

    public range: number = 200;
    public cooldown: number = 0;
    public fireRate: number = 30;
    public damage: number = 1;
    public projectileSpeed: number = 10; 

    public energyConsumption: number = 0;
    public energyProduction: number = 0;
    public energyCapacity: number = 0; 
    
    public isDestroyed: boolean = false;
    public thornsDamage: number = 0;

    // ГЕТТЕР ДЛЯ УГЛА (чтобы Game.ts видел поворот)
    public get rotationAngle(): number {
        return this.turretHead ? this.turretHead.rotation : 0;
    }

    constructor(type: BuildingType, size: number) {
        super();
        this.buildingType = type;
        this.turretHead = new Container();

        this.turretHead.x = size / 2;
        this.turretHead.y = size / 2;

        this.sortableChildren = true;

        switch (type) {
            case 'wall': this.maxHp = 200; this.energyConsumption = 0; break; // HP 100 -> 200
            case 'drill': this.maxHp = 50; this.energyConsumption = 5; break;
            case 'generator': this.maxHp = 40; this.energyProduction = 20; break;
            case 'core': this.maxHp = 1000; this.energyProduction = 50; this.energyCapacity = 1000; break; // HP 500 -> 1000
            
            case 'battery': this.maxHp = 100; this.energyCapacity = 2000; break; 
            
            case 'turret': this.maxHp = 100; this.energyConsumption = 10; this.range = 250; this.fireRate = 30; this.damage = 3; break; // Dmg 1 -> 3, Range 200 -> 250
            case 'sniper': this.maxHp = 60; this.energyConsumption = 15; this.range = 500; this.fireRate = 120; this.damage = 30; break; // Dmg 10 -> 30, Range 400 -> 500
            case 'minigun': this.maxHp = 150; this.energyConsumption = 20; this.range = 200; this.fireRate = 4; this.damage = 1.5; break; // Dmg 0.5 -> 1.5
            
            case 'laser': 
                this.maxHp = 80; 
                this.energyConsumption = 5; 
                this.range = 300; 
                this.fireRate = 60; 
                this.damage = 50; // Dmg 25 -> 50
                break;
        }
        this.hp = this.maxHp;

        // 1. БАЗА
        const baseG = new Graphics();
        const cx = size / 2;
        const cy = size / 2;

        switch (type) {
            case 'wall':
                baseG.roundRect(0, 0, size, size, 4).fill(0x7f8c8d).stroke({ width: 2, color: 0x2c3e50 });
                baseG.rect(5, 5, 12, 6).fill(0x95a5a6); 
                baseG.rect(20, 20, 12, 6).fill(0x95a5a6);
                break;
            case 'drill': 
                baseG.roundRect(0, 0, size, size, 4).fill(0x2980b9).stroke({ width: 2, color: 0x34495e }); 
                break;
            case 'generator': 
                baseG.roundRect(0, 0, size, size, 4).fill(0xd35400).stroke({ width: 2, color: 0xc0392b });
                baseG.moveTo(cx, 5).lineTo(cx - 5, cy).lineTo(cx + 5, cy).lineTo(cx, size - 5).stroke({ width: 2, color: 0xf1c40f });
                break;
            case 'battery':
                baseG.roundRect(0, 0, size, size, 4).fill(0x2c3e50).stroke({ width: 2, color: 0x2ecc71 });
                baseG.rect(10, 10, 20, 20).fill(0x27ae60);
                baseG.rect(18, 5, 4, 4).fill(0xbdc3c7);
                break;
            
            case 'core': 
                baseG.roundRect(0, 0, size, size, 8).fill(0x2c3e50).stroke({ width: 2, color: 0x00FFFF });
                
                // Внутреннее свечение
                baseG.circle(cx, cy, size / 2.5).fill({ color: 0x00FFFF, alpha: 0.2 });
                baseG.circle(cx, cy, size / 3).stroke({ width: 2, color: 0x00FFFF });
                baseG.circle(cx, cy, size / 4).fill(0xFFFFFF);
                
                // Внешнее свечение (Glow)
                const glow = new Graphics();
                glow.circle(cx, cy, size).fill({ color: 0x00FFFF, alpha: 0.15 });
                glow.blendMode = 'add';
                // Анимация пульсации будет в update
                (this as any).glowEffect = glow; 
                this.addChild(glow);
                break;
            
            case 'turret': 
            case 'sniper': 
            case 'minigun':
            case 'laser':
                baseG.circle(cx, cy, size / 2 - 2).fill(0x95a5a6).stroke({ width: 2, color: 0x7f8c8d });
                break;
        }
        baseG.zIndex = 0;
        this.addChild(baseG);

        // 2. ГОЛОВА
        const headG = new Graphics();
        
        switch (type) {
            case 'turret': 
                headG.circle(0, 0, 12).fill(0x27ae60); 
                headG.circle(0, 0, 8).fill(0x2ecc71);  
                headG.roundRect(8, -3, 14, 6, 2).fill(0x27ae60);
                break;

            case 'sniper':
                headG.circle(0, 0, 11).fill(0x34495e);
                headG.roundRect(0, -4, 28, 8, 2).fill(0x2c3e50); 
                headG.circle(0, 0, 4).fill(0xe74c3c); 
                headG.roundRect(10, -1, 10, 2, 1).fill(0xe74c3c);
                break;

            case 'minigun':
                headG.circle(0, 0, 14).fill(0x8e44ad);
                headG.roundRect(5, -7, 12, 14, 3).fill(0x2c3e50);
                headG.circle(16, -4, 2).fill(0x000000);
                headG.circle(16, 4, 2).fill(0x000000);
                headG.circle(18, 0, 2).fill(0x000000);
                break;
            
            case 'laser':
                headG.circle(0, 0, 12).fill(0xffffff); 
                headG.rect(0, -4, 20, 8).fill(0xe74c3c); 
                headG.circle(0, 0, 6).fill(0xe74c3c); 
                break;

            case 'drill':
                headG.circle(0, 0, 8).fill(0xbdc3c7);
                headG.roundRect(-3, -12, 6, 24, 2).fill(0x7f8c8d);
                headG.roundRect(-12, -3, 24, 6, 2).fill(0x7f8c8d);
                headG.circle(0, 0, 4).fill(0xffffff);
                break;
        }
        
        this.muzzleFlash = new Graphics();
        
        if (['turret', 'sniper', 'minigun', 'drill', 'laser'].includes(type)) {
            this.turretHead.addChild(headG);

            if (['turret', 'sniper', 'minigun', 'laser'].includes(type)) {
                this.muzzleFlash.visible = false;
                let offset = 22; 
                let color = 0xFFFF00;
                
                if (type === 'sniper') offset = 32;
                if (type === 'minigun') offset = 20;
                if (type === 'laser') { offset = 25; color = 0xFF0000; }
                
                this.muzzleFlash.x = offset;
                this.muzzleFlash.circle(0, 0, 6).fill(color).circle(0, 0, 3).fill(0xFFFFFF);
                this.turretHead.addChild(this.muzzleFlash);
            }

            this.turretHead.zIndex = 10;
            this.addChild(this.turretHead);
        }

        this.hpBar = new Graphics();
        this.hpBar.y = -25;
        this.hpBar.zIndex = 100;
        this.hpBar.visible = false;
        this.addChild(this.hpBar);
    }

    public repair(amount: number) { this.hp += amount; if (this.hp > this.maxHp) this.hp = this.maxHp; this.tint = 0x00FF00; setTimeout(() => this.tint = 0xFFFFFF, 100); this.updateHpBar(); }
    public startMining(resourceManager: ResourceManager) { this.resourceManager = resourceManager; this.isMining = true; }
    public takeDamage(amount: number) { 
        this.hp -= amount; 
        this.updateHpBar(); 
        
        // Визуальный эффект повреждения
        const pct = this.hp / this.maxHp;
        if (pct < 0.5) {
            // Затемняем здание при повреждении
            const tintVal = Math.floor(255 * (0.5 + pct)); 
            this.tint = (tintVal << 16) | (tintVal << 8) | tintVal;
        }

        this.tint = 0xFFaaaa; 
        setTimeout(() => {
            const currentPct = this.hp / this.maxHp;
            if (currentPct < 0.5) {
                const tv = Math.floor(255 * (0.5 + currentPct));
                this.tint = (tv << 16) | (tv << 8) | tv;
            } else {
                this.tint = 0xFFFFFF;
            }
        }, 50); 

        if (this.hp <= 0) this.isDestroyed = true; 
    }
    private updateHpBar() { if (this.hp < this.maxHp) { this.hpBar.visible = true; this.hpBar.clear(); this.hpBar.rect(-2, -2, 44, 8).fill({color:0x000000, alpha:0.8}); const pct = Math.max(0, this.hp / this.maxHp); const color = pct > 0.5 ? 0x00FF00 : pct > 0.25 ? 0xFFFF00 : 0xFF0000; this.hpBar.rect(0, 0, 40 * pct, 4).fill(color); } else { this.hpBar.visible = false; } }

    public update(
        ticker: Ticker, 
        enemies: Enemy[], 
        spawnProjectile: (x: number, y: number, tx: number, ty: number, damage: number) => void,
        efficiency: number
    ) {
        // Анимация свечения ядра
        if ((this as any).glowEffect) {
            const glow = (this as any).glowEffect as Graphics;
            glow.alpha = 0.15 + Math.sin(Date.now() / 500) * 0.05;
            glow.scale.set(1 + Math.sin(Date.now() / 500) * 0.1);
        }

        if (this.buildingType === 'battery') return; 
        
        if (efficiency <= 0 && this.buildingType !== 'wall') return;

        if (this.isMining && this.resourceManager) {
            this.mineTimer += ticker.deltaTime * efficiency;
            this.turretHead.rotation += 0.1 * efficiency; 
            
            if (this.mineTimer >= this.mineSpeed) {
                this.mineTimer = 0;
                this.resourceManager.addMetal(1);
            }
        }

        if (this.recoilOffset > 0) {
            this.recoilOffset = Math.max(0, this.recoilOffset - 0.5 * ticker.deltaTime);
            const recoilX = -Math.cos(this.turretHead.rotation) * this.recoilOffset;
            const recoilY = -Math.sin(this.turretHead.rotation) * this.recoilOffset;
            this.turretHead.x = 20 + recoilX;
            this.turretHead.y = 20 + recoilY;
        } else {
            this.turretHead.x = 20;
            this.turretHead.y = 20;
        }

        if (['turret', 'sniper', 'minigun', 'laser'].includes(this.buildingType)) {
            if (this.cooldown > 0) {
                this.cooldown -= ticker.deltaTime * efficiency;
            }

            const target = this.findTarget(enemies);
            
            if (target) {
                let aimX = target.x;
                let aimY = target.y;

                if (this.buildingType === 'sniper' || this.buildingType === 'laser') {
                    const dist = Math.sqrt(Math.pow(aimX - (this.x + 20), 2) + Math.pow(aimY - (this.y + 20), 2));
                    if (this.buildingType !== 'laser') {
                        const timeToHit = dist / this.projectileSpeed; 
                        aimX += target.vx * timeToHit;
                        aimY += target.vy * timeToHit;
                    }
                }

                const angle = Math.atan2(aimY - (this.y + 20), aimX - (this.x + 20));
                
                let diff = angle - this.turretHead.rotation;
                while (diff <= -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;

                let turnSpeed = 0.2; 
                if (this.buildingType === 'sniper') turnSpeed = 0.08; 
                if (this.buildingType === 'minigun') turnSpeed = 0.15; 
                if (this.buildingType === 'laser') turnSpeed = 0.3; 

                this.turretHead.rotation += diff * turnSpeed * efficiency;

                if (Math.abs(diff) < 0.3 && this.cooldown <= 0) {
                    const barrelLen = 20;
                    const fireAngle = this.turretHead.rotation; 
                    
                    const spawnX = (this.x + 20) + Math.cos(fireAngle) * barrelLen;
                    const spawnY = (this.y + 20) + Math.sin(fireAngle) * barrelLen;

                    spawnProjectile(spawnX, spawnY, aimX, aimY, this.damage);
                    
                    this.cooldown = this.fireRate;
                    this.recoilOffset = 5; 
                    
                    if (this.muzzleFlash) {
                        this.muzzleFlash.visible = true;
                        setTimeout(() => { if (this.muzzleFlash) this.muzzleFlash.visible = false; }, 50);
                    }
                }
            }
        }
    }

    private findTarget(enemies: Enemy[]): Enemy | null {
        let closest: Enemy | null = null;
        let minDist = Infinity;
        const myX = this.x + 20;
        const myY = this.y + 20;

        if (this.buildingType === 'sniper') {
            let maxHp = -1;
            let bestTarget: Enemy | null = null;
            for (const enemy of enemies) {
                const dx = enemy.x - myX;
                const dy = enemy.y - myY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist <= this.range) {
                    if (enemy.hp > maxHp) {
                        maxHp = enemy.hp;
                        bestTarget = enemy;
                    }
                }
            }
            return bestTarget;
        }

        for (const enemy of enemies) {
            const dx = enemy.x - myX;
            const dy = enemy.y - myY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= this.range) {
                if (dist < minDist) {
                    minDist = dist;
                    closest = enemy;
                }
            }
        }
        return closest;
    }
}
