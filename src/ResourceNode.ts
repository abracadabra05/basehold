import { Container, Graphics } from "pixi.js";

export class ResourceNode extends Container {
  public resourceType: string = "metal";
  public amount: number = 1000; // Сколько руды в жиле

  constructor(size: number) {
    super();

    const g = new Graphics();
    // Рисуем "камень"
    g.circle(size / 2, size / 2, size / 3);
    g.fill(0xa0a0a0); // Серебряный цвет

    // Добавляем блеск/детали
    g.circle(size / 2 - 5, size / 2 - 5, 4);
    g.fill(0xffffff);

    this.addChild(g);
  }
}
