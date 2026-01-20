import { Application } from "pixi.js";
import "./style.css";
import { Game } from "./Game";
import { yaSdk } from "./YandexSDK";

(async () => {
  const app = new Application();

    await app.init({
        background: '#1a1a1a',
        resizeTo: window,
        preference: 'webgl', 
        antialias: true,     
        autoDensity: true,   
        resolution: window.devicePixelRatio || 1, 
    });

  document.body.appendChild(app.canvas);

  // Сначала инициализируем SDK (ожидаем загрузки языка и окружения)
  await yaSdk.init();

  // Инициализируем игру
  const game = new Game(app);
  game.init();

  // Сообщаем платформе, что игра готова
  yaSdk.gameReady();
})();