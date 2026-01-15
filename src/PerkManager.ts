import { GameConfig } from './GameConfig';
import { Translations } from './Localization';
import type { UIManager } from './UIManager';

export interface Perk {
    id: string;
    key: string;
    icon: string;
}

export class PerkManager {
    private uiManager: UIManager;
    private container: HTMLDivElement;
    private onSelectCallback: ((perkId: string) => void) | null = null;

    constructor(uiManager: UIManager) {
        this.uiManager = uiManager;
        this.container = document.createElement('div');
        this.initStyles();
        document.body.appendChild(this.container);
    }

    private t(key: string): string {
        const lang = this.uiManager.currentLang;
        return (Translations[lang] as any)[key] || key;
    }

    public showSelection(onSelect: (perkId: string) => void) {
        this.onSelectCallback = onSelect;
        this.container.innerHTML = '';
        
        const title = document.createElement('h2');
        title.innerText = this.t('perk_title');
        Object.assign(title.style, {
            color: '#3498db', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '30px'
        });
        this.container.appendChild(title);

        const cardContainer = document.createElement('div');
        cardContainer.style.display = 'flex';
        cardContainer.style.gap = '20px';
        this.container.appendChild(cardContainer);

        // Выбираем 3 случайных перка
        const shuffled = [...GameConfig.PERKS].sort(() => 0.5 - Math.random());
        const selection = shuffled.slice(0, 3);

        selection.forEach(perk => {
            const card = this.createPerkCard(perk);
            cardContainer.appendChild(card);
        });

        this.container.style.display = 'flex';
    }

    private createPerkCard(perk: Perk): HTMLElement {
        const card = document.createElement('div');
        Object.assign(card.style, {
            background: 'rgba(255,255,255,0.05)', border: '2px solid #3498db',
            borderRadius: '12px', padding: '20px', width: '180px',
            cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center'
        });

        card.innerHTML = `
            <div style="font-size: 50px; margin-bottom: 15px;">${perk.icon}</div>
            <div style="font-weight: bold; color: white; font-size: 16px; margin-bottom: 10px;">${this.t(perk.key)}</div>
            <div style="font-size: 12px; color: #aaa;">${this.t(perk.key + '_desc')}</div>
        `;

        card.onmouseenter = () => {
            card.style.background = 'rgba(52, 152, 219, 0.2)';
            card.style.transform = 'translateY(-10px)';
            card.style.boxShadow = '0 10px 20px rgba(52, 152, 219, 0.3)';
        };
        card.onmouseleave = () => {
            card.style.background = 'rgba(255,255,255,0.05)';
            card.style.transform = 'translateY(0)';
            card.style.boxShadow = 'none';
        };

        card.onclick = () => {
            this.container.style.display = 'none';
            if (this.onSelectCallback) this.onSelectCallback(perk.id);
        };

        return card;
    }

    private initStyles() {
        Object.assign(this.container.style, {
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.85)', zIndex: 3000,
            display: 'none', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Segoe UI', sans-serif", backdropFilter: 'blur(10px)'
        });
    }
}
