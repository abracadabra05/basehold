import { Container, Text, Ticker } from 'pixi.js';

export class FloatingText extends Container {
    private text: Text;
    public lifeTime: number = 60; // Время жизни (кадры)
    private velocityY: number = -1; // Скорость вверх

    constructor(x: number, y: number, value: string, color: string = '#ffffff', size: number = 16) {
        super();
        this.x = x;
        this.y = y;

        this.text = new Text({
            text: value,
            style: {
                fontFamily: 'Arial',
                fontSize: size,
                fill: color,
                stroke: { color: '#000000', width: 3 },
                fontWeight: 'bold'
            }
        });
        
        // Центрируем текст
        this.text.anchor.set(0.5);
        this.addChild(this.text);
        
        // Небольшой рандомный разлет по X
        this.x += (Math.random() - 0.5) * 10;
    }

    public update(ticker: Ticker) {
        this.lifeTime -= ticker.deltaTime;
        
        // Движение вверх с замедлением
        this.y += this.velocityY * ticker.deltaTime;
        this.velocityY *= 0.95; // Затухание скорости

        // Исчезновение
        if (this.lifeTime < 20) {
            this.alpha = this.lifeTime / 20;
        }

        // Удаление
        if (this.lifeTime <= 0) {
            this.destroy(); // Pixi метод удаления
        }
    }
}
