import type { ResourceManager } from './ResourceManager';
import type { UIManager } from './UIManager';
import { Translations } from './Localization';

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

    constructor(uiManager: UIManager, resourceManager: ResourceManager) {
        this.resourceManager = resourceManager;
        this.uiManager = uiManager;
        
        this.container = document.createElement('div');
        this.initStyles();
        this.hide();
        document.body.appendChild(this.container);
    }

    private t(key: string): string {
        const lang = this.uiManager.currentLang;
        return (Translations[lang] as any)[key] || key;
    }

    public setOnClose(callback: () => void) {
        this.onCloseCallback = callback;
    }

    public show() {
        this.createUI();
        this.container.style.display = 'flex';
    }

    public hide() {
        this.container.style.display = 'none';
    }

    private initStyles() {
        Object.assign(this.container.style, {
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            display: 'flex', flexDirection: 'column', padding: '20px',
            background: 'rgba(15, 15, 15, 0.98)', border: '2px solid #9b59b6', borderRadius: '15px',
            boxShadow: '0 0 40px rgba(155, 89, 182, 0.4)', color: 'white',
            fontFamily: "'Segoe UI', sans-serif", zIndex: '2000', minWidth: '380px', textAlign: 'center'
        });
    }

    private createUI() {
        this.container.innerHTML = '';
        
        const header = document.createElement('div');
        header.innerHTML = `
            <h2 style="margin: 0 0 5px 0; color: #9b59b6; text-transform: uppercase; letter-spacing: 2px;">${this.t('shop_title')}</h2>
            <p style="margin-bottom: 20px; font-size: 13px; color: #888;">${this.t('shop_subtitle')}</p>
        `;
        this.container.appendChild(header);

        const tabsContainer = document.createElement('div');
        Object.assign(tabsContainer.style, {
            display: 'flex', justifyContent: 'space-around', marginBottom: '15px', borderBottom: '1px solid #333'
        });
        this.container.appendChild(tabsContainer);

        const playerTabBtn = this.createTabBtn("👤", true);
        const baseTabBtn = this.createTabBtn("🏰", false);
        tabsContainer.appendChild(playerTabBtn);
        tabsContainer.appendChild(baseTabBtn);

        const contentContainer = document.createElement('div');
        contentContainer.style.minHeight = '240px';
        this.container.appendChild(contentContainer);

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

        contentContainer.appendChild(playerContent);
        contentContainer.appendChild(baseContent);

        playerTabBtn.onclick = () => {
            playerContent.style.display = 'flex'; baseContent.style.display = 'none';
            playerTabBtn.style.borderBottom = '2px solid #9b59b6'; baseTabBtn.style.borderBottom = 'none';
            playerTabBtn.style.color = 'white'; baseTabBtn.style.color = '#555';
        };
        baseTabBtn.onclick = () => {
            playerContent.style.display = 'none'; baseContent.style.display = 'flex';
            baseTabBtn.style.borderBottom = '2px solid #9b59b6'; playerTabBtn.style.borderBottom = 'none';
            baseTabBtn.style.color = 'white'; playerTabBtn.style.color = '#555';
        };

        const closeBtn = document.createElement('button');
        closeBtn.innerText = this.t('shop_close');
        Object.assign(closeBtn.style, {
            marginTop: '20px', padding: '12px', fontSize: '16px', fontWeight: 'bold',
            cursor: 'pointer', background: '#27ae60', color: 'white', border: 'none', borderRadius: '4px'
        });
        closeBtn.onclick = () => { this.hide(); if (this.onCloseCallback) this.onCloseCallback(); };
        this.container.appendChild(closeBtn);
    }

    private createTabBtn(label: string, isActive: boolean): HTMLElement {
        const btn = document.createElement('div');
        btn.innerText = label;
        Object.assign(btn.style, {
            cursor: 'pointer', padding: '10px 30px', fontWeight: 'bold', fontSize: '20px', transition: 'all 0.2s',
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