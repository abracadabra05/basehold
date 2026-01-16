export class VirtualJoystick {
    public static activeTouchIds: Set<number> = new Set();
    public static activeJoysticks: Set<VirtualJoystick> = new Set();

    public static isTouchCaptured(pointerId: number): boolean {
        return this.activeTouchIds.has(pointerId);
    }

    public static activeCount(): number {
        return this.activeJoysticks.size;
    }

    private container: HTMLElement;
    private knob: HTMLElement;
    private touchId: number | null = null;
    private pointerId: number | null = null;
    
    public value: { x: number, y: number } = { x: 0, y: 0 };
    public isActive: boolean = false;
    
    private centerX: number = 0;
    private centerY: number = 0;
    private maxRadius: number = 50;

    constructor(parent: HTMLElement, side: 'left' | 'right') {
        this.container = document.createElement('div');
        this.container.style.position = 'absolute';
        this.container.style.width = '120px';
        this.container.style.height = '120px';
        this.container.style.borderRadius = '50%';
        this.container.style.background = 'rgba(255, 255, 255, 0.02)';
        this.container.style.border = '2px solid rgba(255, 255, 255, 0.06)';
        this.container.style.touchAction = 'none'; 
        this.container.style.pointerEvents = 'auto';
        this.container.style.zIndex = '3000';
        this.container.style.display = 'none'; 
        
        // Позиционирование
        this.container.style.bottom = '0px';
        if (side === 'left') this.container.style.left = '0px';
        else this.container.style.right = '0px';

        this.knob = document.createElement('div');
        this.knob.style.position = 'absolute';
        this.knob.style.width = '50px';
        this.knob.style.height = '50px';
        this.knob.style.borderRadius = '50%';
        this.knob.style.background = 'rgba(255, 255, 255, 0.15)';
        this.knob.style.left = '50%';
        this.knob.style.top = '50%';
        this.knob.style.transform = 'translate(-50%, -50%)';
        this.knob.style.pointerEvents = 'none';

        this.container.appendChild(this.knob);
        parent.appendChild(this.container);

        this.initEvents();
    }

    public show() {
        this.container.style.display = 'block';
    }

    private initEvents() {
        const blockPointer = (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
        };
        this.container.addEventListener('pointerdown', (e) => {
            blockPointer(e);
            if (this.isActive) return;
            const pe = e as PointerEvent;
            this.pointerId = pe.pointerId;
            this.isActive = true;
            VirtualJoystick.activeTouchIds.add(this.pointerId);
            VirtualJoystick.activeJoysticks.add(this);
            if (this.container.setPointerCapture) {
                this.container.setPointerCapture(this.pointerId);
            }
            const rect = this.container.getBoundingClientRect();
            this.centerX = rect.left + rect.width / 2;
            this.centerY = rect.top + rect.height / 2;
            this.updateKnob(pe.clientX, pe.clientY);
        });
        this.container.addEventListener('pointermove', (e) => {
            blockPointer(e);
            const pe = e as PointerEvent;
            if (this.pointerId !== null && pe.pointerId === this.pointerId) {
                this.updateKnob(pe.clientX, pe.clientY);
            }
        });
        this.container.addEventListener('pointerup', (e) => {
            blockPointer(e);
            const pe = e as PointerEvent;
            if (this.pointerId !== null && pe.pointerId !== this.pointerId) return;
            if (this.pointerId !== null) {
                VirtualJoystick.activeTouchIds.delete(this.pointerId);
                if (this.container.releasePointerCapture) {
                    this.container.releasePointerCapture(this.pointerId);
                }
            }
            VirtualJoystick.activeJoysticks.delete(this);
            this.pointerId = null;
            this.reset();
        });
        this.container.addEventListener('pointercancel', (e) => {
            blockPointer(e);
            if (this.pointerId !== null) {
                VirtualJoystick.activeTouchIds.delete(this.pointerId);
                if (this.container.releasePointerCapture) {
                    this.container.releasePointerCapture(this.pointerId);
                }
            }
            VirtualJoystick.activeJoysticks.delete(this);
            this.pointerId = null;
            this.reset();
        });

        this.container.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (this.isActive) return;
            const touch = e.changedTouches[0];
            this.touchId = touch.identifier;
            this.isActive = true;
            if (this.pointerId === null) {
                VirtualJoystick.activeTouchIds.add(this.touchId);
                VirtualJoystick.activeJoysticks.add(this);
            }
            
            const rect = this.container.getBoundingClientRect();
            this.centerX = rect.left + rect.width / 2;
            this.centerY = rect.top + rect.height / 2;
            
            this.updateKnob(touch.clientX, touch.clientY);
        }, { passive: false });

        this.container.addEventListener('touchmove', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!this.isActive) return;
            
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === this.touchId) {
                    const touch = e.changedTouches[i];
                    this.updateKnob(touch.clientX, touch.clientY);
                    break;
                }
            }
        }, { passive: false });

        const endHandler = (e: TouchEvent) => {
            e.preventDefault();
            e.stopPropagation();
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === this.touchId) {
                    if (this.pointerId === null && this.touchId !== null) {
                        VirtualJoystick.activeTouchIds.delete(this.touchId);
                        VirtualJoystick.activeJoysticks.delete(this);
                    }
                    this.touchId = null;
                    this.reset();
                    break;
                }
            }
        };

        this.container.addEventListener('touchend', endHandler);
        this.container.addEventListener('touchcancel', endHandler);
    }

    private updateKnob(clientX: number, clientY: number) {
        let dx = clientX - this.centerX;
        let dy = clientY - this.centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > this.maxRadius) {
            const ratio = this.maxRadius / dist;
            dx *= ratio;
            dy *= ratio;
        }

        this.knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
        
        // Нормализация значения от -1 до 1
        this.value.x = dx / this.maxRadius;
        this.value.y = dy / this.maxRadius;
    }

    private reset() {
        this.isActive = false;
        this.touchId = null;
        this.value = { x: 0, y: 0 };
        this.knob.style.transform = 'translate(-50%, -50%)';
    }
}
