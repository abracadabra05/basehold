import { Container } from 'pixi.js';

export class Camera {
    private world: Container;
    private target: Container | null = null;
    private appScreen: { width: number, height: number };

    constructor(world: Container, appScreen: { width: number, height: number }) {
        this.world = world;
        this.appScreen = appScreen;
    }

    public follow(target: Container) {
        this.target = target;
    }

    public update() {
        if (!this.target) return;

        // Центр экрана
        const screenCenterX = this.appScreen.width / 2;
        const screenCenterY = this.appScreen.height / 2;

        // Мы двигаем МИР в противоположную сторону от игрока, чтобы игрок казался в центре
        // Формула: ПозицияМира = ЦентрЭкрана - ПозицияИгрока
        this.world.x = screenCenterX - this.target.x;
        this.world.y = screenCenterY - this.target.y;
    }
    
    // Обновляем размеры, если окно браузера изменили
    public resize(width: number, height: number) {
        this.appScreen.width = width;
        this.appScreen.height = height;
    }
}