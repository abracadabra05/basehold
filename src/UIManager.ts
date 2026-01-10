import type { BuildingType } from './Building';

// Определяем тип инструмента: или здание, или спец-инструмент
export type ToolType = BuildingType | 'repair' | 'demolish';

export class UIManager {
    private onSelect: (type: ToolType) => void;
    private container: HTMLDivElement;

    constructor(onSelect: (type: ToolType) => void) {
        this.onSelect = onSelect;
        this.container = document.createElement('div');
        this.initStyles();
        this.createButtons();
        document.body.appendChild(this.container);
    }

    private initStyles() {
        this.container.style.position = 'absolute';
        this.container.style.bottom = '20px';
        this.container.style.left = '50%';
        this.container.style.transform = 'translateX(-50%)';
        this.container.style.display = 'flex';
        this.container.style.gap = '10px';
        this.container.style.padding = '10px';
        this.container.style.background = 'rgba(0, 0, 0, 0.5)';
        this.container.style.borderRadius = '8px';
    }

    private createButtons() {
        // Добавляем инструменты в массив
        const items: { type: ToolType, label: string, cost?: number, color?: string }[] = [
            { type: 'wall', label: '🧱 Wall', cost: 10 },
            { type: 'drill', label: '⛏️ Drill', cost: 50 },
            { type: 'generator', label: '⚡ Power', cost: 100 },
            { type: 'turret', label: '🔫 Turret', cost: 30 },
            { type: 'repair', label: '🔧 Repair', color: '#f1c40f' }, // Желтый
            { type: 'demolish', label: '❌ Remove', color: '#e74c3c' }, // Красный
        ];

        items.forEach(item => {
            const btn = document.createElement('button');
            if (item.cost) {
                btn.innerText = `${item.label} (${item.cost})`;
            } else {
                btn.innerText = item.label;
            }
            
            btn.style.padding = '10px 20px';
            btn.style.fontSize = '16px';
            btn.style.cursor = 'pointer';
            if (item.color) btn.style.backgroundColor = item.color;
            
            btn.onclick = () => {
                this.onSelect(item.type);
                console.log('Selected tool:', item.type);
            };

            this.container.appendChild(btn);
        });
    }
}