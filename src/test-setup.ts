import { vi } from 'vitest';

// Mock browser APIs
globalThis.requestAnimationFrame = vi.fn(cb => {
  globalThis.setTimeout(cb, 16);
  return 1;
});
globalThis.cancelAnimationFrame = vi.fn();
globalThis.devicePixelRatio = 1;

// Mock ResizeObserver
globalThis.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Create comprehensive Canvas 2D context mock with all methods
const createMockCanvasContext = () => {
  return {
    // Path methods
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    bezierCurveTo: vi.fn(),
    arc: vi.fn(),
    ellipse: vi.fn(),
    rect: vi.fn(),

    // Stroke and fill methods
    stroke: vi.fn(),
    fill: vi.fn(),
    clip: vi.fn(),

    // Text methods
    fillText: vi.fn(),
    strokeText: vi.fn(),
    measureText: vi.fn(() => ({ width: 100 })),

    // Rectangle methods
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),

    // Transform methods
    save: vi.fn(),
    restore: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    translate: vi.fn(),
    transform: vi.fn(),
    setTransform: vi.fn(),

    // Gradient and pattern methods
    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    createRadialGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    createPattern: vi.fn(() => null),

    // Image methods
    drawImage: vi.fn(),
    getImageData: vi.fn(() => ({
      data: new Uint8ClampedArray(4),
      width: 1,
      height: 1,
    })),
    putImageData: vi.fn(),
    createImageData: vi.fn(() => ({
      data: new Uint8ClampedArray(4),
      width: 1,
      height: 1,
    })),

    // Line style methods
    setLineDash: vi.fn(),
    getLineDash: vi.fn(() => []),

    // Properties
    lineDashOffset: 0,
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    miterLimit: 10,
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    font: '10px sans-serif',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    direction: 'inherit',
    shadowBlur: 0,
    shadowColor: 'rgba(0, 0, 0, 0)',
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'low',

    // Canvas reference
    canvas: { width: 800, height: 400 },
  };
};

// Create the mock context
const mockContext = createMockCanvasContext();

// Enhanced Canvas getContext mock
const enhancedGetContext = vi.fn(() => mockContext);

// Enhanced getBoundingClientRect mock
const enhancedGetBoundingClientRect = vi.fn(() => {
  return {
    width: 500,
    height: 400,
    top: 0,
    left: 0,
    right: 500,
    bottom: 400,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  };
});

// Event listener spies
const addEventListenerSpy = vi.fn();
const removeEventListenerSpy = vi.fn();

// Create persistent style mock
const createPersistentStyle = () => {
  const styleStorage = new Map();

  // Initialize with default values - these will be overridden by component props
  styleStorage.set('cursor', 'default');

  const setPropertySpy = vi.fn((property: string, value: string) => {
    styleStorage.set(property, value);
  });

  const removePropertySpy = vi.fn((property: string) => {
    styleStorage.delete(property);
  });

  const getPropertyValueSpy = vi.fn((property: string) => {
    return styleStorage.get(property) || '';
  });

  return new Proxy({} as CSSStyleDeclaration, {
    get(target, prop) {
      if (prop === 'setProperty') return setPropertySpy;
      if (prop === 'removeProperty') return removePropertySpy;
      if (prop === 'getPropertyValue') return getPropertyValueSpy;
      return styleStorage.get(prop.toString()) || '';
    },
    set(target, prop, value) {
      styleStorage.set(prop.toString(), value);
      return true;
    },
  });
};

const persistentStyle = createPersistentStyle();

// Override HTMLCanvasElement prototype methods
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: enhancedGetContext,
  writable: true,
});

Object.defineProperty(HTMLCanvasElement.prototype, 'getBoundingClientRect', {
  value: enhancedGetBoundingClientRect,
  writable: true,
});

Object.defineProperty(HTMLCanvasElement.prototype, 'addEventListener', {
  value: addEventListenerSpy,
  writable: true,
});

Object.defineProperty(HTMLCanvasElement.prototype, 'removeEventListener', {
  value: removeEventListenerSpy,
  writable: true,
});

Object.defineProperty(HTMLCanvasElement.prototype, 'style', {
  get: () => persistentStyle,
  configurable: true,
});

// Export for test access
export {
  mockContext,
  addEventListenerSpy,
  removeEventListenerSpy,
  enhancedGetContext,
  enhancedGetBoundingClientRect,
  persistentStyle,
};
