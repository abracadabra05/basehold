import { Translations, type Language } from './Localization';
import { Z_INDEX, COLORS, BREAKPOINTS } from './UIConstants';

export class ResourceManager {
    private metal: number = 100;
    private biomass: number = 0;

    private energyProduced: number = 0;
    private energyConsumed: number = 0;
    public batteryCharge: number = 0;
    public batteryCapacity: number = 0;
    public isBlackout: boolean = false;

    private uiElement: HTMLElement;
    private lang: Language = 'en';

    constructor() {
        this.uiElement = document.createElement('div');

        const isMobile = window.innerWidth <= BREAKPOINTS.MOBILE;
        const width = isMobile ? '130px' : '180px';
        const top = isMobile ? '90px' : '100px';
        const fontSize = isMobile ? '10px' : '12px';

        Object.assign(this.uiElement.style, {
            position: 'absolute',
            top: `calc(${top}px + env(safe-area-inset-top, 0px))`,
            left: `calc(15px + env(safe-area-inset-left, 0px))`,
            padding: isMobile ? '8px' : '10px',
            background: isMobile ? COLORS.PANEL_BG_MOBILE : COLORS.PANEL_BG,
            border: `1px solid ${COLORS.PANEL_BORDER}`,
            borderRadius: '6px',
            color: COLORS.TEXT_PRIMARY,
            fontFamily: "'Segoe UI', sans-serif",
            fontSize: fontSize,
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            pointerEvents: 'none',
            width: width,
            boxSizing: 'border-box',
            lineHeight: '1.4',
            zIndex: `${Z_INDEX.HUD_PANELS}`
        });

        document.body.appendChild(this.uiElement);
        this.updateUI();
    }

    public reset() {
        this.metal = 100;
        this.biomass = 0;
        this.batteryCharge = 0;
        this.energyProduced = 0;
        this.energyConsumed = 0;
        this.isBlackout = false;
        this.updateUI();
    }

    public setLanguage(lang: Language) {
        this.lang = lang;
        this.updateUI();
    }

    private t(key: string): string {
        return (Translations[this.lang] as any)[key] || key;
    }

    public addMetal(amount: number) { this.metal += amount; this.updateUI(); }
    public addBiomass(amount: number) { this.biomass += amount; this.updateUI(); }
    
    public spendBiomass(amount: number): boolean {
        if (this.biomass >= amount) { this.biomass -= amount; this.updateUI(); return true; }
        return false;
    }

    public hasMetal(amount: number): boolean { return this.metal >= amount; }
    public spendMetal(amount: number) { if (this.metal >= amount) { this.metal -= amount; this.updateUI(); } }

    public consumeCharge(amount: number): boolean {
        if (this.batteryCharge >= amount) { this.batteryCharge -= amount; this.updateUI(); return true; }
        return false;
    }

    public setEnergyStats(produced: number, consumed: number, capacity: number) {
        this.energyProduced = produced; this.energyConsumed = consumed; this.batteryCapacity = capacity;
    }

    public updateBattery(dt: number) {
        const net = this.energyProduced - this.energyConsumed;
        this.batteryCharge += net * dt;
        if (this.batteryCharge > this.batteryCapacity) this.batteryCharge = this.batteryCapacity;
        if (this.batteryCharge <= 0) { this.batteryCharge = 0; this.isBlackout = true; } 
        else { this.isBlackout = false; }
        this.updateUI();
    }

    private updateUI() {
        const net = this.energyProduced - this.energyConsumed;
        let energyStatus = '';
        if (this.isBlackout) energyStatus = `<span style="color: #ff4757">${this.t('res_status_blackout')}</span>`;
        else if (net < 0) energyStatus = `<span style="color: #ffa502">${this.t('res_status_draining')}</span>`;
        else if (this.batteryCharge < this.batteryCapacity) energyStatus = `<span style="color: #2ecc71">${this.t('res_status_charging')}</span>`;
        else energyStatus = `<span style="color: #2ecc71">${this.t('res_status_charged')}</span>`;

        const chargePct = this.batteryCapacity > 0 ? Math.floor((this.batteryCharge / this.batteryCapacity) * 100) : 0;

        // Используем font-family: monospace для цифр, чтобы не прыгали
        this.uiElement.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="color: #aaa">🔩 ${this.t('res_metal')}</span>
                <span style="font-weight: bold; font-family: monospace;">${Math.floor(this.metal)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #aaa">🧬 ${this.t('res_biomass')}</span>
                <span style="font-weight: bold; font-family: monospace;">${Math.floor(this.biomass)}</span>
            </div>
            <div style="border-top: 1px solid #333; padding-top: 8px;">
                <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px;">
                    <span style="color: #3498db; font-weight: bold;">${this.t('res_energy')}</span>
                    <span style="font-family: monospace;">${Math.floor(this.energyConsumed)} / ${Math.floor(this.energyProduced)}</span>
                </div>
                <div style="width: 100%; background: #222; height: 6px; border-radius: 3px; margin-bottom: 4px; overflow: hidden; border: 1px solid #333;">
                    <div style="width: ${chargePct}%; background: #3498db; height: 100%; transition: width 0.3s;"></div>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 11px;">
                    <span style="color: #aaa">${this.t('res_battery')}: <span style="font-family: monospace;">${Math.floor(this.batteryCharge)}</span></span>
                    <span style="font-weight: bold;">${energyStatus}</span>
                </div>
            </div>
        `;
    }
}