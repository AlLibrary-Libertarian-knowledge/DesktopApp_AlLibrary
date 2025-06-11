/**
 * Performance Optimization Utilities for AlLibrary
 * These utilities help optimize Canvas operations, animations, and reactivity
 */

// Performance Optimization 1: Canvas Renderer with Caching
export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private gradientCache = new Map<string, CanvasGradient>();
  private pathCache = new Map<string, Path2D>();
  private imageCache = new Map<string, ImageBitmap>();

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  // Cache expensive gradient operations
  getOrCreateGradient(key: string, factory: () => CanvasGradient): CanvasGradient {
    if (!this.gradientCache.has(key)) {
      this.gradientCache.set(key, factory());
    }
    return this.gradientCache.get(key)!;
  }

  // Cache Path2D objects for complex shapes
  getOrCreatePath(key: string, factory: () => Path2D): Path2D {
    if (!this.pathCache.has(key)) {
      this.pathCache.set(key, factory());
    }
    return this.pathCache.get(key)!;
  }

  // Batch operations for better performance
  batchDrawOperations(operations: Array<() => void>) {
    this.ctx.save();
    operations.forEach(op => op());
    this.ctx.restore();
  }

  // Efficient text measurement with caching
  private textMetricsCache = new Map<string, TextMetrics>();

  measureTextCached(text: string, font?: string): TextMetrics {
    const key = `${text}-${font || this.ctx.font}`;
    if (!this.textMetricsCache.has(key)) {
      if (font) this.ctx.font = font;
      this.textMetricsCache.set(key, this.ctx.measureText(text));
    }
    return this.textMetricsCache.get(key)!;
  }

  clearCache() {
    this.gradientCache.clear();
    this.pathCache.clear();
    this.imageCache.clear();
    this.textMetricsCache.clear();
  }
}

// Performance Optimization 2: Smart Animation Manager
export class AnimationManager {
  private rafId: number | null = null;
  private isRunning = false;
  private callbacks: Array<() => void> = [];
  private lastFrameTime = 0;
  private frameCount = 0;
  private fps = 60;

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.loop();
  }

  stop() {
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  addCallback(callback: () => void) {
    this.callbacks.push(callback);
  }

  removeCallback(callback: () => void) {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
    }
  }

  getFPS(): number {
    return this.fps;
  }

  private loop = () => {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastFrameTime;

    // Calculate FPS
    this.frameCount++;
    if (this.frameCount % 60 === 0) {
      this.fps = Math.round(1000 / deltaTime);
    }

    // Only render if enough time has passed (60fps throttling)
    if (deltaTime >= 16.67) {
      this.callbacks.forEach(callback => callback());
      this.lastFrameTime = currentTime;
    }

    this.rafId = requestAnimationFrame(this.loop);
  };
}

// Performance Optimization 3: Spatial Partitioning for Node Interactions
export class SpatialGrid {
  private cellSize: number;
  private grid: Map<string, any[]> = new Map();

  constructor(cellSize = 100) {
    this.cellSize = cellSize;
  }

  clear() {
    this.grid.clear();
  }

  insert(x: number, y: number, object: any) {
    const cellKey = this.getCellKey(x, y);
    if (!this.grid.has(cellKey)) {
      this.grid.set(cellKey, []);
    }
    this.grid.get(cellKey)!.push(object);
  }

  getNearby(x: number, y: number, radius: number): any[] {
    const nearby: any[] = [];
    const cellRadius = Math.ceil(radius / this.cellSize);
    const centerCellX = Math.floor(x / this.cellSize);
    const centerCellY = Math.floor(y / this.cellSize);

    for (let dx = -cellRadius; dx <= cellRadius; dx++) {
      for (let dy = -cellRadius; dy <= cellRadius; dy++) {
        const cellKey = `${centerCellX + dx},${centerCellY + dy}`;
        const cell = this.grid.get(cellKey);
        if (cell) {
          nearby.push(...cell);
        }
      }
    }

    return nearby;
  }

  private getCellKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }
}

