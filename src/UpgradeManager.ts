import type { ResourceManager } from './ResourceManager';
import type { UIManager } from './UIManager';
import { Translations } from './Localization';
import { GameConfig } from './GameConfig';
import { yaSdk } from './YandexSDK';

export class UpgradeManager {
    private resourceManager: ResourceManager;
    private uiManager: UIManager;
    private container: HTMLDivElement;
    private onCloseCallback: (() => void) | null = null; 

    public damageLevel: number = 1;
    public mineSpeedLevel: number = 1;
    public moveSpeedLevel: number = 1;
    public regenLevel: number = 0;
    public magnetLevel: number = 0;
    public thornsLevel: number = 0;

    public onUpgrade?: (type: string) => void;
    public onUnlock?: (type: string) => void; // Колбек разблокировки

    // Список открытых зданий (изначально берем из конфига)
    private unlockedBuildings: Set<string> = new Set();

    constructor(uiManager: UIManager, resourceManager: ResourceManager) {
        this.resourceManager = resourceManager;
        this.uiManager = uiManager;
        
        // Инициализация открытых зданий
        for (const [key, val] of Object.entries(GameConfig.BUILDINGS)) {
            if ((val as any).unlocked) this.unlockedBuildings.add(key);
        }
        
        this.container = document.createElement('div');
        this.initStyles();
        this.hide();
        document.body.appendChild(this.container);
    }

    public isBuildingUnlocked(type: string): boolean {
        return this.unlockedBuildings.has(type);
    }

    private t(key: string): string {
        const lang = this.uiManager.currentLang;
        return (Translations[lang] as any)[key] || key;
    }

    public setOnClose(callback: () => void) {
        this.onCloseCallback = callback;
    }

    public show() {
        this.initStyles();
        this.createUI();
        this.container.style.display = 'flex';
    }

    public hide() {
        this.container.style.display = 'none';
    }

    private isMobileLayout(): boolean {
        try {
            return window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 900;
        } catch {
            return window.innerWidth <= 900;
        }
    }

    private initStyles() {
        Object.assign(this.container.style, {
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            display: 'flex', flexDirection: 'column', padding: '20px',
            background: 'rgba(15, 15, 15, 0.98)', border: '2px solid #9b59b6', borderRadius: '15px',
            boxShadow: '0 0 40px rgba(155, 89, 182, 0.4)', color: 'white',
            fontFamily: "'Segoe UI', sans-serif", zIndex: '2000', minWidth: '380px', textAlign: 'center'
        });

        if (this.isMobileLayout()) {
            Object.assign(this.container.style, {
                width: '94vw', maxWidth: '94vw', height: '88vh', maxHeight: '88vh', minWidth: 'unset',
                padding: '12px',
                overflow: 'hidden'
            });
        }
    }

