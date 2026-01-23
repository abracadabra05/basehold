import type { BuildingType } from './Building';
import { Icons } from './Icons';
import { Translations, type Language } from './Localization';
import { yaSdk } from './YandexSDK';
import { Z_INDEX, TOUCH_SIZES, COLORS } from './UIConstants';

export type ToolType = BuildingType | 'repair' | 'demolish';

interface ToolItem {
    type: ToolType;
    key: string; 
    icon: string;
    cost?: number;
    color?: string;
    minWave?: number;
}

export class UIManager {
    private onSelect: (type: ToolType) => void;
    public onDeselect?: () => void; // Вызывается когда инструмент деактивирован
    
    private container: HTMLDivElement;
    private infoPanel: HTMLDivElement;
    private hudPlayer: HTMLDivElement;
    private hudCore: HTMLDivElement;
    private hudTime: HTMLDivElement;
    private mainMenu: HTMLDivElement;
    
    private buttons: Map<ToolType, HTMLButtonElement> = new Map();
    private isPaused: boolean = false;
    private isMobile: boolean = false;
    public isSettingsOpen: boolean = false; // Добавлено
    private currentTool: ToolType | null = 'wall'; // Текущий выбранный инструмент (null = ничего)

    private lang: Language = 'en';
    private showTutorialFlag: boolean = true;

    public onStartGame?: (skipTutorial: boolean) => void;
    public onLanguageChange?: (lang: Language) => void;
    public checkUnlock?: (type: string) => boolean; 
    public onRevive?: () => void; 
    public onRestart?: () => void;
    public onPause?: () => void; // Добавлено
    public onResume?: () => void; // Добавлено
    public onMute?: (muted: boolean) => void; // Добавлено
    public onShowLocked?: () => void; // Показать сообщение "заблокировано"
    
    private items: ToolItem[] = [
        { type: 'wall', key: 'tool_wall', icon: '🧱', cost: 10 },
        { type: 'drill', key: 'tool_drill', icon: '⛏️', cost: 50 },
        { type: 'generator', key: 'tool_generator', icon: '⚡', cost: 100 },
        { type: 'battery', key: 'tool_battery', icon: '🔋', cost: 150 },
        { type: 'turret', key: 'tool_turret', icon: '🔫', cost: 30 },
        { type: 'sniper', key: 'tool_sniper', icon: '🎯', cost: 75 },
        { type: 'minigun', key: 'tool_minigun', icon: '🌪️', cost: 120 },
        { type: 'laser', key: 'tool_laser', icon: '🔥', cost: 200 },
        { type: 'repair', key: 'tool_repair', icon: '🔧', color: '#f1c40f' },
        { type: 'demolish', key: 'tool_remove', icon: '❌', color: '#e74c3c' },
    ];

    constructor(onSelect: (type: ToolType) => void) {
        this.onSelect = onSelect;
        this.detectPlatform();
        this.lang = yaSdk.lang;
        
        this.mainMenu = this.createMainMenu();
        document.body.appendChild(this.mainMenu);

        this.container = document.createElement('div');
        this.initToolbarStyles();
        
        this.infoPanel = document.createElement('div');
        this.initInfoStyles();

        this.hudPlayer = document.createElement('div');
        this.initPlayerHUD();

        this.hudCore = document.createElement('div');
        this.initCoreHUD();

        this.hudTime = document.createElement('div');
        this.initTimeHUD();

        // createButtons перенесен в init
        // this.createButtons(); 
        // this.highlightButton('wall');
    }

    public get currentLang(): Language { return this.lang; }

    private t(key: string): string {
        return (Translations[this.lang] as any)[key] || key;
    }

    private detectPlatform() {
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || ('ontouchstart' in window);
    }

    public init() {
        this.createButtons();
        this.currentTool = 'wall'; // Инициализируем текущий инструмент
        this.highlightButton('wall');
        this.showGameHUD();
    }

