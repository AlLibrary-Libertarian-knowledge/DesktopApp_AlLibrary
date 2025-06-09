import { vi } from 'vitest';

// Mock requestAnimationFrame and cancelAnimationFrame
globalThis.requestAnimationFrame = vi.fn(cb => {
  return globalThis.setTimeout(cb, 16); // ~60fps
});

globalThis.cancelAnimationFrame = vi.fn(id => {
  globalThis.clearTimeout(id);
});

// Mock ResizeObserver
globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock HTMLCanvasElement methods
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  arc: vi.fn(),
  stroke: vi.fn(),
  fill: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  scale: vi.fn(),
  canvas: {
    width: 800,
    height: 400,
  },
}));

// Mock Canvas element style
Object.defineProperty(HTMLCanvasElement.prototype, 'style', {
  value: {
    width: '800px',
    height: '400px',
  },
  writable: true,
  configurable: true,
});

// Mock addEventListener and removeEventListener
HTMLCanvasElement.prototype.addEventListener = vi.fn();
HTMLCanvasElement.prototype.removeEventListener = vi.fn();
