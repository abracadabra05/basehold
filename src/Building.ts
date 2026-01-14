import { Container, Graphics, Ticker } from 'pixi.js';
import type { ResourceManager } from './ResourceManager';
import type { Enemy } from './Enemy';

export type BuildingType = 'wall' | 'drill' | 'generator' | 'turret' | 'core' | 'sniper' | 'minigun';

export class Building extends Container {
    public buildingType: BuildingType;
    private resourceManager: ResourceManager | null = null;
    
    // Графика
    private turretHead: Container; // Вращающаяся часть
    private recoilOffset: number = 0; // Для анимации отдачи

    public hp: number;
    public maxHp: number;
    private hpBar: Graphics;

    private isMining: boolean = false;
    private mineTimer: number = 0;
    private mineSpeed: number = 60; 

    private range: number = 200;
    private cooldown: number = 0;
    private fireRate: number = 30;
    private damage: number = 1;
    // Скорость пули (нужна для упреждения)
    private projectileSpeed: number = 10; 

    public energyConsumption: number = 0;
    public energyProduction: number = 0;
    public isDestroyed: boolean = false;

    constructor(type: BuildingType, size: number) {
        super();
        this.buildingType = type;
        this.turretHead = new Container();

        // Смещаем pivot головы в центр, чтобы она крутилась вокруг своей оси
        // Но так как мы позиционируем голову в центре здания (20, 20), то pivot можно оставить 0,0 
        // и рисовать графику относительно центра.
        this.turretHead.x = size / 2;
        this.turretHead.y = size / 2;

        this.sortableChildren = true;

        switch (type) {
            case 'wall': this.maxHp = 100; this.energyConsumption = 0; break;
            case 'drill': this.maxHp = 30; this.energyConsumption = 5; break;
            case 'generator': this.maxHp = 20; this.energyProduction = 20; break;
            case 'core': this.maxHp = 500; this.energyProduction = 50; break;
            case 'turret': this.maxHp = 50; this.energyConsumption = 10; this.range = 200; this.fireRate = 30; this.damage = 1; break;
            case 'sniper': this.maxHp = 40; this.energyConsumption = 15; this.range = 400; this.fireRate = 120; this.damage = 10; break;
            case 'minigun': this.maxHp = 60; this.energyConsumption = 20; this.range = 150; this.fireRate = 5; this.damage = 0.5; break;
            default: this.maxHp = 10;
        }
        this.hp = this.maxHp;

        // 1. РИСУЕМ БАЗУ (Неподвижная часть)
        const baseG = new Graphics();
        switch (type) {
            case 'wall':
                baseG.rect(0, 0, size, size).fill(0x888888).stroke({ width: 2, color: 0x000000 });
                baseG.rect(5, 5, 10, 5).fill(0x666666); baseG.rect(20, 20, 10, 5).fill(0x666666);
                break;
            case 'drill': baseG.rect(0, 0, size, size).fill(0x3498db); break; // Бур без головы (пока)
            case 'generator': baseG.rect(0, 0, size, size).fill(0xe67e22).moveTo(size / 2, 5).lineTo(size / 2, size - 5).stroke({ width: 4, color: 0xffff00 }); break;
            case 'core': baseG.rect(0, 0, size, size).fill(0x00FFFF).circle(size / 2, size / 2, size / 3).fill(0xFFFFFF).stroke({ width: 3, color: 0x0000FF }); break;
            
            // У турелей база - просто кружок или квадрат
            case 'turret': 
            case 'sniper': 
            case 'minigun':
                baseG.rect(0, 0, size, size).fill(0x7f8c8d); // Темно-серый фундамент
                baseG.stroke({ width: 2, color: 0x2c3e50 });
                break;
        }
        baseG.zIndex = 0;
        this.addChild(baseG);

        // 2. РИСУЕМ ГОЛОВУ (Вращающаяся часть)
        const headG = new Graphics();
        
        switch (type) {
            case 'turret': 
                // Зеленая пушка
                headG.circle(0, 0, 12).fill(0x2ecc71); 
                headG.rect(5, -2, 10, 4).fill(0x27ae60); // Дуло смотрит вправо (0 градусов)
                break;

            case 'sniper':
                // Длинная серая пушка
                headG.circle(0, 0, 10).fill(0x555555);
                headG.rect(0, -3, 25, 6).fill(0x222222); // Длинное дуло
                headG.circle(0, 0, 4).fill(0xFF0000); // Прицел
                break;

            case 'minigun':
                // Фиолетовая толстая пушка
                headG.circle(0, 0, 14).fill(0x8e44ad);
                // Три коротких дула
                headG.rect(5, -6, 8, 3).fill(0x000000);
                headG.rect(5, 3, 8, 3).fill(0x000000);
                headG.rect(8, -1, 8, 3).fill(0x000000);
                break;
            
            case 'drill':
                // Рисуем сам бур (зубчатый)
                headG.circle(0, 0, 8).fill(0xbdc3c7); // Основа
                
                // Рисуем крестовину, чтобы было видно вращение
                headG.rect(-3, -12, 6, 24).fill(0x7f8c8d); 
                headG.rect(-12, -3, 24, 6).fill(0x7f8c8d);
                
                // Центр
                headG.circle(0, 0, 4).fill(0xffffff);
                break;
        }
        
        // Добавляем голову, если это турель или бур
        if (['turret', 'sniper', 'minigun', 'drill'].includes(type)) {
            this.turretHead.addChild(headG);
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
    public takeDamage(amount: number) { this.hp -= amount; this.updateHpBar(); this.tint = 0xFFaaaa; setTimeout(() => this.tint = 0xFFFFFF, 50); if (this.hp <= 0) this.isDestroyed = true; }
    private updateHpBar() { if (this.hp < this.maxHp) { this.hpBar.visible = true; this.hpBar.clear(); this.hpBar.rect(-2, -2, 44, 8).fill({color:0x000000, alpha:0.8}); const pct = Math.max(0, this.hp / this.maxHp); const color = pct > 0.5 ? 0x00FF00 : pct > 0.25 ? 0xFFFF00 : 0xFF0000; this.hpBar.rect(0, 0, 40 * pct, 4).fill(color); } else { this.hpBar.visible = false; } }

    public update(
        ticker: Ticker, 
        enemies: Enemy[], 
        spawnProjectile: (x: number, y: number, tx: number, ty: number, damage: number) => void,
        efficiency: number
    ) {
        if (efficiency <= 0 && this.buildingType !== 'wall') return;

        // Майнинг
        if (this.isMining && this.resourceManager) {
            this.mineTimer += ticker.deltaTime * efficiency;
            // Анимация бура (просто крутим)
            this.turretHead.rotation += 0.1 * efficiency; 
            
            if (this.mineTimer >= this.mineSpeed) {
                this.mineTimer = 0;
                this.resourceManager.addMetal(1);
            }
        }

        // Возврат отдачи (Recoil recovery)
        // Линейная интерполяция (Lerp) обратно к 0
        if (this.recoilOffset > 0) {
            this.recoilOffset = Math.max(0, this.recoilOffset - 0.5 * ticker.deltaTime);
            // Сдвигаем графику головы назад локально
            // Но проще сдвигать весь контейнер turretHead по его локальной оси X? 
            // Нет, Pixi контейнеры не имеют локальной трансформации детей таким образом.
            // Мы будем сдвигать child (headG) внутри turretHead.
            // Хак: Просто двигаем turretHead.x/y против угла поворота.
            
            const recoilX = -Math.cos(this.turretHead.rotation) * this.recoilOffset;
            const recoilY = -Math.sin(this.turretHead.rotation) * this.recoilOffset;
            
            // Центр + отдача
            this.turretHead.x = 20 + recoilX;
            this.turretHead.y = 20 + recoilY;
        } else {
            this.turretHead.x = 20;
            this.turretHead.y = 20;
        }

        // Стрельба
        if (['turret', 'sniper', 'minigun'].includes(this.buildingType)) {
            if (this.cooldown > 0) {
                this.cooldown -= ticker.deltaTime * efficiency;
            }

            const target = this.findTarget(enemies);
            
            if (target) {
                // 1. Вычисляем точку прицеливания (Aim Point)
                let aimX = target.x + 20; // Центр врага (если враги 40x40, но они меньше, но hitbox в центре)
                let aimY = target.y + 20; // Прибавка +20 не нужна, если x,y врага - это его центр? 
                // У врага pivot 0,0 (левый верхний). Центр: x+w/2.
                // В Enemy.ts мы видели, что body смещен на -12,-12. Значит x,y врага - ЭТО ЦЕНТР.
                // Но когда мы строили логику движения врагов, мы прибавляли +20 к цели (зданию).
                // Короче: this.x врага - это его центр. 
                aimX = target.x;
                aimY = target.y;

                // 2. УПРЕЖДЕНИЕ (Только для снайпера)
                if (this.buildingType === 'sniper') {
                    const dist = Math.sqrt(Math.pow(aimX - (this.x + 20), 2) + Math.pow(aimY - (this.y + 20), 2));
                    const timeToHit = dist / this.projectileSpeed; // время полета пули
                    
                    // Предсказываем позицию: P = P0 + V * t
                    aimX += target.vx * timeToHit;
                    aimY += target.vy * timeToHit;
                }

                // 3. Поворот башни
                // atan2(dy, dx)
                const angle = Math.atan2(aimY - (this.y + 20), aimX - (this.x + 20));
                
                // Плавный поворот (Lerp angle)
                // Для простоты пока жесткий поворот
                this.turretHead.rotation = angle;

                // 4. Выстрел
                if (this.cooldown <= 0) {
                    // Спавним пулю из центра башни (или из дула)
                    // Дуло смещено на radius (скажем 15px) по углу
                    const barrelLen = 20;
                    const spawnX = (this.x + 20) + Math.cos(angle) * barrelLen;
                    const spawnY = (this.y + 20) + Math.sin(angle) * barrelLen;

                    // Для снайпера стреляем в предсказанную точку
                    // Для остальных - в текущую (или тоже в предсказанную, это не вредит)
                    spawnProjectile(spawnX, spawnY, aimX, aimY, this.damage);
                    
                    this.cooldown = this.fireRate;
                    
                    // Эффект отдачи
                    this.recoilOffset = 5; // Отскок на 5 пикселей
                }
            }
        }
    }

    private findTarget(enemies: Enemy[]): Enemy | null {
        let closest: Enemy | null = null;
        let minDist = Infinity;
        
        // Центр башни
        const myX = this.x + 20;
        const myY = this.y + 20;

        for (const enemy of enemies) {
            const dx = enemy.x - myX;
            const dy = enemy.y - myY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist <= this.range) {
                // Приоритет целей
                // Снайпер ищет самого жирного (Tank/Boss)
                if (this.buildingType === 'sniper') {
                    // Если текущий closest слабее, меняем на этого
                    // (Танк > Фаст > Обычный)
                    // Простая эвристика по HP
                    if (!closest || enemy.hp > closest.hp) {
                        closest = enemy;
                    }
                } 
                // Миниган ищет ближайшего
                else {
                    if (dist < minDist) {
                        minDist = dist;
                        closest = enemy;
                    }
                }
            }
        }
        return closest;
    }
}
