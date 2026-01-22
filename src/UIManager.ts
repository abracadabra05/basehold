import type { BuildingType } from './Building';
import { Icons } from './Icons';
import { Translations, type Language } from './Localization';
import { yaSdk } from './YandexSDK';

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
        this.highlightButton('wall');
        this.showGameHUD();
    }

    public showGameHUD() {
        document.body.appendChild(this.container);
        document.body.appendChild(this.infoPanel);
        document.body.appendChild(this.hudPlayer);
        document.body.appendChild(this.hudCore);
        document.body.appendChild(this.hudTime);
        
        // Кнопка настроек в игре
        const inGameSettings = document.createElement('button');
        inGameSettings.innerHTML = '⚙️';
        Object.assign(inGameSettings.style, {
            position: 'absolute', top: '20px', right: '20px',
            background: 'rgba(0,0,0,0.5)', border: '1px solid #444', borderRadius: '4px',
            color: 'white', fontSize: '24px', cursor: 'pointer', padding: '5px 10px',
            zIndex: '1000'
        });
        inGameSettings.onclick = () => this.showSettings();
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
            <h2>SETTINGS</h2>
            <div style="display: flex; gap: 15px; margin-bottom: 20px;">
                <button id="set-en" style="padding: 10px 20px; cursor: pointer; background: ${this.lang==='en'?'#3498db':'#333'}; border: 1px solid #3498db; color: white;">EN</button>
                <button id="set-ru" style="padding: 10px 20px; cursor: pointer; background: ${this.lang==='ru'?'#3498db':'#333'}; border: 1px solid #3498db; color: white;">RU</button>
            </div>
            
            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 18px; margin-bottom: 15px;">
                <input type="checkbox" id="set-tut" ${this.showTutorialFlag ? 'checked' : ''} style="width: 20px; height: 20px;">
                ${this.t('tutorial_toggle')}
            </label>

            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 18px; margin-bottom: 30px;">
                <input type="checkbox" id="set-sound" checked style="width: 20px; height: 20px;">
                ${this.t('settings_sound')} 🔊
            </label>

            <!-- Кнопка выхода в меню, если мы в игре -->
            <button id="set-exit" style="padding: 10px 30px; background: #c0392b; border: none; color: white; border-radius: 4px; cursor: pointer; margin-bottom: 10px; display: none;">${this.t('settings_exit')}</button>

            <button id="set-close" style="padding: 10px 30px; background: #27ae60; border: none; color: white; border-radius: 4px; cursor: pointer;">OK</button>
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
                if (item.type !== 'demolish') locked = true;
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
        this.hudTime.style.position = 'absolute';
        this.hudTime.style.bottom = '20px'; 
        this.hudTime.style.right = '20px';
        this.hudTime.style.width = '50px';
        this.hudTime.style.height = '50px';
        this.applyPanelStyle(this.hudTime);
        this.hudTime.style.borderRadius = '50%';
        this.hudTime.style.overflow = 'hidden'; 
        this.hudTime.style.border = '2px solid #555';
        this.hudTime.style.background = 'linear-gradient(to bottom, #87CEEB 0%, #2c3e50 100%)'; 

        this.hudTime.innerHTML = `
            <div id="hud-time-sky" style="width: 100%; height: 100%; position: relative; transition: transform 0.1s linear;">
                <div style="position: absolute; top: -15px; left: 50%; transform: translateX(-50%); font-size: 20px;">☀️</div>
                <div style="position: absolute; bottom: -15px; left: 50%; transform: translateX(-50%); font-size: 20px;">🌙</div>
            </div>
            <div style="position: absolute; bottom: 0; left: 0; width: 100%; height: 40%; background: #222; z-index: 2;"></div>
        `;
    }

    private initCoreHUD() {
        this.hudCore.id = 'hud-core-container';
        Object.assign(this.hudCore.style, {
            position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)',
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '8px 15px', background: 'rgba(0,0,0,0.5)', borderRadius: '4px',
            border: 'none', boxShadow: 'none', zIndex: '1000'
        });
        this.hudCore.innerHTML = `
            <span style="font-weight: bold; color: #00FFFF; font-size: 14px; white-space: nowrap;">${this.t('hud_core_short')}</span>
            <div style="width: 200px; height: 8px; background: #222; border-radius: 4px; overflow: hidden; border: 1px solid #333;">
                <div id="hud-core-bar" style="width: 100%; height: 100%; background-color: #00FFFF; transition: width 0.3s ease-out;"></div>
            </div>
        `;
    }

        private initPlayerHUD() {

            this.hudPlayer.style.position = 'absolute';

            this.hudPlayer.style.top = '20px'; 

            this.hudPlayer.style.left = '20px';

            

            // Уменьшаем ширину на мобильных

            this.hudPlayer.style.width = this.isMobile ? '140px' : '200px';

            this.hudPlayer.style.fontSize = this.isMobile ? '10px' : '12px';

            

            this.hudPlayer.style.boxSizing = 'border-box';

            this.applyPanelStyle(this.hudPlayer);

            this.hudPlayer.style.padding = '10px';

            this.hudPlayer.style.zIndex = '1000';

            

            if (this.isMobile) {

                this.hudPlayer.style.background = 'rgba(15, 15, 15, 0.6)';

            }

    

            this.hudPlayer.innerHTML = `

                <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 11px; color: #aaa; font-weight: bold;">

                    <span>${this.t('hud_hp')}</span>

                    <span id="hud-player-text">100</span>

                </div>

                <div style="width: 100%; height: 8px; background: #222; border-radius: 4px; overflow: hidden; margin-bottom: 8px;">

                    <div id="hud-player-bar" style="width: 100%; height: 100%; background: #2ecc71;"></div>

                </div>

                <!-- ОЧКИ -->

                <div style="font-size: 14px; font-weight: bold; color: #f1c40f; text-align: center;">

                    <span id="hud-score">0</span> 🏆

                </div>

            `;

        }

    private initToolbarStyles() {
        this.container.style.position = 'absolute';
        this.container.style.bottom = '30px'; 
        this.container.style.left = '50%';
        this.container.style.transform = 'translateX(-50%)';
        this.container.style.display = 'flex';
        this.container.style.gap = '6px';
        this.container.style.padding = '10px';
        this.applyPanelStyle(this.container);
        this.container.style.background = 'transparent'; // Прозрачный фон
        this.container.style.border = 'none'; // Без рамки
        this.container.style.pointerEvents = 'auto'; 
        this.container.style.zIndex = '1001';
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
        const btnSize = this.isMobile ? '40px' : '48px'; 
        const iconSize = this.isMobile ? '20px' : '18px';

        this.items.forEach((item, index) => {
            const btn = document.createElement('button');
            const costHtml = item.cost ? `<div style="font-size: 9px; opacity: 0.8; display: flex; align-items: center; gap: 2px;">${Icons.METAL.replace('width="24"', 'width="10"').replace('height="24"', 'height="10"')} ${item.cost}</div>` : '';
            
            const hotkeyHtml = !this.isMobile && index < 9 ? 
                `<div style="position: absolute; top: 2px; right: 4px; font-size: 10px; color: #aaa; font-weight: bold;">${index + 1}</div>` : '';

            btn.innerHTML = `${hotkeyHtml}<div style="font-size: ${iconSize};">${item.icon}</div>${costHtml}`;
            btn.title = this.t(item.key); 
            
            Object.assign(btn.style, {
                width: btnSize, height: btnSize, cursor: 'pointer', color: 'white',
                border: '1px solid rgba(255,255,255,0.2)', // Тонкая рамка
                borderRadius: '6px', 
                background: this.isMobile ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.5)', // Прозрачнее
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.1s', position: 'relative',
                backdropFilter: 'blur(4px)'
            });
            
            if (item.color) btn.style.borderColor = item.color;
            btn.dataset.type = item.type; 
            this.container.appendChild(btn);
            this.buttons.set(item.type, btn);
        });
        
        const handleInteraction = (e: Event) => {
            const target = (e.target as HTMLElement).closest('button');
            if (target && target.dataset.type) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                
                if (!this.isPaused) {
                    const type = target.dataset.type as ToolType;
                    this.onSelect(type);
                    this.highlightButton(type);
                }
            }
        };

        this.container.onpointerdown = handleInteraction;
        this.container.ontouchstart = handleInteraction; 
        this.updateButtonsState(); 
    }

    public selectByIndex(index: number) {
        if (index >= 0 && index < this.items.length) {
            const type = this.items[index].type;
            if (!this.buttons.get(type)?.disabled || type === 'demolish') {
                this.onSelect(type);
                this.highlightButton(type);
            }
        }
    }

    private highlightButton(type: ToolType) {
        this.buttons.forEach((btn, t) => {
            btn.classList.remove('active');
            const item = this.items.find(i => i.type === t);
            btn.style.background = 'transparent';
            btn.style.borderColor = item?.color || '#444';
            btn.style.transform = 'scale(1)';
        });

        const activeBtn = this.buttons.get(type);
        if (activeBtn) {
            activeBtn.classList.add('active');
            activeBtn.style.background = 'rgba(52, 152, 219, 0.2)';
            activeBtn.style.borderColor = '#3498db';
            activeBtn.style.transform = 'scale(1.1)';
        }
    }
}
