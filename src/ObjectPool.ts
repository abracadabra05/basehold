export class ObjectPool<T> {
    private pool: T[] = [];
    private factory: () => T;
    private resetFn: (item: T) => void;

    constructor(factory: () => T, resetFn: (item: T) => void, initialSize: number = 0) {
        this.factory = factory;
        this.resetFn = resetFn;

        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.factory());
        }
    }

    public get(): T {
        if (this.pool.length > 0) {
            const item = this.pool.pop()!;
            this.resetFn(item);
            return item;
        }
        return this.factory();
    }

    public return(item: T) {
        this.pool.push(item);
    }
}
