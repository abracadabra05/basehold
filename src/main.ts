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

  // Сначала инициализируем SDK, но не блокируем игру насмерть
  try {
      await yaSdk.init();
  } catch (e) {
      console.warn('SDK init failed, starting game anyway:', e);
  }

  // Инициализируем игру
  const game = new Game(app);
  game.init();

  // Сообщаем платформе, что игра готова
  yaSdk.gameReady();
})();