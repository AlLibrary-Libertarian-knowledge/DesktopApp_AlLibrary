import type { Node } from '../types';

export class PhysicsEngine {
  private physicsConfig = {
    minOrbitRadius: 80,
    maxOrbitRadius: 300,
    baseOrbitSpeed: 0.0002,
    speedVariation: 0.3,
    drag: 0.95,
    snapBackForce: 0.02,
    centerAttraction: 0.001,
    nodeRadius: 35,
    atmosphereRadius: 160,
    maxRepulsionForce: 15.0,
    minSafeDistance: 120,
    emergencyRepulsion: 25.0,
    atmosphereDamping: 0.95,
    orbitAdjustmentSensitivity: 0.5,
  };

  // Helper function to calculate repulsion force between two nodes
  calculateRepulsionForce(node1: Node, node2: Node): { fx: number; fy: number } {
    const dx = node1.x - node2.x;
    const dy = node1.y - node2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0 && distance < this.physicsConfig.atmosphereRadius) {
      const penetration = 1 - distance / this.physicsConfig.atmosphereRadius;
      const repulsionStrength = this.physicsConfig.maxRepulsionForce * Math.pow(penetration, 2);
      const forceX = (dx / distance) * repulsionStrength;
      const forceY = (dy / distance) * repulsionStrength;
      return { fx: forceX, fy: forceY };
    }

    return { fx: 0, fy: 0 };
  }

  // Check if a node is connected to any other node
  isNodeConnected(
    nodeId: string,
    links: Array<{ source: string; target: string; status: string }>
  ): boolean {
    return links.some(
      link =>
        (link.source === nodeId || link.target === nodeId) &&
        (link.status === 'active' || link.status === 'idle')
    );
  }

  // Apply atmosphere effects to all nodes
  applyAtmosphereEffects(nodes: Node[]): Node[] {
    return nodes.map((node, index) => {
      if (node.isBeingDragged) return node;

      let totalForceX = 0;
      let totalForceY = 0;
      let atmosphereInfluence = 0;

      nodes.forEach((otherNode, otherIndex) => {
        if (index !== otherIndex) {
          const dx = node.x - otherNode.x;
          const dy = node.y - otherNode.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < this.physicsConfig.atmosphereRadius) {
            const penetration = 1 - distance / this.physicsConfig.atmosphereRadius;
            atmosphereInfluence = Math.max(atmosphereInfluence, penetration);
          }

          const repulsion = this.calculateRepulsionForce(node, otherNode);
          totalForceX += repulsion.fx;
          totalForceY += repulsion.fy;
        }
      });

      const speedDamping = 1 - atmosphereInfluence * 0.3;
      const dampingFactor = 0.08;

      return {
        ...node,
        x: node.x + totalForceX * dampingFactor,
        y: node.y + totalForceY * dampingFactor,
        atmosphereInfluence: speedDamping,
      };
    });
  }

  // Main physics simulation
  simulatePhysics(
    nodes: Node[],
    links: Array<{ source: string; target: string; status: string }>,
    draggedNode: Node | null,
    isDragging: boolean,
    mousePosition: { x: number; y: number } | null,
    dragOffset: { x: number; y: number }
  ): Node[] {
    const centerNode = nodes.find(node => node.type === 'self');
    if (!centerNode) return nodes;

    return nodes.map(node => {
      // Handle dragging
      if (draggedNode && draggedNode.id === node.id && isDragging && mousePosition) {
        let newX = mousePosition.x - dragOffset.x;
        let newY = mousePosition.y - dragOffset.y;

        if (node.type !== 'self') {
          const dx = newX - centerNode.x;
          const dy = newY - centerNode.y;
          const newOrbitRadius = Math.sqrt(dx * dx + dy * dy);
          const newAngle = Math.atan2(dy, dx);

          const constrainedRadius = Math.max(
            this.physicsConfig.minOrbitRadius,
            Math.min(this.physicsConfig.maxOrbitRadius, newOrbitRadius)
          );

          const speedMultiplier = Math.pow(
            this.physicsConfig.minOrbitRadius /
              Math.max(constrainedRadius, this.physicsConfig.minOrbitRadius),
            0.5
          );
          const baseSpeed =
            this.physicsConfig.baseOrbitSpeed *
            speedMultiplier *
            (1 + Math.random() * this.physicsConfig.speedVariation);

          const isConnected = this.isNodeConnected(node.id, links);
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

      // Center node stays in place
      if (node.type === 'self') {
        return {
          ...node,
          isBeingDragged: draggedNode?.id === node.id,
        };
      }

      // Orbital motion for other nodes
      if (!node.isBeingDragged) {
        const currentAngle = node.angle || 0;
        const radius = node.orbitRadius || 150;
        let speed = node.orbitSpeed || this.physicsConfig.baseOrbitSpeed;

        const isConnected = this.isNodeConnected(node.id, links);
        if (!isConnected && speed > 0) {
          speed = -Math.abs(speed);
        } else if (isConnected && speed < 0) {
          speed = Math.abs(speed);
        }

        const distanceFromCenter = Math.sqrt(
          (node.x - centerNode.x) ** 2 + (node.y - centerNode.y) ** 2
        );
        const speedMultiplier = Math.pow(
          this.physicsConfig.minOrbitRadius /
            Math.max(distanceFromCenter, this.physicsConfig.minOrbitRadius),
          0.7
        );
        const adjustedSpeed = speed * speedMultiplier;
        const newAngle = currentAngle + adjustedSpeed;

        const targetX = centerNode.x + Math.cos(newAngle) * radius;
        const targetY = centerNode.y + Math.sin(newAngle) * radius;

        // Calculate repulsion forces
        let repulsionX = 0;
        let repulsionY = 0;
        let maxAtmosphereInfluence = 0;

        nodes.forEach(otherNode => {
          if (node.id !== otherNode.id) {
            const dx = node.x - otherNode.x;
            const dy = node.y - otherNode.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 0 && distance < this.physicsConfig.minSafeDistance) {
              const emergencyPenetration = 1 - distance / this.physicsConfig.minSafeDistance;
              const emergencyForce =
                this.physicsConfig.emergencyRepulsion * Math.pow(emergencyPenetration, 1.5);
              repulsionX += (dx / distance) * emergencyForce;
              repulsionY += (dy / distance) * emergencyForce;
              maxAtmosphereInfluence = 1.0;
            } else if (distance > 0 && distance < this.physicsConfig.atmosphereRadius) {
              const penetration = 1 - distance / this.physicsConfig.atmosphereRadius;
              maxAtmosphereInfluence = Math.max(maxAtmosphereInfluence, penetration);
              const repulsionStrength =
                this.physicsConfig.maxRepulsionForce * Math.pow(penetration, 2);
              repulsionX += (dx / distance) * repulsionStrength;
              repulsionY += (dy / distance) * repulsionStrength;
            }
          }
        });

        const repulsionMultiplier = maxAtmosphereInfluence > 0.7 ? 8 : 4;
        const finalTargetX = targetX + repulsionX * repulsionMultiplier;
        const finalTargetY = targetY + repulsionY * repulsionMultiplier;

        const lerpFactor = 0.1 * (1 - maxAtmosphereInfluence * 0.5);
        const newX = node.x + (finalTargetX - node.x) * lerpFactor;
        const newY = node.y + (finalTargetY - node.y) * lerpFactor;

        return {
          ...node,
          x: newX,
          y: newY,
          vx: 0,
          vy: 0,
          angle: newAngle,
          orbitSpeed: speed,
          isBeingDragged: false,
        };
      }

      return node;
    });
  }
}
