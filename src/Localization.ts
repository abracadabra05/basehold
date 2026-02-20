export type Language = 'ru' | 'en';

export const Translations: Record<Language, any> = {
    ru: {
        game_title: 'BASEHOLD', // Добавлено для модерации
        title: 'BASEHOLD',
        subtitle: 'Обороняй. Строй. Выживай.',

        start: 'Начать миссию',
        restart: 'Начать заново',
        leaderboard: 'Лидеры',
        leaderboard_empty: 'Рекордов нет. Будь первым!',
        leaderboard_waves: 'Волны',
        leaderboard_score: 'Очки',
        game_over: 'МИССИЯ ПРОВАЛЕНА',
        revive: 'ВОСКРЕСНУТЬ', // Добавлено
        tutorial_toggle: 'Обучение',

        hud_hp: 'Здоровье', // Было Целостность
        hud_core_short: 'ЯДРО',

        res_metal: 'Металл',
        res_biomass: 'Биомасса',
        res_energy: 'Энергия',
        res_battery: 'Батарея',
        res_capacity: 'Ёмк',
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
        btn_ok: 'ОК',

        settings_title: 'Настройки',
        settings_sound: 'Звук', // Добавлено
        settings_exit: 'Выйти в меню', // Добавлено
        settings_language: 'Язык',
        settings_graphics: 'Графика',
        settings_gfx_high: 'Высокая',
        settings_gfx_low: 'Низкая',
        locked: 'ЗАКРЫТО', // Заблокированная технология
        unlocked: 'ОТКРЫТО', // Разблокированная технология
        tech_unlocked: 'ТЕХНОЛОГИЯ ОТКРЫТА!',
        tech_tier_1: 'Исследование Т1',
        ad_free: 'БЕСПЛАТНО',

        // Building descriptions
        tool_battery_desc: 'Хранит энергию',
        tool_sniper_desc: 'Дальний урон',
        tool_minigun_desc: 'Быстрая стрельба',
        tool_laser_desc: 'Мощный луч',
        tool_tesla_desc: 'Цепная молния',
        tool_slowfield_desc: 'Замедляет врагов',
        tool_radar: 'Радар',
        tool_radar_desc: 'Раскрывает угрозы рядом с ядром',
        tool_missile_desc: 'Тяжёлые ракеты по дальним целям',
        tool_repairhub: 'Рем-хаб',
        tool_repairhub_desc: 'Усиливает ремонт построек',

        // Wave alerts
        wave_miniboss: 'МИНИ-БОСС',
        wave_boss_incoming: 'БОСС ПРИБЛИЖАЕТСЯ',

        // Achievement
        ach_unlocked: 'Достижение получено!',

        // Perk activation
        perk_activated: 'ПЕРК АКТИВИРОВАН!',

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
        perk_explosive_desc: 'Пули взрываются при попадании.',

        // v2.0 Perks
        perk_ricochet: 'Рикошет',
        perk_ricochet_desc: 'Пули отскакивают к ближайшему врагу.',
        perk_critical: 'Критический удар',
        perk_critical_desc: 'Шанс нанести двойной урон.',
        perk_slow_bullets: 'Замедляющие пули',
        perk_slow_bullets_desc: 'Пули замедляют врагов.',
        perk_life_steal: 'Вампиризм зданий',
        perk_life_steal_desc: 'Здания восстанавливают HP от урона.',
        perk_overdrive: 'Овердрайв',
        perk_overdrive_desc: 'Скорость стрельбы и движение +20%.',
        perk_salvage: 'Сбор трофеев',
        perk_salvage_desc: 'Больше ресурсов с убитых врагов.',
        perk_nanoburst: 'Нано-всплеск',
        perk_nanoburst_desc: 'Мгновенно чинит постройки вокруг игрока.',
        perk_hunter_protocol: 'Протокол охоты',
        perk_hunter_protocol_desc: 'Доп. урон по элитным врагам.',

        // Changelog
        changelog_title: 'Обновления',
        changelog_new: 'НОВОЕ',
        changelog_version: 'Версия',

        // v2.0 Buildings
        tool_tesla: 'Тесла',
        tool_slowfield: 'Замедлитель',
        tool_missile: 'Ракетница',
        tool_shieldgen: 'Щит-ген',

        // v2.0 Enemies
        enemy_healer: 'Хилер',
        enemy_splitter: 'Сплиттер',
        enemy_shieldbearer: 'Щитоносец',
        enemy_teleporter: 'Телепортер',
        enemy_swarm: 'Рой',
        enemy_miniboss: 'Мини-босс',
        enemy_saboteur: 'Саботажник',
        enemy_juggernaut: 'Джаггернаут',
        enemy_phasewalker: 'Фазоход',

        // Achievements
        achievements_title: 'Достижения',
        ach_first_blood: 'Первая кровь',
        ach_first_blood_desc: 'Убить 10 врагов',
        ach_architect: 'Архитектор',
        ach_architect_desc: 'Построить 50 зданий',
        ach_survivor: 'Выживший',
        ach_survivor_desc: 'Дожить до волны 20',
        ach_boss_killer: 'Убийца боссов',
        ach_boss_killer_desc: 'Победить 5 боссов',
        ach_energetic: 'Энергетик',
        ach_energetic_desc: 'Накопить 500 энергии',
        ach_mass_killer: 'Массовый убийца',
        ach_mass_killer_desc: 'Убить 100 врагов',
        ach_builder: 'Строитель',
        ach_builder_desc: 'Построить 100 зданий',
        ach_wave_master: 'Мастер волн',
        ach_wave_master_desc: 'Дожить до волны 50',

        // Stats
        stats_title: 'Статистика',
        stats_enemies_killed: 'Убито врагов',
        stats_buildings_built: 'Построено зданий',
        stats_damage_dealt: 'Нанесено урона',
        stats_resources_mined: 'Добыто ресурсов',
        stats_time_played: 'Время в игре',
        stats_wave_reached: 'Достигнута волна',

        // Endless mode
        endless_mode: 'Бесконечный режим',
        endless_unlocked: 'Бесконечный режим разблокирован!',

        // Wave patterns
        wave_pattern_speed: '⚠️ РОЙ СКОРОСТИ',
        wave_pattern_ranged: '⚠️ ДАЛЬНЯЯ АТАКА',
        wave_pattern_explosive: '⚠️ ВЗРЫВНОЙ ДОЖДЬ',
        wave_pattern_heavy: '⚠️ ТЯЖЁЛЫЙ ШТУРМ',
        wave_mutator_fog: 'МУТАТОР: ТУМАН',
        wave_mutator_overcharge: 'МУТАТОР: ПЕРЕГРУЗКА',
        wave_mutator_swarm: 'МУТАТОР: РОЙ',

        store_title: 'Виртуальный магазин',
        store_buy: 'Купить',
        store_reward: 'За рекламу',
        store_auth: 'Войти',
        store_auth_desc: 'Войдите, чтобы покупки сохранялись в аккаунте.',
        store_pack_biomass_s: 'Пак биомассы S',
        store_pack_biomass_s_desc: '+300 биомассы',
        store_pack_biomass_l: 'Пак биомассы L',
        store_pack_biomass_l_desc: '+1300 биомассы',
        store_pack_metal_s: 'Пак металла S',
        store_pack_metal_s_desc: '+450 металла',
        store_booster_double_rewards: 'x2 награды',
        store_booster_double_rewards_desc: 'Удваивает награды на 7 минут',
        store_booster_overdrive: 'Боевой овердрайв',
        store_booster_overdrive_desc: 'Урон и темп стрельбы на 7 минут',
        store_purchase_ok: 'Покупка применена!',
        store_purchase_fail: 'Покупка не выполнена',
        store_pending_applied: 'Восстановлены необработанные покупки',
        store_reward_progress: 'Реклама просмотрена:',
        store_reward_steps: 'нужно просмотров'
    },
    en: {
        game_title: 'BASEHOLD',
        title: 'BASEHOLD',
        subtitle: 'Defend. Build. Survive.',

        start: 'Start Mission',
        restart: 'Restart Game',
        leaderboard: 'Leaders',
        leaderboard_empty: 'No records yet. Be the first!',
        leaderboard_waves: 'Waves',
        leaderboard_score: 'Score',
        game_over: 'MISSION FAILED',
        revive: 'REVIVE',
        tutorial_toggle: 'Show Tutorial',

        hud_hp: 'HP', // Was Integrity
        hud_core_short: 'CORE',

        res_metal: 'Metal',
        res_biomass: 'Biomass',
        res_energy: 'Energy',
        res_battery: 'Battery',
        res_capacity: 'Cap',
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
        btn_ok: 'OK',

        settings_title: 'Settings',
        settings_sound: 'Sound',
        settings_exit: 'Exit to Menu',
        settings_language: 'Language',
        settings_graphics: 'Graphics',
        settings_gfx_high: 'High',
        settings_gfx_low: 'Low',
        locked: 'LOCKED', // Locked technology
        unlocked: 'UNLOCKED', // Unlocked technology
        tech_unlocked: 'TECH UNLOCKED!',
        tech_tier_1: 'Tier 1 Research',
        ad_free: 'FREE',

        // Building descriptions
        tool_battery_desc: 'Stores energy',
        tool_sniper_desc: 'Long range damage',
        tool_minigun_desc: 'Rapid fire',
        tool_laser_desc: 'Powerful beam',
        tool_tesla_desc: 'Chain lightning',
        tool_slowfield_desc: 'Slows enemies',
        tool_radar: 'Radar',
        tool_radar_desc: 'Reveals local threats around the core',
        tool_missile_desc: 'Heavy rockets against distant targets',
        tool_repairhub: 'Repair Hub',
        tool_repairhub_desc: 'Boosts nearby structure repairs',

        // Wave alerts
        wave_miniboss: 'MINI-BOSS',
        wave_boss_incoming: 'BOSS INCOMING',

        // Achievement
        ach_unlocked: 'Achievement Unlocked!',

        // Perk activation
        perk_activated: 'PERK ACTIVATED!',

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
        perk_explosive_desc: 'Bullets explode on impact.',

        // v2.0 Perks
        perk_ricochet: 'Ricochet',
        perk_ricochet_desc: 'Bullets bounce to nearest enemy.',
        perk_critical: 'Critical Hit',
        perk_critical_desc: 'Chance to deal double damage.',
        perk_slow_bullets: 'Slowing Bullets',
        perk_slow_bullets_desc: 'Bullets slow down enemies.',
        perk_life_steal: 'Building Lifesteal',
        perk_life_steal_desc: 'Buildings restore HP from damage.',
        perk_overdrive: 'Overdrive',
        perk_overdrive_desc: 'Fire rate and movement +20%.',
        perk_salvage: 'Salvage',
        perk_salvage_desc: 'More resources from enemy kills.',
        perk_nanoburst: 'Nano Burst',
        perk_nanoburst_desc: 'Instantly repairs structures around player.',
        perk_hunter_protocol: 'Hunter Protocol',
        perk_hunter_protocol_desc: 'Bonus damage against elite enemies.',

        // Changelog
        changelog_title: 'Updates',
        changelog_new: 'NEW',
        changelog_version: 'Version',

        // v2.0 Buildings
        tool_tesla: 'Tesla',
        tool_slowfield: 'Slow Field',
        tool_missile: 'Missile',
        tool_shieldgen: 'Shield Gen',

        // v2.0 Enemies
        enemy_healer: 'Healer',
        enemy_splitter: 'Splitter',
        enemy_shieldbearer: 'Shield Bearer',
        enemy_teleporter: 'Teleporter',
        enemy_swarm: 'Swarm',
        enemy_miniboss: 'Mini-Boss',
        enemy_saboteur: 'Saboteur',
        enemy_juggernaut: 'Juggernaut',
        enemy_phasewalker: 'Phasewalker',

        // Achievements
        achievements_title: 'Achievements',
        ach_first_blood: 'First Blood',
        ach_first_blood_desc: 'Kill 10 enemies',
        ach_architect: 'Architect',
        ach_architect_desc: 'Build 50 buildings',
        ach_survivor: 'Survivor',
        ach_survivor_desc: 'Reach wave 20',
        ach_boss_killer: 'Boss Killer',
        ach_boss_killer_desc: 'Defeat 5 bosses',
        ach_energetic: 'Energetic',
        ach_energetic_desc: 'Store 500 energy',
        ach_mass_killer: 'Mass Killer',
        ach_mass_killer_desc: 'Kill 100 enemies',
        ach_builder: 'Builder',
        ach_builder_desc: 'Build 100 buildings',
        ach_wave_master: 'Wave Master',
        ach_wave_master_desc: 'Reach wave 50',

        // Stats
        stats_title: 'Statistics',
        stats_enemies_killed: 'Enemies Killed',
        stats_buildings_built: 'Buildings Built',
        stats_damage_dealt: 'Damage Dealt',
        stats_resources_mined: 'Resources Mined',
        stats_time_played: 'Time Played',
        stats_wave_reached: 'Wave Reached',

        // Endless mode
        endless_mode: 'Endless Mode',
        endless_unlocked: 'Endless mode unlocked!',

        // Wave patterns
        wave_pattern_speed: '⚠️ SPEED SWARM',
        wave_pattern_ranged: '⚠️ RANGED ATTACK',
        wave_pattern_explosive: '⚠️ EXPLOSIVE RAIN',
        wave_pattern_heavy: '⚠️ HEAVY ASSAULT',
        wave_mutator_fog: 'MUTATOR: FOG',
        wave_mutator_overcharge: 'MUTATOR: OVERCHARGE',
        wave_mutator_swarm: 'MUTATOR: SWARM',

        store_title: 'Virtual Store',
        store_buy: 'Buy',
        store_reward: 'Watch Ad',
        store_auth: 'Sign In',
        store_auth_desc: 'Sign in to keep purchases linked to your account.',
        store_pack_biomass_s: 'Biomass Pack S',
        store_pack_biomass_s_desc: '+300 biomass',
        store_pack_biomass_l: 'Biomass Pack L',
        store_pack_biomass_l_desc: '+1300 biomass',
        store_pack_metal_s: 'Metal Pack S',
        store_pack_metal_s_desc: '+450 metal',
        store_booster_double_rewards: 'x2 Rewards',
        store_booster_double_rewards_desc: 'Double rewards for 7 minutes',
        store_booster_overdrive: 'Combat Overdrive',
        store_booster_overdrive_desc: 'Damage and fire tempo for 7 minutes',
        store_purchase_ok: 'Purchase applied!',
        store_purchase_fail: 'Purchase failed',
        store_pending_applied: 'Recovered unconsumed purchases',
        store_reward_progress: 'Ad progress:',
        store_reward_steps: 'views required'
    }
};
