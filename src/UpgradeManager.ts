import type { ResourceManager } from './ResourceManager';

export class UpgradeManager {
    private resourceManager: ResourceManager;
    private container: HTMLDivElement;

    // Текущие уровни прокачки
    public damageLevel: number = 1;
    public mineSpeedLevel: number = 1;
    public moveSpeedLevel: number = 1;

    // Колбеки для применения улучшений
    public onDamageUpgrade?: (val: number) => void;
    public onMineSpeedUpgrade?: (val: number) => void;
    public onMoveSpeedUpgrade?: (val: number) => void;

    constructor(resourceManager: ResourceManager) {
        this.resourceManager = resourceManager;
        
        this.container = document.createElement('div');
        this.initStyles();
        this.createUI();
        document.body.appendChild(this.container);
    }

    private initStyles() {
        this.container.style.position = 'absolute';
        this.container.style.top = '100px';
        this.container.style.right = '20px';
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.gap = '10px';
        this.container.style.padding = '15px';
        this.container.style.background = 'rgba(0, 0, 0, 0.7)';
        this.container.style.borderRadius = '8px';
        this.container.style.color = 'white';
        this.container.style.fontFamily = 'Arial, sans-serif';
    }

    private createUI() {
        this.container.innerHTML = `<h3 style="margin: 0 0 10px 0;">🧬 Shop</h3>`;

        this.createUpgradeBtn("💥 Damage", () => this.damageLevel, () => {
            this.damageLevel++;
            if (this.onDamageUpgrade) this.onDamageUpgrade(this.damageLevel);
        });

        this.createUpgradeBtn("⛏️ Mining", () => this.mineSpeedLevel, () => {
            this.mineSpeedLevel++;
            if (this.onMineSpeedUpgrade) this.onMineSpeedUpgrade(1 + (this.mineSpeedLevel - 1) * 0.2); // +20% за уровень
        });

        this.createUpgradeBtn("🏃 Speed", () => this.moveSpeedLevel, () => {
            this.moveSpeedLevel++;
            if (this.onMoveSpeedUpgrade) this.onMoveSpeedUpgrade(1 + (this.moveSpeedLevel - 1) * 0.1); // +10% за уровень
        });
    }

    private createUpgradeBtn(label: string, getLevel: () => number, onBuy: () => void) {
        const wrapper = document.createElement('div');
        const btn = document.createElement('button');
        const info = document.createElement('span');

        const updateText = () => {
            const lvl = getLevel();
            // Цена растет с уровнем: 50 * уровень
            const cost = 50 * lvl; 
            btn.innerText = `Up (${cost})`;
            info.innerText = `${label} [Lvl ${lvl}]`;
        };

        btn.style.marginLeft = '10px';
        btn.style.cursor = 'pointer';
        btn.style.padding = '5px 10px';
        btn.style.background = '#9b59b6';
        btn.style.color = 'white';
        btn.style.border = 'none';
        btn.style.borderRadius = '4px';

        btn.onclick = () => {
            const cost = 50 * getLevel();
            // Проверяем, есть ли биомасса (но в ResourceManager пока нет геттера biomass)
            // Придется добавить геттер или сделать свойство публичным.
            // Сделаем простой хак: проверим через метод spendBiomass (создадим его)
            if (this.resourceManager.spendBiomass(cost)) {
                onBuy();
                updateText();
            } else {
                btn.style.background = 'red';
                setTimeout(() => btn.style.background = '#9b59b6', 200);
            }
        };

        updateText();
        wrapper.appendChild(info);
        wrapper.appendChild(btn);
        this.container.appendChild(wrapper);
    }
}