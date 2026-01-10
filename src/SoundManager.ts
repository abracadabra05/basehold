export class SoundManager {
    private ctx: AudioContext;
    private masterGain: GainNode;
    private isMuted: boolean = false;

    constructor() {
        // Инициализируем аудио контекст
        // @ts-ignore (для совместимости с Safari иногда нужно webkitAudioContext, но в Pixi v8 проектах обычно стандарт)
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioContextClass();

        // Главная громкость
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.3; // 30% громкости, чтобы не оглохнуть
        this.masterGain.connect(this.ctx.destination);
    }

    // Метод для генерации простого звука
    private playTone(freq: number, type: OscillatorType, duration: number, slideTo: number | null = null) {
        if (this.isMuted) return;
        if (this.ctx.state === 'suspended') this.ctx.resume(); // Браузеры блокируют звук до первого клика

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        
        // Если нужно изменение частоты (например, "пиу" - падение частоты)
        if (slideTo) {
            osc.frequency.exponentialRampToValueAtTime(slideTo, this.ctx.currentTime + duration);
        }

        // Огибающая громкости (чтобы не было щелчков)
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    // --- ЗВУКОВЫЕ ПРЕСЕТЫ ---

    public playShoot() {
        // Быстрое падение частоты (Pew!)
        this.playTone(600, 'square', 0.1, 100);
    }

    public playTurretShoot() {
        // Чуть ниже и тише
        this.playTone(400, 'square', 0.1, 50);
    }

    public playHit() {
        // Короткий шум или низкая частота
        this.playTone(150, 'sawtooth', 0.1, 50);
    }

    public playBuild() {
        // Высокий приятный звук
        this.playTone(800, 'sine', 0.15);
        setTimeout(() => this.playTone(1200, 'sine', 0.2), 50);
    }

    public playMine() {
        // Низкий ритмичный звук
        this.playTone(100, 'triangle', 0.05);
    }

    public playError() {
        // Неприятный низкий звук
        this.playTone(150, 'sawtooth', 0.2, 100);
    }

    public playGameOver() {
        // Грустная последовательность
        this.playTone(300, 'triangle', 0.5, 200);
        setTimeout(() => this.playTone(250, 'triangle', 0.5, 150), 400);
        setTimeout(() => this.playTone(200, 'triangle', 1.0, 50), 800);
    }
}