import type { ResourceManager } from "./ResourceManager";

export class UpgradeManager {
  private resourceManager: ResourceManager;
  private container: HTMLDivElement;
  private onCloseCallback: (() => void) | null = null; // Колбек при закрытии

  public damageLevel: number = 1;
  public mineSpeedLevel: number = 1;
  public moveSpeedLevel: number = 1;

  public onDamageUpgrade?: (val: number) => void;
  public onMineSpeedUpgrade?: (val: number) => void;
  public onMoveSpeedUpgrade?: (val: number) => void;

  constructor(resourceManager: ResourceManager) {
    this.resourceManager = resourceManager;

    this.container = document.createElement("div");
    this.initStyles();
    this.createUI();
    document.body.appendChild(this.container);

    // Скрываем по умолчанию
    this.hide();
  }

  // Метод для установки действия при закрытии
  public setOnClose(callback: () => void) {
    this.onCloseCallback = callback;
  }

  public show() {
    this.container.style.display = "flex";
  }

  public hide() {
    this.container.style.display = "none";
  }

  private initStyles() {
    this.container.style.position = "fixed"; // Фиксируем по центру экрана
    this.container.style.top = "50%";
    this.container.style.left = "50%";
    this.container.style.transform = "translate(-50%, -50%)";

    this.container.style.display = "flex";
    this.container.style.flexDirection = "column";
    this.container.style.gap = "15px";
    this.container.style.padding = "30px";
    this.container.style.background = "rgba(20, 20, 20, 0.95)"; // Темный фон
    this.container.style.border = "2px solid #9b59b6"; // Фиолетовая рамка
    this.container.style.borderRadius = "15px";
    this.container.style.boxShadow = "0 0 20px rgba(155, 89, 182, 0.5)";
    this.container.style.color = "white";
    this.container.style.fontFamily = "Arial, sans-serif";
    this.container.style.zIndex = "2000"; // Поверх всего
    this.container.style.minWidth = "300px";
    this.container.style.textAlign = "center";
  }

  private createUI() {
    this.container.innerHTML = `
            <h2 style="margin: 0 0 20px 0; color: #9b59b6;">🧬 Mutation Lab</h2>
            <p style="margin-bottom: 20px; font-size: 14px; color: #ccc;">Spend biomass to evolve.</p>
        `;

    const upgradesDiv = document.createElement("div");
    upgradesDiv.style.display = "flex";
    upgradesDiv.style.flexDirection = "column";
    upgradesDiv.style.gap = "10px";
    this.container.appendChild(upgradesDiv);

    this.createUpgradeBtn(
      upgradesDiv,
      "💥 Damage",
      () => this.damageLevel,
      () => {
        this.damageLevel++;
        if (this.onDamageUpgrade) this.onDamageUpgrade(this.damageLevel);
      },
    );

    this.createUpgradeBtn(
      upgradesDiv,
      "⛏️ Mining Speed",
      () => this.mineSpeedLevel,
      () => {
        this.mineSpeedLevel++;
        if (this.onMineSpeedUpgrade)
          this.onMineSpeedUpgrade(1 + (this.mineSpeedLevel - 1) * 0.2);
      },
    );

    this.createUpgradeBtn(
      upgradesDiv,
      "🏃 Move Speed",
      () => this.moveSpeedLevel,
      () => {
        this.moveSpeedLevel++;
        if (this.onMoveSpeedUpgrade)
          this.onMoveSpeedUpgrade(1 + (this.moveSpeedLevel - 1) * 0.1);
      },
    );

    // Кнопка закрытия / следующей волны
    const closeBtn = document.createElement("button");
    closeBtn.innerText = "Resume / Next Wave >>";
    closeBtn.style.marginTop = "20px";
    closeBtn.style.padding = "15px";
    closeBtn.style.fontSize = "18px";
    closeBtn.style.fontWeight = "bold";
    closeBtn.style.cursor = "pointer";
    closeBtn.style.background = "#27ae60";
    closeBtn.style.color = "white";
    closeBtn.style.border = "none";
    closeBtn.style.borderRadius = "8px";

    closeBtn.onclick = () => {
      this.hide();
      if (this.onCloseCallback) this.onCloseCallback();
    };

    this.container.appendChild(closeBtn);
  }

  private createUpgradeBtn(
    parent: HTMLElement,
    label: string,
    getLevel: () => number,
    onBuy: () => void,
  ) {
    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.justifyContent = "space-between";
    wrapper.style.alignItems = "center";
    wrapper.style.background = "rgba(255,255,255,0.1)";
    wrapper.style.padding = "10px";
    wrapper.style.borderRadius = "8px";

    const info = document.createElement("span");
    info.style.fontWeight = "bold";

    const btn = document.createElement("button");
    btn.style.cursor = "pointer";
    btn.style.padding = "5px 15px";
    btn.style.background = "#8e44ad";
    btn.style.color = "white";
    btn.style.border = "none";
    btn.style.borderRadius = "4px";

    const updateText = () => {
      const lvl = getLevel();
      const cost = 50 * lvl;
      btn.innerText = `Upgrade (${cost} 🧬)`;
      info.innerText = `${label} [Lvl ${lvl}]`;
    };

    btn.onclick = () => {
      const cost = 50 * getLevel();
      if (this.resourceManager.spendBiomass(cost)) {
        onBuy();
        updateText();
      } else {
        btn.style.background = "red";
        setTimeout(() => (btn.style.background = "#8e44ad"), 200);
      }
    };

    updateText();
    wrapper.appendChild(info);
    wrapper.appendChild(btn);
    parent.appendChild(wrapper);
  }
}
