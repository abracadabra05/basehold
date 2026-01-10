export class ResourceManager {
    private metal: number = 0;
    private biomass: number = 0; // <--- Новый ресурс
    private uiElement: HTMLElement;

    constructor() {
        this.uiElement = document.createElement('div');
        this.uiElement.style.position = 'absolute';
        this.uiElement.style.top = '20px';
        this.uiElement.style.left = '20px';
        this.uiElement.style.color = 'white';
        this.uiElement.style.fontFamily = 'Arial, sans-serif';
        this.uiElement.style.fontSize = '20px'; // Чуть меньше, чтобы влезло
        this.uiElement.style.fontWeight = 'bold';
        this.uiElement.style.textShadow = '2px 2px 0 #000';
        this.uiElement.style.pointerEvents = 'none'; // Чтобы клики проходили сквозь текст
        
        document.body.appendChild(this.uiElement);
        this.updateUI();
    }

    public addMetal(amount: number) {
        this.metal += amount;
        this.updateUI();
    }

    // <--- Новый метод
    public addBiomass(amount: number) {
        this.biomass += amount;
        this.updateUI();
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

    private updateUI() {
        // Отображаем оба ресурса
        this.uiElement.innerHTML = `
            <span style="color: #bdc3c7">🔩 Metal: ${Math.floor(this.metal)}</span><br>
            <span style="color: #9b59b6">🧬 Biomass: ${Math.floor(this.biomass)}</span>
        `;
    }
}