    private createUI() {
        this.container.innerHTML = '';

        const isMobile = this.isMobileLayout();

        const closeX = document.createElement('button');
        closeX.innerText = '✕';
        Object.assign(closeX.style, {
            position: 'absolute',
            top: '10px',
            right: '10px',
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            border: '1px solid #333',
            background: 'rgba(0,0,0,0.35)',
            color: 'white',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: 'pointer',
            zIndex: '3000'
        });
        closeX.onclick = () => { this.hide(); if (this.onCloseCallback) this.onCloseCallback(); };
        this.container.appendChild(closeX);
        
        const header = document.createElement('div');
        header.innerHTML = `
            <h2 style="margin: 0 0 5px 0; color: #9b59b6; text-transform: uppercase; letter-spacing: 2px;">${this.t('shop_title')}</h2>
            <p style="margin-bottom: 20px; font-size: 13px; color: #888;">${this.t('shop_subtitle')}</p>
        `;
        if (isMobile) {
            header.style.paddingRight = '44px';
            const subtitle = header.querySelector('p') as HTMLParagraphElement | null;
            if (subtitle) {
                subtitle.style.marginBottom = '10px';
                subtitle.style.fontSize = '12px';
            }
        }
        this.container.appendChild(header);

        const tabsContainer = document.createElement('div');
        Object.assign(tabsContainer.style, {
            display: 'flex', justifyContent: 'space-around', marginBottom: '15px', borderBottom: '1px solid #333', width: '100%'
        });
        this.container.appendChild(tabsContainer);

        const playerTabBtn = this.createTabBtn("👤", true);
        const baseTabBtn = this.createTabBtn("🏰", false);
        const techTabBtn = this.createTabBtn("🔬", false);
        
        tabsContainer.appendChild(playerTabBtn);
        tabsContainer.appendChild(baseTabBtn);
        tabsContainer.appendChild(techTabBtn);

        const contentContainer = document.createElement('div');
        contentContainer.style.minHeight = isMobile ? 'unset' : '280px'; // Чуть больше места
        contentContainer.style.flex = '1';
        contentContainer.style.minHeight = '0';
        contentContainer.style.overflowY = 'auto';
        if (isMobile) {
            contentContainer.style.paddingBottom = '10px';
            (contentContainer.style as any).webkitOverflowScrolling = 'touch';
            contentContainer.style.touchAction = 'pan-y';
        }
        this.container.appendChild(contentContainer);

        // --- PLAYER ---
        const playerContent = document.createElement('div');
        playerContent.style.display = 'flex';
        playerContent.style.flexDirection = 'column';
        playerContent.style.gap = '8px';
        
        this.createUpgradeBtn(playerContent, this.t('upg_dmg'), () => this.damageLevel, () => {
            this.damageLevel++;
            if (this.onUpgrade) this.onUpgrade('damage');
        });
        this.createUpgradeBtn(playerContent, this.t('upg_speed'), () => this.moveSpeedLevel, () => {
            this.moveSpeedLevel++;
            if (this.onUpgrade) this.onUpgrade('speed');
        });
        this.createUpgradeBtn(playerContent, this.t('upg_mine'), () => this.mineSpeedLevel, () => {
            this.mineSpeedLevel++;
            if (this.onUpgrade) this.onUpgrade('mine');
        });
        this.createUpgradeBtn(playerContent, this.t('upg_magnet'), () => this.magnetLevel, () => {
            this.magnetLevel++;
            if (this.onUpgrade) this.onUpgrade('magnet');
        });

        // --- BASE ---
        const baseContent = document.createElement('div');
        baseContent.style.display = 'none'; 
        baseContent.style.flexDirection = 'column';
        baseContent.style.gap = '8px';

        this.createUpgradeBtn(baseContent, this.t('upg_regen'), () => this.regenLevel, () => {
            this.regenLevel++;
            if (this.onUpgrade) this.onUpgrade('regen');
        });
        this.createUpgradeBtn(baseContent, this.t('upg_thorns'), () => this.thornsLevel, () => {
            this.thornsLevel++;
            if (this.onUpgrade) this.onUpgrade('thorns');
        });

        // --- TECH ---
        const techContent = document.createElement('div');
        techContent.style.display = 'none';
        techContent.style.flexDirection = 'column';
        techContent.style.gap = '8px';

        // Генерируем кнопки для закрытых технологий
        const unlockables = ['battery', 'sniper', 'minigun', 'laser'];
        unlockables.forEach(type => {
            if (GameConfig.BUILDINGS[type as keyof typeof GameConfig.BUILDINGS]) {
                this.createUnlockBtn(techContent, type);
            }
        });

        contentContainer.appendChild(playerContent);
        contentContainer.appendChild(baseContent);
        contentContainer.appendChild(techContent);

        playerTabBtn.onclick = () => {
            playerContent.style.display = 'flex'; baseContent.style.display = 'none'; techContent.style.display = 'none';
            playerTabBtn.style.color = 'white'; baseTabBtn.style.color = '#555'; techTabBtn.style.color = '#555';
            playerTabBtn.style.borderBottom = '2px solid #9b59b6'; baseTabBtn.style.borderBottom = 'none'; techTabBtn.style.borderBottom = 'none';
        };
        baseTabBtn.onclick = () => {
            playerContent.style.display = 'none'; baseContent.style.display = 'flex'; techContent.style.display = 'none';
            baseTabBtn.style.color = 'white'; playerTabBtn.style.color = '#555'; techTabBtn.style.color = '#555';
            baseTabBtn.style.borderBottom = '2px solid #9b59b6'; playerTabBtn.style.borderBottom = 'none'; techTabBtn.style.borderBottom = 'none';
        };
        techTabBtn.onclick = () => {
            playerContent.style.display = 'none'; baseContent.style.display = 'none'; techContent.style.display = 'flex';
            techTabBtn.style.color = 'white'; playerTabBtn.style.color = '#555'; baseTabBtn.style.color = '#555';
            techTabBtn.style.borderBottom = '2px solid #9b59b6'; playerTabBtn.style.borderBottom = 'none'; baseTabBtn.style.borderBottom = 'none';
        };

        const closeBtn = document.createElement('button');
        closeBtn.innerText = this.t('shop_close');
        Object.assign(closeBtn.style, {
            marginTop: '20px', padding: '12px', fontSize: '16px', fontWeight: 'bold',
            cursor: 'pointer', background: '#27ae60', color: 'white', border: 'none', borderRadius: '4px'
        });
        if (isMobile) {
            Object.assign(closeBtn.style, {
                marginTop: '12px',
                padding: '10px',
                fontSize: '14px'
            });
        }
        closeBtn.onclick = () => { this.hide(); if (this.onCloseCallback) this.onCloseCallback(); };
        this.container.appendChild(closeBtn);
    }

