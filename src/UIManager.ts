import type { BuildingType } from './Building';

export class UIManager {
    private onSelect: (type: BuildingType) => void;
    private container: HTMLDivElement;

    constructor(onSelect: (type: BuildingType) => void) {
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
        const types: { type: BuildingType, label: string }[] = [
            { type: 'wall', label: '🧱 Wall' },
            { type: 'drill', label: '⛏️ Drill' },
            { type: 'generator', label: '⚡ Power' },
        ];

        types.forEach(item => {
            const btn = document.createElement('button');
            btn.innerText = item.label;
            btn.style.padding = '10px 20px';
            btn.style.fontSize = '16px';
            btn.style.cursor = 'pointer';
            
            btn.onclick = () => {
                this.onSelect(item.type);
                console.log('Selected:', item.type);
            };

            this.container.appendChild(btn);
        });
    }
}