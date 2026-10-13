import { render, cleanup } from '@solidjs/testing-library';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import NetworkGraph from './NetworkGraph';
import type { NetworkGraphProps } from './types';
import { mockContext, addEventListenerSpy, removeEventListenerSpy } from '../../../test-setup';

// Mock ResizeObserver
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Using mockContext from test-setup.ts (imported above)

const mockCanvas = {
  getContext: vi.fn(() => mockContext),
  getBoundingClientRect: vi.fn(() => ({
    width: 800,
    height: 400,
    top: 0,
    left: 0,
    right: 800,
    bottom: 400,
  })),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  width: 800,
  height: 400,
  style: { width: '800px', height: '400px', cursor: 'default' },
};

// Use mocks from test-setup.ts
// Note: Global mocks are now configured in test-setup.ts

Object.defineProperty(window, 'devicePixelRatio', {
  writable: true,
  value: 1,
});

/** Tests use simulated topology so they do not depend on Tauri lobby. */
const MockGraph = (props: NetworkGraphProps = {}) => <NetworkGraph useMockData={true} {...props} />;

describe('NetworkGraph', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders with default props', () => {
    const { container } = render(() => <MockGraph />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeTruthy();
  });

  it('handles responsive width prop', () => {
    const { container } = render(() => <MockGraph width="100%" height={400} />);
    const canvas = container.querySelector('canvas') as HTMLCanvasElement;

    expect(canvas).toBeTruthy();
    expect(canvas.style.width).toBe('100%');
  });

  it('handles numeric width prop', () => {
    const { container } = render(() => <MockGraph width={600} height={400} />);
    const canvas = container.querySelector('canvas') as HTMLCanvasElement;

    expect(canvas).toBeTruthy();
    expect(canvas.style.width).toBe('600px');
  });

  it('handles responsive height prop', () => {
    const { container } = render(() => <MockGraph width={800} height="100%" />);
    const canvas = container.querySelector('canvas') as HTMLCanvasElement;

    expect(canvas).toBeTruthy();
    expect(canvas.style.height).toBe('100%');
  });

  it('shows network statistics when showStats is true', () => {
    const { container } = render(() => <MockGraph showStats={true} />);
    const statsContainer = container.querySelector('.network-stats');

    expect(statsContainer).toBeTruthy();
    expect(container.textContent).toContain('Peers');
    expect(container.textContent).toMatch(/Arquivos|Files/);
    expect(container.textContent).toMatch(/Saúde|Health/);
  });

  it('hides network statistics when showStats is false', () => {
    const { container } = render(() => <MockGraph showStats={false} />);
    const statsContainer = container.querySelector('.network-stats');

    expect(statsContainer).toBeFalsy();
  });

  it('applies correct theme class', () => {
    const { container } = render(() => <MockGraph theme="dark" />);
    const networkGraph = container.querySelector('.network-graph');

    expect(networkGraph?.classList.contains('dark')).toBe(true);
  });

  it('sets up ResizeObserver for responsive behavior', () => {
    const mockObserve = vi.fn();
    globalThis.ResizeObserver = vi.fn(() => ({
      observe: mockObserve,
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    })) as any;

    render(() => <MockGraph width="100%" height={400} />);

    expect(globalThis.ResizeObserver).toHaveBeenCalled();
    expect(mockObserve).toHaveBeenCalled();
  });

  it('handles canvas DPI scaling correctly', () => {
    Object.defineProperty(window, 'devicePixelRatio', {
      writable: true,
      value: 2,
    });

    render(() => <MockGraph width={400} height={300} />);

    // Should call scale with device pixel ratio
    expect(mockContext.scale).toHaveBeenCalledWith(2, 2);
  });

  it('responds to mouse events for interactivity', () => {
    render(() => <MockGraph />);

    expect(addEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));
  });

  it('calculates network statistics correctly', () => {
    const { container } = render(() => <MockGraph showStats={true} />);

    // Peers ratio + health % from mock graph stats
    expect(container.textContent).toMatch(/\d+\/\d+/);
    expect(container.textContent).toMatch(/\d+%/);
  });

  describe('Responsive behavior', () => {
    it('adapts to container size changes', () => {
      const mockObserve = vi.fn();

      globalThis.ResizeObserver = vi.fn((callback: ResizeObserverCallback) => {
        void callback;
        return {
          observe: mockObserve,
          unobserve: vi.fn(),
          disconnect: vi.fn(),
        };
      }) as any;

      render(() => <MockGraph width="100%" height={400} />);

      expect(mockObserve).toHaveBeenCalled();
    });

    it('maintains aspect ratio during resize', () => {
      const { container } = render(() => <MockGraph width="100%" height="auto" />);
      const canvas = container.querySelector('canvas');

      expect(canvas?.style.width).toBe('100%');
    });

    it('uses default dimensions when no props provided', () => {
      const { container } = render(() => <MockGraph />);
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;

      expect(canvas.style.width).toBe('500px');
      expect(canvas.style.height).toBe('400px');
    });
  });

  describe('Performance', () => {
    it('sets up animation loop correctly', () => {
      render(() => <MockGraph />);

      expect(globalThis.requestAnimationFrame).toHaveBeenCalled();
    });

    it('cleans up animation on unmount', () => {
      const { unmount } = render(() => <MockGraph />);

      unmount();

      expect(globalThis.cancelAnimationFrame).toHaveBeenCalled();
    });

    it('sets up event listeners correctly', async () => {
      const { unmount } = render(() => <MockGraph />);

      // Wait for the component to fully mount and set up event listeners
      await new Promise(resolve => setTimeout(resolve, 10));

      // Verify event listeners were added
      expect(addEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));

      unmount();
    });
  });
});
