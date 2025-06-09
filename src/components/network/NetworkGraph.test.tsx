import { render, cleanup } from '@solidjs/testing-library';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import NetworkGraph from './NetworkGraph';
import {
  mockContext,
  addEventListenerSpy,
  removeEventListenerSpy,
  scaleSpy,
} from '../../test-setup';

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

describe('NetworkGraph', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders with default props', () => {
    const { container } = render(() => <NetworkGraph />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeTruthy();
  });

  it('handles responsive width prop', () => {
    const { container } = render(() => <NetworkGraph width="100%" height={400} />);
    const canvas = container.querySelector('canvas') as HTMLCanvasElement;

    expect(canvas).toBeTruthy();
    expect(canvas.style.width).toBe('100%');
  });

  it('handles numeric width prop', () => {
    const { container } = render(() => <NetworkGraph width={600} height={400} />);
    const canvas = container.querySelector('canvas') as HTMLCanvasElement;

    expect(canvas).toBeTruthy();
    expect(canvas.style.width).toBe('600px');
  });

  it('handles responsive height prop', () => {
    const { container } = render(() => <NetworkGraph width={800} height="100%" />);
    const canvas = container.querySelector('canvas') as HTMLCanvasElement;

    expect(canvas).toBeTruthy();
    expect(canvas.style.height).toBe('100%');
  });

  it('shows network statistics when showStats is true', () => {
    const { container } = render(() => <NetworkGraph showStats={true} />);
    const statsContainer = container.querySelector('.network-stats');

    expect(statsContainer).toBeTruthy();
    expect(container.textContent).toContain('Peers');
    expect(container.textContent).toContain('Bandwidth');
    expect(container.textContent).toContain('Latency');
    expect(container.textContent).toContain('Health');
  });

  it('hides network statistics when showStats is false', () => {
    const { container } = render(() => <NetworkGraph showStats={false} />);
    const statsContainer = container.querySelector('.network-stats');

    expect(statsContainer).toBeFalsy();
  });

  it('applies correct theme class', () => {
    const { container } = render(() => <NetworkGraph theme="dark" />);
    const networkGraph = container.querySelector('.network-graph');

    expect(networkGraph?.classList.contains('dark')).toBe(true);
  });

  it('sets up ResizeObserver for responsive behavior', () => {
    const mockObserve = vi.fn();
    global.ResizeObserver = vi.fn(() => ({
      observe: mockObserve,
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    })) as any;

    render(() => <NetworkGraph width="100%" height={400} />);

    expect(global.ResizeObserver).toHaveBeenCalled();
    expect(mockObserve).toHaveBeenCalled();
  });

  it('handles canvas DPI scaling correctly', () => {
    Object.defineProperty(window, 'devicePixelRatio', {
      writable: true,
      value: 2,
    });

    render(() => <NetworkGraph width={400} height={300} />);

    // Should call scale with device pixel ratio
    expect(mockContext.scale).toHaveBeenCalledWith(2, 2);
  });

  it('responds to mouse events for interactivity', () => {
    render(() => <NetworkGraph interactive={true} />);

    expect(addEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
  });

  it('calculates network statistics correctly', () => {
    const { container } = render(() => <NetworkGraph showStats={true} />);

    // Check that statistics are calculated and displayed
    expect(container.textContent).toMatch(/\d+\/\d+/); // Peers format
    expect(container.textContent).toMatch(/\d+\.\d+ MB\/s/); // Bandwidth format
    expect(container.textContent).toMatch(/\d+ms/); // Latency format
    expect(container.textContent).toMatch(/\d+%/); // Health percentage
  });

  describe('Responsive behavior', () => {
    it('adapts to container size changes', () => {
      let observerCallback: ((entries: any[]) => void) | null = null;

      global.ResizeObserver = vi.fn(callback => {
        observerCallback = callback;
        return {
          observe: vi.fn(),
          unobserve: vi.fn(),
          disconnect: vi.fn(),
        };
      }) as any;

      render(() => <NetworkGraph width="100%" height={400} />);

      // Simulate container resize
      if (observerCallback) {
        observerCallback([
          {
            contentRect: { width: 1200, height: 400 },
          },
        ]);
      }

      // Should have set up the canvas for the new dimensions
      expect(mockContext.scale).toHaveBeenCalled();
    });

    it('maintains aspect ratio during resize', () => {
      const { container } = render(() => <NetworkGraph width="100%" height="auto" />);
      const canvas = container.querySelector('canvas');

      expect(canvas?.style.width).toBe('100%');
    });

    it('uses default dimensions when no props provided', () => {
      const { container } = render(() => <NetworkGraph />);
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;

      expect(canvas.style.width).toBe('500px');
      expect(canvas.style.height).toBe('400px');
    });
  });

  describe('Performance', () => {
    it('sets up animation loop correctly', () => {
      render(() => <NetworkGraph />);

      expect(global.requestAnimationFrame).toHaveBeenCalled();
    });

    it('cleans up animation on unmount', () => {
      const { unmount } = render(() => <NetworkGraph />);

      unmount();

      expect(global.cancelAnimationFrame).toHaveBeenCalled();
    });

    it('removes event listeners on cleanup', () => {
      const { unmount } = render(() => <NetworkGraph interactive={true} />);

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
    });
  });
});