// Performance Optimization 4: Efficient Vector Operations
export class Vector2D {
  constructor(
    public x: number = 0,
    public y: number = 0
  ) {}

  static distance(a: Vector2D, b: Vector2D): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  static distanceSquared(a: Vector2D, b: Vector2D): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return dx * dx + dy * dy;
  }

  static normalize(vector: Vector2D): Vector2D {
    const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    if (length === 0) return new Vector2D(0, 0);
    return new Vector2D(vector.x / length, vector.y / length);
  }

  static multiply(vector: Vector2D, scalar: number): Vector2D {
    return new Vector2D(vector.x * scalar, vector.y * scalar);
  }
}

// Performance Optimization 5: Debounced Event Handlers
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: number;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// Performance Optimization 6: Throttled Event Handlers
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

// Performance Optimization 7: Object Pool for Temporary Objects
export class ObjectPool<T> {
  private pool: T[] = [];
  private factory: () => T;
  private reset: (obj: T) => void;

  constructor(factory: () => T, reset: (obj: T) => void, initialSize = 10) {
    this.factory = factory;
    this.reset = reset;

    for (let i = 0; i < initialSize; i++) {
      this.pool.push(factory());
    }
  }

  acquire(): T {
    return this.pool.pop() || this.factory();
  }

  release(obj: T) {
    this.reset(obj);
    this.pool.push(obj);
  }

  clear() {
    this.pool.length = 0;
  }
}

// Performance Optimization 8: Memory-efficient Canvas Operations
export class CanvasOptimizer {
  static setupHighDPICanvas(canvas: HTMLCanvasElement): CanvasRenderingContext2D | null {
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const devicePixelRatio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    // Set actual size in memory (scaled up for high DPI)
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;

    // Scale back down using CSS
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';

    // Scale the drawing context so everything draws at the correct size
    ctx.scale(devicePixelRatio, devicePixelRatio);

    return ctx;
  }

  static enableImageSmoothing(ctx: CanvasRenderingContext2D, enabled = true) {
    ctx.imageSmoothingEnabled = enabled;
    if ('webkitImageSmoothingEnabled' in ctx) {
      (ctx as any).webkitImageSmoothingEnabled = enabled;
    }
    if ('mozImageSmoothingEnabled' in ctx) {
      (ctx as any).mozImageSmoothingEnabled = enabled;
    }
  }
}

// Performance Optimization 9: Efficient State Updates
export function createBatchedSignal<T>(initialValue: T, batchDelay = 16) {
  let currentValue = initialValue;
  let scheduledUpdate: number | null = null;
  const subscribers = new Set<(value: T) => void>();

  const subscribe = (callback: (value: T) => void) => {
    subscribers.add(callback);
    return () => subscribers.delete(callback);
  };

  const setValue = (newValue: T) => {
    currentValue = newValue;

    if (scheduledUpdate === null) {
      scheduledUpdate = requestAnimationFrame(() => {
        subscribers.forEach(callback => callback(currentValue));
        scheduledUpdate = null;
      });
    }
  };

  const getValue = () => currentValue;

  return [getValue, setValue, subscribe] as const;
}

// Performance Optimization 10: Canvas Layer Management
export class LayeredCanvas {
  private layers: Map<string, HTMLCanvasElement> = new Map();
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  createLayer(name: string, zIndex = 0): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.zIndex = zIndex.toString();
    canvas.style.pointerEvents = 'none';

    this.container.appendChild(canvas);
    this.layers.set(name, canvas);

    return canvas;
  }

  getLayer(name: string): HTMLCanvasElement | undefined {
    return this.layers.get(name);
  }

  removeLayer(name: string) {
    const canvas = this.layers.get(name);
    if (canvas && canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
      this.layers.delete(name);
    }
  }

  resizeAllLayers(width: number, height: number) {
    this.layers.forEach(canvas => {
      const ctx = CanvasOptimizer.setupHighDPICanvas(canvas);
      if (ctx) {
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
      }
    });
  }

  clear() {
    this.layers.forEach(canvas => {
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    });
    this.layers.clear();
  }
}
