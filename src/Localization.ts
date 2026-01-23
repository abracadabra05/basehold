export type Language = 'ru' | 'en';

export const Translations: Record<Language, any> = {
    ru: {
        game_title: 'BASEHOLD', // Добавлено для модерации
        title: 'BASEHOLD',
        subtitle: 'Обороняй. Строй. Выживай.',
        
        start: 'Начать миссию',
        restart: 'Начать заново',
        leaderboard: 'Лидеры', // Добавлено
        leaderboard_empty: 'Рекордов нет. Будь первым!', // Добавлено
        game_over: 'МИССИЯ ПРОВАЛЕНА',
        revive: 'ВОСКРЕСНУТЬ', // Добавлено
        tutorial_toggle: 'Обучение',
        
        hud_hp: 'Здоровье', // Было Целостность
        hud_core_short: 'ЯДРО',
        
        res_metal: 'Металл',
        res_biomass: 'Биомасса',
        res_energy: 'Энергия',
        res_battery: 'Батарея',
        res_status_blackout: 'БЛЭКАУТ',
        res_status_draining: 'РАЗРЯДКА',
        res_status_charging: 'ЗАРЯДКА',
        res_status_charged: 'ЗАРЯЖЕНО',
        
        void_damage: 'УРОН ПУСТОТЫ!',
        
        tut_move: 'Двигайся на WASD',
        tut_shoot: 'ЛКМ - Стрелять, Стой рядом с ресурсом для добычи',
        tut_move_mobile: 'Используй левый джойстик для движения',
        tut_shoot_mobile: 'Используй правый джойстик для стрельбы',
        tut_mine_mobile: 'Стой рядом с ресурсом для добычи',
        tut_build: 'Выбирай здания на панели снизу',
        tut_core: 'Защищай ядро любой ценой',
        tut_drill: 'Ставь буры на синие точки',
        tut_play: 'Поехали!',
        tut_next: 'Далее',
        
        tool_wall: 'Стена',
        tool_drill: 'Бур',
        tool_generator: 'Генератор',
        tool_battery: 'Батарея',
        tool_turret: 'Турель',
        tool_sniper: 'Снайпер',
        tool_minigun: 'Миниган',
        tool_laser: 'Лазер',
        tool_repair: 'Ремонт',
        tool_remove: 'Снос',
        tool_power: 'Энергия',
        
        upg_dmg: 'Урон',
        upg_speed: 'Скорость',
        upg_mine: 'Добыча',
        upg_regen: 'Рем-боты',
        upg_thorns: 'Шипы',
        upg_magnet: 'Магнит',
        upg_level: 'Уровень',
        upg_max: 'МАКС',
        
        shop_title: 'Исследования и Улучшения',
        shop_subtitle: 'Тратьте биомассу на развитие технологий',
        shop_close: 'Закрыть',
        
        settings_title: 'Настройки',
        settings_sound: 'Звук', // Добавлено
        settings_exit: 'Выйти в меню', // Добавлено
        settings_language: 'Язык',
        locked: 'ЗАКРЫТО', // Заблокированная технология
        unlocked: 'ОТКРЫТО', // Разблокированная технология
        tech_unlocked: 'ТЕХНОЛОГИЯ ОТКРЫТА!',

        // Wave statuses
        wave_prep: 'ДО СЛЕДУЮЩЕЙ ВОЛНЫ',
        wave_active: 'ВОЛНА',
        wave_shop: 'МАГАЗИН',
        wave_boss: 'БИТВА С БОССОМ',
        wave_skip: 'СКИП',
        
        // Perks
        perk_title: 'Выберите Усиление',
        perk_double_shot: 'Мульти-выстрел',
        perk_double_shot_desc: 'Дополнительная пуля за выстрел.',
        perk_vampirism: 'Вампиризм',
        perk_vampirism_desc: 'Шанс восстановить HP при убийстве.',
        perk_reload: 'Скорострельность',
        perk_reload_desc: 'Стрельба быстрее на 30%.',
        perk_shield: 'Энерго-щит',
        perk_shield_desc: 'Шанс заблокировать урон.',
        perk_repair: 'Нано-боты',
        perk_repair_desc: 'Здания медленно чинятся сами.',
        perk_explosive: 'Взрывные пули',
        perk_explosive_desc: 'Пули взрываются при попадании.'
    },
    en: {
        game_title: 'BASEHOLD',
        title: 'BASEHOLD',
        subtitle: 'Defend. Build. Survive.',
        
        start: 'Start Mission',
        restart: 'Restart Game',
        leaderboard: 'Leaders',
        leaderboard_empty: 'No records yet. Be the first!', // Добавлено
        game_over: 'MISSION FAILED',
        revive: 'REVIVE',
        tutorial_toggle: 'Show Tutorial',
        
        hud_hp: 'HP', // Was Integrity
        hud_core_short: 'CORE',
        
        res_metal: 'Metal',
        res_biomass: 'Biomass',
        res_energy: 'Energy',
        res_battery: 'Battery',
        res_status_blackout: 'BLACKOUT',
        res_status_draining: 'DRAINING',
        res_status_charging: 'CHARGING',
        res_status_charged: 'CHARGED',
        
        void_damage: 'VOID DAMAGE!',
        
        tut_move: 'Use WASD to Move',
        tut_shoot: 'LMB to Shoot, stand near node to mine',
        tut_move_mobile: 'Use left joystick to move',
        tut_shoot_mobile: 'Use right joystick to shoot',
        tut_mine_mobile: 'Stand near resource nodes to mine',
        tut_build: 'Select buildings from the bottom bar',
        tut_core: 'Protect the Core at all costs',
        tut_drill: 'Place drills on blue nodes to mine metal',
        tut_play: 'I am ready!',
        tut_next: 'Next',
        
        tool_wall: 'Wall',
        tool_drill: 'Drill',
        tool_generator: 'Generator',
        tool_battery: 'Battery',
        tool_turret: 'Turret',
        tool_sniper: 'Sniper',
        tool_minigun: 'Minigun',
        tool_laser: 'Laser',
        tool_repair: 'Repair',
        tool_remove: 'Remove',
        tool_power: 'Power',
        
        upg_dmg: 'Damage',
        upg_speed: 'Move Speed',
        upg_mine: 'Mining Eff.',
        upg_regen: 'Repair Bots',
        upg_thorns: 'Thorns',
        upg_magnet: 'Magnet',
        upg_level: 'Level',
        upg_max: 'MAX',
        
        shop_title: 'Research & Upgrades',
        shop_subtitle: 'Spend biomass to upgrade systems',
        shop_close: 'Close',

        settings_title: 'Settings',
        settings_sound: 'Sound',
        settings_exit: 'Exit to Menu',
        settings_language: 'Language',
        locked: 'LOCKED', // Locked technology
        unlocked: 'UNLOCKED', // Unlocked technology
        tech_unlocked: 'TECH UNLOCKED!',

        // Wave statuses
        wave_prep: 'NEXT WAVE IN',
        wave_active: 'WAVE',
        wave_shop: 'SHOPPING',
        wave_boss: 'BOSS FIGHT',
        wave_skip: 'SKIP',

        // Perks
        perk_title: 'Choose an Upgrade',
        perk_double_shot: 'Multi-Shot',
        perk_double_shot_desc: 'Additional projectile per shot.',
        perk_vampirism: 'Vampirism',
        perk_vampirism_desc: 'Chance to restore HP on kill.',
        perk_reload: 'Rapid Fire',
        perk_reload_desc: 'Fire 30% faster.',
        perk_shield: 'Energy Shield',
        perk_shield_desc: 'Chance to block incoming damage.',
        perk_repair: 'Nano-Repair',
        perk_repair_desc: 'Buildings slowly regenerate HP.',
        perk_explosive: 'High Explosive',
        perk_explosive_desc: 'Bullets explode on impact.'
    }
};
