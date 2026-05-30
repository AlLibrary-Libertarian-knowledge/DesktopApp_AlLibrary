import { type Component, splitProps, createMemo } from 'solid-js';
import styles from './DocumentViewerLoader.module.css';

export type DocumentViewerLoaderPhase = 'resolve' | 'content';

export interface DocumentViewerLoaderProps {
  /** Primary status line */
  message: string;
  /** resolve = metadata lookup; content = byte/stream load */
  phase?: DocumentViewerLoaderPhase;
  /** HUD micro-label above message */
  eyebrow?: string;
  /** Secondary hint below message */
  hint?: string;
  /** Fill available viewport and center (document page overlay) */
  fullscreen?: boolean;
  /** Pipeline step 0–7 label when processing documents */
  pipelineStep?: number;
  pipelineLabel?: string;
  /** Smaller layout for redirects / embedded areas */
  compact?: boolean;
  class?: string;
  'data-testid'?: string;
}

const PHASE_LABELS: Record<DocumentViewerLoaderPhase, string> = {
  resolve: 'Reader · Signal lock',
  content: 'Reader · Data stream',
};

const PHASE_HINTS: Record<DocumentViewerLoaderPhase, string> = {
  resolve: 'Resolving document identity',
  content: 'Buffering pages into viewer',
};

export const DocumentViewerLoader: Component<DocumentViewerLoaderProps> = props => {
  const [local, rest] = splitProps(props, [
    'message',
    'phase',
    'eyebrow',
    'hint',
    'fullscreen',
    'pipelineStep',
    'pipelineLabel',
    'compact',
    'class',
    'data-testid',
  ]);

  const phase = () => local.phase ?? 'content';
  const eyebrow = createMemo(() => {
    if (local.pipelineStep != null) {
      return `Treatment · Step ${local.pipelineStep}/7`;
    }
    return local.eyebrow ?? PHASE_LABELS[phase()];
  });
  const hint = createMemo(() => local.pipelineLabel ?? local.hint ?? PHASE_HINTS[phase()]);

  return (
    <div
      class={`${styles.loader} ${local.fullscreen ? styles.fullscreen : ''} ${local.compact ? styles.compact : ''} ${local.class ?? ''}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      data-testid={local['data-testid'] ?? 'document-viewer-loader'}
      {...rest}
    >
      <div class={styles.field} aria-hidden="true">
        <div class={styles.grid} />
        <div class={`${styles.orb} ${styles.orbPrimary}`} />
        <div class={`${styles.orb} ${styles.orbAccent}`} />
      </div>

      <div class={styles.panel}>
        <div class={styles.scanner} aria-hidden="true">
          <div class={`${styles.ring} ${styles.ringOuter}`} />
          <div class={`${styles.ring} ${styles.ringMid}`} />
          <div class={`${styles.ring} ${styles.ringInner}`} />
          <div class={styles.glyph} />
          <div class={styles.scanBeam} />
        </div>

        <div class={styles.copy}>
          <p class={styles.eyebrow}>{eyebrow()}</p>
          <p class={styles.message}>{local.message}</p>
          <p class={styles.hint}>{hint()}</p>
        </div>

        <div class={styles.phases} aria-hidden="true">
          <span
            class={`${styles.phaseDot} ${phase() === 'resolve' ? styles.phaseDotActive : ''}`}
          />
          <span
            class={`${styles.phaseDot} ${phase() === 'content' ? styles.phaseDotActive : ''}`}
          />
        </div>

        <div class={styles.rail} aria-hidden="true">
          <div class={styles.railFill} />
        </div>
      </div>
    </div>
  );
};

export default DocumentViewerLoader;
