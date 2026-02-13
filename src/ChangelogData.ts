export const VERSION = '2.5.1';

export interface ChangelogEntry {
    version: string;
    date: string;
    changes: {
        ru: string[];
        en: string[];
    };
}

export const CHANGELOG: ChangelogEntry[] = [
    {
        version: '2.5.0',
        date: '2025-02-10',
        changes: {
            ru: [
                'Умный ИИ врагов: A* патфайндинг вокруг зданий и камней',
                'Два лидерборда: «Волны» и «Очки» с табами переключения',
                'Настройки графики: Высокая / Низкая для слабых устройств',
                'Исправлен сброс перков при рестарте',
                'Враги теперь наносят свой реальный урон при столкновении',
                'Исправлено освещение лазерных башен',
                'Защита от зависания при генерации мира'
            ],
            en: [
                'Smart enemy AI: A* pathfinding around buildings and rocks',
                'Dual leaderboards: Waves and Score with tab switching',
                'Graphics settings: High / Low for weaker devices',
                'Fixed perks not resetting on game restart',
                'Enemies now deal correct collision damage',
                'Fixed laser tower lighting',
                'Protected world generation from infinite loops'
            ]
        }
    },
    {
        version: '2.0.0',
        date: '2025-01-24',
        changes: {
            ru: [
                'Новые враги: Хилер, Сплиттер, Щитоносец, Мини-босс',
                'Новые здания: Тесла-катушка, Поле замедления',
                'Новые перки: Рикошет, Крит. удар, Медленные пули, Вампиризм зданий',
                'Система достижений (8 достижений)',
                'Мини-боссы на волнах 5, 15, 25...',
                'Режим бесконечных волн после 50 волны',
                'Статистика после смерти',
                'Меню обновлений и чейнджлог',
                'Улучшен магазин технологий'
            ],
            en: [
                'New enemies: Healer, Splitter, Shield Bearer, Mini-boss',
                'New buildings: Tesla Coil, Slow Field',
                'New perks: Ricochet, Critical Hit, Slow Bullets, Building Lifesteal',
                'Achievement system (8 achievements)',
                'Mini-bosses on waves 5, 15, 25...',
                'Endless mode after wave 50',
                'Death statistics screen',
                'Updates menu and changelog',
                'Improved tech shop'
            ]
        }
    },
    {
        version: '1.0.0',
        date: '2024-12',
        changes: {
            ru: [
                'Первый релиз игры',
                '6 типов врагов',
                '8 типов зданий',
                '6 перков',
                'Интеграция с игровой платформой',
                'Мобильная поддержка'
            ],
            en: [
                'Initial game release',
                '6 enemy types',
                '8 building types',
                '6 perks',
                'Game platform integration',
                'Mobile support'
            ]
        }
    }
];
