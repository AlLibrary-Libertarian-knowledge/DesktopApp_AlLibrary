import {
  type Component,
  onMount,
  onCleanup,
  createEffect,
  createSignal,
  createMemo,
} from 'solid-js';
import { useTranslation } from '../../../i18n/hooks';
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
import PeerNodeModal from './components/PeerNodeModal';
import { performanceConfig } from './config/physicsConfig';
import { formatFileSize } from './utils/formatters';
import { buildLobbyGraph, nodeHitRadius } from './data/buildLobbyGraph';
import { buildMockGraph, USE_MOCK_NETWORK_GRAPH } from './data/mockNetworkData';
import { useNetworkLobby } from '@/hooks/api/useNetworkLobby';
import { useNetworkPeers } from '@/hooks/api/useNetworkPeers';
import { onionShareStatus, trackerGetConfig } from '@/services/network/onionShareService';
import './NetworkGraph.css';

const NetworkGraph: Component<NetworkGraphProps> = props => {
  const { t } = useTranslation('components');
  const useMock = () => props.useMockData ?? USE_MOCK_NETWORK_GRAPH;

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
    setNodes,
    setHoveredNode,
    setSelectedNode,
    setMousePosition,
    replaceGraph,
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

  const lobby = useNetworkLobby();
  const networkPeers = useNetworkPeers();
  const [selfOnion, setSelfOnion] = createSignal<string | null>(null);
  const [selfNodeId, setSelfNodeId] = createSignal<string | null>(null);

  // Smart Animation Management
  let isRenderScheduled = false;
  const lastActivityTime = Date.now(); // Keep as const since it's not reassigned in test mode

  /** Click vs drag: only start drag after threshold; open modal on short press. */
  const DRAG_THRESHOLD_PX = 8;
  let pressNode: (typeof nodes)[number] | null = null;
  let pressOrigin: { x: number; y: number } | null = null;
  let dragArmed = false;

  const graphCenter = () => {
    if (canvasRef) {
      const rect = canvasRef.getBoundingClientRect();
      return {
        centerX: rect.width * 0.45 || 400,
        centerY: rect.height * 0.5 || 300,
      };
    }
    return { centerX: 400, centerY: 300 };
  };

  const syncGraph = () => {
    const { centerX, centerY } = graphCenter();
    if (useMock()) {
      const built = buildMockGraph(centerX, centerY);
      replaceGraph(built.nodes, built.links);
      return;
    }
    const built = buildLobbyGraph({
      selfOnion: selfOnion(),
      selfNodeId: selfNodeId(),
      peers: networkPeers.peers(),
      files: lobby.files(),
      centerX,
      centerY,
    });
    replaceGraph(built.nodes, built.links);
  };

  createEffect(() => {
    if (useMock()) {
      syncGraph();
      return;
    }
    // Live lobby: rebuild when peers/files/identity change
    networkPeers.peers();
    lobby.files();
    selfOnion();
    selfNodeId();
    syncGraph();
  });

  const uniqueFileCount = createMemo(() => {
    if (!useMock()) return lobby.files().length;
    const hashes = new Set<string>();
    for (const n of nodes) {
      for (const f of n.sharedFiles ?? []) {
        if (f.contentHash) hashes.add(f.contentHash);
      }
    }
    return hashes.size;
  });

  /** Live overlay stats from current graph nodes (avoids stale debounced store). */
  const overlayStats = createMemo(() => {
    const list = [...nodes];
    const peers = list.filter(n => n.type !== 'self');
    const active = peers.filter(n => n.status === 'connected').length;
    const shareSum = list.reduce((s, n) => s + (n.sharedFileCount ?? 0), 0);
    const health =
      peers.length === 0
        ? list.some(n => n.type === 'self')
          ? 72
          : 0
        : Math.round((active / peers.length) * 100);
    const tone = health > 80 ? 'good' : health > 50 ? 'fair' : 'poor';
    return {
      activePeers: active,
      totalPeers: peers.length,
      files: uniqueFileCount(),
      shares: shareSum,
      health,
      tone,
    };
  });

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

    // In test mode, use original performance-based animation logic
    if (props.testMode || import.meta.env?.MODE === 'test') {
      // Fallback to activity-based animation for testing
      const hasActivity = checkNetworkActivity();
      const timeSinceActivity = Date.now() - lastActivityTime;

      if (hasActivity) {
        simulatePhysics();
        drawNetwork();
        animationId = requestAnimationFrame(smartAnimate);
      } else if (timeSinceActivity < performanceConfig.ACTIVITY_TIMEOUT) {
        simulatePhysics();
        scheduleRender();
        animationId = requestAnimationFrame(smartAnimate);
      } else {
        // In test mode, stop animation after timeout
        scheduleRender();
        return;
      }
    } else {
      // FORCE 24/7 CONTINUOUS ANIMATION in production mode
      simulatePhysics();
      drawNetwork();

      // Always schedule the next frame for 24/7 animation
      animationId = requestAnimationFrame(smartAnimate);
    }
  };

  // Physics simulation using extracted PhysicsEngine
  const simulatePhysics = () => {
    if (!physicsEngine) return;

    const frozenIds = [
      hoveredNode()?.id,
      selectedNode()?.id,
      expansionState.expandedNode?.id,
    ].filter((id): id is string => Boolean(id));

    const updatedNodes = physicsEngine.simulatePhysics(
      nodes,
      links,
      dragState.draggedNode,
      dragState.isDragging,
      mousePosition(),
      dragState.dragOffset,
      frozenIds
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

  // Quiet grid — subtle atmosphere, no racing highlight lines
  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const time = Date.now() * 0.001;
    const gridSize = 28;
    const offset = (time * 4) % gridSize;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 1;

    for (let x = -offset; x <= width + gridSize; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = -offset; y <= height + gridSize; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Soft vignette wash
    const wash = ctx.createRadialGradient(
      width * 0.5,
      height * 0.5,
      Math.min(width, height) * 0.15,
      width * 0.5,
      height * 0.5,
      Math.max(width, height) * 0.65
    );
    wash.addColorStop(0, 'rgba(255, 138, 61, 0.03)');
    wash.addColorStop(1, 'transparent');
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, width, height);
  };

  const nodeVisualRadius = (node: (typeof nodes)[number]) => {
    const base = node.type === 'self' ? 14 : 12;
    const files = Math.min((node.sharedFileCount ?? node.connections) * 0.45, 6);
    const busy =
      (node.activeTransfers?.downloading.length ? 2 : 0) +
      (node.activeTransfers?.uploading.length ? 2 : 0);
    return base + files + busy + 4; // pad so stroke meets the rim, not the center
  };

  const drawAllConnections = (ctx: CanvasRenderingContext2D) => {
    links.forEach(link => {
      const sourceNode = nodes.find(n => n.id === link.source);
      const targetNode = nodes.find(n => n.id === link.target);
      if (!sourceNode || !targetNode) return;
      if (sourceNode.status === 'disconnected' || targetNode.status === 'disconnected') return;
      if (sourceNode.status === 'error' || targetNode.status === 'error') return;
      drawLink(ctx, sourceNode, targetNode, link);
    });
  };

  /** Straight edges with soft glow, flow dashes, and clean chevrons. */
  const drawLink = (
    ctx: CanvasRenderingContext2D,
    source: (typeof nodes)[number],
    target: (typeof nodes)[number],
    link: (typeof links)[number]
  ) => {
    const dx0 = target.x - source.x;
    const dy0 = target.y - source.y;
    const dist = Math.hypot(dx0, dy0);
    if (dist < 8) return;

    const ux = dx0 / dist;
    const uy = dy0 / dist;
    const r1 = nodeVisualRadius(source);
    const r2 = nodeVisualRadius(target);
    const x1 = source.x + ux * r1;
    const y1 = source.y + uy * r1;
    const x2 = target.x - ux * r2;
    const y2 = target.y - uy * r2;
    const span = Math.hypot(x2 - x1, y2 - y1);
    if (span < 4) return;

    let transferType: 'idle' | 'downloading' | 'uploading' = 'idle';
    let flowTowardTarget = true;
    const srcUp = (source.activeTransfers?.uploading.length ?? 0) > 0;
    const srcDown = (source.activeTransfers?.downloading.length ?? 0) > 0;
    const tgtUp = (target.activeTransfers?.uploading.length ?? 0) > 0;
    const tgtDown = (target.activeTransfers?.downloading.length ?? 0) > 0;

    if (srcUp || tgtDown) {
      transferType = 'uploading';
      flowTowardTarget = srcUp || !tgtUp;
    } else if (srcDown || tgtUp) {
      transferType = 'downloading';
      flowTowardTarget = !srcDown;
    }

    const palette = {
      downloading: { a: '#60a5fa', b: '#3b82f6', glow: 'rgba(59, 130, 246, 0.35)' },
      uploading: { a: '#34d399', b: '#10b981', glow: 'rgba(16, 185, 129, 0.35)' },
      idle: {
        a: 'rgba(61, 207, 176, 0.75)',
        b: 'rgba(255, 138, 61, 0.55)',
        glow: 'rgba(61, 207, 176, 0.15)',
      },
    }[transferType];

    const active = transferType !== 'idle' || link.status === 'active';
    const width = transferType === 'idle' ? 1.6 : 2.15;
    const alpha =
      source.status === 'connecting' || target.status === 'connecting' ? 0.4 : active ? 0.85 : 0.55;

    const strokePath = () => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    };

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Soft under-glow
    ctx.strokeStyle = palette.glow;
    ctx.lineWidth = width + 3;
    ctx.globalAlpha = alpha * 0.45;
    ctx.shadowColor = palette.glow;
    ctx.shadowBlur = 8;
    ctx.setLineDash([]);
    strokePath();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Main stroke
    const grad = ctx.createLinearGradient(x1, y1, x2, y2);
    grad.addColorStop(0, palette.a);
    grad.addColorStop(1, palette.b);
    ctx.strokeStyle = grad;
    ctx.lineWidth = width;
    ctx.globalAlpha = alpha;

    const time = Date.now() * 0.001;
    if (transferType === 'downloading') {
      ctx.setLineDash([5, 11]);
      ctx.lineDashOffset = flowTowardTarget ? -(time * 26) : time * 26;
    } else if (transferType === 'uploading') {
      ctx.setLineDash([4, 10]);
      ctx.lineDashOffset = flowTowardTarget ? -(time * 22) : time * 22;
    } else if (active) {
      ctx.setLineDash([3, 9]);
      ctx.lineDashOffset = -(time * 10);
    } else {
      ctx.setLineDash([2, 8]);
    }

    strokePath();
    ctx.stroke();

    // Traveling bead on active links
    if (transferType !== 'idle') {
      const t = (((time * 0.35) % 1) + 1) % 1;
      const u = flowTowardTarget ? t : 1 - t;
      const bx = x1 + (x2 - x1) * u;
      const by = y1 + (y2 - y1) * u;
      ctx.fillStyle = palette.b;
      ctx.globalAlpha = 0.95;
      ctx.shadowColor = palette.b;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(bx, by, 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Chevron near the receiving end
    if (active) {
      const u = 0.72;
      const ax = x1 + (x2 - x1) * u;
      const ay = y1 + (y2 - y1) * u;
      const size = 5.5;
      ctx.fillStyle = palette.b;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.moveTo(ax + ux * size, ay + uy * size);
      ctx.lineTo(ax - ux * size * 0.7 - uy * size * 0.55, ay - uy * size * 0.7 + ux * size * 0.55);
      ctx.lineTo(ax - ux * size * 0.7 + uy * size * 0.55, ay - uy * size * 0.7 - ux * size * 0.55);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
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
    if (hovered && !dragState.isDragging && !expansionState.expandedNode) {
      // Anchor to frozen node position (not the moving cursor)
      drawTooltip(ctx, hovered, hovered.x, hovered.y, width, height);
    }
  };

  /** Compact hover card — Portuguese, amber chrome, node-anchored */
  const drawTooltip = (
    ctx: CanvasRenderingContext2D,
    node: (typeof nodes)[number],
    anchorX: number,
    anchorY: number,
    width: number,
    height: number
  ) => {
    const isSelf = Boolean(node.isLocalSelf || node.type === 'self');
    const live = node.status === 'connected';
    const title = isSelf ? 'Você' : node.username || node.label || node.onionShort || 'Peer';
    const fileCount = node.sharedFileCount ?? node.sharedFiles?.length ?? 0;
    const sharedBytes =
      node.sharedBytes ?? (node.sharedFiles || []).reduce((s, f) => s + (f.size || 0), 0);
    const onion = node.onionShort || node.onionAddress || '';
    const onionShort = onion.length > 28 ? `${onion.slice(0, 14)}…${onion.slice(-8)}` : onion;

    const rows: Array<{ label: string; value: string; muted?: boolean }> = [
      { label: 'Status', value: live ? 'Online' : 'Ausente' },
      { label: 'Arquivos', value: String(fileCount) },
    ];
    if (sharedBytes > 0) {
      rows.push({
        label: 'Volume',
        value: formatFileSize(Math.max(1, Math.round(sharedBytes / 1024))),
      });
    }
    if (node.lastSeenLabel) {
      rows.push({ label: 'Visto', value: node.lastSeenLabel });
    }
    if (onionShort) {
      rows.push({ label: 'Onion', value: onionShort, muted: true });
    }

    const sample = (node.sharedFiles || []).slice(0, 2).map(f => f.name);
    const padX = 14;
    const padY = 12;
    const titleFont = '700 14px Syne, Outfit, sans-serif';
    const labelFont = '600 10px Outfit, sans-serif';
    const valueFont = '500 12px Outfit, sans-serif';
    const hintFont = '500 11px Outfit, sans-serif';
    const rowH = 18;
    const fileH = 15;

    ctx.font = titleFont;
    let contentW = ctx.measureText(title).width;
    ctx.font = valueFont;
    for (const r of rows) {
      contentW = Math.max(contentW, ctx.measureText(`${r.label}  ${r.value}`).width);
    }
    for (const name of sample) {
      contentW = Math.max(contentW, ctx.measureText(`· ${name}`).width * 0.95);
    }
    contentW = Math.max(contentW, ctx.measureText('Clique para detalhes').width);

    const boxW = Math.min(Math.max(contentW + padX * 2, 200), 280);
    let boxH = padY + 22 + 6 + rows.length * rowH + padY + 18;
    if (sample.length) boxH += 8 + sample.length * fileH + 4;

    const gap = 22;
    let boxX = anchorX + gap;
    let boxY = anchorY - boxH / 2;
    if (boxX + boxW > width - 8) boxX = anchorX - boxW - gap;
    if (boxX < 8) boxX = 8;
    if (boxY < 8) boxY = 8;
    if (boxY + boxH > height - 8) boxY = height - boxH - 8;

    // Soft connector line from node to card
    ctx.strokeStyle = 'rgba(255, 138, 61, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(anchorX, anchorY);
    ctx.lineTo(boxX < anchorX ? boxX + boxW : boxX, boxY + 20);
    ctx.stroke();

    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = 'rgba(22, 20, 18, 0.96)';
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 12);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.strokeStyle = 'rgba(255, 138, 61, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 12);
    ctx.stroke();

    // Accent bar
    ctx.fillStyle = '#ff8a3d';
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, 3, boxH, 2);
    ctx.fill();

    let y = boxY + padY + 14;
    ctx.fillStyle = '#f4f0ea';
    ctx.font = titleFont;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(title, boxX + padX, y);

    // status chip next to title
    const chip = live ? 'Online' : 'Ausente';
    ctx.font = '700 9px Outfit, sans-serif';
    const chipW = ctx.measureText(chip).width + 10;
    const chipX = boxX + boxW - padX - chipW;
    const chipY = boxY + padY + 2;
    ctx.fillStyle = live ? '#3dcfb0' : '#e8b45a';
    ctx.beginPath();
    ctx.roundRect(chipX, chipY, chipW, 16, 8);
    ctx.fill();
    ctx.fillStyle = live ? '#042f24' : '#3d2a0a';
    ctx.fillText(chip, chipX + 5, chipY + 11);

    y += 10;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(boxX + padX, y);
    ctx.lineTo(boxX + boxW - padX, y);
    ctx.stroke();
    y += 16;

    for (const r of rows) {
      if (r.label === 'Status') continue; // shown as chip
      ctx.font = labelFont;
      ctx.fillStyle = '#6b665e';
      ctx.fillText(r.label.toUpperCase(), boxX + padX, y);
      ctx.font = valueFont;
      ctx.fillStyle = r.muted ? '#9c968c' : '#f4f0ea';
      const labelW = 64;
      ctx.fillText(r.value, boxX + padX + labelW, y);
      y += rowH;
    }

    if (sample.length) {
      y += 2;
      ctx.font = labelFont;
      ctx.fillStyle = '#6b665e';
      ctx.fillText('ARQUIVOS', boxX + padX, y);
      y += fileH;
      ctx.font = '500 11px Outfit, sans-serif';
      ctx.fillStyle = '#c4bfb6';
      for (const name of sample) {
        const clipped = name.length > 28 ? `${name.slice(0, 26)}…` : name;
        ctx.fillText(`· ${clipped}`, boxX + padX, y);
        y += fileH;
      }
      if (fileCount > sample.length) {
        ctx.fillStyle = '#6b665e';
        ctx.fillText(`+${fileCount - sample.length} mais`, boxX + padX, y);
        y += fileH;
      }
    }

    y = boxY + boxH - 10;
    ctx.font = hintFont;
    ctx.fillStyle = '#ff8a3d';
    ctx.fillText('Clique para detalhes', boxX + padX, y);
  };

  const findNodeAt = (x: number, y: number) => {
    let best: (typeof nodes)[number] | null = null;
    let bestDist = Infinity;
    for (const node of nodes) {
      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      const radius = nodeHitRadius(node);
      if (distance < radius && distance < bestDist) {
        bestDist = distance;
        best = node;
      }
    }
    return best;
  };

  const handleMouseMoveOptimized = (e: MouseEvent) => {
    if (!canvasRef) return;

    const rect = canvasRef.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePosition({ x, y });

    // Arm drag only after threshold — short presses become clicks
    if (pressNode && pressOrigin && !dragArmed) {
      const dist = Math.hypot(x - pressOrigin.x, y - pressOrigin.y);
      if (dist >= DRAG_THRESHOLD_PX) {
        dragArmed = true;
        startDrag(pressNode, pressOrigin);
        canvasRef.style.cursor = 'grabbing';
      }
    }

    if (dragState.isDragging) {
      updateDragDistance({ x, y });
      return;
    }

    const hoveredNodeFound = findNodeAt(x, y);
    setHoveredNode(hoveredNodeFound);
    canvasRef.style.cursor = hoveredNodeFound ? 'pointer' : 'default';
  };

  const handleMouseMove = throttle(handleMouseMoveOptimized, performanceConfig.THROTTLE_INTERVAL);

  const handleMouseDown = (e: MouseEvent) => {
    if (!canvasRef || e.button !== 0) return;

    const rect = canvasRef.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    pressNode = findNodeAt(x, y);
    pressOrigin = { x, y };
    dragArmed = false;
    setMousePosition({ x, y });
  };

  const handleMouseUp = (e: MouseEvent) => {
    if (!canvasRef) return;
    // Avoid double-fire from canvas + document listeners
    if (!pressOrigin && !dragArmed && !dragState.isDragging) return;

    const rect = canvasRef.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const wasDragging = dragArmed || dragState.isDragging;
    const pressed = pressNode;

    if (dragState.isDragging) {
      endDrag();
      resetDragFlag();
    }

    pressNode = null;
    pressOrigin = null;
    dragArmed = false;

    if (!wasDragging && pressed) {
      const target = findNodeAt(x, y) ?? pressed;
      expandNode(target, { x: e.clientX, y: e.clientY });
    } else if (!wasDragging && !pressed) {
      if (expansionState.expandedNode) {
        closeExpandedNode();
      }
    }

    canvasRef.style.cursor = hoveredNode() ? 'pointer' : 'default';
  };

  onMount(() => {
    void (async () => {
      try {
        const [status, cfg] = await Promise.all([onionShareStatus(), trackerGetConfig()]);
        setSelfOnion(status.onion ?? null);
        setSelfNodeId(cfg.nodeId ?? null);
      } catch {
        /* outside Tauri */
      }
      void lobby.refresh(true);
    })();

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
        syncGraph();
      };

      setupCanvas();

      const resizeObserver = new ResizeObserver(setupCanvas);
      resizeObserver.observe(canvasRef);

      canvasRef.addEventListener('mousemove', handleMouseMove);
      canvasRef.addEventListener('mousedown', handleMouseDown);
      canvasRef.addEventListener('mouseup', handleMouseUp);

      const onDocMouseUp = (ev: MouseEvent) => handleMouseUp(ev);
      document.addEventListener('mouseup', onDocMouseUp);

      smartAnimate();

      return () => {
        resizeObserver.disconnect();
        if (canvasRef) {
          canvasRef.removeEventListener('mousemove', handleMouseMove);
          canvasRef.removeEventListener('mousedown', handleMouseDown);
          canvasRef.removeEventListener('mouseup', handleMouseUp);
        }
        document.removeEventListener('mouseup', onDocMouseUp);
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
      {(props.showLegend ?? true) && <TransferLegend />}

      {props.showStats && (
        <div class="network-stats" aria-label="Resumo da rede">
          <div class="network-stats-head">
            <span class="network-stats-kicker">Rede</span>
            <span class={`network-stats-pill health-${overlayStats().tone}`}>
              {overlayStats().health}%
            </span>
          </div>
          <div class="network-stats-grid">
            <div class="network-stat-item">
              <span class="network-stat-label">Peers</span>
              <span class="network-stat-value">
                {overlayStats().activePeers}
                <span class="network-stat-suffix">/{overlayStats().totalPeers}</span>
              </span>
            </div>
            <div class="network-stat-item">
              <span class="network-stat-label">Arquivos</span>
              <span class="network-stat-value">{overlayStats().files}</span>
            </div>
            <div class="network-stat-item">
              <span class="network-stat-label">Anúncios</span>
              <span class="network-stat-value">{overlayStats().shares}</span>
            </div>
            <div class="network-stat-item">
              <span class="network-stat-label">Saúde</span>
              <span class={`network-stat-value health-${overlayStats().tone}`}>
                {overlayStats().health}%
              </span>
            </div>
          </div>
        </div>
      )}

      <PeerNodeModal
        node={expansionState.expandedNode}
        onClose={() => {
          closeExpandedNode();
          setSelectedNode(null);
        }}
      />
    </div>
  );
};

export default NetworkGraph;
