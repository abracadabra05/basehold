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
    public onUnlock?: (type: string) => void;

    public onPauseRequest?: () => void;
    public onResumeRequest?: () => void;

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

    public reset() {
        this.damageLevel = 1;
        this.mineSpeedLevel = 1;
        this.moveSpeedLevel = 1;
        this.regenLevel = 0;
        this.magnetLevel = 0;
        this.thornsLevel = 0;

        // Сбрасываем открытые технологии до дефолтных
        this.unlockedBuildings.clear();
        for (const [key, val] of Object.entries(GameConfig.BUILDINGS)) {
            if ((val as any).unlocked) this.unlockedBuildings.add(key);
        }

        // Перерисовываем UI, чтобы сбросить цены и кнопки
        this.createUI();
    }

    public getProgressState(): {
        upgrades: { damage: number; speed: number; mine: number; regen: number; thorns: number; magnet: number };
        unlockedBuildings: string[];
    } {
        return {
            upgrades: {
                damage: this.damageLevel,
                speed: this.moveSpeedLevel,
                mine: this.mineSpeedLevel,
                regen: this.regenLevel,
                thorns: this.thornsLevel,
                magnet: this.magnetLevel,
            },
            unlockedBuildings: Array.from(this.unlockedBuildings),
        };
    }

    public applyProgressState(state: {
        upgrades?: Partial<{ damage: number; speed: number; mine: number; regen: number; thorns: number; magnet: number }>;
        unlockedBuildings?: string[];
    }): void {
        const upgrades = state.upgrades || {};
        this.damageLevel = Math.max(1, Math.floor(upgrades.damage ?? this.damageLevel));
        this.moveSpeedLevel = Math.max(1, Math.floor(upgrades.speed ?? this.moveSpeedLevel));
        this.mineSpeedLevel = Math.max(1, Math.floor(upgrades.mine ?? this.mineSpeedLevel));
        this.regenLevel = Math.max(0, Math.floor(upgrades.regen ?? this.regenLevel));
        this.thornsLevel = Math.max(0, Math.floor(upgrades.thorns ?? this.thornsLevel));
        this.magnetLevel = Math.max(0, Math.floor(upgrades.magnet ?? this.magnetLevel));

        if (Array.isArray(state.unlockedBuildings)) {
            this.unlockedBuildings.clear();
            for (const [key, val] of Object.entries(GameConfig.BUILDINGS)) {
                if ((val as any).unlocked) this.unlockedBuildings.add(key);
            }
            for (const type of state.unlockedBuildings) {
                this.unlockedBuildings.add(type);
            }
        }
    }

    public isBuildingUnlocked(type: string): boolean {
        return this.unlockedBuildings.has(type);
    }

    public unlockBuilding(type: string): boolean {
        if (!GameConfig.BUILDINGS[type as keyof typeof GameConfig.BUILDINGS]) return false;
        if (this.unlockedBuildings.has(type)) return false;
        this.unlockedBuildings.add(type);
        if (this.onUnlock) this.onUnlock(type);
        return true;
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
            display: 'flex', flexDirection: 'column', padding: '24px',
            background: 'linear-gradient(145deg, rgba(16, 16, 20, 0.98), rgba(30, 15, 40, 0.98))',
            border: '1px solid rgba(155, 89, 182, 0.5)',
            borderRadius: '20px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5), 0 0 30px rgba(155, 89, 182, 0.2)',
            color: 'white',
            fontFamily: "'Segoe UI', sans-serif", zIndex: '2000', textAlign: 'center',
            maxHeight: '85vh', width: '450px', maxWidth: '94vw',
            backdropFilter: 'blur(20px)',
            webkitBackdropFilter: 'blur(20px)'
        });

        if (this.isMobileLayout()) {
            Object.assign(this.container.style, {
                width: '94vw', maxWidth: '94vw', height: 'auto', maxHeight: '92vh',
                padding: '16px',
                border: '1px solid rgba(155, 89, 182, 0.3)'
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
        Object.assign(contentContainer.style, {
            flex: '1',
            minHeight: '0',
            maxHeight: isMobile ? 'calc(100% - 180px)' : '350px',
            overflowY: 'auto',
            overflowX: 'hidden',
            paddingRight: '5px',
            paddingBottom: '10px'
        });
        // Enable smooth scrolling on all platforms
        (contentContainer.style as any).webkitOverflowScrolling = 'touch';
        contentContainer.style.scrollBehavior = 'smooth';
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
        const unlockables = ['battery', 'sniper', 'minigun', 'laser', 'tesla', 'slowfield', 'radar', 'missile', 'repairhub'];
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
            border: 'none', borderRadius: '3px', fontWeight: 'bold', width: '90px', fontSize: '12px',
            boxSizing: 'border-box'
        });

        // Кнопка рекламы
        const adBtn = document.createElement('button');
        adBtn.innerText = `🎬 ${this.t('ad_free')}`;
        Object.assign(adBtn.style, {
            cursor: 'pointer', padding: '4px 12px', background: '#e67e22', color: 'white',
            border: 'none', borderRadius: '3px', fontWeight: 'bold', width: '90px', fontSize: '10px',
            boxSizing: 'border-box'
        });

        // In-app purchase button (portal currency)
        const iapBtn = document.createElement('button');
        iapBtn.innerText = '💎 BUY';
        Object.assign(iapBtn.style, {
            cursor: 'pointer', padding: '4px 12px', background: '#8e44ad', color: 'white',
            border: 'none', borderRadius: '3px', fontWeight: 'bold', width: '90px', fontSize: '10px',
            boxSizing: 'border-box'
        });

        const cost = (GameConfig.BUILDINGS as any)[type].researchCost || 100;
        const toolName = this.t(`tool_${type}`);

        const updateState = () => {
            const isUnlocked = this.isBuildingUnlocked(type);

            if (isUnlocked) {
                btn.innerText = this.t('unlocked');
                btn.disabled = true;
                btn.style.background = '#27ae60';
                info.style.opacity = '0.5';
                adBtn.style.display = 'none'; // Скрываем рекламу, если куплено
                iapBtn.style.display = 'none';
            } else {
                btn.innerText = `${cost} 🧬`;
                btn.disabled = false;
                btn.style.background = '#3498db';
                info.style.opacity = '1';
                adBtn.style.display = 'block';
                iapBtn.style.display = 'block';
            }

            const descKey = `tool_${type}_desc`;
            const desc = this.t(descKey) !== descKey ? this.t(descKey) : '';
            info.innerHTML = `<div style="font-size: 14px; font-weight: bold;">${toolName}</div>
                              <div style="font-size: 11px; color: #aaa;">${desc || this.t('tech_tier_1')}</div>`;
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
            yaSdk.showRewardedVideo(
                () => { doUnlock(); },
                () => { if (this.onPauseRequest) this.onPauseRequest(); },
                () => { if (this.onResumeRequest) this.onResumeRequest(); }
            );
        };

        iapBtn.onclick = async () => {
            if (this.onPauseRequest) this.onPauseRequest();
            try {
                const productId = `tech${type}`;
                const purchase = await yaSdk.purchaseProduct(productId);
                if (purchase.success) {
                    doUnlock();
                    if (purchase.purchaseToken) {
                        await yaSdk.consumePurchase(purchase.purchaseToken);
                    }
                }
            } finally {
                if (this.onResumeRequest) this.onResumeRequest();
            }
        };

        updateState();
        wrapper.appendChild(info);
        wrapper.appendChild(btnContainer);
        btnContainer.appendChild(btn);
        btnContainer.appendChild(iapBtn);
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
            const cost = Math.floor(50 * Math.pow(1.5, lvl)); // Exponential scaling

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
            const cost = Math.floor(50 * Math.pow(1.5, lvl)); // Exponential scaling
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
