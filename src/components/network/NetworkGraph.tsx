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
  vx: number; // velocity x
  vy: number; // velocity y
  angle?: number; // orbital angle
  orbitRadius?: number; // distance from center
  orbitSpeed?: number; // orbital speed
  isBeingDragged?: boolean; // drag state
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
  const [draggedNode, setDraggedNode] = createSignal<Node | null>(null);
  const [isDragging, setIsDragging] = createSignal(false);
  const [dragOffset, setDragOffset] = createSignal<{ x: number; y: number }>({ x: 0, y: 0 });
  const [networkStats, setNetworkStats] = createStore({
    totalPeers: 0,
    activePeers: 0,
    totalBandwidth: 0,
    averageLatency: 0,
    networkHealth: 0,
  });

  // Galaxy physics simulation parameters
  const physicsConfig = {
    minOrbitRadius: 80, // Minimum distance from center
    maxOrbitRadius: 300, // Maximum distance from center
    baseOrbitSpeed: 0.0002, // Base orbital speed (radians per frame) - made slower
    speedVariation: 0.3, // Random speed variation per node
    drag: 0.95, // Friction when dragging
    snapBackForce: 0.02, // Force to return to orbit when released
    centerAttraction: 0.001, // Gentle pull toward center
    nodeRadius: 35, // Visual radius of nodes
    atmosphereRadius: 160, // Invisible atmosphere around each node (much larger)
    maxRepulsionForce: 15.0, // Maximum repulsion strength (much stronger)
    minSafeDistance: 120, // Minimum safe distance between nodes (increased)
    emergencyRepulsion: 25.0, // Very strong force when too close (much stronger)
    atmosphereDamping: 0.95, // Speed reduction when entering atmosphere
    orbitAdjustmentSensitivity: 0.5, // How much dragging toward/away from center affects orbit
  };

  // Mock network data with orbital properties
  const [nodes, setNodes] = createStore<Node[]>([
    {
      id: 'self',
      label: 'You',
      type: 'self',
      status: 'connected',
      x: 400,
      y: 300,
      vx: 0,
      vy: 0,
      angle: 0,
      orbitRadius: 0, // Center node doesn't orbit
      orbitSpeed: 0,
      isBeingDragged: false,
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
      x: 400 + 150 * Math.cos(0), // 150px from center at 0 degrees
      y: 300 + 150 * Math.sin(0),
      vx: 0,
      vy: 0,
      angle: 0,
      orbitRadius: 150,
      orbitSpeed: 0.0008 + Math.random() * 0.0004,
      isBeingDragged: false,
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
      x: 400 + 180 * Math.cos(Math.PI / 3), // 180px from center at 60 degrees
      y: 300 + 180 * Math.sin(Math.PI / 3),
      vx: 0,
      vy: 0,
      angle: Math.PI / 3,
      orbitRadius: 180,
      orbitSpeed: 0.001 + Math.random() * 0.0005,
      isBeingDragged: false,
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
      x: 400 + 200 * Math.cos((2 * Math.PI) / 3), // 200px from center at 120 degrees
      y: 300 + 200 * Math.sin((2 * Math.PI) / 3),
      vx: 0,
      vy: 0,
      angle: (2 * Math.PI) / 3,
      orbitRadius: 200,
      orbitSpeed: 0.0006 + Math.random() * 0.0003,
      isBeingDragged: false,
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
      x: 400 + 160 * Math.cos(Math.PI), // 160px from center at 180 degrees
      y: 300 + 160 * Math.sin(Math.PI),
      vx: 0,
      vy: 0,
      angle: Math.PI,
      orbitRadius: 160,
      orbitSpeed: 0.0009 + Math.random() * 0.0004,
      isBeingDragged: false,
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
      x: 400 + 220 * Math.cos((4 * Math.PI) / 3), // 220px from center at 240 degrees
      y: 300 + 220 * Math.sin((4 * Math.PI) / 3),
      vx: 0,
      vy: 0,
      angle: (4 * Math.PI) / 3,
      orbitRadius: 220,
      orbitSpeed: -(0.0005 + Math.random() * 0.0002),
      isBeingDragged: false,
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

  // Helper function to check if a node is connected to any other node
  const isNodeConnected = (nodeId: string): boolean => {
    return links.some(
      link =>
        (link.source === nodeId || link.target === nodeId) &&
        (link.status === 'active' || link.status === 'idle')
    );
  };

  // Recenter "You" node to the middle of the canvas
  const recenterCamera = () => {
    const selfNode = nodes.find(node => node.type === 'self');
    if (selfNode && canvasRef) {
      const rect = canvasRef.getBoundingClientRect();

      // Calculate position more towards top-left (about 1/3 from top and left)
      const centerX = rect.width * 0.33;
      const centerY = rect.height * 0.33;

      // Move the "You" node to the center position
      setNodes(prevNodes =>
        prevNodes.map(node => (node.type === 'self' ? { ...node, x: centerX, y: centerY } : node))
      );
    }
  };

  // Helper function to calculate repulsion force between two nodes (invisible atmosphere)
  const calculateRepulsionForce = (node1: Node, node2: Node): { fx: number; fy: number } => {
    const dx = node1.x - node2.x;
    const dy = node1.y - node2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0 && distance < physicsConfig.atmosphereRadius) {
      // Calculate atmosphere penetration (0 = edge of atmosphere, 1 = touching)
      const penetration = 1 - distance / physicsConfig.atmosphereRadius;

      // Exponential repulsion that gets stronger as nodes get closer
      const repulsionStrength = physicsConfig.maxRepulsionForce * Math.pow(penetration, 2);

      const forceX = (dx / distance) * repulsionStrength;
      const forceY = (dy / distance) * repulsionStrength;

      return { fx: forceX, fy: forceY };
    }

    return { fx: 0, fy: 0 };
  };

  // Apply atmosphere effects to all nodes (soft shield system)
  const applyAtmosphereEffects = (nodes: Node[]): Node[] => {
    return nodes.map((node, index) => {
      // Skip atmosphere effects for nodes being dragged
      if (node.isBeingDragged) return node;

      let totalForceX = 0;
      let totalForceY = 0;
      let atmosphereInfluence = 0;

      // Calculate repulsion from all other nodes and atmosphere influence
      nodes.forEach((otherNode, otherIndex) => {
        if (index !== otherIndex) {
          const dx = node.x - otherNode.x;
          const dy = node.y - otherNode.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // Calculate atmosphere influence for speed damping
          if (distance < physicsConfig.atmosphereRadius) {
            const penetration = 1 - distance / physicsConfig.atmosphereRadius;
            atmosphereInfluence = Math.max(atmosphereInfluence, penetration);
          }

          // Calculate repulsion force
          const repulsion = calculateRepulsionForce(node, otherNode);
          totalForceX += repulsion.fx;
          totalForceY += repulsion.fy;
        }
      });

      // Apply speed damping based on atmosphere influence
      const speedDamping = 1 - atmosphereInfluence * 0.3; // Reduce speed by up to 30%

      // Apply repulsion forces with smooth damping
      const dampingFactor = 0.08; // Smooth, gentle movement

      return {
        ...node,
        x: node.x + totalForceX * dampingFactor,
        y: node.y + totalForceY * dampingFactor,
        // Store atmosphere influence for potential use in orbital speed
        atmosphereInfluence: speedDamping,
      };
    });
  };

  // Galaxy orbital physics simulation with draggable center
  const simulatePhysics = () => {
    const dragged = draggedNode();

    setNodes(prevNodes => {
      const centerNode = prevNodes.find(node => node.type === 'self');
      if (!centerNode) return prevNodes;

      let updatedNodes = prevNodes.map(node => {
        // Handle dragging for any node including the center
        if (dragged && dragged.id === node.id && isDragging()) {
          const mousePos = mousePosition();
          if (mousePos) {
            const dragOff = dragOffset();

            let newX = mousePos.x - dragOff.x;
            let newY = mousePos.y - dragOff.y;

            // No boundary constraints for infinite canvas

            // For non-center nodes, calculate new orbital distance based on drag position
            if (node.type !== 'self') {
              const dx = newX - centerNode.x;
              const dy = newY - centerNode.y;
              const newOrbitRadius = Math.sqrt(dx * dx + dy * dy);
              const newAngle = Math.atan2(dy, dx);

              // Constrain orbit radius within bounds
              const constrainedRadius = Math.max(
                physicsConfig.minOrbitRadius,
                Math.min(physicsConfig.maxOrbitRadius, newOrbitRadius)
              );

              // Calculate new speed based on distance and connection status
              const speedMultiplier = Math.pow(
                physicsConfig.minOrbitRadius /
                  Math.max(constrainedRadius, physicsConfig.minOrbitRadius),
                0.5
              );
              const baseSpeed =
                physicsConfig.baseOrbitSpeed *
                speedMultiplier *
                (1 + Math.random() * physicsConfig.speedVariation);

              // Make disconnected nodes orbit counterclockwise
              const isConnected = isNodeConnected(node.id);
              const newOrbitSpeed = isConnected ? baseSpeed : -baseSpeed;

              return {
                ...node,
                x: newX,
                y: newY,
                vx: 0,
                vy: 0,
                angle: newAngle,
                orbitRadius: constrainedRadius,
                orbitSpeed: newOrbitSpeed,
                isBeingDragged: true,
              };
            }

            return {
              ...node,
              x: newX,
              y: newY,
              vx: 0,
              vy: 0,
              isBeingDragged: true,
            };
          }
        }

        // For the center node, if not being dragged, just maintain position
        if (node.type === 'self') {
          return {
            ...node,
            isBeingDragged: dragged?.id === node.id,
          };
        }

        // For orbiting nodes, orbit around the center node
        if (!node.isBeingDragged) {
          const currentAngle = node.angle || 0;
          const radius = node.orbitRadius || 150;
          let speed = node.orbitSpeed || physicsConfig.baseOrbitSpeed;

          // Ensure disconnected nodes move counterclockwise
          const isConnected = isNodeConnected(node.id);
          if (!isConnected && speed > 0) {
            speed = -Math.abs(speed); // Make negative for counterclockwise
          } else if (isConnected && speed < 0) {
            speed = Math.abs(speed); // Make positive for clockwise
          }

          // Enhanced distance-based speed calculation (closer = much slower)
          const distanceFromCenter = Math.sqrt(
            (node.x - centerNode.x) ** 2 + (node.y - centerNode.y) ** 2
          );
          const speedMultiplier = Math.pow(
            physicsConfig.minOrbitRadius /
              Math.max(distanceFromCenter, physicsConfig.minOrbitRadius),
            0.7 // Higher exponent for more pronounced speed difference
          );
          const adjustedSpeed = speed * speedMultiplier;

          // Update angle for orbital motion
          const newAngle = currentAngle + adjustedSpeed;

          // Calculate target position based on orbital motion around the center node
          const targetX = centerNode.x + Math.cos(newAngle) * radius;
          const targetY = centerNode.y + Math.sin(newAngle) * radius;

          // Calculate repulsion forces from other nodes
          let repulsionX = 0;
          let repulsionY = 0;
          let maxAtmosphereInfluence = 0;

          prevNodes.forEach(otherNode => {
            if (node.id !== otherNode.id) {
              const dx = node.x - otherNode.x;
              const dy = node.y - otherNode.y;
              const distance = Math.sqrt(dx * dx + dy * dy);

              // Emergency repulsion for nodes that are too close
              if (distance > 0 && distance < physicsConfig.minSafeDistance) {
                const emergencyPenetration = 1 - distance / physicsConfig.minSafeDistance;
                const emergencyForce =
                  physicsConfig.emergencyRepulsion * Math.pow(emergencyPenetration, 1.5);

                repulsionX += (dx / distance) * emergencyForce;
                repulsionY += (dy / distance) * emergencyForce;
                maxAtmosphereInfluence = 1.0; // Maximum influence for emergency
              }
              // Normal atmosphere repulsion
              else if (distance > 0 && distance < physicsConfig.atmosphereRadius) {
                // Calculate atmosphere penetration
                const penetration = 1 - distance / physicsConfig.atmosphereRadius;
                maxAtmosphereInfluence = Math.max(maxAtmosphereInfluence, penetration);

                // Exponential repulsion that gets stronger as nodes get closer
                const repulsionStrength =
                  physicsConfig.maxRepulsionForce * Math.pow(penetration, 2);

                repulsionX += (dx / distance) * repulsionStrength;
                repulsionY += (dy / distance) * repulsionStrength;
              }
            }
          });

          // Apply strong repulsion to the target position (prioritize repulsion over orbit)
          const repulsionMultiplier = maxAtmosphereInfluence > 0.7 ? 8 : 4; // Much stronger when close
          const finalTargetX = targetX + repulsionX * repulsionMultiplier;
          const finalTargetY = targetY + repulsionY * repulsionMultiplier;

          // Smooth movement toward final target position (with repulsion)
          const currentX = node.x;
          const currentY = node.y;
          const lerpFactor = 0.1 * (1 - maxAtmosphereInfluence * 0.5); // Slower movement in atmosphere
          const newX = currentX + (finalTargetX - currentX) * lerpFactor;
          const newY = currentY + (finalTargetY - currentY) * lerpFactor;

          return {
            ...node,
            x: newX,
            y: newY,
            vx: 0,
            vy: 0,
            angle: newAngle,
            orbitSpeed: speed, // Update with corrected direction
            isBeingDragged: false,
          };
        }

        return node;
      });

      // Atmosphere effects are now integrated into orbital motion
      return updatedNodes;
    });
  };

  // Animation loop with physics simulation
  const animate = () => {
    if (
      !canvasRef ||
      typeof window === 'undefined' ||
      typeof requestAnimationFrame === 'undefined'
    ) {
      return;
    }

    simulatePhysics();
    drawNetwork();

    animationId = requestAnimationFrame(animate);
  };

  const drawNetwork = () => {
    if (!canvasRef) return;

    const ctx = canvasRef.getContext('2d');
    if (!ctx) return;

    const rect = canvasRef.getBoundingClientRect();
    const width = rect.width || 500;
    const height = rect.height || 400;

    ctx.clearRect(0, 0, width, height);

    drawGrid(ctx, width, height);

    links.forEach(link => {
      const sourceNode = nodes.find(n => n.id === link.source);
      const targetNode = nodes.find(n => n.id === link.target);
      if (sourceNode && targetNode) {
        drawLink(ctx, sourceNode, targetNode, link);
      }
    });

    nodes.forEach(node => {
      drawNode(ctx, node);
    });

    // Draw UI elements (tooltip, etc.)
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

    const baseSize = 12;
    const size = baseSize + node.connections * 1.5;

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

    if (isHovered) {
      ctx.strokeStyle = typeColors[node.type];
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(node.x, node.y, size + 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    if (isSelected || isHovered) {
      ctx.shadowColor = typeColors[node.type];
      ctx.shadowBlur = 15;
      ctx.globalAlpha = 0.8;
    }

    ctx.fillStyle = typeColors[node.type];
    ctx.globalAlpha = statusAlpha[node.status];
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
    ctx.fill();

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

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;

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

    const titleFont = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const contentFont = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

    ctx.font = titleFont;
    const titleWidth = ctx.measureText(title).width;

    ctx.font = contentFont;
    const maxContentWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
    const maxWidth = Math.max(titleWidth, maxContentWidth);

    const tooltipWidth = maxWidth + padding * 2;
    const tooltipHeight = (lines.length + 1) * lineHeight + padding * 2 + 8;

    const offset = 15;
    let tooltipX = mouseX + offset;
    let tooltipY = mouseY - tooltipHeight - offset;

    if (tooltipX + tooltipWidth > width) {
      tooltipX = mouseX - tooltipWidth - offset;
    }

    if (tooltipY < 0) {
      tooltipY = mouseY + offset;
    }

    tooltipX = Math.max(5, Math.min(tooltipX, width - tooltipWidth - 5));
    tooltipY = Math.max(5, Math.min(tooltipY, height - tooltipHeight - 5));

    const gradient = ctx.createLinearGradient(
      tooltipX,
      tooltipY,
      tooltipX,
      tooltipY + tooltipHeight
    );
    gradient.addColorStop(0, 'rgba(30, 41, 59, 0.95)');
    gradient.addColorStop(1, 'rgba(15, 23, 42, 0.98)');

    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 4;

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 8);
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

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

    ctx.fillStyle = '#ffffff';
    ctx.font = titleFont;
    ctx.textAlign = 'left';
    ctx.fillText(title, tooltipX + padding, tooltipY + padding + 13);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tooltipX + padding, tooltipY + padding + 20);
    ctx.lineTo(tooltipX + tooltipWidth - padding, tooltipY + padding + 20);
    ctx.stroke();

    ctx.font = contentFont;
    lines.forEach((line, index) => {
      const yPos = tooltipY + padding + 20 + 8 + (index + 1) * lineHeight;

      const [label, value] = line.split(': ');

      if (!label || !value) return;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText(label + ':', tooltipX + padding, yPos);

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

  const handleMouseMove = (e: MouseEvent) => {
    if (!canvasRef) return;

    const rect = canvasRef.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePosition({ x, y });

    // Handle dragging
    if (isDragging() && draggedNode()) {
      // Dragging is handled in the physics simulation
      return;
    }

    // Normal hover detection when not dragging
    const hoveredNodeFound = nodes.find(node => {
      const baseSize = 12;
      const nodeSize = baseSize + node.connections * 1.5;
      const clickRadius = nodeSize + 4;

      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      return distance < clickRadius;
    });

    setHoveredNode(hoveredNodeFound || null);
    canvasRef.style.cursor = hoveredNodeFound ? 'pointer' : 'default';
  };

  const handleMouseDown = (e: MouseEvent) => {
    if (!canvasRef) return;

    const rect = canvasRef.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find the node under the mouse (including the "You" node now)
    const clickedNode = nodes.find(node => {
      const baseSize = 12;
      const nodeSize = baseSize + node.connections * 1.5;
      const clickRadius = nodeSize + 4;

      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      return distance < clickRadius;
    });

    if (clickedNode) {
      setDraggedNode(clickedNode);
      setIsDragging(true);
      setDragOffset({ x: x - clickedNode.x, y: y - clickedNode.y });
      canvasRef.style.cursor = 'grabbing';

      // Mark the node as being dragged
      setNodes(prevNodes =>
        prevNodes.map(node =>
          node.id === clickedNode.id ? { ...node, isBeingDragged: true } : node
        )
      );
    }
  };

  const handleMouseUp = () => {
    if (isDragging() && draggedNode()) {
      // Mark the node as no longer being dragged
      setNodes(prevNodes =>
        prevNodes.map(node =>
          node.id === draggedNode()!.id ? { ...node, isBeingDragged: false } : node
        )
      );
    }

    setIsDragging(false);
    setDraggedNode(null);
    if (canvasRef) {
      canvasRef.style.cursor = hoveredNode() ? 'pointer' : 'default';
    }
  };

  const handleClick = (e: MouseEvent) => {
    // Only handle click if we're not dragging
    if (isDragging()) return;

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

    setSelectedNode(clickedNode || null);
  };

  createEffect(() => {
    const activePeers = nodes.filter(n => n.status === 'connected').length;
    const totalBandwidth = nodes.reduce((sum, n) => sum + n.bandwidth, 0);
    const averageLatency = nodes
      .filter(n => n.status === 'connected')
      .reduce((sum, n, _, arr) => sum + n.latency / arr.length, 0);
    const networkHealth = Math.round((activePeers / nodes.length) * 100);

    setNetworkStats({
      totalPeers: nodes.length - 1,
      activePeers: activePeers - 1,
      totalBandwidth,
      averageLatency: Math.round(averageLatency),
      networkHealth,
    });
  });

  onMount(() => {
    if (canvasRef) {
      const setupCanvas = () => {
        const rect = canvasRef!.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        canvasRef!.width = rect.width * dpr;
        canvasRef!.height = rect.height * dpr;

        const originalWidth = typeof props.width === 'string' ? props.width : `${rect.width}px`;
        const originalHeight = typeof props.height === 'string' ? props.height : `${rect.height}px`;

        canvasRef!.style.width = originalWidth;
        canvasRef!.style.height = originalHeight;

        const ctx = canvasRef!.getContext('2d');
        if (ctx) {
          ctx.scale(dpr, dpr);
        }
      };

      setupCanvas();

      const resizeObserver = new ResizeObserver(setupCanvas);
      resizeObserver.observe(canvasRef);

      canvasRef.addEventListener('mousemove', handleMouseMove);
      canvasRef.addEventListener('mousedown', handleMouseDown);
      canvasRef.addEventListener('mouseup', handleMouseUp);
      canvasRef.addEventListener('click', handleClick);

      // Add global mouse up to handle dragging that ends outside the canvas
      document.addEventListener('mouseup', handleMouseUp);

      animate();

      return () => {
        resizeObserver.disconnect();
        if (canvasRef) {
          canvasRef.removeEventListener('mousemove', handleMouseMove);
          canvasRef.removeEventListener('mousedown', handleMouseDown);
          canvasRef.removeEventListener('mouseup', handleMouseUp);
          canvasRef.removeEventListener('click', handleClick);
        }
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }

    return () => {};
  });

  onCleanup(() => {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
    if (canvasRef) {
      canvasRef.removeEventListener('mousemove', handleMouseMove);
      canvasRef.removeEventListener('mousedown', handleMouseDown);
      canvasRef.removeEventListener('mouseup', handleMouseUp);
      canvasRef.removeEventListener('click', handleClick);
    }
    document.removeEventListener('mouseup', handleMouseUp);
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

      {/* Modern Recenter Floating Action Button */}
      <div class="recenter-fab-container">
        <button
          class="recenter-fab"
          onClick={recenterCamera}
          title="Recenter view on You node"
          aria-label="Recenter camera view"
        >
          <div class="recenter-icon">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
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

        {/* Ripple effect container */}
        <div class="recenter-ripple" />
      </div>

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

      <style>{`
        .recenter-fab-container {
          position: absolute;
          top: 16px;
          right: 16px;
          z-index: 20;
        }

        .recenter-fab {
          display: flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 28px;
          padding: 12px 18px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          letter-spacing: 0.3px;
          box-shadow:
            0 4px 12px rgba(102, 126, 234, 0.4),
            0 2px 4px rgba(0, 0, 0, 0.1);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .recenter-fab:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow:
            0 8px 20px rgba(102, 126, 234, 0.5),
            0 4px 8px rgba(0, 0, 0, 0.15);
          background: linear-gradient(135deg, #7c8ee8 0%, #8a5bb8 100%);
        }

        .recenter-fab:active {
          transform: translateY(0) scale(0.98);
          transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .recenter-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .recenter-fab:hover .recenter-icon {
          transform: rotate(90deg);
        }

        .recenter-text {
          opacity: 0.95;
          transition: opacity 0.2s ease;
        }

        .recenter-fab:hover .recenter-text {
          opacity: 1;
        }

        .recenter-ripple {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          transform: translate(-50%, -50%);
          pointer-events: none;
          transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .recenter-fab:active .recenter-ripple {
          width: 60px;
          height: 60px;
          opacity: 0;
        }

        /* Dark theme adjustments */
        .network-graph.dark .recenter-fab {
          background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow:
            0 4px 12px rgba(0, 0, 0, 0.3),
            0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .network-graph.dark .recenter-fab:hover {
          background: linear-gradient(135deg, #5a6578 0%, #3d4758 100%);
          box-shadow:
            0 8px 20px rgba(0, 0, 0, 0.4),
            0 4px 8px rgba(0, 0, 0, 0.25);
        }

        /* Subtle pulse animation for better discoverability */
        @keyframes subtle-pulse {
          0%,
          100% {
            box-shadow:
              0 4px 12px rgba(102, 126, 234, 0.4),
              0 2px 4px rgba(0, 0, 0, 0.1);
          }
          50% {
            box-shadow:
              0 4px 16px rgba(102, 126, 234, 0.5),
              0 2px 6px rgba(0, 0, 0, 0.15);
          }
        }

        .recenter-fab {
          animation: subtle-pulse 3s ease-in-out infinite;
        }

        .recenter-fab:hover {
          animation: none;
        }

        /* Accessibility improvements */
        .recenter-fab:focus {
          outline: none;
          box-shadow:
            0 4px 12px rgba(102, 126, 234, 0.4),
            0 2px 4px rgba(0, 0, 0, 0.1),
            0 0 0 3px rgba(102, 126, 234, 0.3);
        }

        @media (prefers-reduced-motion: reduce) {
          .recenter-fab,
          .recenter-icon,
          .recenter-ripple {
            transition: none !important;
            animation: none !important;
          }
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .recenter-fab-container {
            top: 12px;
            right: 12px;
          }

          .recenter-fab {
            padding: 10px 14px;
            font-size: 12px;
          }

          .recenter-text {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default NetworkGraph;
