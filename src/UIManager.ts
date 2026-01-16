import type { BuildingType } from './Building';
import { Icons } from './Icons';
import { Translations, type Language } from './Localization';

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

    private lang: Language = 'en';
    private showTutorialFlag: boolean = true;

    public onStartGame?: (skipTutorial: boolean) => void;
    public onLanguageChange?: (lang: Language) => void;
    public checkUnlock?: (type: string) => boolean; // Колбек проверки
    
    private items: ToolItem[] = [
        { type: 'wall', key: 'tool_wall', icon: '🧱', cost: 10 },
        { type: 'drill', key: 'tool_drill', icon: '⛏️', cost: 50 },
        { type: 'generator', key: 'tool_generator', icon: '⚡', cost: 100 },
        { type: 'battery', key: 'tool_battery', icon: '🔋', cost: 150 },
        { type: 'turret', key: 'tool_turret', icon: '🔫', cost: 30 },
        { type: 'sniper', key: 'tool_sniper', icon: '🎯', cost: 75, minWave: 3 },
        { type: 'minigun', key: 'tool_minigun', icon: '🌪️', cost: 120, minWave: 5 },
        { type: 'laser', key: 'tool_laser', icon: '🔥', cost: 200, minWave: 7 },
        { type: 'repair', key: 'tool_repair', icon: '🔧', color: '#f1c40f' },
        { type: 'demolish', key: 'tool_remove', icon: '❌', color: '#e74c3c' },
    ];

    constructor(onSelect: (type: ToolType) => void) {
        this.onSelect = onSelect;
        this.detectPlatform();
        this.detectLanguage();
        
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

        this.createButtons(); 
        this.highlightButton('wall');
    }

    public get currentLang(): Language { return this.lang; }

    private t(key: string): string {
        return (Translations[this.lang] as any)[key] || key;
    }

    private detectPlatform() {
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || ('ontouchstart' in window);
    }

    private detectLanguage() {
        const browserLang = navigator.language.split('-')[0];
        if (browserLang === 'ru') this.lang = 'ru';
        else this.lang = 'en';
    }

    public init() {
        this.showGameHUD();
    }

    public showGameHUD() {
        document.body.appendChild(this.container);
        document.body.appendChild(this.infoPanel);
        document.body.appendChild(this.hudPlayer);
        document.body.appendChild(this.hudCore);
        document.body.appendChild(this.hudTime);
        this.updateWave(1);
    }

    public hideMenu() {
        this.mainMenu.style.display = 'none';
    }

    public resize() {
        // Если что-то нужно пересчитать при ресайзе
        this.detectPlatform();
        // Можно обновить размеры кнопок, если они зависят от платформы
    }

    public showGameOver() {
        const overlay = document.createElement('div');
        Object.assign(overlay.style, {
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.7)', zIndex: 10001,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontFamily: "'Segoe UI', sans-serif",
            backdropFilter: 'blur(10px)', // Размытие фона
            opacity: '0', transition: 'opacity 1s ease-in'
        });
        
        overlay.innerHTML = `
            <div style="text-align: center; transform: translateY(-20px);">
                <h1 style="font-size: 80px; color: #e74c3c; margin: 0 0 40px 0; text-transform: uppercase; letter-spacing: 15px; font-weight: 900; text-shadow: 0 0 30px rgba(231, 76, 60, 0.5);">${this.t('game_over')}</h1>
                <button id="restart-btn" style="padding: 18px 60px; font-size: 20px; cursor: pointer; background: transparent; color: #3498db; border: 2px solid #3498db; border-radius: 4px; text-transform: uppercase; letter-spacing: 4px; font-weight: bold; transition: all 0.3s;">${this.t('restart')}</button>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Плавное появление
        setTimeout(() => overlay.style.opacity = '1', 10);

        const btn = overlay.querySelector('#restart-btn') as HTMLButtonElement;
        btn.onmouseenter = () => {
            btn.style.background = '#3498db';
            btn.style.color = 'white';
            btn.style.boxShadow = '0 0 20px rgba(52, 152, 219, 0.5)';
        };
        btn.onmouseleave = () => {
            btn.style.background = 'transparent';
            btn.style.color = '#3498db';
            btn.style.boxShadow = 'none';
        };
        btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.location.reload();
        };
    }

    public showTutorial(onComplete: () => void) {
        const steps = [
            { text: this.t('tut_move'), icon: "🏃" },
            { text: this.t('tut_shoot'), icon: "🔫" },
            { text: this.t('tut_build'), icon: "🧱" },
            { text: this.t('tut_core'), icon: "💎" },
            { text: this.t('tut_drill'), icon: "⚙️" },
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
        const titleSize = this.isMobile ? '40px' : '80px';
        const subSize = this.isMobile ? '14px' : '18px';
        const gap = this.isMobile ? '20px' : '40px';
        
        div.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <h1 style="font-size: ${titleSize}; color: #3498db; margin: 0; text-transform: uppercase; letter-spacing: 5px; font-weight: 900;">${this.t('title')}</h1>
                <p style="color: #7f8c8d; margin-bottom: ${gap}; font-size: ${subSize}; letter-spacing: 2px;">${this.t('subtitle')}</p>
                
                <div style="display: flex; gap: 15px; margin-bottom: ${gap}; justify-content: center;">
                    <button id="lang-en" style="padding: 10px 20px; cursor: pointer; background: ${this.lang==='en'?'#3498db':'#1a1a1a'}; border: 1px solid #3498db; color: white; border-radius: 4px;">EN</button>
                    <button id="lang-ru" style="padding: 10px 20px; cursor: pointer; background: ${this.lang==='ru'?'#3498db':'#1a1a1a'}; border: 1px solid #3498db; color: white; border-radius: 4px;">RU</button>
                </div>

                <label style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: ${gap}; cursor: pointer; font-size: 16px;">
                    <input type="checkbox" id="tut-toggle" ${this.showTutorialFlag ? 'checked' : ''} style="width: 20px; height: 20px;">
                    ${this.t('tutorial_toggle')}
                </label>
            </div>
        `;

        const startBtn = document.createElement('button');
        startBtn.innerText = this.t('start');
        Object.assign(startBtn.style, {
            padding: this.isMobile ? '12px 40px' : '18px 60px',
            fontSize: this.isMobile ? '18px' : '24px',
            cursor: 'pointer',
            background: 'rgba(52, 152, 219, 0.1)', color: '#3498db', border: '2px solid #3498db',
            borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '4px',
            transition: 'all 0.2s', fontWeight: 'bold'
        });

        startBtn.onclick = () => {
            div.style.display = 'none';
            if (this.onStartGame) this.onStartGame(!this.showTutorialFlag);
        };

        div.appendChild(startBtn);

        div.querySelector('#lang-en')?.addEventListener('click', (e) => { e.stopPropagation(); this.lang = 'en'; this.refreshUI(); });
        div.querySelector('#lang-ru')?.addEventListener('click', (e) => { e.stopPropagation(); this.lang = 'ru'; this.refreshUI(); });
        div.querySelector('#tut-toggle')?.addEventListener('change', (e: any) => { this.showTutorialFlag = e.target.checked; });
    }

    private refreshUI() {
        this.updateMainMenuContent(this.mainMenu);
        this.createButtons(); 
        this.initCoreHUD(); 
        this.initPlayerHUD();
        this.updateButtonsState(); // Добавлено: блокируем кнопки заново
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

    public updateButtonsState() {
        this.items.forEach(item => {
            const btn = this.buttons.get(item.type);
            if (!btn) return;

            let locked = false;
            
            // Проверка по волне (если есть)
            // if (item.minWave && currentWave < item.minWave) locked = true; // Можно оставить или убрать, если технологии заменят это

            // Проверка по технологии
            if (this.checkUnlock && !this.checkUnlock(item.type)) {
                locked = true;
            }

            if (locked) {
                btn.disabled = true;
                btn.style.opacity = '0.3';
                btn.style.filter = 'grayscale(1)';
                // Добавляем иконку замка, если ее нет
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
        // Мы перенесли логику блокировки в updateButtonsState, 
        // но если нужно оставить minWave, можно передать wave туда.
        // Пока просто вызываем обновление состояния.
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
        this.hudTime.style.overflow = 'hidden'; // Маска
        this.hudTime.style.border = '2px solid #555';
        this.hudTime.style.background = 'linear-gradient(to bottom, #87CEEB 0%, #2c3e50 100%)'; // Небо

        this.hudTime.innerHTML = `
            <div id="hud-time-sky" style="width: 100%; height: 100%; position: relative; transition: transform 0.1s linear;">
                <!-- Солнце и Луна разнесены по вертикали на 40px от центра -->
                <div style="position: absolute; top: -15px; left: 50%; transform: translateX(-50%); font-size: 20px;">☀️</div>
                <div style="position: absolute; bottom: -15px; left: 50%; transform: translateX(-50%); font-size: 20px;">🌙</div>
            </div>
            <!-- Горизонт (полоска снизу, чтобы скрыть "подземную" часть) -->
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
        this.hudPlayer.style.top = '20px'; // Переместим наверх слева (было bottom 20px)
        this.hudPlayer.style.left = '20px';
        this.hudPlayer.style.width = '180px';
        this.applyPanelStyle(this.hudPlayer);
        this.hudPlayer.style.padding = '10px';
        this.hudPlayer.style.zIndex = '1000';
        this.hudPlayer.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 11px; color: #aaa; font-weight: bold;">
                <span>${this.t('hud_hp')}</span>
                <span id="hud-player-text">100</span>
            </div>
            <div style="width: 100%; height: 8px; background: #222; border-radius: 4px; overflow: hidden;">
                <div id="hud-player-bar" style="width: 100%; height: 100%; background: #2ecc71;"></div>
            </div>
        `;
    }

    private initToolbarStyles() {
        this.container.style.position = 'absolute';
        this.container.style.bottom = '30px'; // Было 20px
        this.container.style.left = '50%';
        this.container.style.transform = 'translateX(-50%)';
        this.container.style.display = 'flex';
        this.container.style.gap = '6px';
        this.container.style.padding = '10px';
        this.applyPanelStyle(this.container);
        this.container.style.pointerEvents = 'auto'; 
        this.container.style.zIndex = '1001';
    }

    private initInfoStyles() {
        this.infoPanel.style.position = 'fixed';
        this.infoPanel.style.bottom = '140px'; // Было 80px
        this.infoPanel.style.left = '50%';
        this.infoPanel.style.transform = 'translateX(-50%)';
        this.applyPanelStyle(this.infoPanel);
        this.infoPanel.style.padding = '8px 12px';
        this.infoPanel.style.display = 'none';
        this.infoPanel.style.minWidth = '120px';
        this.infoPanel.style.background = 'rgba(10, 10, 10, 0.5)'; // Было 0.8
        this.infoPanel.style.backdropFilter = 'blur(6px)'; // Чуть больше блюра для читаемости
        this.infoPanel.style.zIndex = '1000';
    }

    private createButtons() {
        this.container.innerHTML = '';
        // Уменьшаем размер кнопок для мобильных, чтобы не было громоздко
        const btnSize = this.isMobile ? '40px' : '48px'; // Было 56px для мобильных
        const iconSize = this.isMobile ? '20px' : '18px';

        this.items.forEach(item => {
            const btn = document.createElement('button');
            const costHtml = item.cost ? `<div style="font-size: 9px; opacity: 0.8; display: flex; align-items: center; gap: 2px;">${Icons.METAL.replace('width="24"', 'width="10"').replace('height="24"', 'height="10"')} ${item.cost}</div>` : '';
            btn.innerHTML = `<div style="font-size: ${iconSize};">${item.icon}</div>${costHtml}`;
            btn.title = this.t(item.key); 
            
            Object.assign(btn.style, {
                width: btnSize, height: btnSize, cursor: 'pointer', color: 'white',
                border: '1px solid #444', borderRadius: '4px', background: 'transparent',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.1s'
            });
            
            if (item.color) btn.style.borderColor = item.color;
            btn.dataset.type = item.type; // Храним тип в дата-атрибуте
            this.container.appendChild(btn);
            this.buttons.set(item.type, btn);
        });
        
        // Делегированная обработка для всего контейнера
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

        // Удаляем старые листенеры если есть (нет, мы создаем кнопки заново)
        this.container.onpointerdown = handleInteraction;
        // Дублируем touchstart для гарантии
        this.container.ontouchstart = handleInteraction; 
        
        this.updateButtonsState(); // Обновляем состояние (замки)
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