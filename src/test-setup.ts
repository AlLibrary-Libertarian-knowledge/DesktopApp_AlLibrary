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

// Enhanced getBoundingClientRect mock
const enhancedGetBoundingClientRect = vi.fn(() => ({
  width: 800,
  height: 400,
  top: 0,
  left: 0,
  right: 800,
  bottom: 400,
  x: 0,
  y: 0,
  toJSON: () => ({}),
}));

// Dynamic style object that preserves percentages
const createDynamicStyle = () => {
  const style = {
    width: '800px',
    height: '400px',
    cursor: 'default',
  };

  // Mock setProperty to preserve percentage values
  const setPropertySpy = vi.fn((property, value) => {
    style[property] = value;
  });

  const removePropertySpy = vi.fn(property => {
    delete style[property];
  });

  const getPropertyValueSpy = vi.fn(property => {
    return style[property] || '';
  });

  // Add methods to style object
  Object.assign(style, {
    setProperty: setPropertySpy,
    removeProperty: removePropertySpy,
    getPropertyValue: getPropertyValueSpy,
  });

  return style;
};

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
  get: createDynamicStyle,
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
};
