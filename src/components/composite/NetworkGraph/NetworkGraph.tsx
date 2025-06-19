import { Component, onMount, onCleanup } from 'solid-js';
import {
  CanvasRenderer,
  AnimationManager,
  SpatialGrid,
  Vector2D,
  throttle,
  ObjectPool,
} from '../../../utils/performance';

// Import our extracted components and utilities
import type { NetworkGraphProps } from './types';
import { useNetworkState } from './hooks/useNetworkState';
import { PhysicsEngine } from './physics/PhysicsEngine';
import { NodeRenderer } from './rendering/NodeRenderer';
import TransferLegend from './components/TransferLegend';
import { performanceConfig } from './config/physicsConfig';
import {
  formatTimeRemaining,
  formatFileSize,
  formatBandwidth,
  formatLatency,
  formatReliability,
  formatNodeType,
  getNetworkTypeIcon,
} from './utils/formatters';
import './NetworkGraph.css';

const NetworkGraph: Component<NetworkGraphProps> = props => {
  let canvasRef: HTMLCanvasElement | undefined;
  let animationId: number;

  // Performance system instances
  let renderer: CanvasRenderer | null = null;
  let animationManager: AnimationManager | null = null;
  let spatialGrid: SpatialGrid | null = null;
  let physicsEngine: PhysicsEngine | null = null;
  let nodeRenderer: NodeRenderer | null = null;

  // Object pools for frequent allocations
  const vectorPool = new ObjectPool(
    () => new Vector2D(),
    v => {
      v.x = 0;
      v.y = 0;
    }
  );

  // Use our extracted state management hook
  const {
    nodes,
    links,
    hoveredNode,
    selectedNode,
    mousePosition,
    dragState,
    expansionState,
    networkStats,
    setNodes,
    setHoveredNode,
    setSelectedNode,
    setMousePosition,
    startDrag,
    endDrag,
    resetDragFlag,
    updateDragDistance,
    expandNode,
    closeExpandedNode,
    recenterCamera,
    isNodeConnected,
    updateNodePositions,
  } = useNetworkState();

  // Smart Animation Management
  let isRenderScheduled = false;
  let lastActivityTime = Date.now();

  // Track if we had a drag to prevent click - ULTRA ROBUST DETECTION
  let hadDragOperation = false;
  let clickBlocked = false;
  let mouseDownStarted = false;
  let hasMovedDuringPress = false;

  const checkNetworkActivity = (): boolean => {
    const hasMovement = nodes.some(
      node =>
        Math.abs(node.vx) > performanceConfig.STABLE_VELOCITY_THRESHOLD ||
        Math.abs(node.vy) > performanceConfig.STABLE_VELOCITY_THRESHOLD
    );

    const hasInteraction =
      hoveredNode() !== null || dragState.isDragging || expansionState.isExpanding;

    const hasActiveTransfers = nodes.some(
      node =>
        node.activeTransfers &&
        (node.activeTransfers.downloading.length > 0 || node.activeTransfers.uploading.length > 0)
    );

    // Always consider orbital motion as activity - nodes should always be moving
    const hasOrbitalMotion = nodes.some(
      node => node.type !== 'self' && node.orbitSpeed && Math.abs(node.orbitSpeed) > 0
    );

    return hasMovement || hasInteraction || hasActiveTransfers || hasOrbitalMotion;
  };

  const scheduleRender = () => {
    if (!isRenderScheduled) {
      isRenderScheduled = true;
      requestAnimationFrame(() => {
        drawNetwork();
        isRenderScheduled = false;
      });
    }
  };

  const smartAnimate = () => {
    if (
      !canvasRef ||
      typeof window === 'undefined' ||
      typeof requestAnimationFrame === 'undefined'
    ) {
      return;
    }

    // FORCE 24/7 CONTINUOUS ANIMATION - Always simulate physics and render
    simulatePhysics();
    drawNetwork();

    // Always schedule the next frame for 24/7 animation
    animationId = requestAnimationFrame(smartAnimate);
  };

  // Physics simulation using extracted PhysicsEngine
  const simulatePhysics = () => {
    if (!physicsEngine) return;

    const updatedNodes = physicsEngine.simulatePhysics(
      nodes,
      links,
      dragState.draggedNode,
      dragState.isDragging,
      mousePosition(),
      dragState.dragOffset
    );

    // Use optimized position updates to avoid unnecessary re-renders
    updateNodePositions(updatedNodes);
  };

  // Optimized render function
  const drawNetwork = () => {
    if (!canvasRef || !renderer || !nodeRenderer) return;

    const ctx = canvasRef.getContext('2d');
    if (!ctx) return;

    const rect = canvasRef.getBoundingClientRect();
    const width = rect.width || 500;
    const height = rect.height || 400;

    ctx.clearRect(0, 0, width, height);

    // Batch all drawing operations for better performance
    renderer.batchDrawOperations([
      () => drawGrid(ctx, width, height),
      () => drawAllConnections(ctx),
      () => drawAllNodes(ctx),
      () => drawUIOverlays(ctx, width, height),
    ]);
  };

  // Grid drawing with continuous animation
  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const time = Date.now() * 0.001; // Current time for animations

    // Animated grid
    ctx.strokeStyle = 'var(--border-color)';
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.2 + Math.sin(time * 0.5) * 0.1; // Subtle breathing effect

    const gridSize = 25;
    const offset = (time * 10) % gridSize; // Slow moving grid

    // Vertical lines with animation
    for (let x = -offset; x <= width + gridSize; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal lines with animation
    for (let y = -offset; y <= height + gridSize; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Add some animated highlight lines
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.4 + Math.sin(time * 2) * 0.2;

    // Animated vertical highlight
    const highlightX = width / 2 + Math.sin(time * 0.3) * (width * 0.3);
    ctx.beginPath();
    ctx.moveTo(highlightX, 0);
    ctx.lineTo(highlightX, height);
    ctx.stroke();

    // Animated horizontal highlight
    const highlightY = height / 2 + Math.cos(time * 0.4) * (height * 0.3);
    ctx.beginPath();
    ctx.moveTo(0, highlightY);
    ctx.lineTo(width, highlightY);
    ctx.stroke();

    ctx.globalAlpha = 1;
  };

  // Connection drawing with enhanced animations
  const drawAllConnections = (ctx: CanvasRenderingContext2D) => {
    links.forEach(link => {
      const sourceNode = nodes.find(n => n.id === link.source);
      const targetNode = nodes.find(n => n.id === link.target);

      if (
        sourceNode &&
        targetNode &&
        sourceNode.status === 'connected' &&
        targetNode.status === 'connected'
      ) {
        drawLink(ctx, sourceNode, targetNode, link);
      }
    });
  };

  // Enhanced link drawing
  const drawLink = (ctx: CanvasRenderingContext2D, source: any, target: any, link: any) => {
    let transferType = 'idle';
    let lineWidth = Math.max(1, (link.bandwidth / 1024) * 3);
    let isDirWithBandwidth = false;
    let uploadingNode: any = null;
    let downloadingNode: any = null;

    // Check transfer activity
    if (source.activeTransfers) {
      if (source.activeTransfers.uploading.length > 0) {
        transferType = 'uploading';
        uploadingNode = source;
        lineWidth = Math.max(2, lineWidth * 1.5);
        isDirWithBandwidth = true;
      } else if (source.activeTransfers.downloading.length > 0) {
        transferType = 'downloading';
        downloadingNode = source;
        lineWidth = Math.max(2, lineWidth * 1.5);
        isDirWithBandwidth = true;
      }
    }

    if (target.activeTransfers) {
      if (target.activeTransfers.uploading.length > 0) {
        transferType = 'uploading';
        uploadingNode = target;
        lineWidth = Math.max(2, lineWidth * 1.5);
        isDirWithBandwidth = true;
      } else if (target.activeTransfers.downloading.length > 0 && transferType === 'idle') {
        transferType = 'downloading';
        downloadingNode = target;
        lineWidth = Math.max(2, lineWidth * 1.5);
        isDirWithBandwidth = true;
      }
    }

    // Enhanced color system
    const transferColors = {
      downloading: ['#2563eb', '#1d4ed8'],
      uploading: ['#059669', '#047857'],
      reconnecting: ['#f59e0b', '#d97706'],
      interrupted: ['#ef4444', '#dc2626'],
      corrupted: ['#dc2626', '#b91c1c'],
      slow: ['#8b5cf6', '#7c3aed'],
      idle: ['#6b7280', '#9ca3af'],
      verified: ['#16a34a', '#15803d'],
    } as const;

    const colors =
      transferColors[transferType as keyof typeof transferColors] || transferColors.idle;
    const gradient = ctx.createLinearGradient(source.x, source.y, target.x, target.y);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(1, colors[1]);

    ctx.strokeStyle = gradient;
    ctx.lineWidth = lineWidth;
    ctx.globalAlpha = link.strength;

    // Enhanced directional flow animations
    const time = Date.now() * 0.001;

    if (transferType === 'downloading') {
      const flowOffset = (time * 30) % 30;
      ctx.setLineDash([8, 22]);
      ctx.lineDashOffset = downloadingNode === target ? -flowOffset : flowOffset;
      ctx.shadowColor = '#2563eb';
      ctx.shadowBlur = 8;
    } else if (transferType === 'uploading') {
      const flowOffset = (time * 25) % 25;
      ctx.setLineDash([6, 19]);
      ctx.lineDashOffset = uploadingNode === source ? -flowOffset : flowOffset;
      ctx.shadowColor = '#059669';
      ctx.shadowBlur = 6;
    } else if (link.status === 'active') {
      const flowOffset = (time * 15) % 15;
      ctx.setLineDash([4, 11]);
      ctx.lineDashOffset = -flowOffset;
    } else {
      ctx.setLineDash([]);
    }

    // Draw the main line
    ctx.beginPath();
    ctx.moveTo(source.x, source.y);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();

    // Add directional arrow for active transfers
    if (isDirWithBandwidth) {
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const unitX = dx / length;
      const unitY = dy / length;

      let arrowPos = 0.5;
      if (transferType === 'downloading' && downloadingNode) {
        arrowPos = downloadingNode === target ? 0.75 : 0.25;
      } else if (transferType === 'uploading' && uploadingNode) {
        arrowPos = uploadingNode === source ? 0.25 : 0.75;
      }

      const arrowX = source.x + dx * arrowPos;
      const arrowY = source.y + dy * arrowPos;

      const arrowSize = 6 + Math.sin(time * 4) * 1;
      ctx.fillStyle = colors[1];
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(
        arrowX - arrowSize * unitX - arrowSize * 0.5 * unitY,
        arrowY - arrowSize * unitY + arrowSize * 0.5 * unitX
      );
      ctx.lineTo(
        arrowX - arrowSize * unitX + arrowSize * 0.5 * unitY,
        arrowY - arrowSize * unitY - arrowSize * 0.5 * unitX
      );
      ctx.closePath();
      ctx.fill();
    }

    // Reset context
    ctx.globalAlpha = 1;
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;
  };

  // Node drawing using extracted NodeRenderer
  const drawAllNodes = (ctx: CanvasRenderingContext2D) => {
    if (!canvasRef || !nodeRenderer) return;

    const rect = canvasRef.getBoundingClientRect();
    const padding = 100;

    // Frustum Culling: Only render nodes within viewport + padding
    const visibleNodes = nodes.filter(node => {
      return (
        node.x >= -padding &&
        node.x <= rect.width + padding &&
        node.y >= -padding &&
        node.y <= rect.height + padding
      );
    });

    // Render all visible nodes using our extracted NodeRenderer
    visibleNodes.forEach(node => {
      nodeRenderer!.drawNode(node, hoveredNode(), selectedNode());
    });
  };

  // UI overlay drawing
  const drawUIOverlays = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const hovered = hoveredNode();
    const mousePos = mousePosition();
    if (hovered && mousePos && !dragState.isDragging) {
      drawTooltip(ctx, hovered, mousePos.x, mousePos.y, width, height);
    }
  };

  // Enhanced tooltip drawing
  const drawTooltip = (
    ctx: CanvasRenderingContext2D,
    node: any,
    mouseX: number,
    mouseY: number,
    width: number,
    height: number
  ) => {
    const padding = 16;
    const lineHeight = 18;
    const title = node.username || node.label || 'Unknown Node';
    const lines: string[] = [];

    // Enhanced tooltip content
    lines.push(
      `Type: ${node.type.charAt(0).toUpperCase() + node.type.slice(1)} • ${node.status.charAt(0).toUpperCase() + node.status.slice(1)}`
    );

    if (node.username && node.username !== node.label) {
      lines.push(`IP: ${node.username}`);
    }
    if (node.location && node.location !== 'Unknown') {
      lines.push(`Location: ${node.location}`);
    }
    if (node.networkType) {
      lines.push(`Network: ${node.networkType.toUpperCase()}`);
    }

    lines.push(`Connections: ${node.connections} peers`);
    lines.push(`Bandwidth: ${(node.bandwidth / 1024).toFixed(1)} MB/s`);
    lines.push(
      `Latency: ${node.latency.toFixed(0)}ms • Reliability: ${node.reliability.toFixed(0)}%`
    );

    // Active File Transfers
    if (node.activeTransfers) {
      const downloads = node.activeTransfers.downloading;
      const uploads = node.activeTransfers.uploading;

      if (downloads.length > 0) {
        lines.push('');
        lines.push(`📥 DOWNLOADING (${downloads.length}):`);
        downloads.slice(0, 2).forEach((dl: any) => {
          lines.push(`  • ${dl.fileName}`);
          lines.push(
            `    ${dl.progress}% • ${(dl.speed / 1024).toFixed(1)} MB/s • ${formatFileSize(dl.fileSize)}`
          );
          lines.push(`    ${formatTimeRemaining(dl.timeRemaining)} remaining`);
        });
        if (downloads.length > 2) {
          lines.push(`  ... and ${downloads.length - 2} more`);
        }
      }

      if (uploads.length > 0) {
        lines.push('');
        lines.push(`📤 UPLOADING (${uploads.length}):`);
        uploads.slice(0, 2).forEach((ul: any) => {
          lines.push(`  • ${ul.fileName}`);
          lines.push(
            `    ${ul.progress}% • ${(ul.speed / 1024).toFixed(1)} MB/s • ${formatFileSize(ul.fileSize)}`
          );
          lines.push(`    ${formatTimeRemaining(ul.timeRemaining)} remaining`);
        });
        if (uploads.length > 2) {
          lines.push(`  ... and ${uploads.length - 2} more`);
        }
      }
    }

    // Calculate tooltip dimensions
    const titleFont = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const contentFont = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

    ctx.font = titleFont;
    const titleWidth = ctx.measureText(title).width;
    ctx.font = contentFont;
    const maxContentWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
    const maxWidth = Math.max(titleWidth, maxContentWidth);

    const tooltipWidth = Math.min(maxWidth + padding * 2, 450);
    const tooltipHeight = (lines.length + 1) * lineHeight + padding * 2 + 30;

    const offset = 15;
    let tooltipX = mouseX + offset;
    let tooltipY = mouseY - tooltipHeight - offset;

    // Position adjustment
    if (tooltipX + tooltipWidth > width) {
      tooltipX = mouseX - tooltipWidth - offset;
    }
    if (tooltipY < 0) {
      tooltipY = mouseY + offset;
    }

    tooltipX = Math.max(5, Math.min(tooltipX, width - tooltipWidth - 5));
    tooltipY = Math.max(5, Math.min(tooltipY, height - tooltipHeight - 5));

    // Gradient background
    const gradient = ctx.createLinearGradient(
      tooltipX,
      tooltipY,
      tooltipX,
      tooltipY + tooltipHeight
    );
    gradient.addColorStop(0, 'rgba(30, 41, 59, 0.95)');
    gradient.addColorStop(1, 'rgba(15, 23, 42, 0.95)');

    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 6;

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 12);
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Node type colored border
    const typeColors = {
      self: '#3b82f6',
      peer: '#10b981',
      institution: '#a855f7',
      community: '#f59e0b',
    };

    ctx.strokeStyle = typeColors[node.type as keyof typeof typeColors];
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 12);
    ctx.stroke();

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = titleFont;
    ctx.textAlign = 'left';
    ctx.fillText(title, tooltipX + padding, tooltipY + padding + 18);

    // Content
    ctx.font = contentFont;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';

    lines.forEach((line, index) => {
      const yPos = tooltipY + padding + 28 + 12 + (index + 1) * lineHeight;
      ctx.fillText(line, tooltipX + padding, yPos);
    });
  };

  // Mouse handling with immediate click blocking
  const handleMouseMoveOptimized = (e: MouseEvent) => {
    if (!canvasRef) return;

    const rect = canvasRef.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePosition({ x, y });
    updateDragDistance({ x, y });

    // If mouse is down and we're moving, this is definitely a drag operation
    if (mouseDownStarted && dragState.isDragging) {
      hasMovedDuringPress = true;
      clickBlocked = true;
      hadDragOperation = true;
    }

    if (dragState.isDragging && dragState.draggedNode) {
      return;
    }

    // Hover detection
    const hoveredNodeFound =
      nodes.find(node => {
        const baseSize = 12;
        const nodeSize = baseSize + node.connections * 1.5;
        const clickRadius = nodeSize + 10;
        const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
        return distance < clickRadius;
      }) || null;

    setHoveredNode(hoveredNodeFound);
    canvasRef.style.cursor = hoveredNodeFound ? 'pointer' : 'default';
  };

  const handleMouseMove = throttle(handleMouseMoveOptimized, performanceConfig.THROTTLE_INTERVAL);

  const handleMouseDown = (e: MouseEvent) => {
    if (!canvasRef) return;

    // Mark that mouse press started - reset all flags for fresh detection
    mouseDownStarted = true;
    hasMovedDuringPress = false;
    clickBlocked = false;
    hadDragOperation = false;

    const rect = canvasRef.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedNode = nodes.find(node => {
      const baseSize = 12;
      const nodeSize = baseSize + node.connections * 1.5;
      const clickRadius = nodeSize + 4;
      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      return distance < clickRadius;
    });

    if (clickedNode) {
      startDrag(clickedNode, { x, y });
      if (canvasRef) {
        canvasRef.style.cursor = 'grabbing';
      }
    }

    setMousePosition({ x, y });
  };

  const handleMouseUp = () => {
    mouseDownStarted = false;

    // If we moved during press, definitely block clicks
    if (hasMovedDuringPress || dragState.hasDraggedDistance) {
      hadDragOperation = true;
      clickBlocked = true;
    }

    // Only end drag if we were actually dragging
    if (dragState.isDragging) {
      endDrag();
    }
    if (canvasRef) {
      canvasRef.style.cursor = hoveredNode() ? 'pointer' : 'default';
    }

    // Clear flags after a substantial delay to ensure click events are blocked
    if (hadDragOperation || clickBlocked || hasMovedDuringPress) {
      setTimeout(() => {
        hadDragOperation = false;
        clickBlocked = false;
        hasMovedDuringPress = false;
        resetDragFlag();
      }, 250); // Even longer delay for ultra-reliable detection
    }
  };

  // Use capture phase to block clicks before they bubble
  const handleClickCapture = (e: MouseEvent) => {
    // Block in capture phase - this fires BEFORE the regular click handler
    if (
      hadDragOperation ||
      clickBlocked ||
      hasMovedDuringPress ||
      dragState.hasDraggedDistance ||
      dragState.isDragging
    ) {
      e.preventDefault();
      e.stopImmediatePropagation();
      e.stopPropagation();
      return false;
    }
  };

  const handleClick = (e: MouseEvent) => {
    // Additional check in regular click handler (though it should be blocked by capture)
    if (
      hadDragOperation ||
      clickBlocked ||
      hasMovedDuringPress ||
      dragState.hasDraggedDistance ||
      dragState.isDragging
    ) {
      e.preventDefault();
      e.stopImmediatePropagation();
      e.stopPropagation();
      return false;
    }

    if (!canvasRef) return;

    const rect = canvasRef.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedNode = nodes.find(node => {
      const baseSize = 12;
      const nodeSize = baseSize + node.connections * 1.5;
      const clickRadius = nodeSize + 4;
      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      return distance < clickRadius;
    });

    if (clickedNode) {
      // Only expand node on genuine click (not after drag)
      expandNode(clickedNode, { x: e.clientX, y: e.clientY });
    } else {
      // Close expanded node if clicking on empty space
      if (expansionState.expandedNode) {
        closeExpandedNode();
      }
    }

    setSelectedNode(clickedNode || null);
  };

  onMount(() => {
    if (canvasRef) {
      const setupCanvas = () => {
        const rect = canvasRef!.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        canvasRef!.width = rect.width * dpr;
        canvasRef!.height = rect.height * dpr;

        const originalWidth =
          typeof props.width === 'string' ? props.width : `${props.width || 500}px`;
        const originalHeight =
          typeof props.height === 'string' ? props.height : `${props.height || 400}px`;

        canvasRef!.style.width = originalWidth;
        canvasRef!.style.height = originalHeight;

        const ctx = canvasRef!.getContext('2d');
        if (ctx) {
          ctx.scale(dpr, dpr);

          // Initialize performance systems
          if (!renderer) {
            renderer = new CanvasRenderer(ctx);
          }
          if (!animationManager) {
            animationManager = new AnimationManager();
          }
          if (!spatialGrid) {
            spatialGrid = new SpatialGrid(100);
          }
          if (!physicsEngine) {
            physicsEngine = new PhysicsEngine();
          }
          if (!nodeRenderer) {
            nodeRenderer = new NodeRenderer(ctx);
          }
        }
      };

      setupCanvas();

      const resizeObserver = new ResizeObserver(setupCanvas);
      resizeObserver.observe(canvasRef);

      canvasRef.addEventListener('mousemove', handleMouseMove);
      canvasRef.addEventListener('mousedown', handleMouseDown);
      canvasRef.addEventListener('mouseup', handleMouseUp);
      canvasRef.addEventListener('click', handleClickCapture, true); // Capture phase
      canvasRef.addEventListener('click', handleClick); // Bubble phase (backup)

      document.addEventListener('mouseup', handleMouseUp);

      smartAnimate();

      return () => {
        resizeObserver.disconnect();
        if (canvasRef) {
          canvasRef.removeEventListener('mousemove', handleMouseMove);
          canvasRef.removeEventListener('mousedown', handleMouseDown);
          canvasRef.removeEventListener('mouseup', handleMouseUp);
          canvasRef.removeEventListener('click', handleClickCapture, true);
          canvasRef.removeEventListener('click', handleClick);
        }
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }

    return () => {};
  });

  onCleanup(() => {
    if (animationManager) {
      animationManager.stop();
    }
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
    if (renderer) {
      renderer.clearCache();
    }
    if (spatialGrid) {
      spatialGrid.clear();
    }
    if (vectorPool) {
      vectorPool.clear();
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

      {/* Recenter FAB */}
      <div class="recenter-fab-container">
        <button
          class="recenter-fab"
          onClick={() => canvasRef && recenterCamera(canvasRef)}
          title="Recenter view on You node"
          aria-label="Recenter camera view"
        >
          <div class="recenter-icon">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="m12 1 0 6" />
              <path d="m12 17 0 6" />
              <path d="m1 12 6 0" />
              <path d="m17 12 6 0" />
            </svg>
          </div>
          <span class="recenter-text">Center</span>
        </button>
        <div class="recenter-ripple" />
      </div>

      {/* Transfer Legend Component */}
      <TransferLegend />

      {/* Network Stats */}
      {props.showStats && (
        <div class="network-stats">
          <div class="network-stat-item">
            <span class="network-stat-label">Peers</span>
            <span class="network-stat-value">
              {networkStats.activePeers}/{networkStats.totalPeers}
            </span>
          </div>
          <div class="network-stat-item">
            <span class="network-stat-label">Bandwidth</span>
            <span class="network-stat-value">
              {(networkStats.totalBandwidth / 1024).toFixed(1)} MB/s
            </span>
          </div>
          <div class="network-stat-item">
            <span class="network-stat-label">Latency</span>
            <span class="network-stat-value">{networkStats.averageLatency}ms</span>
          </div>
          <div class="network-stat-item">
            <span class="network-stat-label">Health</span>
            <span
              class={`network-stat-value health-${networkStats.networkHealth > 80 ? 'good' : networkStats.networkHealth > 50 ? 'fair' : 'poor'}`}
            >
              {networkStats.networkHealth}%
            </span>
          </div>
        </div>
      )}

      {/* Selected Node Details */}
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

      {/* Expanded Node Overlay */}
      {expansionState.expandedNode && (
        <div
          class={`expanded-node-overlay ${expansionState.isExpanded ? 'expanded' : ''}`}
          onClick={e => {
            if (e.target === e.currentTarget) {
              closeExpandedNode();
            }
          }}
        >
          <div class="expanded-node-content">
            {/* Header */}
            <div class="expanded-node-header">
              <div class="node-avatar">
                <div class={`node-type-indicator ${expansionState.expandedNode.type}`}>
                  {expansionState.expandedNode.type === 'self' && '👤'}
                  {expansionState.expandedNode.type === 'peer' && '🌐'}
                  {expansionState.expandedNode.type === 'institution' && '🏛️'}
                  {expansionState.expandedNode.type === 'community' && '🏘️'}
                </div>
              </div>

              <div class="node-info">
                <h1 class="node-title">{expansionState.expandedNode.label}</h1>
                <p class="node-subtitle">
                  {formatNodeType(expansionState.expandedNode.type)} Network Node
                </p>
                <div class="node-status-badges">
                  <span class={`status-badge ${expansionState.expandedNode.status}`}>
                    {expansionState.expandedNode.status}
                  </span>
                  <span class="network-badge">
                    {getNetworkTypeIcon(expansionState.expandedNode.networkType || 'internet')} P2P
                  </span>
                </div>
              </div>

              <button class="close-button" onClick={closeExpandedNode} title="Close">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="m18 6-12 12" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div class="expanded-node-body">
              <div class="content-columns">
                <div class="column-left">
                  {/* Connection Stats */}
                  <div class="stats-section">
                    <h3>Connection Statistics</h3>
                    <div class="stats-grid-compact">
                      <div class="stat-compact">
                        <span class="stat-label-compact">Status</span>
                        <span
                          class={`stat-value-compact status-${expansionState.expandedNode.status}`}
                        >
                          {expansionState.expandedNode.status}
                        </span>
                      </div>
                      <div class="stat-compact">
                        <span class="stat-label-compact">Connections</span>
                        <span class="stat-value-compact">
                          {expansionState.expandedNode.connections}
                        </span>
                      </div>
                      <div class="stat-compact">
                        <span class="stat-label-compact">Bandwidth</span>
                        <span class="stat-value-compact">
                          {formatBandwidth(expansionState.expandedNode.bandwidth)}
                        </span>
                      </div>
                      <div class="stat-compact">
                        <span class="stat-label-compact">Latency</span>
                        <span class="stat-value-compact">
                          {formatLatency(expansionState.expandedNode.latency).text}
                        </span>
                      </div>
                      <div class="stat-compact">
                        <span class="stat-label-compact">Reliability</span>
                        <span class="stat-value-compact">
                          {formatReliability(expansionState.expandedNode.reliability).text}
                        </span>
                      </div>
                      <div class="stat-compact">
                        <span class="stat-label-compact">Network Type</span>
                        <span class="stat-value-compact">
                          {getNetworkTypeIcon(
                            expansionState.expandedNode.networkType || 'internet'
                          )}{' '}
                          {formatNodeType(expansionState.expandedNode.networkType || 'internet')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Active Transfers */}
                  {expansionState.expandedNode.activeTransfers &&
                    (expansionState.expandedNode.activeTransfers.downloading.length > 0 ||
                      expansionState.expandedNode.activeTransfers.uploading.length > 0) && (
                      <div class="transfers-section">
                        <h3>Active Transfers</h3>
                        <div class="transfers-list">
                          <div class="transfer-item">
                            <div class="transfer-info">
                              <div class="transfer-file">📥 Cultural Archive Data</div>
                              <div class="transfer-details">{formatFileSize(1024)} • Active</div>
                            </div>
                            <div class="transfer-progress">
                              <div class="progress-bar">
                                <div class="progress-fill" style="width: 75%" />
                              </div>
                              <div class="progress-text">75%</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                </div>

                <div class="column-right">
                  {/* Node Capabilities */}
                  {expansionState.expandedNode.capabilities && (
                    <div class="capabilities-section">
                      <h3>Capabilities</h3>
                      <div class="capabilities-grid-compact">
                        {Object.entries(expansionState.expandedNode.capabilities).map(
                          ([key, value]) => (
                            <div class="capability-item">
                              <span class="capability-label">{formatNodeType(key)}</span>
                              <span class="capability-status">
                                {typeof value === 'boolean' ? (value ? '✓' : '✗') : String(value)}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* Cultural Context */}
                  {expansionState.expandedNode.culturalContext && (
                    <div class="cultural-section">
                      <h3>Cultural Context</h3>
                      <p class="cultural-description">
                        {expansionState.expandedNode.culturalContext}
                      </p>
                    </div>
                  )}

                  {/* Location & Network Info */}
                  <div class="location-section">
                    <h3>Network Information</h3>
                    <div class="location-grid">
                      {expansionState.expandedNode.location && (
                        <>
                          <span class="location-label">Location</span>
                          <span class="location-value">{expansionState.expandedNode.location}</span>
                        </>
                      )}
                      <span class="location-label">Node ID</span>
                      <span class="location-value font-mono">{expansionState.expandedNode.id}</span>
                      <span class="location-label">Type</span>
                      <span class="location-value">
                        {formatNodeType(expansionState.expandedNode.type)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkGraph;