    public showGameHUD() {
        document.body.appendChild(this.container);
        document.body.appendChild(this.infoPanel);
        document.body.appendChild(this.hudPlayer);
        document.body.appendChild(this.hudCore);
        // hudTime удалён - иконка времени не отображается

        // Settings button - below minimap on mobile, bottom right on desktop
        const inGameSettings = document.createElement('button');
        inGameSettings.id = 'ingame-settings-btn';
        inGameSettings.innerHTML = '⚙️';
        const minimapSize = this.isMobile ? 80 : 100;

        Object.assign(inGameSettings.style, {
            position: 'absolute',
            top: this.isMobile ? `${10 + minimapSize + 5}px` : 'auto',
            bottom: this.isMobile ? 'auto' : '20px',
            right: '10px',
            width: '36px',
            height: '36px',
            background: 'rgba(0,0,0,0.6)',
            border: `1px solid ${COLORS.PANEL_BORDER}`,
            borderRadius: '50%',
            color: 'white',
            fontSize: '18px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: `${Z_INDEX.SETTINGS_BUTTON}`,
            touchAction: 'manipulation'
        });
        inGameSettings.onclick = () => this.showSettings();
        inGameSettings.ontouchstart = (e) => { e.preventDefault(); this.showSettings(); };
        document.body.appendChild(inGameSettings);

        this.updateWave(1);
    }

    public hideMenu() {
        this.mainMenu.style.display = 'none';
    }

    public showMenu() {
        this.mainMenu.style.display = 'flex';
        // Скрываем HUD, если он был виден (хотя он не мешает под меню, но лучше скрыть)
        // this.container.style.display = 'none'; 
        // Или просто пусть меню перекрывает все (z-index 9999).
        this.updateMainMenuContent(this.mainMenu); // Обновляем контент (лидерборд и т.д.)
    }

    public resize() {
        this.detectPlatform();
    }

    public showGameOver(canRevive: boolean = true) {
        const overlay = document.createElement('div');
        Object.assign(overlay.style, {
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.7)', zIndex: 10001,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontFamily: "'Segoe UI', sans-serif",
            backdropFilter: 'blur(10px)', 
            opacity: '0', transition: 'opacity 1s ease-in'
        });
        
