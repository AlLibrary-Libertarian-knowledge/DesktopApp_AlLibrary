import { createSignal, createEffect, createMemo, batch, untrack } from 'solid-js';
import { createStore } from 'solid-js/store';
import type {
  Node,
  Link,
  NetworkStatsState,
  MousePosition,
  DragState,
  ExpansionState,
} from '../types';
import { debounce } from '../../../../utils/performance';
import { mergeGraphPositions } from '../data/buildLobbyGraph';

export function useNetworkState() {
  // Starts empty; NetworkGraph hydrates from tracker lobby (or keeps last topology).
  const [nodes, setNodes] = createStore<Node[]>([]);
  const [links, setLinks] = createStore<Link[]>([]);

  // UI State
  const [hoveredNode, setHoveredNode] = createSignal<Node | null>(null);
  const [selectedNode, setSelectedNode] = createSignal<Node | null>(null);
  const [mousePosition, setMousePosition] = createSignal<MousePosition | null>(null);

  // Drag State
  const [dragState, setDragState] = createStore<DragState>({
    isDragging: false,
    draggedNode: null,
    dragOffset: { x: 0, y: 0 },
    dragStartPosition: null,
    hasDraggedDistance: false,
  });

  // Expansion State
  const [expansionState, setExpansionState] = createStore<ExpansionState>({
    expandedNode: null,
    isExpanding: false,
    isExpanded: false,
    expandedPosition: { x: 0, y: 0 },
  });

  // Network Statistics (peers/files from lobby — no fake bandwidth)
  const [networkStats, setNetworkStats] = createStore<NetworkStatsState>({
    totalPeers: 0,
    activePeers: 0,
    totalBandwidth: 0,
    averageLatency: 0,
    networkHealth: 0,
  });

  const connectedNodes = createMemo(() => nodes.filter(n => n.status === 'connected'));

  const totalSharedFiles = createMemo(() =>
    nodes.reduce((sum, n) => sum + (n.sharedFileCount ?? 0), 0)
  );

  const updateNetworkStats = debounce(() => {
    const peers = nodes.filter(n => n.type !== 'self');
    const activePeers = peers.filter(n => n.status === 'connected').length;
    const denom = Math.max(peers.length, 1);
    const networkHealth =
      peers.length === 0
        ? nodes.some(n => n.type === 'self')
          ? 72
          : 0
        : Math.round((activePeers / denom) * 100);

    batch(() => {
      setNetworkStats({
        totalPeers: peers.length,
        activePeers,
        // Reuse slot: total shared file announcements (shown as "Files" in UI)
        totalBandwidth: totalSharedFiles(),
        averageLatency: 0,
        networkHealth,
      });
    });
  }, 100);

  createEffect(() => {
    nodes.length;
    connectedNodes();
    totalSharedFiles();
    updateNetworkStats();
  });

  const replaceGraph = (nextNodes: Node[], nextLinks: Link[]) => {
    const merged = untrack(() => mergeGraphPositions(nodes, nextNodes));
    batch(() => {
      setNodes(merged);
      setLinks(nextLinks);
    });
    // Refresh selected/expanded node fields (files, lastSeen) after lobby sync
    const expandedId = untrack(() => expansionState.expandedNode?.id);
    if (expandedId) {
      const fresh = merged.find(n => n.id === expandedId);
      if (fresh) {
        setExpansionState('expandedNode', fresh);
        setSelectedNode(fresh);
      }
    }
  };

  // Optimized drag handling with batched state updates
  const startDrag = (node: Node, mousePos: MousePosition) => {
    batch(() => {
      setDragState({
        isDragging: true,
        draggedNode: node,
        dragStartPosition: mousePos,
        dragOffset: { x: mousePos.x - node.x, y: mousePos.y - node.y },
        hasDraggedDistance: false,
      });

      // Mark node as being dragged in a single batch
      setNodes(prevNodes =>
        prevNodes.map(n => (n.id === node.id ? { ...n, isBeingDragged: true } : n))
      );
    });
  };

  const endDrag = () => {
    batch(() => {
      if (dragState.isDragging && dragState.draggedNode) {
        // Mark node as no longer being dragged
        setNodes(prevNodes =>
          prevNodes.map(n =>
            n.id === dragState.draggedNode!.id ? { ...n, isBeingDragged: false } : n
          )
        );
      }

      setDragState({
        isDragging: false,
        draggedNode: null,
        dragStartPosition: null,
        dragOffset: { x: 0, y: 0 },
        hasDraggedDistance: false,
      });
    });
  };

  const resetDragFlag = () => {
    setDragState('hasDraggedDistance', false);
  };

  const updateDragDistance = (currentMousePos: MousePosition) => {
    if (dragState.isDragging && dragState.dragStartPosition) {
      const dragDistance = Math.sqrt(
        (currentMousePos.x - dragState.dragStartPosition.x) ** 2 +
          (currentMousePos.y - dragState.dragStartPosition.y) ** 2
      );
      // Increased threshold from 8 to 15 pixels for ultra-reliable click vs drag detection
      if (dragDistance > 15) {
        setDragState('hasDraggedDistance', true);
      }
    }
  };

  // Expansion handling — open modal; second click on same node closes
  const expandNode = (node: Node, position: MousePosition) => {
    if (expansionState.expandedNode?.id === node.id && expansionState.isExpanded) {
      closeExpandedNode();
      setSelectedNode(null);
      return;
    }

    setSelectedNode(node);
    setExpansionState({
      expandedNode: node,
      expandedPosition: position,
      isExpanding: false,
      isExpanded: true,
    });
  };

  const closeExpandedNode = () => {
    setExpansionState({
      expandedNode: null,
      isExpanded: false,
      isExpanding: false,
      expandedPosition: { x: 0, y: 0 },
    });
    setSelectedNode(null);
  };

  // Camera control
  const recenterCamera = (canvasRef: HTMLCanvasElement) => {
    const selfNode = nodes.find(node => node.type === 'self');
    if (selfNode && canvasRef) {
      const rect = canvasRef.getBoundingClientRect();
      const centerX = rect.width * 0.25;
      const centerY = rect.height * 0.48;

      setNodes(prevNodes =>
        prevNodes.map(node => (node.type === 'self' ? { ...node, x: centerX, y: centerY } : node))
      );
    }
  };

  // Helper function to check if node is connected
  const isNodeConnected = (nodeId: string): boolean => {
    return links.some(
      link =>
        (link.source === nodeId || link.target === nodeId) &&
        (link.status === 'active' || link.status === 'idle')
    );
  };

  // Optimized node position updates for physics simulation
  const updateNodePositions = (updatedNodes: Node[]) => {
    // Only update if there are actual changes including orbital properties
    const hasChanges = updatedNodes.some((node, index) => {
      const oldNode = nodes[index];
      return (
        oldNode &&
        (Math.abs(node.x - oldNode.x) > 0.1 ||
          Math.abs(node.y - oldNode.y) > 0.1 ||
          Math.abs(node.vx - oldNode.vx) > 0.01 ||
          Math.abs(node.vy - oldNode.vy) > 0.01 ||
          Math.abs((node.angle || 0) - (oldNode.angle || 0)) > 0.001 || // Include angle changes
          Math.abs((node.orbitRadius || 0) - (oldNode.orbitRadius || 0)) > 0.1 || // Include orbit radius changes
          Math.abs((node.orbitSpeed || 0) - (oldNode.orbitSpeed || 0)) > 0.0001) // Include orbit speed changes
      );
    });

    if (hasChanges) {
      setNodes(updatedNodes);
    }
  };

  return {
    // State
    nodes,
    links,
    hoveredNode,
    selectedNode,
    mousePosition,
    dragState,
    expansionState,
    networkStats,

    // Setters
    setNodes,
    setLinks,
    setHoveredNode,
    setSelectedNode,
    setMousePosition,
    replaceGraph,

    // Optimized setters
    updateNodePositions,

    // Actions
    startDrag,
    endDrag,
    resetDragFlag,
    updateDragDistance,
    expandNode,
    closeExpandedNode,
    recenterCamera,
    isNodeConnected,
  };
}
