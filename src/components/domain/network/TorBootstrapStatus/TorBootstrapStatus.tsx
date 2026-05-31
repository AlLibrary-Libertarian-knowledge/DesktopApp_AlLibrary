import { type Component, For, Show, createMemo } from 'solid-js';
import { Loader2 } from 'lucide-solid';
import { Progress } from '@/components/foundation/Progress';
import { useNetworkPresenceResource } from '@/hooks/network/useNetworkPresence';
import { bootstrapStatusLabel, deriveBootstrapSteps } from '@/utils/networkBootstrapSteps';
import styles from './TorBootstrapStatus.module.css';

export type TorBootstrapStatusVariant = 'compact' | 'sidebar' | 'banner';

export interface TorBootstrapStatusProps {
  variant?: TorBootstrapStatusVariant;
  showSteps?: boolean;
  class?: string;
}

export const TorBootstrapStatus: Component<TorBootstrapStatusProps> = props => {
  const { presence, bootstrapMessage, isBootstrapping } = useNetworkPresenceResource();
  const variant = () => props.variant ?? 'compact';
  const showSteps = () => props.showSteps ?? variant() === 'banner';

  const steps = createMemo(() =>
    deriveBootstrapSteps(presence().bootstrapPercent, presence().mode, bootstrapMessage())
  );

  const statusLabel = createMemo(() =>
    bootstrapStatusLabel(presence().mode, presence().bootstrapPercent, bootstrapMessage())
  );

  const progressValue = createMemo(() => {
    const pct = presence().bootstrapPercent;
    return pct > 0 ? pct : undefined;
  });

  return (
    <Show when={isBootstrapping()}>
      <div
        class={`${styles.container} ${styles[variant()]} ${props.class ?? ''}`}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <Show when={variant() !== 'compact'}>
          <div class={styles.pulseRow}>
            <Loader2 size={variant() === 'banner' ? 18 : 14} class={styles.pulseIcon} />
            <span class={styles.labelActive}>{statusLabel()}</span>
          </div>
        </Show>

        <Progress
          value={progressValue() ?? 0}
          max={100}
          size={variant() === 'banner' ? 'md' : 'sm'}
          variant="info"
          indeterminate={progressValue() === undefined}
          showLabel={variant() === 'compact'}
          label={variant() === 'compact' ? statusLabel() : undefined}
          ariaLabel="Tor network bootstrap progress"
        />

        <Show when={showSteps()}>
          <div class={styles.steps}>
            <For each={steps()}>
              {step => (
                <div
                  class={`${styles.step} ${
                    step.status === 'active'
                      ? styles.stepActive
                      : step.status === 'done'
                        ? styles.stepDone
                        : ''
                  }`}
                >
                  <span
                    class={`${styles.stepDot} ${
                      step.status === 'active'
                        ? styles.stepDotActive
                        : step.status === 'done'
                          ? styles.stepDotDone
                          : ''
                    }`}
                  />
                  <span>{step.label}</span>
                </div>
              )}
            </For>
          </div>
        </Show>
      </div>
    </Show>
  );
};

export default TorBootstrapStatus;
