export const VERSION = '2.0.0';

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
                'Интеграция Yandex Games',
                'Мобильная поддержка'
            ],
            en: [
                'Initial game release',
                '6 enemy types',
                '8 building types',
                '6 perks',
                'Yandex Games integration',
                'Mobile support'
            ]
        }
    }
];
