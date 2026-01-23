export class SoundManager {
    private ctx: AudioContext;
    private masterGain: GainNode;
    private compressor: DynamicsCompressorNode;
    private filter: BiquadFilterNode; // Фильтр для мягкости
    private isMuted: boolean = false;
    
    // Таймеры для предотвращения наложения звуков
    private lastSoundTime: Map<string, number> = new Map();
    private minInterval: number = 0.03; 

    constructor() {
        // @ts-ignore
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioContextClass();

        // 1. Фильтр (Lowpass) - срезает резкие верха
        this.filter = this.ctx.createBiquadFilter();
        this.filter.type = 'lowpass';
        this.filter.frequency.value = 3000; // Срезаем все что выше 3кГц (звон)
        this.filter.Q.value = 0.5; // Мягкий спад

        // 2. Компрессор
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.value = -15; 
        this.compressor.knee.value = 30;
        this.compressor.ratio.value = 12; 
        this.compressor.attack.value = 0.003; 
        this.compressor.release.value = 0.25;

        // 3. Главная громкость
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.3;

        // Цепь: MasterGain -> Filter -> Compressor -> Destination
        this.masterGain.connect(this.filter);
        this.filter.connect(this.compressor);
        this.compressor.connect(this.ctx.destination);
    }

    private playTone(
        freq: number,
        type: OscillatorType,
        duration: number,
        volume: number = 0.1,
        slideTo: number | null = null,
        category: string = 'default'
    ) {
        if (this.isMuted) return;
        if (this.ctx.state === "suspended") this.ctx.resume();

        const now = this.ctx.currentTime;
        
        // --- ЛОГИКА ЗАЩИТЫ ОТ НАЛОЖЕНИЯ ---
        // Проверяем интервал для конкретной категории
        const lastTime = this.lastSoundTime.get(category) || 0;
        let interval = this.minInterval;
        
        // Индивидуальные интервалы для категорий
        if (category === 'hit') interval = 0.1; // Удары не чаще 100мс
        if (category === 'shoot') interval = 0.05; // Выстрелы не чаще 50мс
        if (category === 'explosion') interval = 0.2; // Взрывы не чаще 200мс

        if (now - lastTime < interval) return;
        this.lastSoundTime.set(category, now);

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        if (slideTo) {
            osc.frequency.exponentialRampToValueAtTime(
                slideTo,
                this.ctx.currentTime + duration
            );
        }

        // Плавное затухание, чтобы не было щелчков
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    public playShoot() { 
        this.playTone(600, "triangle", 0.1, 0.25, 100, 'shoot'); // Было square
    }
    
    public playTurretShoot() { 
        this.playTone(400, "triangle", 0.1, 0.15, 50, 'shoot'); // Было square
    }
    
    public playHit() {
        this.playTone(150, "sawtooth", 0.1, 0.1, 50, 'hit'); // Оставим пилу для удара, но фильтр ее смягчит
    }

    public playEnemyHit() {
        this.playTone(80, "square", 0.1, 0.15, 40, 'hit'); // Было sawtooth
    }

    public playBuild() {
        this.playTone(800, "sine", 0.15, 0.1, null, 'ui');
        setTimeout(() => this.playTone(1200, "sine", 0.2, 0.1, null, 'ui'), 50);
    }

    public playMine() { 
        this.playTone(100, "triangle", 0.05, 0.05, null, 'mine'); 
    }
    
    public playError() { 
        this.playTone(150, "sawtooth", 0.2, 0.1, 100, 'ui'); 
    }
    
    public playExplosion() {
        this.playTone(100, "sawtooth", 0.3, 0.2, 20, 'explosion');
    }

    public playHeartbeat() {
        this.playTone(60, "sine", 0.15, 0.5, 40, 'ui'); // Низкий глухой звук
    }

    public playGameOver() {
        this.playTone(300, "triangle", 0.5, 0.2, 200, 'ui');
        setTimeout(() => this.playTone(250, "triangle", 0.5, 0.2, 150, 'ui'), 400);
        setTimeout(() => this.playTone(200, "triangle", 1.0, 0.2, 50, 'ui'), 800);
    }

    public getMuted(): boolean {
        return this.isMuted;
    }

    public setVolume(volume: number) {
        // volume: 0.0 to 1.0
        this.masterGain.gain.value = volume * 0.3; // 0.3 - базовая громкость
        this.isMuted = volume === 0;
    }

    public getVolume(): number {
        return this.masterGain.gain.value / 0.3;
    }

    public setMute(muted: boolean) {
        this.isMuted = muted;
        if (muted) {
            this.ctx.suspend();
        } else {
            this.ctx.resume();
        }
    }

    public toggleMute(): boolean {
        this.setMute(!this.isMuted);
        return this.isMuted;
    }

    public pause() {
        if (this.ctx.state === 'running') this.ctx.suspend();
    }

    public resume() {
        if (!this.isMuted && this.ctx.state === 'suspended') this.ctx.resume();
    }
}