        overlay.innerHTML = `
            <div style="text-align: center; transform: translateY(-20px);">
                <h1 style="font-size: 80px; color: #e74c3c; margin: 0 0 40px 0; text-transform: uppercase; letter-spacing: 15px; font-weight: 900; text-shadow: 0 0 30px rgba(231, 76, 60, 0.5);">${this.t('game_over')}</h1>
                <div style="display: flex; gap: 20px; justify-content: center;">
                    ${canRevive ? `<button id="revive-btn" style="padding: 18px 40px; font-size: 20px; cursor: pointer; background: #e67e22; color: white; border: none; border-radius: 4px; text-transform: uppercase; letter-spacing: 2px; font-weight: bold; transition: all 0.3s;">🎬 ${this.t('revive')}</button>` : ''}
                    <button id="restart-btn" style="padding: 18px 40px; font-size: 20px; cursor: pointer; background: transparent; color: #3498db; border: 2px solid #3498db; border-radius: 4px; text-transform: uppercase; letter-spacing: 2px; font-weight: bold; transition: all 0.3s;">${this.t('restart')}</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        setTimeout(() => overlay.style.opacity = '1', 10);

        const reviveBtn = overlay.querySelector('#revive-btn') as HTMLButtonElement | null;
        const restartBtn = overlay.querySelector('#restart-btn') as HTMLButtonElement;

        if (reviveBtn) {
            reviveBtn.onclick = (e) => {
                e.preventDefault(); e.stopPropagation();
                yaSdk.showRewardedVideo(() => {
                    document.body.removeChild(overlay);
                    if (this.onRevive) this.onRevive();
                });
            };
        }

        restartBtn.onclick = (e) => {
            e.preventDefault(); e.stopPropagation();
            document.body.removeChild(overlay);
            if (this.onRestart) this.onRestart();
        };
    }

    public showTutorial(onComplete: () => void) {
        const steps = this.isMobile ? [
            { text: this.t('tut_move_mobile'), icon: "🕹️" },
            { text: this.t('tut_shoot_mobile'), icon: "🎯" },
            { text: this.t('tut_mine_mobile'), icon: "⛏️" },
            { text: this.t('tut_build'), icon: "🧱" },
        ] : [
            { text: this.t('tut_move'), icon: "🏃" },
            { text: this.t('tut_shoot'), icon: "🔫" },
            { text: this.t('tut_build'), icon: "🧱" },
            { text: this.t('tut_core'), icon: "💎" },
        ];
        
        let stepIndex = 0;
        const overlay = document.createElement('div');
        Object.assign(overlay.style, {
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.85)', zIndex: 10000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(8px)'
        });

        const box = document.createElement('div');
        Object.assign(box.style, {
            background: '#1e272e', padding: '30px', borderRadius: '12px',
            color: 'white', maxWidth: '400px', width: '80%', textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)', border: '1px solid #3498db',
            fontFamily: "'Segoe UI', sans-serif"
        });
        overlay.appendChild(box);

        const content = document.createElement('div');
        content.style.fontSize = '20px';
        content.style.marginBottom = '25px';
        content.style.lineHeight = '1.4';
        box.appendChild(content);

        const btn = document.createElement('button');
        Object.assign(btn.style, {
            padding: '12px 40px', fontSize: '18px', cursor: 'pointer',
            background: '#3498db', color: 'white', border: 'none', borderRadius: '4px',
            fontWeight: 'bold', textTransform: 'uppercase'
        });
        box.appendChild(btn);

        const showStep = () => {
            if (stepIndex >= steps.length) {
                document.body.removeChild(overlay);
                onComplete();
                return;
            }
            const s = steps[stepIndex];
            content.innerHTML = `<div style="font-size: 60px; margin-bottom: 15px;">${s.icon}</div>${s.text}`;
            btn.innerText = stepIndex === steps.length - 1 ? this.t('tut_play') : this.t('tut_next');
        };

        btn.onclick = () => { stepIndex++; showStep(); };
        showStep();
        document.body.appendChild(overlay);
    }

    private createMainMenu(): HTMLDivElement {
        const div = document.createElement('div');
        div.id = 'main-menu';
        Object.assign(div.style, {
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: '#0a0a0a', zIndex: 9999,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontFamily: "'Segoe UI', sans-serif"
        });

        this.updateMainMenuContent(div);
        return div;
    }

    private updateMainMenuContent(div: HTMLDivElement) {
        const titleSize = this.isMobile ? '40px' : '70px'; // Чуть меньше для ПК
        const subSize = this.isMobile ? '12px' : '16px';
        const gap = this.isMobile ? '15px' : '30px';
        
        div.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; width: 100%; z-index: 10;">
                <h1 style="font-size: ${titleSize}; color: #3498db; margin: 0; text-transform: uppercase; letter-spacing: 5px; font-weight: 900; text-shadow: 0 4px 10px rgba(0,0,0,0.5);">${this.t('game_title')}</h1>
                <p style="color: #aaa; margin-bottom: ${gap}; font-size: ${subSize}; letter-spacing: 2px;">${this.t('subtitle')}</p>
                
                <button id="start-btn" style="padding: ${this.isMobile ? '12px 40px' : '16px 50px'}; font-size: ${this.isMobile ? '18px' : '22px'}; cursor: pointer; background: rgba(52, 152, 219, 0.15); color: #3498db; border: 2px solid #3498db; borderRadius: 4px; text-transform: uppercase; letter-spacing: 3px; font-weight: bold; transition: all 0.2s; backdrop-filter: blur(4px);">
                    ${this.t('start')}
                </button>
            </div>

            <!-- ЛИДЕРБОРД (Виджет для ПК) -->
            ${!this.isMobile ? `
            <div id="main-leaderboard" style="position: absolute; top: 50%; right: 20px; transform: translateY(-50%); width: 220px; background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(5px);">
                <h4 style="margin: 0 0 10px 0; color: #f1c40f; text-align: center; text-transform: uppercase; font-size: 14px;">🏆 ${this.t('leaderboard')}</h4>
                <div id="lb-list" style="font-size: 12px; min-height: 80px;">Loading...</div>
            </div>` : ''}

            <!-- КНОПКИ (Настройки, Фуллскрин) - ВЕРНУЛИ ВНИЗ -->
            <div style="position: absolute; bottom: 20px; right: 20px; display: flex; gap: 15px; z-index: 20;">
                ${this.isMobile ? `<button id="mob-lb-btn" style="background: none; border: none; font-size: 28px; cursor: pointer;">🏆</button>` : ''}
                ${(window.self === window.top || this.isMobile) ? `<button id="fullscreen-btn" style="background: none; border: none; font-size: 28px; cursor: pointer; opacity: 0.7; color: white;">⛶</button>` : ''}
                <button id="settings-btn" style="background: none; border: none; font-size: 28px; cursor: pointer; opacity: 0.7; color: white;">⚙️</button>
            </div>
        `;

