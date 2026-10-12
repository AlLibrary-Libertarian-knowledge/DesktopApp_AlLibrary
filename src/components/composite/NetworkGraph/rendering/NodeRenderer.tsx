import type { Node } from '../types';

/** roundRect is missing in some test/canvas mocks — fall back to rect. */
function fillRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.rect(x, y, w, h);
  }
  ctx.fill();
}

/**
 * Canvas node drawing — planetary peers with transfer “satellites”
 * (orbiting progress dots for downloads / uploads).
 */
export class NodeRenderer {
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  drawNode(node: Node, hoveredNode: Node | null, selectedNode: Node | null): void {
    const isHovered = hoveredNode?.id === node.id;
    const isSelected = selectedNode?.id === node.id;
    const finalSize = this.nodeRadius(node);
    const nodeColor = this.resolveColor(node);
    const alpha = this.statusAlpha(node.status);

    // Satellites first (behind body)
    this.drawTransferIndicators(node, finalSize);

    if (isSelected) {
      this.drawFocusRing(node, finalSize, '#ff8a3d', 0.9, 3, 14);
    } else if (isHovered) {
      this.drawFocusRing(node, finalSize, nodeColor, 0.5, 2, 10);
    } else if (node.type === 'self') {
      this.drawFocusRing(node, finalSize, 'rgba(255, 138, 61, 0.45)', 0.35, 1.5, 8);
    }

    // Soft outer glow
    this.ctx.save();
    this.ctx.shadowColor = nodeColor;
    this.ctx.shadowBlur = isHovered || isSelected ? 18 : 10;
    this.ctx.globalAlpha = alpha * 0.85;
    this.ctx.fillStyle = nodeColor;
    this.ctx.beginPath();
    this.ctx.arc(node.x, node.y, finalSize, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();

    // Body
    this.ctx.globalAlpha = alpha;
    this.ctx.fillStyle = nodeColor;
    this.ctx.beginPath();
    this.ctx.arc(node.x, node.y, finalSize, 0, Math.PI * 2);
    this.ctx.fill();

    // Specular highlight
    const grad = this.ctx.createRadialGradient(
      node.x - finalSize * 0.35,
      node.y - finalSize * 0.4,
      0,
      node.x,
      node.y,
      finalSize
    );
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
    grad.addColorStop(0.45, 'rgba(255, 255, 255, 0.08)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.15)');
    this.ctx.globalAlpha = alpha;
    this.ctx.fillStyle = grad;
    this.ctx.beginPath();
    this.ctx.arc(node.x, node.y, finalSize, 0, Math.PI * 2);
    this.ctx.fill();

    // Crisp rim
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    this.ctx.lineWidth = 1;
    this.ctx.globalAlpha = alpha * 0.9;
    this.ctx.beginPath();
    this.ctx.arc(node.x, node.y, finalSize - 0.5, 0, Math.PI * 2);
    this.ctx.stroke();

    this.drawStatusEffects(node, finalSize);
    this.drawNetworkTypeIndicator(node, finalSize, isHovered, isSelected);
    this.drawNodeLabels(node, finalSize, isHovered, isSelected);

    this.ctx.globalAlpha = 1;
    this.ctx.shadowBlur = 0;
    this.ctx.lineCap = 'butt';
  }

  private nodeRadius(node: Node): number {
    const baseSize = node.type === 'self' ? 14 : 12;
    const connectionModifier = Math.min((node.sharedFileCount ?? node.connections) * 0.45, 6);
    let activityModifier = 0;
    if (node.activeTransfers) {
      activityModifier =
        (node.activeTransfers.downloading.length > 0 ? 2 : 0) +
        (node.activeTransfers.uploading.length > 0 ? 2 : 0);
    }
    return baseSize + connectionModifier + activityModifier;
  }

  private statusAlpha(status: Node['status']): number {
    return { connected: 1, connecting: 0.85, disconnected: 0.45, error: 0.65 }[status];
  }

  private resolveColor(node: Node): string {
    if (node.activeTransfers) {
      const { downloading, uploading } = node.activeTransfers;
      if (downloading.length > 0) {
        return downloading.some(dl => dl.timeRemaining > 259200) ? '#8b5cf6' : '#3b82f6';
      }
      if (uploading.length > 0) return '#10b981';
    }
    if (node.status === 'connecting') return '#f59e0b';
    if (node.status === 'disconnected') return '#b45309';
    if (node.status === 'error') return '#ef4444';
    const typeColors = {
      self: '#ff8a3d',
      peer: '#3dcfb0',
      institution: '#34d399',
      community: '#f59e0b',
    };
    return typeColors[node.type];
  }

  private drawFocusRing(
    node: Node,
    finalSize: number,
    color: string,
    alpha: number,
    width: number,
    pad: number
  ): void {
    const time = Date.now() * 0.0035;
    const pulse = 1 + Math.sin(time) * 0.04;
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = width;
    this.ctx.globalAlpha = alpha;
    this.ctx.shadowColor = color;
    this.ctx.shadowBlur = 10;
    this.ctx.beginPath();
    this.ctx.arc(node.x, node.y, (finalSize + pad) * pulse, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;
  }

  /** Progress rings + orbiting file “satellites” (keep these). */
  private drawTransferIndicators(node: Node, finalSize: number): void {
    if (!node.activeTransfers) return;

    const time = Date.now() * 0.0009;
    const { downloading, uploading } = node.activeTransfers;

    if (downloading.length > 0) {
      this.drawSatelliteOrbit({
        node,
        finalSize,
        orbitPad: 13,
        transfers: downloading,
        color: '#3b82f6',
        track: 'rgba(59, 130, 246, 0.2)',
        spin: time * 0.7,
        clockwise: true,
      });
    }

    if (uploading.length > 0) {
      this.drawSatelliteOrbit({
        node,
        finalSize,
        orbitPad: 8,
        transfers: uploading,
        color: '#10b981',
        track: 'rgba(16, 185, 129, 0.2)',
        spin: time * -0.85,
        clockwise: false,
      });
    }
  }

  private drawSatelliteOrbit(opts: {
    node: Node;
    finalSize: number;
    orbitPad: number;
    transfers: Array<{ fileName: string; progress: number }>;
    color: string;
    track: string;
    spin: number;
    clockwise: boolean;
  }): void {
    const { node, finalSize, orbitPad, transfers, color, track, spin } = opts;
    const primary = transfers[0];
    if (!primary) return;

    const orbitRadius = finalSize + orbitPad;
    const progressAngle = (Math.min(100, Math.max(0, primary.progress)) / 100) * Math.PI * 2;

    let seed = 0;
    for (let i = 0; i < primary.fileName.length; i++) seed += primary.fileName.charCodeAt(i);
    const baseAngle = ((seed % 360) * Math.PI) / 180 + spin;

    // Track
    this.ctx.strokeStyle = track;
    this.ctx.lineWidth = 2;
    this.ctx.globalAlpha = 0.7;
    this.ctx.beginPath();
    this.ctx.arc(node.x, node.y, orbitRadius, 0, Math.PI * 2);
    this.ctx.stroke();

    // Progress arc
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2.5;
    this.ctx.lineCap = 'round';
    this.ctx.globalAlpha = 0.95;
    this.ctx.shadowColor = color;
    this.ctx.shadowBlur = 6;
    this.ctx.beginPath();
    this.ctx.arc(node.x, node.y, orbitRadius, baseAngle, baseAngle + progressAngle);
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;

    // Primary satellite at progress tip
    const tipAngle = baseAngle + progressAngle;
    this.drawSatelliteDot(node.x, node.y, orbitRadius, tipAngle, color, 3.2);

    // Extra satellites for additional files in flight (up to 3)
    const extra = Math.min(transfers.length, 3);
    for (let i = 1; i < extra; i++) {
      const a = baseAngle + (i / extra) * Math.PI * 2 * 0.65 + spin * 0.3;
      this.drawSatelliteDot(node.x, node.y, orbitRadius, a, color, 2.4);
    }
  }

  private drawSatelliteDot(
    cx: number,
    cy: number,
    radius: number,
    angle: number,
    color: string,
    size: number
  ): void {
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    this.ctx.save();
    this.ctx.shadowColor = color;
    this.ctx.shadowBlur = 8;
    this.ctx.fillStyle = color;
    this.ctx.globalAlpha = 1;
    this.ctx.beginPath();
    this.ctx.arc(x, y, size, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    this.ctx.beginPath();
    this.ctx.arc(x - size * 0.25, y - size * 0.25, size * 0.4, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }

  private drawStatusEffects(node: Node, finalSize: number): void {
    if (node.status === 'connecting') {
      const time = Date.now() * 0.0025;
      this.ctx.strokeStyle = 'rgba(245, 158, 11, 0.55)';
      this.ctx.lineWidth = 1.5;
      this.ctx.globalAlpha = 0.35 + Math.sin(time) * 0.2;
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, finalSize + 5 + Math.sin(time) * 2, 0, Math.PI * 2);
      this.ctx.stroke();
    } else if (node.status === 'error') {
      this.ctx.strokeStyle = '#ef4444';
      this.ctx.lineWidth = 2;
      this.ctx.globalAlpha = 0.75;
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, finalSize + 3, 0, Math.PI * 2);
      this.ctx.stroke();
    }
  }

  private drawNetworkTypeIndicator(
    node: Node,
    finalSize: number,
    isHovered: boolean,
    isSelected: boolean
  ): void {
    const show =
      node.networkType === 'tor' ||
      node.networkType === 'hybrid' ||
      ((isHovered || isSelected) && node.networkType === 'internet');
    if (!show) return;

    const iconX = node.x + finalSize + 6;
    const iconY = node.y - finalSize - 2;
    const r = 7;

    this.ctx.fillStyle = 'rgba(15, 13, 11, 0.85)';
    this.ctx.globalAlpha = 0.95;
    this.ctx.beginPath();
    this.ctx.arc(iconX, iconY, r, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.strokeStyle = 'rgba(255, 138, 61, 0.55)';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    this.ctx.fillStyle = '#ff8a3d';
    this.ctx.font = 'bold 9px Outfit, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(node.networkType === 'internet' ? 'N' : 'T', iconX, iconY + 0.5);
  }

  private drawNodeLabels(
    node: Node,
    finalSize: number,
    isHovered: boolean,
    isSelected: boolean
  ): void {
    const busy =
      (node.activeTransfers?.downloading.length ?? 0) > 0 ||
      (node.activeTransfers?.uploading.length ?? 0) > 0;
    if (!(isHovered || isSelected || node.type === 'self' || busy)) {
      this.ctx.textBaseline = 'alphabetic';
      return;
    }

    const displayName =
      node.type === 'self' ? 'Você' : node.onionShort || node.username || node.label || 'Peer';
    const fileCount = node.sharedFileCount ?? 0;
    const lines: string[] = [displayName];
    if (node.type !== 'self' && (isHovered || isSelected) && node.lastSeenLabel) {
      lines.push(`visto ${node.lastSeenLabel}`);
    }
    lines.push(`${fileCount} arquivo${fileCount === 1 ? '' : 's'}`);

    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    const fonts = [
      '700 12px Outfit, Syne, sans-serif',
      '500 10px Outfit, sans-serif',
      '500 9px Outfit, sans-serif',
    ];
    const colors = ['#f4f0ea', 'rgba(244, 240, 234, 0.7)', 'rgba(244, 240, 234, 0.5)'];

    // Measure for pill background
    let maxW = 0;
    lines.forEach((line, i) => {
      this.ctx.font = fonts[Math.min(i, fonts.length - 1)]!;
      maxW = Math.max(maxW, this.ctx.measureText(line).width);
    });
    const padX = 8;
    const lineH = 14;
    const blockH = lines.length * lineH + 6;
    const blockW = maxW + padX * 2;
    const top = node.y + finalSize + 10;

    this.ctx.fillStyle = 'rgba(12, 10, 9, 0.72)';
    fillRoundRect(this.ctx, node.x - blockW / 2, top - 2, blockW, blockH, 6);

    lines.forEach((line, i) => {
      this.ctx.font = fonts[Math.min(i, fonts.length - 1)]!;
      this.ctx.fillStyle = colors[Math.min(i, colors.length - 1)]!;
      this.ctx.fillText(line, node.x, top + 2 + i * lineH);
    });

    this.ctx.textBaseline = 'alphabetic';
  }
}
