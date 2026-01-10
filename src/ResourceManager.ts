export class ResourceManager {
    private metal: number = 0;
    private biomass: number = 0;
    private energyProduced: number = 0;
    private energyConsumed: number = 0;
    private uiElement: HTMLElement;

    constructor() {
        this.uiElement = document.createElement('div');
        this.uiElement.style.position = 'absolute';
        this.uiElement.style.top = '20px';
        this.uiElement.style.left = '20px';
        this.uiElement.style.color = 'white';
        this.uiElement.style.fontFamily = 'Arial, sans-serif';
        this.uiElement.style.fontSize = '20px';
        this.uiElement.style.fontWeight = 'bold';
        this.uiElement.style.textShadow = '2px 2px 0 #000';
        this.uiElement.style.pointerEvents = 'none';
        
        document.body.appendChild(this.uiElement);
        this.updateUI();
    }

    public addMetal(amount: number) {
        this.metal += amount;
        this.updateUI();
    }

    public addBiomass(amount: number) {
        this.biomass += amount;
        this.updateUI();
    }

    // <--- НОВЫЙ МЕТОД
    public spendBiomass(amount: number): boolean {
        if (this.biomass >= amount) {
            this.biomass -= amount;
            this.updateUI();
            return true;
        }
        return false;
    }

    public hasMetal(amount: number): boolean {
        return this.metal >= amount;
    }

    public spendMetal(amount: number) {
        if (this.metal >= amount) {
            this.metal -= amount;
            this.updateUI();
        }
    }

    public updateEnergy(produced: number, consumed: number) {
        this.energyProduced = produced;
        this.energyConsumed = consumed;
        this.updateUI();
    }

    private updateUI() {
        // Цвет энергии: Желтый, если все ок. Красный, если перегрузка.
        const energyColor = (this.energyProduced >= this.energyConsumed) ? '#f1c40f' : '#e74c3c';

        this.uiElement.innerHTML = `
            <span style="color: #bdc3c7">🔩 Metal: ${Math.floor(this.metal)}</span><br>
            <span style="color: #9b59b6">🧬 Biomass: ${Math.floor(this.biomass)}</span><br>
            <span style="color: ${energyColor}">⚡ Energy: ${this.energyConsumed} / ${this.energyProduced}</span>
        `;
    }
}