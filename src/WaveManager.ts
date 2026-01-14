import { Ticker } from "pixi.js";

export class WaveManager {
  private spawnCallback: (waveNum: number, count: number) => void;
  private onOpenShopCallback: () => void; // Колбек для открытия магазина

  private waveTimer: number = 0;
  private timeBetweenWaves: number = 600; // 10 секунд между волнами
  private prepTime: number = 1800; // 30 секунд (при 60 FPS) подготовки

  public waveCount: number = 1;
  private uiElement: HTMLElement;

  // Флаг паузы (пока магазин открыт)
  private isPaused: boolean = false;
  // Флаг подготовки
  private isPrepPhase: boolean = true;

  constructor(
    spawnCallback: (waveNum: number, count: number) => void,
    onOpenShopCallback: () => void,
  ) {
    this.spawnCallback = spawnCallback;
    this.onOpenShopCallback = onOpenShopCallback;

    this.uiElement = document.createElement("div");
    this.uiElement.style.position = "absolute";
    this.uiElement.style.top = "20px";
    this.uiElement.style.right = "20px";
    this.uiElement.style.color = "red";
    this.uiElement.style.fontFamily = "Arial, sans-serif";
    this.uiElement.style.fontSize = "24px";
    this.uiElement.style.fontWeight = "bold";
    this.uiElement.style.textShadow = "2px 2px 0 #000";
    document.body.appendChild(this.uiElement);
  }

  public get isShopOpen(): boolean {
    return this.isPaused;
  }

  public resume() {
    this.isPaused = false;
    // После закрытия магазина сразу запускаем следующую волну
    this.startWave();
  }

  public update(ticker: Ticker) {
    if (this.isPaused) return;

    // Если фаза подготовки
    if (this.isPrepPhase) {
      this.prepTime -= ticker.deltaTime;
      const timeLeft = Math.ceil(this.prepTime / 60);
      this.uiElement.innerText = `🛡️ Prep Time: ${timeLeft}s`;
      this.uiElement.style.color = "#3498db"; // Синий цвет

      if (this.prepTime <= 0) {
        this.isPrepPhase = false;
        this.startWave();
      }
      return;
    }

    // Обычная фаза между волнами
    this.waveTimer += ticker.deltaTime;
    const timeLeft = Math.ceil((this.timeBetweenWaves - this.waveTimer) / 60);
    this.uiElement.innerText = `💀 Wave ${this.waveCount} in: ${timeLeft}s`;
    this.uiElement.style.color = "red";

    if (this.waveTimer >= this.timeBetweenWaves) {
      // ПРОВЕРКА МАГАЗИНА:
      // Если следующая волна будет (5, 10, 15...), то ПЕРЕД ней открываем магазин
      // (waveCount сейчас равен номеру следующей волны, т.к. увеличивается в конце startWave,
      // но тут логичнее так: waveCount = 1 (идет 1), waveCount = 5 (идет 5).
      // Давай сделаем так: После завершения 5-й волны? Нет, перед 6-й.
      // Проще: если (waveCount - 1) % 5 === 0 && waveCount > 1...

      // Давай проще: Магазин открывается ПЕРЕД 6, 11, 16 волной.
      // То есть если (this.waveCount - 1) % 5 === 0 ? Нет.
      // Если сейчас Wave 5 должна начаться, то таймер дотикал.
      // Мы спавним Wave 5.

      // Задача: "Магазин каждые 5 волн".
      // Значит: 1, 2, 3, 4, 5 -> МАГАЗИН -> 6, 7...
      // Значит, когда таймер дотикал для волны 6.
      if (this.waveCount > 1 && (this.waveCount - 1) % 5 === 0) {
        // Если мы тут, значит таймер дотикал для волны 6, 11 и т.д.
        // Ставим паузу и открываем шоп
        this.isPaused = true;
        this.waveTimer = 0; // Сброс таймера
        this.onOpenShopCallback();
      } else {
        this.startWave();
      }
    }
  }

  private startWave() {
    this.waveTimer = 0;
    const enemiesToSpawn = 3 + Math.floor(this.waveCount * 1.5);
    console.log(`Wave ${this.waveCount} started!`);
    this.spawnCallback(this.waveCount, enemiesToSpawn);
    this.waveCount++;
  }
}
