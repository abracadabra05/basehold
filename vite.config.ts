import { defineConfig } from "vite";

export default defineConfig({
  // Это заставляет Vite использовать относительные пути (./style.css вместо /style.css)
  // Без этого игра не запустится на itch.io
  base: "./",
});
