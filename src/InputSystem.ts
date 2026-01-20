import { FederatedPointerEvent, Container, Rectangle } from "pixi.js";
import { VirtualJoystick } from "./VirtualJoystick";

export class InputSystem {
  private stage: Container;

  public isRightMouseDown: boolean = false;
  public mousePosition: { x: number; y: number } = { x: 0, y: 0 };

  private keys: { [key: string]: boolean } = {};

  private leftJoystick!: VirtualJoystick;
  private rightJoystick!: VirtualJoystick;
  public isMobile: boolean = false;

  public onSpacePressed?: () => void;
  public onToggleBuildMode?: () => void;
  public onRightClick?: () => void; // Добавлено
  public onNumberPressed?: (index: number) => void; // Добавлено

  constructor(stage: Container) {
    this.stage = stage;
  }

  public init(screenRect: Rectangle) {
    this.checkMobile();
    this.createMobileControls();

    window.oncontextmenu = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    this.stage.eventMode = "static";
    this.stage.hitArea = screenRect;

    this.stage.on("globalmousemove", (e: FederatedPointerEvent) => {
      this.mousePosition = { x: e.global.x, y: e.global.y };
    });
    this.stage.on("pointermove", (e: FederatedPointerEvent) => {
      this.mousePosition = { x: e.global.x, y: e.global.y };
    });

    window.addEventListener("mousemove", (e) => {
      this.mousePosition = { x: e.clientX, y: e.clientY };
    });

    // --- GLOBAL WINDOW EVENTS ---

    const isGameCanvas = (e: Event) => {
      const target = e.target as HTMLElement;
      // Если цель - не канвас (а кнопка, джойстик, див меню), то это UI
      return target.tagName === "CANVAS";
    };

    window.addEventListener("mousedown", (e) => {
      if (!isGameCanvas(e)) return; // ИГНОРИРУЕМ ВСЁ, ЧТО НЕ КАНВАС
      if (e.button === 2) {
        this.isRightMouseDown = true;
        if (this.onRightClick) this.onRightClick();
      }
    });

    window.addEventListener("mouseup", (e) => {
      if (e.button === 2) this.isRightMouseDown = false;
    });

    window.addEventListener(
      "touchstart",
      (e) => {
        // Если коснулись интерфейса - игра не должна реагировать
        if (!isGameCanvas(e)) return;

        // Ноль реакции, обработка внутри Pixi или джойстиков
      },
      { passive: false },
    );

    window.addEventListener("pointerdown", (e) => {
      if (!isGameCanvas(e)) return;
      if (e.button === 2) this.isRightMouseDown = true;
    });

    window.addEventListener("pointerup", (e) => {
      if (e.button === 2) this.isRightMouseDown = false;
    });

    window.addEventListener("blur", () => {
      this.isRightMouseDown = false;
      this.keys = {};
    });

        // --- KEYBOARD ---
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Space') {
                if (this.onSpacePressed) this.onSpacePressed();
            }
            if (e.code === 'Escape') {
                if (this.onToggleBuildMode) this.onToggleBuildMode(); 
            }
            // Цифры 1-9
            if (e.code.startsWith('Digit')) {
                const num = parseInt(e.code.replace('Digit', ''));
                if (!isNaN(num) && num > 0 && num <= 9) {
                    if (this.onNumberPressed) this.onNumberPressed(num - 1); // Индекс 0-8
                }
            }
        });
    window.addEventListener("keyup", (e) => {
      this.keys[e.code] = false;
    });
  }

  private checkMobile() {
    this.isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      );
    this.isMobile = this.isMobile || "ontouchstart" in window;
  }

  private createMobileControls() {
    if (!this.isMobile) return;

    const leftJoystickContainer = document.createElement("div");
    leftJoystickContainer.style.width = "120px";
    leftJoystickContainer.style.height = "120px";
    leftJoystickContainer.style.position = "absolute";
    leftJoystickContainer.style.bottom = "40px";
    leftJoystickContainer.style.left = "40px";

    leftJoystickContainer.style.pointerEvents = "auto";
    leftJoystickContainer.style.touchAction = "none";
    leftJoystickContainer.style.zIndex = "950";

    document.body.appendChild(leftJoystickContainer);

    const rightJoystickContainer = document.createElement("div");
    rightJoystickContainer.style.width = "120px";
    rightJoystickContainer.style.height = "120px";
    rightJoystickContainer.style.position = "absolute";
    rightJoystickContainer.style.bottom = "40px";
    rightJoystickContainer.style.right = "40px";

    rightJoystickContainer.style.pointerEvents = "auto";
    rightJoystickContainer.style.touchAction = "none";
    rightJoystickContainer.style.zIndex = "950";

    document.body.appendChild(rightJoystickContainer);

    this.leftJoystick = new VirtualJoystick(leftJoystickContainer, "left");
    this.leftJoystick.show();

    this.rightJoystick = new VirtualJoystick(rightJoystickContainer, "right");
    this.rightJoystick.show();

    // Кнопка Build удалена по просьбе
  }

  public getMovementVector(): { x: number; y: number } {
    const v = { x: 0, y: 0 };

    if (this.keys["KeyW"] || this.keys["ArrowUp"]) v.y -= 1;
    if (this.keys["KeyS"] || this.keys["ArrowDown"]) v.y += 1;
    if (this.keys["KeyA"] || this.keys["ArrowLeft"]) v.x -= 1;
    if (this.keys["KeyD"] || this.keys["ArrowRight"]) v.x += 1;

    if (this.isMobile && this.leftJoystick && this.leftJoystick.isActive) {
      v.x = this.leftJoystick.value.x;
      v.y = this.leftJoystick.value.y;
    }

    if (!this.leftJoystick?.isActive && (v.x !== 0 || v.y !== 0)) {
      const len = Math.sqrt(v.x * v.x + v.y * v.y);
      v.x /= len;
      v.y /= len;
    }

    return v;
  }

  public getAimVector(): { x: number; y: number } | null {
    if (this.isMobile && this.rightJoystick && this.rightJoystick.isActive) {
      return this.rightJoystick.value;
    }
    return null;
  }

  public isShooting(): boolean {
    if (this.isMobile && this.rightJoystick) {
      return (
        this.rightJoystick.isActive &&
        (Math.abs(this.rightJoystick.value.x) > 0.3 ||
          Math.abs(this.rightJoystick.value.y) > 0.3)
      );
    }
    return this.isRightMouseDown;
  }

  public getMouseWorldPosition(worldContainer: Container): {
    x: number;
    y: number;
  } {
    return worldContainer.toLocal(this.mousePosition);
  }
}
