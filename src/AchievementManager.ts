import { Translations, type Language } from './Localization';

export interface Achievement {
    id: string;
    key: string;
    icon: string;
    target: number;
    progress: number;
    unlocked: boolean;
}

export class AchievementManager {
    private achievements: Achievement[] = [
        { id: 'first_blood', key: 'ach_first_blood', icon: '🩸', target: 10, progress: 0, unlocked: false },
        { id: 'architect', key: 'ach_architect', icon: '🏗️', target: 50, progress: 0, unlocked: false },
        { id: 'survivor', key: 'ach_survivor', icon: '🛡️', target: 20, progress: 0, unlocked: false },
        { id: 'boss_killer', key: 'ach_boss_killer', icon: '👑', target: 5, progress: 0, unlocked: false },
        { id: 'energetic', key: 'ach_energetic', icon: '⚡', target: 500, progress: 0, unlocked: false },
        { id: 'mass_killer', key: 'ach_mass_killer', icon: '💀', target: 100, progress: 0, unlocked: false },
        { id: 'builder', key: 'ach_builder', icon: '🧱', target: 100, progress: 0, unlocked: false },
        { id: 'wave_master', key: 'ach_wave_master', icon: '🌊', target: 50, progress: 0, unlocked: false },
    ];

    private lang: Language = 'en';
    private storageKey: string = 'basehold_achievements';
    public onUnlock?: (achievement: Achievement) => void;

    constructor() {
        this.load();
    }

    public setLanguage(lang: Language) {
        this.lang = lang;
    }

    private t(key: string): string {
        return (Translations[this.lang] as any)[key] || key;
    }

