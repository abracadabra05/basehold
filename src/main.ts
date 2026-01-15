import { Application } from "pixi.js";
import "./style.css";
import { Game } from "./Game";

(async () => {
  const app = new Application();

    await app.init({
        background: '#1a1a1a',
        resizeTo: window,
        preference: 'webgl', // webgpu иногда глючит с antialias на старых драйверах, webgl надежнее для 2d
        antialias: true,     // <--- СГЛАЖИВАНИЕ
        autoDensity: true,   // Корректная работа с CSS пикселями
        resolution: window.devicePixelRatio || 1, // Высокое разрешение для Retina/4k экранов
    });

  document.body.appendChild(app.canvas);

  // Инициализируем игру
  const game = new Game(app);
  game.init();
})();
