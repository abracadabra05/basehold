import { Container, Ticker } from 'pixi.js';

export class Camera {
    private world: Container;
    private keys: { [key: string]: boolean } = {}; // Храним состояние клавиш
    private speed: number = 15; // Скорость камеры

    constructor(world: Container) {
        this.world = world;
        this.initInput();
    }

    private initInput() {
        // Слушаем нажатия клавиш
        window.addEventListener('keydown', (e) => { this.keys[e.code] = true; });
        window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
    }

    public update(ticker: Ticker) {
        // ticker.deltaTime помогает делать движение плавным независимо от FPS
        const moveSpeed = this.speed * ticker.deltaTime;

        // Логика: Если идем ВПРАВО (D), мир сдвигается ВЛЕВО (минус X), и так далее.
        if (this.keys['KeyW'] || this.keys['ArrowUp']) {
            this.world.y += moveSpeed;
        }
        if (this.keys['KeyS'] || this.keys['ArrowDown']) {
            this.world.y -= moveSpeed;
        }
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
            this.world.x += moveSpeed;
        }
        if (this.keys['KeyD'] || this.keys['ArrowRight']) {
            this.world.x -= moveSpeed;
        }
    }
}