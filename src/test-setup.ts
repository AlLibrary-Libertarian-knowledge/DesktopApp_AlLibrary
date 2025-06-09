import { vi } from 'vitest';

// Mock browser APIs
globalThis.requestAnimationFrame = vi.fn(cb => {
  setTimeout(cb, 16);
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

// Create persistent spies for canvas context methods
const scaleSpy = vi.fn();
const clearRectSpy = vi.fn();
const fillRectSpy = vi.fn();
const strokeRectSpy = vi.fn();
const measureTextSpy = vi.fn(() => ({ width: 100 }));
const fillTextSpy = vi.fn();
const beginPathSpy = vi.fn();
const moveToSpy = vi.fn();
const lineToSpy = vi.fn();
const arcSpy = vi.fn();
const strokeSpy = vi.fn();
const fillSpy = vi.fn();
const saveSpy = vi.fn();
const restoreSpy = vi.fn();
const createLinearGradientSpy = vi.fn(() => ({
  addColorStop: vi.fn(),
}));
const setLineDashSpy = vi.fn();

// Enhanced Canvas context mock with persistent spies
const mockContext = {
  clearRect: clearRectSpy,
  fillRect: fillRectSpy,
  strokeRect: strokeRectSpy,
  scale: scaleSpy,
  measureText: measureTextSpy,
  fillText: fillTextSpy,
  beginPath: beginPathSpy,
  moveTo: moveToSpy,
  lineTo: lineToSpy,
  arc: arcSpy,
  stroke: strokeSpy,
  fill: fillSpy,
  save: saveSpy,
  restore: restoreSpy,
  createLinearGradient: createLinearGradientSpy,
  setLineDash: setLineDashSpy,
  lineDashOffset: 0,
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  globalAlpha: 1,
  font: '',
  textAlign: '',
  canvas: { width: 800, height: 400 },
};

// Persistent spies for event listeners
const addEventListenerSpy = vi.fn();
const removeEventListenerSpy = vi.fn();

// Enhanced Canvas getContext mock that returns the same context instance
const enhancedGetContext = vi.fn(() => {
  return mockContext;
});

// Enhanced getBoundingClientRect mock that returns dimensions based on actual style
const enhancedGetBoundingClientRect = vi.fn(function () {
  // Read the actual style from the canvas element
  const width = this.style.width;
  const height = this.style.height;

  // Parse width to number (remove 'px', convert percentages to pixel equivalent)
  let pixelWidth = 500; // default
  let pixelHeight = 400; // default

  if (width) {
    if (width.endsWith('px')) {
      pixelWidth = parseInt(width);
    } else if (width.endsWith('%')) {
      // For percentage, use a reasonable container size (e.g., 800px container)
      pixelWidth = 800 * (parseInt(width) / 100);
    }
  }

  if (height) {
    if (height.endsWith('px')) {
      pixelHeight = parseInt(height);
    } else if (height.endsWith('%')) {
      // For percentage, use a reasonable container size (e.g., 600px container)
      pixelHeight = 600 * (parseInt(height) / 100);
    }
  }

  return {
    width: pixelWidth,
    height: pixelHeight,
    top: 0,
    left: 0,
    right: pixelWidth,
    bottom: pixelHeight,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  };
});

// Create a persistent style object that retains property changes
const createPersistentStyle = () => {
  const styleStorage = new Map();

  // Initialize with component's actual default values (from NetworkGraph.tsx lines 658-661)
  styleStorage.set('width', '500px'); // Component default: props.width || 500
  styleStorage.set('height', '400px'); // Component default: props.height || 400
  styleStorage.set('cursor', 'default');

  const setPropertySpy = vi.fn((property, value) => {
    styleStorage.set(property, value);
  });

  const removePropertySpy = vi.fn(property => {
    styleStorage.delete(property);
  });

  const getPropertyValueSpy = vi.fn(property => {
    return styleStorage.get(property) || '';
  });

  // Create a proxy that intercepts all property access
  return new Proxy(
    {},
    {
      get(target, prop) {
        if (prop === 'setProperty') return setPropertySpy;
        if (prop === 'removeProperty') return removePropertySpy;
        if (prop === 'getPropertyValue') return getPropertyValueSpy;

        // Return stored value for any property
        return styleStorage.get(prop.toString()) || '';
      },
      set(target, prop, value) {
        // Store the value when properties are set directly
        styleStorage.set(prop.toString(), value);
        return true;
      },
    }
  );
};

// Create a single persistent style instance
const persistentStyle = createPersistentStyle();

// Override HTMLCanvasElement prototype methods with persistent spies
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
  scaleSpy,
  clearRectSpy,
  fillRectSpy,
  strokeRectSpy,
  measureTextSpy,
  fillTextSpy,
  beginPathSpy,
  moveToSpy,
  lineToSpy,
  arcSpy,
  strokeSpy,
  fillSpy,
  saveSpy,
  restoreSpy,
  createLinearGradientSpy,
  setLineDashSpy,
  persistentStyle,
};
