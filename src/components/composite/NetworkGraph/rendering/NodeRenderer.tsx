import type { Node } from '../types';

export class NodeRenderer {
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  drawNode(node: Node, hoveredNode: Node | null, selectedNode: Node | null): void {
    const isHovered = hoveredNode?.id === node.id;
    const isSelected = selectedNode?.id === node.id;

    // Minimalistic size calculation
    const baseSize = 12;
    const connectionModifier = Math.min(node.connections * 0.5, 6);

    // Transfer activity adds subtle size increase
    let activityModifier = 0;
    if (node.activeTransfers) {
      const hasDownloads = node.activeTransfers.downloading.length > 0;
      const hasUploads = node.activeTransfers.uploading.length > 0;
      activityModifier = (hasDownloads ? 2 : 0) + (hasUploads ? 2 : 0);
    }

    const finalSize = baseSize + connectionModifier + activityModifier;

    // Enhanced color system based on transfer states and node status
    let nodeColor = '#6b7280'; // Default gray

    // Priority 1: Transfer state colors
    if (node.activeTransfers) {
      const downloads = node.activeTransfers.downloading;
      const uploads = node.activeTransfers.uploading;

      if (downloads.length > 0) {
        const hasSlow = downloads.some(dl => dl.timeRemaining > 259200);
        if (hasSlow) {
          nodeColor = '#8b5cf6'; // Purple - slow downloads
        } else {
          nodeColor = '#2563eb'; // Blue - normal downloading
        }
      } else if (uploads.length > 0) {
        nodeColor = '#059669'; // Green - uploading
      }
    }

    // Priority 2: Node status colors
    if (nodeColor === '#6b7280') {
      if (node.status === 'connecting') {
        nodeColor = '#f59e0b';
      } else if (node.status === 'disconnected') {
        nodeColor = '#ef4444';
      } else if (node.status === 'error') {
        nodeColor = '#dc2626';
      } else if (node.status === 'connected') {
        const typeColors = {
          self: '#2563eb',
          peer: '#16a34a',
          institution: '#7c3aed',
          community: '#ea580c',
        };
        nodeColor = typeColors[node.type];
      }
    }

    const statusColors = {
      connected: 1,
      connecting: 0.8,
      disconnected: 0.4,
      error: 0.6,
    };

    // Draw transfer progress indicators
    this.drawTransferIndicators(node, finalSize);

    // Subtle hover effect
    if (isHovered || isSelected) {
      const time = Date.now() * 0.003;
      const scaleEffect = isHovered ? 1 + Math.sin(time) * 0.05 : 1;

      this.ctx.strokeStyle = nodeColor;
      this.ctx.lineWidth = 2;
      this.ctx.globalAlpha = 0.4;
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, (finalSize + 6) * scaleEffect, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    // Main node circle
    this.ctx.fillStyle = nodeColor;
    this.ctx.globalAlpha = statusColors[node.status];
    this.ctx.beginPath();
    this.ctx.arc(node.x, node.y, finalSize, 0, Math.PI * 2);
    this.ctx.fill();

    // Inner highlight
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    this.ctx.globalAlpha = statusColors[node.status] * 0.8;
    this.ctx.beginPath();
    this.ctx.arc(node.x, node.y - 1, finalSize * 0.7, 0, Math.PI * 2);
    this.ctx.fill();

    // Status-specific effects
    this.drawStatusEffects(node, finalSize);

    // Network type indicator
    this.drawNetworkTypeIndicator(node, finalSize, isHovered, isSelected);

    // Activity badge
    this.drawActivityBadge(node, finalSize);

    // Labels
    this.drawNodeLabels(node, finalSize, isHovered, isSelected);

    // Reset context
    this.ctx.globalAlpha = 1;
    this.ctx.shadowBlur = 0;
  }

  private drawTransferIndicators(node: Node, finalSize: number): void {
    if (!node.activeTransfers) return;

    const time = Date.now() * 0.0008;
    const { downloading, uploading } = node.activeTransfers;

    // Download progress ring
    if (downloading.length > 0) {
      const primaryDownload = downloading[0];
      if (primaryDownload) {
        const progressAngle = (primaryDownload.progress / 100) * Math.PI * 2;
        const orbitRadius = finalSize + 12;

        let startAngle = 0;
        for (let i = 0; i < primaryDownload.fileName.length; i++) {
          startAngle += primaryDownload.fileName.charCodeAt(i);
        }
        startAngle = (startAngle % 360) * (Math.PI / 180);
        const currentAngle = startAngle + time * 0.6;

        // Background track
        this.ctx.strokeStyle = 'rgba(37, 99, 235, 0.15)';
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = 0.5;
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, orbitRadius, 0, Math.PI * 2);
        this.ctx.stroke();

        // Progress arc
        this.ctx.strokeStyle = '#2563eb';
        this.ctx.lineWidth = 2.5;
        this.ctx.lineCap = 'round';
        this.ctx.globalAlpha = 0.9;
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, orbitRadius, currentAngle, currentAngle + progressAngle);
        this.ctx.stroke();

        // Progress dot
        const progressDotX = node.x + Math.cos(currentAngle + progressAngle) * orbitRadius;
        const progressDotY = node.y + Math.sin(currentAngle + progressAngle) * orbitRadius;
        this.ctx.fillStyle = '#2563eb';
        this.ctx.globalAlpha = 1;
        this.ctx.beginPath();
        this.ctx.arc(progressDotX, progressDotY, 2, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }

    // Upload progress ring
    if (uploading.length > 0) {
      const primaryUpload = uploading[0];
      if (primaryUpload) {
        const progressAngle = (primaryUpload.progress / 100) * Math.PI * 2;
        const orbitRadius = finalSize + 7;

        let startAngle = 0;
        for (let i = 0; i < primaryUpload.fileName.length; i++) {
          startAngle += primaryUpload.fileName.charCodeAt(i);
        }
        startAngle = (startAngle % 360) * (Math.PI / 180);
        const currentAngle = startAngle + time * -0.8;

        // Background track
        this.ctx.strokeStyle = 'rgba(5, 150, 105, 0.15)';
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = 0.5;
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, orbitRadius, 0, Math.PI * 2);
        this.ctx.stroke();

        // Progress arc
        this.ctx.strokeStyle = '#059669';
        this.ctx.lineWidth = 2.5;
        this.ctx.lineCap = 'round';
        this.ctx.globalAlpha = 0.9;
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, orbitRadius, currentAngle, currentAngle + progressAngle);
        this.ctx.stroke();

        // Progress dot
        const progressDotX = node.x + Math.cos(currentAngle + progressAngle) * orbitRadius;
        const progressDotY = node.y + Math.sin(currentAngle + progressAngle) * orbitRadius;
        this.ctx.fillStyle = '#059669';
        this.ctx.globalAlpha = 1;
        this.ctx.beginPath();
        this.ctx.arc(progressDotX, progressDotY, 2, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
  }

  private drawStatusEffects(node: Node, finalSize: number): void {
    if (node.status === 'connecting') {
      const time = Date.now() * 0.002;
      const pulseAlpha = 0.3 + Math.sin(time) * 0.2;
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      this.ctx.globalAlpha = pulseAlpha;
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, finalSize * 0.8, 0, Math.PI * 2);
      this.ctx.fill();
    } else if (node.status === 'error') {
      this.ctx.strokeStyle = '#ef4444';
      this.ctx.lineWidth = 2;
      this.ctx.globalAlpha = 0.8;
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, finalSize + 2, 0, Math.PI * 2);
      this.ctx.stroke();
    }
  }

