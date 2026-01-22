// UI Constants for consistent styling across the game

// Z-Index Layers (organized from back to front)
export const Z_INDEX = {
    // Game elements
    GAME_WORLD: 0,

    // Background UI
    JOYSTICKS: 900,

    // Main UI elements
    HUD_PANELS: 1000,
    TOOLBAR: 1010,
    MINIMAP: 1020,
    SETTINGS_BUTTON: 1030,

    // Wave/info overlays
    WAVE_PANEL: 1100,
    INFO_PANEL: 1100,

    // Lighting (should be above game, below UI)
    LIGHTING: 5000,

    // Effects
    VOID_OVERLAY: 8000,

    // Modal overlays (highest)
    OVERLAY_MENU: 10000,
    OVERLAY_SETTINGS: 10001,
    OVERLAY_GAMEOVER: 10002,
    OVERLAY_PERK: 10003,
} as const;

// Responsive breakpoints
export const BREAKPOINTS = {
    MOBILE: 800,
    TABLET: 1024,
    DESKTOP: 1280,
} as const;

// Touch-friendly minimum sizes (Apple HIG recommends 44px)
export const TOUCH_SIZES = {
    MIN_BUTTON: 44,
    MIN_ICON: 24,
    JOYSTICK: 130,
    JOYSTICK_KNOB: 55,
} as const;

// Safe area for notched devices
export const SAFE_AREA = {
    TOP: 'env(safe-area-inset-top, 0px)',
    BOTTOM: 'env(safe-area-inset-bottom, 0px)',
    LEFT: 'env(safe-area-inset-left, 0px)',
    RIGHT: 'env(safe-area-inset-right, 0px)',
} as const;

// UI Positions (avoid conflicts)
export const UI_POSITIONS = {
    // Top-left: Player HUD
    HUD_PLAYER: { top: 20, left: 20 },

    // Top-center: Core HP
    HUD_CORE: { top: 20 },

    // Top-right: Minimap (with settings button inside or below)
    MINIMAP: { top: 20, right: 20 },
    SETTINGS_BUTTON_OFFSET: 10, // Below minimap

    // Center-top: Wave timer
    WAVE_PANEL: { top: 60 },

    // Left side: Resources
    RESOURCES: { top: 110, left: 20 },

    // Bottom-center: Toolbar
    TOOLBAR: { bottom: 20 },

    // Bottom-left: Left joystick (mobile)
    JOYSTICK_LEFT: { bottom: 30, left: 30 },

    // Bottom-right: Right joystick (mobile) - NO hudTime here!
    JOYSTICK_RIGHT: { bottom: 30, right: 30 },

    // Time indicator moved to top-left area (below resources on desktop)
    // or hidden on mobile
} as const;

// Colors
export const COLORS = {
    PRIMARY: '#3498db',
    SUCCESS: '#2ecc71',
    WARNING: '#f1c40f',
    DANGER: '#e74c3c',
    SECONDARY: '#9b59b6',

    PANEL_BG: 'rgba(15, 15, 15, 0.9)',
    PANEL_BG_MOBILE: 'rgba(15, 15, 15, 0.7)',
    PANEL_BORDER: '#333',

    TEXT_PRIMARY: '#ffffff',
    TEXT_SECONDARY: '#aaaaaa',
} as const;