    private createUnlockBtn(parent: HTMLElement, type: string) {
        const wrapper = document.createElement('div');
        Object.assign(wrapper.style, {
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '4px', border: '1px solid #333'
        });

        const info = document.createElement('div');
        info.style.textAlign = 'left';
        info.style.flex = '1';

        const btnContainer = document.createElement('div');
        btnContainer.style.display = 'flex';
        btnContainer.style.flexDirection = 'column';
        btnContainer.style.gap = '4px';
        btnContainer.style.alignItems = 'flex-end';

        const btn = document.createElement('button');
        Object.assign(btn.style, {
            cursor: 'pointer', padding: '6px 12px', background: '#3498db', color: 'white',
            border: 'none', borderRadius: '3px', fontWeight: 'bold', minWidth: '80px', fontSize: '12px'
        });

        // Кнопка рекламы
        const adBtn = document.createElement('button');
        adBtn.innerText = "🎬 FREE";
        Object.assign(adBtn.style, {
            cursor: 'pointer', padding: '4px 12px', background: '#e67e22', color: 'white',
            border: 'none', borderRadius: '3px', fontWeight: 'bold', minWidth: '80px', fontSize: '10px'
        });

        const cost = (GameConfig.BUILDINGS as any)[type].researchCost || 100;
        const toolName = this.t(`tool_${type}`);

        const updateState = () => {
            const isUnlocked = this.isBuildingUnlocked(type);
            
            if (isUnlocked) {
                btn.innerText = "UNLOCKED";
                btn.disabled = true;
                btn.style.background = '#27ae60';
                info.style.opacity = '0.5';
                adBtn.style.display = 'none'; // Скрываем рекламу, если куплено
            } else {
                btn.innerText = `${cost} 🧬`;
                btn.disabled = false;
                btn.style.background = '#3498db';
                info.style.opacity = '1';
                adBtn.style.display = 'block';
            }
            
            info.innerHTML = `<div style="font-size: 14px; font-weight: bold;">${toolName}</div>
                              <div style="font-size: 11px; color: #aaa;">Tech Level 1</div>`;
        };

        const doUnlock = () => {
            this.unlockedBuildings.add(type);
            if (this.onUnlock) this.onUnlock(type);
            updateState();
        };

        btn.onclick = () => {
            if (this.resourceManager.spendBiomass(cost)) {
                doUnlock();
            } else {
                btn.style.background = '#c0392b';
                setTimeout(() => btn.style.background = '#3498db', 300);
            }
        };

        adBtn.onclick = () => {
            yaSdk.showRewardedVideo(() => {
                doUnlock();
            });
        };

        updateState();
        wrapper.appendChild(info);
        wrapper.appendChild(btnContainer);
        btnContainer.appendChild(btn);
        btnContainer.appendChild(adBtn);
        parent.appendChild(wrapper);
    }

    private createTabBtn(label: string, isActive: boolean): HTMLElement {
        const btn = document.createElement('div');
        btn.innerText = label;
        const isMobile = window.innerWidth <= 768;
        Object.assign(btn.style, {
            cursor: 'pointer', padding: isMobile ? '8px 10px' : '10px 30px', fontWeight: 'bold', fontSize: isMobile ? '18px' : '20px', transition: 'all 0.2s',
            borderBottom: isActive ? '2px solid #9b59b6' : 'none', color: isActive ? 'white' : '#555'
        });
        return btn;
    }

    private createUpgradeBtn(parent: HTMLElement, label: string, getLevel: () => number, onBuy: () => void) {
        const wrapper = document.createElement('div');
        Object.assign(wrapper.style, {
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '4px', border: '1px solid #333'
        });

        const info = document.createElement('div');
        info.style.textAlign = 'left';

        const btn = document.createElement('button');
        Object.assign(btn.style, {
            cursor: 'pointer', padding: '6px 12px', background: '#8e44ad', color: 'white',
            border: 'none', borderRadius: '3px', fontWeight: 'bold', minWidth: '80px'
        });

        const updateText = () => {
            const lvl = getLevel();
            const cost = 50 * (lvl === 0 ? 1 : lvl); 
            
            if (lvl >= 10) {
                btn.innerText = this.t('upg_max');
                btn.disabled = true;
                btn.style.background = '#444';
            } else {
                btn.innerText = `${cost} 🧬`;
                btn.disabled = false;
            }
            
            info.innerHTML = `<div style="font-size: 14px; font-weight: bold;">${label}</div>
                              <div style="font-size: 11px; color: #aaa;">${this.t('upg_level')} ${lvl}</div>`;
        };

        btn.onclick = () => {
            const lvl = getLevel();
            const cost = 50 * (lvl === 0 ? 1 : lvl);
            if (this.resourceManager.spendBiomass(cost)) {
                onBuy(); updateText();
            } else {
                btn.style.background = '#c0392b';
                setTimeout(() => btn.style.background = '#8e44ad', 300);
            }
        };

        updateText();
        wrapper.appendChild(info);
        wrapper.appendChild(btn);
        parent.appendChild(wrapper);
    }
}