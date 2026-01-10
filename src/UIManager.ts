import type { BuildingType } from './Building';

// Определяем тип инструмента: или здание, или спец-инструмент
export type ToolType = BuildingType | 'repair' | 'demolish';

export class UIManager {
    private onSelect: (type: ToolType) => void;
    private container: HTMLDivElement;
    private buttons: Map<ToolType, HTMLButtonElement> = new Map(); // Храним ссылки на кнопки
    private isPaused: boolean = false;
    private activeTool: ToolType | null = 'wall'; // По умолчанию стена

    constructor(onSelect: (type: ToolType) => void) {
        this.onSelect = onSelect;
        this.container = document.createElement('div');
        this.initStyles();
        this.createButtons();
        document.body.appendChild(this.container);
        
        // Сразу подсвечиваем дефолтный инструмент
        this.highlightButton('wall');
    }

    // Метод для блокировки UI при паузе
    public setPaused(paused: boolean) {
        this.isPaused = paused;
        // Визуально затемняем панель
        this.container.style.opacity = paused ? '0.5' : '1.0';
        this.container.style.pointerEvents = paused ? 'none' : 'auto';
    }

    private initStyles() {
        this.container.style.position = 'absolute';
        this.container.style.bottom = '20px';
        this.container.style.left = '50%';
        this.container.style.transform = 'translateX(-50%)';
        this.container.style.display = 'flex';
        this.container.style.gap = '10px';
        this.container.style.padding = '10px';
        this.container.style.background = 'rgba(0, 0, 0, 0.7)'; // Чуть темнее фон
        this.container.style.borderRadius = '12px';
        this.container.style.border = '2px solid #444';
        this.container.style.transition = 'opacity 0.3s'; // Плавное затемнение
    }

    private createButtons() {
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
            
            btn.style.padding = '12px 18px';
            btn.style.fontSize = '14px';
            btn.style.cursor = 'pointer';
            btn.style.fontWeight = 'bold';
            btn.style.color = 'white';
            btn.style.border = '2px solid transparent'; // Рамка для выделения
            btn.style.borderRadius = '6px';
            btn.style.backgroundColor = item.color ? item.color : '#555';
            btn.style.transition = 'all 0.1s'; // Анимация
            
            btn.onclick = () => {
                if (this.isPaused) return; // Блокировка
                
                this.onSelect(item.type);
                this.highlightButton(item.type);
            };

            this.container.appendChild(btn);
            this.buttons.set(item.type, btn);
        });
    }

    private highlightButton(type: ToolType) {
        // Сбрасываем стили у всех
        this.buttons.forEach(btn => {
            btn.style.transform = 'scale(1.0)';
            btn.style.borderColor = 'transparent';
            btn.style.boxShadow = 'none';
        });

        // Выделяем нажатую
        const activeBtn = this.buttons.get(type);
        if (activeBtn) {
            activeBtn.style.transform = 'scale(1.1)'; // Чуть увеличиваем
            activeBtn.style.borderColor = '#ffffff';   // Белая обводка
            activeBtn.style.boxShadow = '0 0 10px rgba(255,255,255,0.5)'; // Свечение
        }
        this.activeTool = type;
    }
}