        const startBtn = div.querySelector('#start-btn') as HTMLButtonElement;
        const bindBtn = (btn: HTMLElement | null, action: () => void) => {
            if (!btn) return;
            const handler = (e: Event) => {
                e.preventDefault();
                e.stopPropagation();
                action();
            };
            btn.onclick = handler;
            btn.ontouchstart = handler;
        };

        bindBtn(startBtn, () => {
            div.style.display = 'none';
            if (this.onStartGame) this.onStartGame(!this.showTutorialFlag);
        });

        bindBtn(div.querySelector('#settings-btn'), () => this.showSettings());
        bindBtn(div.querySelector('#fullscreen-btn'), () => this.toggleFullscreen());
        bindBtn(div.querySelector('#mob-lb-btn'), () => this.showLeaderboardModal());
        
        // Загружаем виджет только на ПК
        if (!this.isMobile) {
            this.loadEmbeddedLeaderboard(div.querySelector('#lb-list') as HTMLElement);
        }
    }
    
    // Метод для модального окна лидерборда (мобилки)
    private async showLeaderboardModal() {
        const overlay = document.createElement('div');
        Object.assign(overlay.style, {
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.85)', zIndex: 10005,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontFamily: "'Segoe UI', sans-serif", backdropFilter: 'blur(5px)'
        });
        overlay.innerHTML = `<div style="font-size: 20px;">Loading...</div>`;
        document.body.appendChild(overlay);
        
        const entries = await yaSdk.getLeaderboardEntries();
        let listHtml = '';
        entries.forEach(e => {
            listHtml += `<div style="display: flex; justify-content: space-between; width: 100%; padding: 8px; border-bottom: 1px solid #444; font-size: 14px;">
                <span style="color: #f1c40f;">#${e.rank}</span>
                <span style="flex: 1; text-align: left; margin-left: 10px;">${e.player.name}</span>
                <span style="color: #3498db;">${e.score}</span>
            </div>`;
        });

        overlay.innerHTML = `
            <div style="background: #1e272e; padding: 20px; borderRadius: 12px; width: 85%; max-width: 350px; text-align: center; border: 1px solid #444;">
                <h3 style="margin-top: 0; color: #f1c40f;">🏆 ${this.t('leaderboard')}</h3>
                <div style="max-height: 60vh; overflow-y: auto; margin-bottom: 15px;">
                    ${listHtml || `<div style="color: #777;">${this.t('leaderboard_empty')}</div>`}
                </div>
                <button id="close-lb" style="padding: 10px 30px; background: #3498db; border: none; color: white; borderRadius: 4px; cursor: pointer;">OK</button>
            </div>
        `;
        overlay.querySelector('#close-lb')?.addEventListener('click', () => document.body.removeChild(overlay));
    }

    private toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.warn(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }

    private async loadEmbeddedLeaderboard(container: HTMLElement) {
        if (!container) return;
        const entries = await yaSdk.getLeaderboardEntries(5);
        let listHtml = '';
        entries.forEach(e => {
            listHtml += `<div style="display: flex; justify-content: space-between; width: 100%; margin-bottom: 5px;">
                <span style="color: #f1c40f;">#${e.rank}</span>
                <span style="flex: 1; text-align: left; margin-left: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${e.player.name}</span>
                <span style="color: #3498db;">${e.score}</span>
            </div>`;
        });
        container.innerHTML = listHtml || `<div style="color: #777; text-align: center;">${this.t('leaderboard_empty')}</div>`;
    }

    private showSettings() {
        this.isSettingsOpen = true;
        if (this.onPause) this.onPause();

        const overlay = document.createElement('div');
        Object.assign(overlay.style, {
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.85)', zIndex: 10005,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontFamily: "'Segoe UI', sans-serif"
        });
        
        overlay.innerHTML = `
            <div style="background: rgba(30,39,46,0.95); padding: 25px 35px; border-radius: 12px; border: 1px solid #3498db; min-width: 280px;">
                <h2 style="margin: 0 0 20px 0; text-align: center; color: #3498db; font-size: 22px; text-transform: uppercase; letter-spacing: 2px;">${this.t('settings_title')}</h2>

                <div style="margin-bottom: 20px;">
                    <div style="display: flex; gap: 10px; justify-content: center;">
                        <button id="set-en" style="padding: 8px 16px; cursor: pointer; background: ${this.lang==='en'?'#3498db':'rgba(51,51,51,0.8)'}; border: 2px solid ${this.lang==='en'?'#3498db':'#555'}; border-radius: 8px; transition: all 0.2s; transform: ${this.lang==='en'?'scale(1.1)':'scale(1)'};">
                            <svg width="32" height="20" viewBox="0 0 32 20"><rect width="32" height="20" fill="#fff"/><rect width="32" height="1.54" y="0" fill="#B22234"/><rect width="32" height="1.54" y="3.08" fill="#B22234"/><rect width="32" height="1.54" y="6.16" fill="#B22234"/><rect width="32" height="1.54" y="9.24" fill="#B22234"/><rect width="32" height="1.54" y="12.32" fill="#B22234"/><rect width="32" height="1.54" y="15.4" fill="#B22234"/><rect width="32" height="1.54" y="18.46" fill="#B22234"/><rect width="12.8" height="10.8" fill="#3C3B6E"/></svg>
                        </button>
                        <button id="set-ru" style="padding: 8px 16px; cursor: pointer; background: ${this.lang==='ru'?'#3498db':'rgba(51,51,51,0.8)'}; border: 2px solid ${this.lang==='ru'?'#3498db':'#555'}; border-radius: 8px; transition: all 0.2s; transform: ${this.lang==='ru'?'scale(1.1)':'scale(1)'};">
                            <svg width="32" height="20" viewBox="0 0 32 20"><rect width="32" height="6.67" y="0" fill="#fff"/><rect width="32" height="6.67" y="6.67" fill="#0039A6"/><rect width="32" height="6.67" y="13.33" fill="#D52B1E"/></svg>
                        </button>
                    </div>
                </div>

                <div style="border-top: 1px solid #444; padding-top: 15px; margin-bottom: 15px;">
                    <label style="display: flex; align-items: center; gap: 12px; cursor: pointer; font-size: 16px; margin-bottom: 12px; padding: 8px; border-radius: 6px; background: rgba(255,255,255,0.05);">
                        <input type="checkbox" id="set-tut" ${this.showTutorialFlag ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: #3498db;">
                        <span>${this.t('tutorial_toggle')}</span>
                    </label>

                    <label style="display: flex; align-items: center; gap: 12px; cursor: pointer; font-size: 16px; padding: 8px; border-radius: 6px; background: rgba(255,255,255,0.05);">
                        <input type="checkbox" id="set-sound" checked style="width: 18px; height: 18px; accent-color: #3498db;">
                        <span>${this.t('settings_sound')}</span>
                        <span style="margin-left: auto;">🔊</span>
                    </label>
                </div>

                <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 20px;">
                    <button id="set-exit" style="padding: 12px; background: #c0392b; border: none; color: white; border-radius: 6px; cursor: pointer; font-weight: bold; display: none; transition: all 0.2s;">${this.t('settings_exit')}</button>
                    <button id="set-close" style="padding: 12px; background: #27ae60; border: none; color: white; border-radius: 6px; cursor: pointer; font-weight: bold; transition: all 0.2s;">OK</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Показываем кнопку выхода только если игра идет (меню скрыто)
        const exitBtn = overlay.querySelector('#set-exit') as HTMLButtonElement;
        if (this.mainMenu.style.display === 'none') {
            exitBtn.style.display = 'block';
        }
        
        exitBtn.onclick = () => {
            document.body.removeChild(overlay);
            this.isSettingsOpen = false;
            if (this.onRestart) this.onRestart(); // Используем рестарт для выхода в меню
        };

        overlay.querySelector('#set-en')?.addEventListener('click', () => { this.lang = 'en'; this.refreshUI(); document.body.removeChild(overlay); this.showSettings(); });
        overlay.querySelector('#set-ru')?.addEventListener('click', () => { this.lang = 'ru'; this.refreshUI(); document.body.removeChild(overlay); this.showSettings(); });
        
        overlay.querySelector('#set-tut')?.addEventListener('change', (e: any) => { this.showTutorialFlag = e.target.checked; });
        
        const soundCheckbox = overlay.querySelector('#set-sound') as HTMLInputElement;
        // Здесь нужно получить текущее состояние звука, но мы не знаем его.
        // Пока оставим checked по умолчанию, но лучше передавать состояние в showSettings.
        // Для простоты будем считать, что звук включен, если не выключен.
        
        soundCheckbox.addEventListener('change', (e: any) => { 
            if (this.onMute) this.onMute(!e.target.checked); 
        });

        overlay.querySelector('#set-close')?.addEventListener('click', () => {
            document.body.removeChild(overlay);
            this.isSettingsOpen = false;
            if (this.onResume) this.onResume();
        });
    }

    private refreshUI() {
        this.updateMainMenuContent(this.mainMenu);
        this.createButtons(); 
        this.initCoreHUD(); 
        this.initPlayerHUD();
        this.updateButtonsState(); 
        if (this.onLanguageChange) this.onLanguageChange(this.lang);
    }

    public setPaused(paused: boolean) {
        this.isPaused = paused;
        const opacity = paused ? '0.3' : '1.0';
        this.container.style.opacity = opacity;
        this.hudPlayer.style.opacity = opacity;
        this.container.style.pointerEvents = paused ? 'none' : 'auto';
    }

    public updateHUD(player: {hp: number, maxHp: number}, core: {hp: number, maxHp: number} | null) {
        const pHpPct = Math.max(0, (player.hp / player.maxHp) * 100);
        const pBar = document.getElementById('hud-player-bar');
        const pText = document.getElementById('hud-player-text');
        if (pBar) pBar.style.width = `${pHpPct}%`;
        if (pText) pText.innerText = `${Math.ceil(player.hp)}`;

        if (core) {
            const cHpPct = Math.max(0, (core.hp / core.maxHp) * 100);
            const cBar = document.getElementById('hud-core-bar');
            if (cBar) cBar.style.width = `${cHpPct}%`;
        }
    }

    public updateTime(progress: number) {
        const sky = document.getElementById('hud-time-sky');
        if (sky) sky.style.transform = `rotate(${progress * 360}deg)`;
    }
    
    public updateScore(score: number) {
        const el = document.getElementById('hud-score');
        if (el) el.innerText = `${score}`;
    }

    public updateButtonsState() {
        this.items.forEach(item => {
            const btn = this.buttons.get(item.type);
            if (!btn) return;

            let locked = false;
            if (this.checkUnlock && !this.checkUnlock(item.type)) {
                // repair и demolish НИКОГДА не блокируются
                if (item.type !== 'demolish' && item.type !== 'repair') locked = true;
            }

            if (locked) {
                btn.disabled = true;
                btn.style.opacity = '0.3';
                btn.style.filter = 'grayscale(1)';
                if (!btn.querySelector('.lock-icon')) {
                    const lock = document.createElement('div');
                    lock.className = 'lock-icon';
                    lock.innerText = '🔒';
                    Object.assign(lock.style, {
                        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                        fontSize: '24px', textShadow: '0 0 5px black'
                    });
                    btn.appendChild(lock);
                }
            } else {
                btn.disabled = false;
                btn.style.opacity = '1.0';
                btn.style.filter = 'none';
                const lock = btn.querySelector('.lock-icon');
                if (lock) lock.remove();
            }
        });
    }

    public updateWave(_wave: number) {
        this.updateButtonsState();
    }

    public showBuildingInfo(data: { name: string, hp: number, maxHp: number, damage?: number, energy?: string } | null) {
        if (!data) {
            this.infoPanel.style.display = 'none';
            return;
        }
        this.infoPanel.style.display = 'block';
        
        let displayName = data.name;
        const tool = this.items.find(i => i.type.toLowerCase() === data.name.toLowerCase());
        if (tool) displayName = this.t(tool.key);

        let html = `<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <b style="color: #3498db; font-size: 12px; text-transform: uppercase;">${displayName}</b>
            <span style="font-size: 10px; color: #aaa;">${Math.floor(data.hp)}/${data.maxHp}</span>
        </div>`;
        
        const hpPct = (data.hp / data.maxHp) * 100;
        const hpColor = hpPct > 50 ? '#2ecc71' : hpPct > 25 ? '#f1c40f' : '#e74c3c';
        
        html += `<div style="width: 100%; height: 3px; background: #222; margin-bottom: 6px; border-radius: 1px;">
            <div style="width: ${hpPct}%; height: 100%; background: ${hpColor}; border-radius: 1px;"></div>
        </div>`;
        
        html += `<div style="display: flex; gap: 8px; font-size: 10px;">`;
        if (data.damage) html += `<span>⚔️ <span style="color: #e74c3c">${data.damage}</span></span>`;
        if (data.energy) html += `<span>⚡ <span style="color: #f1c40f">${data.energy}</span></span>`;
        html += `</div>`;
        
        this.infoPanel.innerHTML = html;
    }

    private applyPanelStyle(el: HTMLElement) {
        el.style.background = 'rgba(15, 15, 15, 0.95)';
        el.style.border = '1px solid #333';
        el.style.borderRadius = '4px';
        el.style.color = 'white';
        el.style.fontFamily = "'Segoe UI', sans-serif";
        el.style.pointerEvents = 'none';
        el.style.zIndex = '1000';
    }

    private initTimeHUD() {
        // Time indicator - REMOVED (hidden on all devices)
        this.hudTime.style.display = 'none';
    }

    private initCoreHUD() {
        this.hudCore.id = 'hud-core-container';
        const barWidth = this.isMobile ? '120px' : '180px';

        Object.assign(this.hudCore.style, {
            position: 'absolute',
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: this.isMobile ? '5px' : '8px',
            padding: this.isMobile ? '5px 8px' : '6px 12px',
            background: 'rgba(0,0,0,0.6)',
            borderRadius: '16px',
            border: 'none',
            boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
            zIndex: `${Z_INDEX.HUD_PANELS}`
        });

        this.hudCore.innerHTML = `
            <span style="font-weight: bold; color: #00FFFF; font-size: ${this.isMobile ? '10px' : '12px'}; white-space: nowrap;">${this.t('hud_core_short')}</span>
            <div style="width: ${barWidth}; height: 6px; background: #222; border-radius: 3px; overflow: hidden; border: 1px solid #333;">
                <div id="hud-core-bar" style="width: 100%; height: 100%; background-color: #00FFFF; transition: width 0.3s ease-out;"></div>
            </div>
        `;
    }

    private initPlayerHUD() {
        // Fixed width for both platforms - increased for longer text
        const width = '170px';

        Object.assign(this.hudPlayer.style, {
            position: 'absolute',
            top: '10px',
            left: '10px',
            width: width,
            fontSize: this.isMobile ? '10px' : '11px',
            boxSizing: 'border-box',
            padding: '8px',
            zIndex: `${Z_INDEX.HUD_PANELS}`,
            background: 'rgba(0,0,0,0.6)',
            border: `1px solid ${COLORS.PANEL_BORDER}`,
            borderRadius: '6px',
            color: 'white',
            fontFamily: "'Segoe UI', sans-serif",
            pointerEvents: 'none'
        });

        this.hudPlayer.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 10px; color: #aaa; font-weight: bold;">
                <span>${this.t('hud_hp')}</span>
                <span id="hud-player-text">100</span>
            </div>
            <div style="width: 100%; height: 5px; background: #222; border-radius: 3px; overflow: hidden; margin-bottom: 5px;">
                <div id="hud-player-bar" style="width: 100%; height: 100%; background: ${COLORS.SUCCESS}; transition: width 0.3s;"></div>
            </div>
            <div style="font-size: ${this.isMobile ? '11px' : '12px'}; font-weight: bold; color: ${COLORS.WARNING}; text-align: center;">
                <span id="hud-score">0</span> 🏆
            </div>
        `;
    }

    private initToolbarStyles() {
        // Safe area padding for notched devices
        const bottomPadding = this.isMobile ? '20px' : '25px';

        Object.assign(this.container.style, {
            position: 'absolute',
            bottom: `calc(${bottomPadding} + env(safe-area-inset-bottom, 0px))`,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: this.isMobile ? '4px' : '6px',
            padding: this.isMobile ? '6px' : '10px',
            background: 'transparent',
            border: 'none',
            pointerEvents: 'auto',
            zIndex: `${Z_INDEX.TOOLBAR}`,
            maxWidth: '95vw',
            flexWrap: 'nowrap',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch'
        });

        // Hide scrollbar but allow scrolling
        this.container.style.scrollbarWidth = 'none';
        (this.container.style as any).msOverflowStyle = 'none';
    }

    private initInfoStyles() {
        this.infoPanel.style.position = 'fixed';
        this.infoPanel.style.bottom = '140px'; 
        this.infoPanel.style.left = '50%';
        this.infoPanel.style.transform = 'translateX(-50%)';
        this.applyPanelStyle(this.infoPanel);
        this.infoPanel.style.padding = '8px 12px';
        this.infoPanel.style.display = 'none';
        this.infoPanel.style.minWidth = '120px';
        this.infoPanel.style.background = 'rgba(10, 10, 10, 0.5)'; 
        this.infoPanel.style.backdropFilter = 'blur(6px)'; 
        this.infoPanel.style.zIndex = '1000';
    }

    private createButtons() {
        this.container.innerHTML = '';
        // Minimum 44px for touch-friendly buttons (Apple HIG)
        const btnSize = this.isMobile ? `${TOUCH_SIZES.MIN_BUTTON}px` : '50px';
        const iconSize = this.isMobile ? '18px' : '20px';
        const costFontSize = this.isMobile ? '8px' : '9px';

        this.items.forEach((item, index) => {
            const btn = document.createElement('button');
            const costHtml = item.cost ? `<div style="font-size: ${costFontSize}; opacity: 0.8; display: flex; align-items: center; gap: 2px;">${Icons.METAL.replace('width="24"', 'width="10"').replace('height="24"', 'height="10"')} ${item.cost}</div>` : '';

            const hotkeyHtml = !this.isMobile && index < 9 ?
                `<div style="position: absolute; top: 2px; right: 4px; font-size: 10px; color: #aaa; font-weight: bold;">${index + 1}</div>` : '';

            btn.innerHTML = `${hotkeyHtml}<div style="font-size: ${iconSize};">${item.icon}</div>${costHtml}`;
            btn.title = this.t(item.key);

            Object.assign(btn.style, {
                width: btnSize,
                height: btnSize,
                minWidth: btnSize,
                minHeight: btnSize,
                cursor: 'pointer',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                background: this.isMobile ? COLORS.PANEL_BG_MOBILE : 'rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.1s',
                position: 'relative',
                backdropFilter: 'blur(4px)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
            });

            if (item.color) btn.style.borderColor = item.color;
            btn.dataset.type = item.type;

            // Привязываем обработчики напрямую к каждой кнопке
            const handleButtonClick = (e: Event) => {
                e.preventDefault();
                e.stopPropagation();

                if (this.isPaused) return;

                const type = item.type;
                const buttonEl = this.buttons.get(type);

                // Проверяем, заблокирован ли инструмент (repair и demolish НИКОГДА не блокируются)
                if (buttonEl?.disabled && type !== 'demolish' && type !== 'repair') {
                    if (this.onShowLocked) this.onShowLocked();
                    return;
                }

                // Переключение: если нажали на уже выбранный инструмент - деактивируем (ничего в руках)
                if (this.currentTool === type) {
                    this.currentTool = null;
                    if (this.onDeselect) this.onDeselect(); // Отключаем инструмент в BuildingSystem
                    this.highlightButton(null); // Снимаем выделение со всех кнопок
                } else {
                    this.currentTool = type;
                    this.onSelect(type);
                    this.highlightButton(type);
                }
            };

            btn.addEventListener('click', handleButtonClick);
            btn.addEventListener('touchend', handleButtonClick, { passive: false });

            this.container.appendChild(btn);
            this.buttons.set(item.type, btn);
        });

        this.updateButtonsState(); 
    }

    public selectByIndex(index: number) {
        if (index >= 0 && index < this.items.length) {
            const type = this.items[index].type;
            const btn = this.buttons.get(type);

            // Проверяем, заблокирован ли инструмент (repair и demolish НИКОГДА не блокируются)
            if (btn?.disabled && type !== 'demolish' && type !== 'repair') {
                if (this.onShowLocked) this.onShowLocked();
                return;
            }

            // Переключение: если нажали на уже выбранный - деактивируем (ничего в руках)
            if (this.currentTool === type) {
                this.currentTool = null;
                if (this.onDeselect) this.onDeselect();
                this.highlightButton(null);
            } else {
                this.currentTool = type;
                this.onSelect(type);
                this.highlightButton(type);
            }
        }
    }

    private highlightButton(type: ToolType | null) {
        // Сначала снимаем выделение со всех кнопок
        this.buttons.forEach((btn, t) => {
            btn.classList.remove('active');
            const item = this.items.find(i => i.type === t);
            btn.style.background = 'transparent';
            btn.style.borderColor = item?.color || '#444';
            btn.style.transform = 'scale(1)';
        });

        // Если type === null, ничего не выделяем (ничего в руках)
        if (type === null) return;

        const activeBtn = this.buttons.get(type);
        if (activeBtn) {
            activeBtn.classList.add('active');
            activeBtn.style.background = 'rgba(52, 152, 219, 0.2)';
            activeBtn.style.borderColor = '#3498db';
            activeBtn.style.transform = 'scale(1.1)';
        }
    }
}