  private drawNetworkTypeIndicator(
    node: Node,
    finalSize: number,
    isHovered: boolean,
    isSelected: boolean
  ): void {
    if (node.networkType && (isHovered || isSelected || node.type === 'self')) {
      const iconSize = 8;
      const iconX = node.x + finalSize + 8;
      const iconY = node.y - finalSize - 4;

      // Background circle
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      this.ctx.globalAlpha = 0.8;
      this.ctx.beginPath();
      this.ctx.arc(iconX, iconY, iconSize, 0, Math.PI * 2);
      this.ctx.fill();

      // Icon
      this.ctx.fillStyle = '#ffffff';
      this.ctx.globalAlpha = 1;
      this.ctx.font = 'bold 10px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';

      const networkIcons = {
        tor: '⚡',
        internet: '🌐',
        hybrid: '⚡',
      };

      const icon = networkIcons[node.networkType] || '◦';
      this.ctx.fillText(icon, iconX, iconY);
    }
  }

  private drawActivityBadge(node: Node, finalSize: number): void {
    const totalTransfers =
      (node.activeTransfers?.downloading.length || 0) +
      (node.activeTransfers?.uploading.length || 0);

    if (totalTransfers > 0) {
      const badgeX = node.x + finalSize - 4;
      const badgeY = node.y - finalSize + 4;
      const badgeRadius = 6;

      this.ctx.fillStyle = '#f59e0b';
      this.ctx.globalAlpha = 0.9;
      this.ctx.beginPath();
      this.ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = '#ffffff';
      this.ctx.globalAlpha = 1;
      this.ctx.font = 'bold 8px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(totalTransfers.toString(), badgeX, badgeY);
    }
  }

  private drawNodeLabels(
    node: Node,
    finalSize: number,
    isHovered: boolean,
    isSelected: boolean
  ): void {
    if (isHovered || isSelected || node.type === 'self') {
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'top';

      const displayName = node.username || node.label || 'Unknown';
      this.ctx.fillText(displayName, node.x, node.y + finalSize + 12);

      if (node.type !== 'self' && node.location) {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.font = '10px -apple-system, BlinkMacSystemFont, sans-serif';
        this.ctx.fillText(node.location, node.x, node.y + finalSize + 28);
      }

      if (node.connections > 0) {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.font = '9px -apple-system, BlinkMacSystemFont, sans-serif';
        this.ctx.fillText(
          `${node.connections} peers`,
          node.x,
          node.y + finalSize + (node.location ? 42 : 28)
        );
      }
    }

    this.ctx.textBaseline = 'alphabetic';
  }
}
