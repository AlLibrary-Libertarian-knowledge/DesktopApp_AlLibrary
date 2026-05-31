import type { OnionShareMode } from '@/services/network/onionShareService';

export type BootstrapStepStatus = 'pending' | 'active' | 'done';

export interface BootstrapStep {
  id: string;
  label: string;
  status: BootstrapStepStatus;
}

const STEP_DEFS: Array<{ id: string; label: string; threshold: number }> = [
  { id: 'prepare', label: 'Preparing Tor environment', threshold: 5 },
  { id: 'tor', label: 'Starting Tor process', threshold: 15 },
  { id: 'circuits', label: 'Bootstrapping Tor circuits', threshold: 85 },
  { id: 'onion', label: 'Publishing onion hidden service', threshold: 95 },
  { id: 'tracker', label: 'Syncing tracker lobby', threshold: 100 },
];

export function deriveBootstrapSteps(
  percent: number,
  mode: OnionShareMode,
  message: string | null
): BootstrapStep[] {
  if (mode !== 'bootstrapping') {
    return STEP_DEFS.map(s => ({
      id: s.id,
      label: s.label,
      status: mode === 'ready' ? 'done' : 'pending',
    }));
  }

  const pct = Math.max(0, Math.min(100, percent));
  let activeIndex = STEP_DEFS.findIndex(s => pct < s.threshold);
  if (activeIndex === -1) activeIndex = STEP_DEFS.length - 1;

  return STEP_DEFS.map((s, i) => {
    let label = s.label;
    if (i === activeIndex && message?.trim()) {
      label = message.trim();
    }
    const status: BootstrapStepStatus =
      i < activeIndex ? 'done' : i === activeIndex ? 'active' : 'pending';
    return { id: s.id, label, status };
  });
}

export function bootstrapStatusLabel(
  mode: OnionShareMode,
  percent: number,
  message: string | null
): string {
  if (mode === 'bootstrapping') {
    if (message?.trim()) return message.trim();
    if (percent > 0) return `Bootstrapping Tor… ${percent}%`;
    return 'Connecting to Tor network…';
  }
  if (mode === 'ready') return 'Onion network ready';
  if (mode === 'degraded' || mode === 'failed') return 'Local tracker only';
  return 'Starting network…';
}
