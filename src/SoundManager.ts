export class SoundManager {
    private ctx: AudioContext;
    private masterGain: GainNode;
    private compressor: DynamicsCompressorNode;
    private isMuted: boolean = false;
    
    // Для ограничения частоты звуков (чтобы не было каши)
    private lastHitTime: number = 0;

    constructor() {
        // @ts-ignore
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioContextClass();

        // 1. Создаем компрессор (он будет "прижимать" громкие звуки)
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.value = -10; // Начинаем сжимать, если громче -10dB
        this.compressor.knee.value = 40;
        this.compressor.ratio.value = 12; // Сильное сжатие
        this.compressor.attack.value = 0;
        this.compressor.release.value = 0.25;

        // 2. Главная громкость
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.3; 

        // 3. Цепь: Звук -> MasterGain -> Compressor -> Динамики
        this.masterGain.connect(this.compressor);
        this.compressor.connect(this.ctx.destination);
    }

    private playTone(freq: number, type: OscillatorType, duration: number, volume: number = 0.1, slideTo: number | null = null) {
        if (this.isMuted) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        // PITCH VARIATION: +/- 10%
        // Это делает звук "живым"
        const variation = 1 + (Math.random() - 0.5) * 0.2;
        const finalFreq = freq * variation;
        const finalSlide = slideTo ? slideTo * variation : null;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(finalFreq, this.ctx.currentTime);
        
        if (finalSlide) {
            osc.frequency.exponentialRampToValueAtTime(finalSlide, this.ctx.currentTime + duration);
        }

        // Огибающая громкости
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    // --- ЗВУКОВЫЕ ПРЕСЕТЫ ---

    public playShoot() {
        // Сделали тише: volume = 0.08 (было 0.3)
        this.playTone(600, 'square', 0.1, 0.08, 100);
    }

    public playTurretShoot() {
        // Турели тоже тише
        this.playTone(400, 'square', 0.1, 0.05, 50);
    }

    public playHit() {
        // ЗАЩИТА ОТ ПЕРЕГРУЗА:
        // Если с прошлого звука прошло меньше 100мс, не играем новый
        const now = this.ctx.currentTime;
        if (now - this.lastHitTime < 0.1) return;
        this.lastHitTime = now;

        // Тише и ниже
        this.playTone(150, 'sawtooth', 0.1, 0.1, 50);
    }

    public playBuild() {
        this.playTone(800, 'sine', 0.15, 0.1);
        setTimeout(() => this.playTone(1200, 'sine', 0.2, 0.1), 50);
    }

    public playMine() {
        // Очень тихо
        this.playTone(100, 'triangle', 0.05, 0.05);
    }

    public playError() {
        this.playTone(150, 'sawtooth', 0.2, 0.1, 100);
    }

    public playGameOver() {
        this.playTone(300, 'triangle', 0.5, 0.2, 200);
        setTimeout(() => this.playTone(250, 'triangle', 0.5, 0.2, 150), 400);
        setTimeout(() => this.playTone(200, 'triangle', 1.0, 0.2, 50), 800);
    }
}