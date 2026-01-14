import { Application } from "pixi.js";
import "./style.css";
import { Game } from "./Game";

(async () => {
  const app = new Application();

  await app.init({
    background: "#1a1a1a",
    resizeTo: window,
    preference: "webgpu",
  });

  document.body.appendChild(app.canvas);

  // Инициализируем игру
  const game = new Game(app);
  game.init();
})();
