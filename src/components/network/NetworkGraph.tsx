import { Component, createSignal, onMount, onCleanup, createEffect } from 'solid-js';
import { createStore } from 'solid-js/store';
import './NetworkGraph.css';

interface Node {
  id: string;
  label: string;
  type: 'self' | 'peer' | 'institution' | 'community';
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  x: number;
  y: number;
  connections: number;
  bandwidth: number;
  latency: number;
  reliability: number;
  culturalContext?: string;
}

interface Link {
  source: string;
  target: string;
  strength: number;
  bandwidth: number;
  latency: number;
  status: 'active' | 'idle' | 'error';
}

interface NetworkGraphProps {
  width?: number | string;
  height?: number | string;
  interactive?: boolean;
  showStats?: boolean;
  theme?: 'light' | 'dark';
}

const NetworkGraph: Component<NetworkGraphProps> = props => {
  let canvasRef: HTMLCanvasElement | undefined;
  let animationId: number;

  const [hoveredNode, setHoveredNode] = createSignal<Node | null>(null);
  const [selectedNode, setSelectedNode] = createSignal<Node | null>(null);
  const [mousePosition, setMousePosition] = createSignal<{ x: number; y: number } | null>(null);
  const [networkStats, setNetworkStats] = createStore({
    totalPeers: 0,
    activePeers: 0,
    totalBandwidth: 0,
    averageLatency: 0,
    networkHealth: 0,
  });

  // Mock network data - in real implementation this would come from backend
  const [nodes] = createStore<Node[]>([
    {
      id: 'self',
      label: 'You',
      type: 'self',
      status: 'connected',
      x: 250,
      y: 250,
      connections: 12,
      bandwidth: 1024,
      latency: 0,
      reliability: 100,
    },
    {
      id: 'peer-1',
      label: 'Cultural Institution BR',
      type: 'institution',
      status: 'connected',
      x: 150,
      y: 150,
      connections: 8,
      bandwidth: 512,
      latency: 45,
      reliability: 95,
      culturalContext: 'Brazil Indigenous Heritage',
    },
    {
      id: 'peer-2',
      label: 'Academic Library EU',
      type: 'institution',
      status: 'connected',
      x: 350,
      y: 150,
      connections: 15,
      bandwidth: 2048,
      latency: 120,
      reliability: 98,
    },
    {
      id: 'peer-3',
      label: 'Community Archive',
      type: 'community',
      status: 'connecting',
      x: 350,
      y: 350,
      connections: 3,
      bandwidth: 256,
      latency: 200,
      reliability: 78,
      culturalContext: 'Pacific Islander Stories',
    },
    {
      id: 'peer-4',
      label: 'Knowledge Hub',
      type: 'peer',
      status: 'connected',
      x: 150,
      y: 350,
      connections: 6,
      bandwidth: 768,
      latency: 80,
      reliability: 88,
    },
    {
      id: 'peer-5',
      label: 'Anonymous Node',
      type: 'peer',
      status: 'disconnected',
      x: 100,
      y: 250,
      connections: 0,
      bandwidth: 0,
      latency: 999,
      reliability: 0,
    },
  ]);

  const [links] = createStore<Link[]>([
    {
      source: 'self',
      target: 'peer-1',
      strength: 0.8,
      bandwidth: 512,
      latency: 45,
      status: 'active',
    },
    {
      source: 'self',
      target: 'peer-2',
      strength: 0.9,
      bandwidth: 1024,
      latency: 120,
      status: 'active',
    },
    {
      source: 'self',
      target: 'peer-4',
      strength: 0.6,
      bandwidth: 256,
      latency: 80,
      status: 'idle',
    },
    {
      source: 'peer-1',
      target: 'peer-2',
      strength: 0.4,
      bandwidth: 128,
      latency: 165,
      status: 'idle',
    },
  ]);

  // Animation and rendering
  const animate = () => {
    if (canvasRef) {
      drawNetwork();
    }
    // Use requestAnimationFrame for optimal smoothness (60fps)
    animationId = requestAnimationFrame(animate);
  };

  const drawNetwork = () => {
    if (!canvasRef) return;

    const ctx = canvasRef.getContext('2d');
    if (!ctx) return;

    // Get actual canvas dimensions for responsive behavior
    const rect = canvasRef.getBoundingClientRect();
    const width = rect.width || 500;
    const height = rect.height || 400;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw grid background
    drawGrid(ctx, width, height);

    // Draw links
    links.forEach(link => {
      const sourceNode = nodes.find(n => n.id === link.source);
      const targetNode = nodes.find(n => n.id === link.target);
      if (sourceNode && targetNode) {
        drawLink(ctx, sourceNode, targetNode, link);
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      drawNode(ctx, node);
    });

    // Draw hover tooltip with mouse coordinates
    const hovered = hoveredNode();
    const mousePos = mousePosition();
    if (hovered && mousePos) {
      drawTooltip(ctx, hovered, mousePos.x, mousePos.y, width, height);
    }
  };

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = 'var(--border-color)';
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.3;

    const gridSize = 25;
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  };

  const drawLink = (ctx: CanvasRenderingContext2D, source: Node, target: Node, link: Link) => {
    const gradient = ctx.createLinearGradient(source.x, source.y, target.x, target.y);

    // Color based on status and bandwidth
    const colors = {
      active: ['#3b82f6', '#06b6d4'],
      idle: ['#6b7280', '#9ca3af'],
      error: ['#ef4444', '#f87171'],
    } as const;

    const statusColors = colors[link.status] || colors.idle;
    gradient.addColorStop(0, statusColors[0]);
    gradient.addColorStop(1, statusColors[1]);

    ctx.strokeStyle = gradient;
    ctx.lineWidth = Math.max(1, (link.bandwidth / 1024) * 4);
    ctx.globalAlpha = link.strength;

    // Animated flow effect for active links
    if (link.status === 'active') {
      const time = Date.now() * 0.001;
      const flowOffset = (time * 20) % 20;
      ctx.setLineDash([5, 15]);
      ctx.lineDashOffset = -flowOffset;
    } else {
      ctx.setLineDash([]);
    }

    ctx.beginPath();
    ctx.moveTo(source.x, source.y);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();

    ctx.globalAlpha = 1;
    ctx.setLineDash([]);
  };

  const drawNode = (ctx: CanvasRenderingContext2D, node: Node) => {
    const isHovered = hoveredNode()?.id === node.id;
    const isSelected = selectedNode()?.id === node.id;

    // Node size based on connections
    const baseSize = 12;
    const size = baseSize + node.connections * 1.5;

    // Colors based on type and status
    const typeColors = {
      self: '#3b82f6',
      peer: '#10b981',
      institution: '#a855f7',
      community: '#f59e0b',
    };

    const statusAlpha = {
      connected: 1,
      connecting: 0.7,
      disconnected: 0.3,
      error: 0.5,
    };

    // Enhanced hover effect with larger visual feedback
    if (isHovered) {
      // Draw hover ring
      ctx.strokeStyle = typeColors[node.type];
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(node.x, node.y, size + 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Outer glow for selection/hover
    if (isSelected || isHovered) {
      ctx.shadowColor = typeColors[node.type];
      ctx.shadowBlur = 15;
      ctx.globalAlpha = 0.8;
    }

    // Main node circle
    ctx.fillStyle = typeColors[node.type];
    ctx.globalAlpha = statusAlpha[node.status];
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
    ctx.fill();

    // Inner status indicator
    if (node.status === 'connecting') {
      const time = Date.now() * 0.003;
      const pulseSize = size * (0.7 + Math.sin(time) * 0.2);
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(node.x, node.y, pulseSize, 0, Math.PI * 2);
      ctx.fill();
    } else if (node.status === 'error') {
      ctx.fillStyle = '#ef4444';
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(node.x, node.y, size * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Reliability ring
    if (node.status === 'connected') {
      const ringRadius = size + 4;
      const reliabilityAngle = (node.reliability / 100) * Math.PI * 2;

      ctx.strokeStyle = typeColors[node.type];
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(node.x, node.y, ringRadius, -Math.PI / 2, -Math.PI / 2 + reliabilityAngle);
      ctx.stroke();
    }

    // Reset shadow and alpha
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;

    // Node label
    if (isHovered || isSelected || node.type === 'self') {
      ctx.fillStyle = 'var(--text-color)';
      ctx.font = '11px var(--font-family-sans)';
      ctx.textAlign = 'center';
      ctx.fillText(node.label || 'Unknown', node.x, node.y + size + 15);
    }
  };

  const drawTooltip = (
    ctx: CanvasRenderingContext2D,
    node: Node,
    mouseX: number,
    mouseY: number,
    width: number,
    height: number
  ) => {
    const padding = 12;
    const lineHeight = 16;

    // Prepare tooltip content with better formatting
    const title = node.label || 'Unknown Node';
    const lines = [
      `Type: ${node.type.charAt(0).toUpperCase() + node.type.slice(1)}`,
      `Status: ${node.status.charAt(0).toUpperCase() + node.status.slice(1)}`,
      `Connections: ${node.connections}`,
      `Bandwidth: ${node.bandwidth} KB/s`,
      `Latency: ${node.latency}ms`,
      `Reliability: ${node.reliability}%`,
    ];

    if (node.culturalContext) {
      lines.push(`Cultural: ${node.culturalContext}`);
    }

    // Set proper web-safe fonts for canvas
    const titleFont = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const contentFont = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

    // Set font for measurements
    ctx.font = titleFont;
    const titleWidth = ctx.measureText(title).width;

    ctx.font = contentFont;
    const maxContentWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
    const maxWidth = Math.max(titleWidth, maxContentWidth);

    const tooltipWidth = maxWidth + padding * 2;
    const tooltipHeight = (lines.length + 1) * lineHeight + padding * 2 + 8; // Extra space for title

    // Smart positioning - follow mouse but stay within bounds
    const offset = 15; // Distance from cursor
    let tooltipX = mouseX + offset;
    let tooltipY = mouseY - tooltipHeight - offset;

    // Adjust horizontal position if tooltip would go off right edge
    if (tooltipX + tooltipWidth > width) {
      tooltipX = mouseX - tooltipWidth - offset;
    }

    // Adjust vertical position if tooltip would go off top edge
    if (tooltipY < 0) {
      tooltipY = mouseY + offset;
    }

    // Final bounds check - ensure tooltip is fully visible
    tooltipX = Math.max(5, Math.min(tooltipX, width - tooltipWidth - 5));
    tooltipY = Math.max(5, Math.min(tooltipY, height - tooltipHeight - 5));

    // Create gradient background
    const gradient = ctx.createLinearGradient(
      tooltipX,
      tooltipY,
      tooltipX,
      tooltipY + tooltipHeight
    );
    gradient.addColorStop(0, 'rgba(30, 41, 59, 0.95)'); // Dark blue-gray
    gradient.addColorStop(1, 'rgba(15, 23, 42, 0.98)'); // Darker blue-gray

    // Draw shadow first
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 4;

    // Draw tooltip background with rounded corners
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 8);
    ctx.fill();

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Draw border with node type color
    const typeColors = {
      self: '#3b82f6',
      peer: '#10b981',
      institution: '#a855f7',
      community: '#f59e0b',
    };

    ctx.strokeStyle = typeColors[node.type];
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 8);
    ctx.stroke();

    // Draw title with larger, bold font
    ctx.fillStyle = '#ffffff';
    ctx.font = titleFont;
    ctx.textAlign = 'left';
    ctx.fillText(title, tooltipX + padding, tooltipY + padding + 13);

    // Draw separator line under title
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tooltipX + padding, tooltipY + padding + 20);
    ctx.lineTo(tooltipX + tooltipWidth - padding, tooltipY + padding + 20);
    ctx.stroke();

    // Draw content lines with proper spacing and colors
    ctx.font = contentFont;
    lines.forEach((line, index) => {
      const yPos = tooltipY + padding + 20 + 8 + (index + 1) * lineHeight;

      // Split line into label and value for better formatting
      const [label, value] = line.split(': ');

      if (!label || !value) return; // Safety check

      // Draw label in muted color
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText(label + ':', tooltipX + padding, yPos);

      // Draw value in bright color with appropriate status colors
      let valueColor = '#ffffff';
      if (label === 'Status') {
        switch (value.toLowerCase()) {
          case 'connected':
            valueColor = '#10b981';
            break;
          case 'connecting':
            valueColor = '#f59e0b';
            break;
          case 'disconnected':
            valueColor = '#6b7280';
            break;
          case 'error':
            valueColor = '#ef4444';
            break;
        }
      } else if (label === 'Reliability') {
        const reliability = parseInt(value);
        if (reliability >= 90) valueColor = '#10b981';
        else if (reliability >= 70) valueColor = '#f59e0b';
        else valueColor = '#ef4444';
      } else if (label === 'Type') {
        valueColor = typeColors[node.type];
      }

      ctx.fillStyle = valueColor;
      const labelWidth = ctx.measureText(label + ':').width;
      ctx.fillText(value, tooltipX + padding + labelWidth + 8, yPos);
    });
  };

  // Mouse interaction - optimized for smooth performance
  const handleMouseMove = (e: MouseEvent) => {
    if (!canvasRef) return;

    const rect = canvasRef.getBoundingClientRect();

    // Simple coordinate calculation since we're handling DPI in canvas setup
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Update mouse position for smooth tooltip tracking
    setMousePosition({ x, y });

    const hoveredNodeFound = nodes.find(node => {
      // Calculate the same size as used in drawNode
      const baseSize = 12;
      const nodeSize = baseSize + node.connections * 1.5;
      // Add some padding for easier interaction
      const clickRadius = nodeSize + 4;

      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      return distance < clickRadius;
    });

    setHoveredNode(hoveredNodeFound || null);
    canvasRef.style.cursor = hoveredNodeFound ? 'pointer' : 'default';
  };

  const handleClick = (e: MouseEvent) => {
    if (!canvasRef) return;

    const rect = canvasRef.getBoundingClientRect();

    // Simple coordinate calculation since we're handling DPI in canvas setup
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedNode = nodes.find(node => {
      // Calculate the same size as used in drawNode
      const baseSize = 12;
      const nodeSize = baseSize + node.connections * 1.5;
      // Add some padding for easier interaction
      const clickRadius = nodeSize + 4;

      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      return distance < clickRadius;
    });

    setSelectedNode(clickedNode || null);
  };

  // Calculate network statistics
  createEffect(() => {
    const activePeers = nodes.filter(n => n.status === 'connected').length;
    const totalBandwidth = nodes.reduce((sum, n) => sum + n.bandwidth, 0);
    const averageLatency = nodes
      .filter(n => n.status === 'connected')
      .reduce((sum, n, _, arr) => sum + n.latency / arr.length, 0);
    const networkHealth = Math.round((activePeers / nodes.length) * 100);

    setNetworkStats({
      totalPeers: nodes.length - 1, // Exclude self
      activePeers: activePeers - 1, // Exclude self
      totalBandwidth,
      averageLatency: Math.round(averageLatency),
      networkHealth,
    });
  });

  onMount(() => {
    if (canvasRef) {
      // Set up canvas for proper DPI handling
      const setupCanvas = () => {
        const rect = canvasRef!.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        // Set the canvas internal size with device pixel ratio
        canvasRef!.width = rect.width * dpr;
        canvasRef!.height = rect.height * dpr;

        // Scale the canvas back down using CSS
        canvasRef!.style.width = rect.width + 'px';
        canvasRef!.style.height = rect.height + 'px';

        // Scale the drawing context so everything draws at the correct size
        const ctx = canvasRef!.getContext('2d');
        if (ctx) {
          ctx.scale(dpr, dpr);
        }

        console.log('Canvas setup:', {
          rect: { width: rect.width, height: rect.height },
          canvas: { width: canvasRef!.width, height: canvasRef!.height },
          dpr,
        });
      };

      setupCanvas();

      // Add resize observer to handle canvas resizing
      const resizeObserver = new ResizeObserver(setupCanvas);
      resizeObserver.observe(canvasRef);

      canvasRef.addEventListener('mousemove', handleMouseMove);
      canvasRef.addEventListener('click', handleClick);
      animate();

      // Cleanup function for resize observer
      return () => {
        resizeObserver.disconnect();
        if (canvasRef) {
          canvasRef.removeEventListener('mousemove', handleMouseMove);
          canvasRef.removeEventListener('click', handleClick);
        }
      };
    }

    // Return empty cleanup function if no canvas
    return () => {};
  });

  onCleanup(() => {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
    if (canvasRef) {
      canvasRef.removeEventListener('mousemove', handleMouseMove);
      canvasRef.removeEventListener('click', handleClick);
    }
  });

  return (
    <div class={`network-graph ${props.theme || 'light'}`}>
      <canvas
        ref={canvasRef}
        style={{
          width: typeof props.width === 'string' ? props.width : `${props.width || 500}px`,
          height: typeof props.height === 'string' ? props.height : `${props.height || 400}px`,
        }}
        class="network-canvas"
      />

      {props.showStats && (
        <div class="network-stats">
          <div class="stat-item">
            <span class="stat-label">Peers</span>
            <span class="stat-value">
              {networkStats.activePeers}/{networkStats.totalPeers}
            </span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Bandwidth</span>
            <span class="stat-value">{(networkStats.totalBandwidth / 1024).toFixed(1)} MB/s</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Latency</span>
            <span class="stat-value">{networkStats.averageLatency}ms</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Health</span>
            <span
              class={`stat-value health-${networkStats.networkHealth > 80 ? 'good' : networkStats.networkHealth > 50 ? 'fair' : 'poor'}`}
            >
              {networkStats.networkHealth}%
            </span>
          </div>
        </div>
      )}

      {selectedNode() && (
        <div class="node-details">
          <h4>{selectedNode()!.label}</h4>
          <div class="detail-grid">
            <span>Type:</span> <span>{selectedNode()!.type}</span>
            <span>Status:</span>{' '}
            <span class={`status-${selectedNode()!.status}`}>{selectedNode()!.status}</span>
            <span>Connections:</span> <span>{selectedNode()!.connections}</span>
            <span>Bandwidth:</span> <span>{selectedNode()!.bandwidth} KB/s</span>
            <span>Latency:</span> <span>{selectedNode()!.latency}ms</span>
            <span>Reliability:</span> <span>{selectedNode()!.reliability}%</span>
          </div>
          {selectedNode()!.culturalContext && (
            <div class="cultural-context">
              <strong>Cultural Context:</strong>
              <p>{selectedNode()!.culturalContext}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NetworkGraph;