    public load() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const data = JSON.parse(saved);
                for (const ach of this.achievements) {
                    const savedAch = data.find((a: any) => a.id === ach.id);
                    if (savedAch) {
                        ach.progress = savedAch.progress || 0;
                        ach.unlocked = savedAch.unlocked || false;
                    }
                }
            }
        } catch (e) {
            console.warn('Failed to load achievements:', e);
        }
    }

    public save() {
        try {
            const data = this.achievements.map(a => ({
                id: a.id,
                progress: a.progress,
                unlocked: a.unlocked
            }));
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (e) {
            console.warn('Failed to save achievements:', e);
        }
    }

    public addProgress(type: string, amount: number = 1) {
        let updated = false;

        switch (type) {
            case 'kill':
                this.updateAchievement('first_blood', amount);
                this.updateAchievement('mass_killer', amount);
                updated = true;
                break;
            case 'boss_kill':
                this.updateAchievement('boss_killer', amount);
                updated = true;
                break;
            case 'build':
                this.updateAchievement('architect', amount);
                this.updateAchievement('builder', amount);
                updated = true;
                break;
            case 'wave':
                // For wave achievements, set progress to the wave number (not additive)
                this.setAchievementProgress('survivor', amount);
                this.setAchievementProgress('wave_master', amount);
                updated = true;
                break;
            case 'energy':
                this.updateAchievement('energetic', amount);
                updated = true;
                break;
        }

        if (updated) {
            this.save();
        }
    }

    private updateAchievement(id: string, amount: number) {
        const ach = this.achievements.find(a => a.id === id);
        if (!ach || ach.unlocked) return;

        ach.progress += amount;

        if (ach.progress >= ach.target && !ach.unlocked) {
            ach.unlocked = true;
            if (this.onUnlock) {
                this.onUnlock(ach);
            }
        }
    }

    private setAchievementProgress(id: string, value: number) {
        const ach = this.achievements.find(a => a.id === id);
        if (!ach || ach.unlocked) return;

        // Set progress to value if higher than current
        if (value > ach.progress) {
            ach.progress = value;
        }

        if (ach.progress >= ach.target && !ach.unlocked) {
            ach.unlocked = true;
            if (this.onUnlock) {
                this.onUnlock(ach);
            }
        }
    }

    public getAll(): Achievement[] {
        return this.achievements;
    }

    public getUnlocked(): Achievement[] {
        return this.achievements.filter(a => a.unlocked);
    }

    public getProgress(id: string): { current: number; target: number; unlocked: boolean } | null {
        const ach = this.achievements.find(a => a.id === id);
        if (!ach) return null;
        return { current: ach.progress, target: ach.target, unlocked: ach.unlocked };
    }

    public reset() {
        for (const ach of this.achievements) {
            ach.progress = 0;
            ach.unlocked = false;
        }
        this.save();
    }

    public showUI(container: HTMLElement) {
        const overlay = document.createElement('div');
        Object.assign(overlay.style, {
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.85)', zIndex: '10005',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontFamily: "'Segoe UI', sans-serif", backdropFilter: 'blur(5px)'
        });

        let achievementsHtml = '';
        for (const ach of this.achievements) {
            const pct = Math.min(100, Math.floor((ach.progress / ach.target) * 100));
            const statusColor = ach.unlocked ? '#2ecc71' : '#666';
            const statusText = ach.unlocked ? '✓' : `${ach.progress}/${ach.target}`;

            achievementsHtml += `
                <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 8px; border-left: 3px solid ${statusColor};">
                    <span style="font-size: 24px;">${ach.icon}</span>
                    <div style="flex: 1;">
                        <div style="font-weight: bold; color: ${ach.unlocked ? '#fff' : '#aaa'};">${this.t(ach.key)}</div>
                        <div style="font-size: 11px; color: #666;">${this.t(ach.key + '_desc')}</div>
                        <div style="margin-top: 4px; height: 4px; background: #333; border-radius: 2px; overflow: hidden;">
                            <div style="width: ${pct}%; height: 100%; background: ${ach.unlocked ? '#2ecc71' : '#3498db'}; transition: width 0.3s;"></div>
                        </div>
                    </div>
                    <span style="color: ${statusColor}; font-weight: bold; font-size: 12px;">${statusText}</span>
                </div>
            `;
        }

        overlay.innerHTML = `
            <div style="background: #1e272e; padding: 25px; border-radius: 12px; width: 90%; max-width: 450px; max-height: 80vh; overflow-y: auto; border: 1px solid #444;">
                <h3 style="margin-top: 0; color: #f1c40f; text-transform: uppercase; letter-spacing: 2px; text-align: center;">
                    🏆 ${this.t('achievements_title')}
                </h3>
                <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px;">
                    ${achievementsHtml}
                </div>
                <button id="close-achievements" style="width: 100%; padding: 12px; background: #3498db; border: none; color: white; border-radius: 4px; cursor: pointer; font-weight: bold;">${this.t('btn_ok')}</button>
            </div>
        `;

        container.appendChild(overlay);
        overlay.querySelector('#close-achievements')?.addEventListener('click', () => {
            container.removeChild(overlay);
        });
    }

    public showUnlockNotification(achievement: Achievement, container: HTMLElement) {
        const notification = document.createElement('div');
        Object.assign(notification.style, {
            position: 'fixed',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%) translateY(-20px)',
            background: 'linear-gradient(135deg, #1e272e 0%, #2c3e50 100%)',
            border: '2px solid #f1c40f',
            borderRadius: '12px',
            padding: '15px 25px',
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            color: 'white',
            fontFamily: "'Segoe UI', sans-serif",
            boxShadow: '0 4px 20px rgba(241, 196, 15, 0.4)',
            zIndex: '10010',
            opacity: '0',
            transition: 'all 0.5s ease-out'
        });

        notification.innerHTML = `
            <span style="font-size: 32px;">${achievement.icon}</span>
            <div>
                <div style="font-size: 10px; color: #f1c40f; text-transform: uppercase; letter-spacing: 2px;">${this.t('ach_unlocked')}</div>
                <div style="font-size: 16px; font-weight: bold;">${this.t(achievement.key)}</div>
            </div>
        `;

        container.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(-50%) translateY(0)';
        }, 10);

        // Animate out
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(-50%) translateY(-20px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    container.removeChild(notification);
                }
            }, 500);
        }, 3000);
    }
}
