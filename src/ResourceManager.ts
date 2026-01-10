export class ResourceManager {
    private metal: number = 0;
    private metalElement: HTMLElement;

    constructor() {
        // Создаем UI для ресурсов
        this.metalElement = document.createElement('div');
        this.metalElement.style.position = 'absolute';
        this.metalElement.style.top = '20px';
        this.metalElement.style.left = '20px';
        this.metalElement.style.color = 'white';
        this.metalElement.style.fontFamily = 'Arial, sans-serif';
        this.metalElement.style.fontSize = '24px';
        this.metalElement.style.fontWeight = 'bold';
        this.metalElement.style.textShadow = '2px 2px 0 #000';
        
        document.body.appendChild(this.metalElement);
        this.updateUI();
    }

    public addMetal(amount: number) {
        this.metal += amount;
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
        this.metalElement.innerText = `🔩 Metal: ${Math.floor(this.metal)}`;
    }
}