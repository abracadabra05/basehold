import { Application } from 'pixi.js';
import './style.css';

(async () => {
  // Создаем приложение
  const app = new Application();

  // Инициализируем. Параметр 'preference: webgpu' просит браузер использовать новый графический API
  await app.init({
    background: '#2c3e50', // Временный синий цвет фона, чтобы видеть, что работает
    resizeTo: window,       // Автоматически растягивать на всё окно
    preference: 'webgpu',   // Предпочитать WebGPU (fallback на WebGL)
  });

  // Добавляем холст (canvas) на страницу
  document.body.appendChild(app.canvas);

  // Выводим в консоль тип рендера (чтобы убедиться, что WebGPU включился)
  console.log('Render type:', app.renderer.type);
})();