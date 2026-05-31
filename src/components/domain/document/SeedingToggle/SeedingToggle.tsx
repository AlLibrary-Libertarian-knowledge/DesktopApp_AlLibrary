import { type Component, Show, splitProps } from 'solid-js';
import { Radio, PauseCircle } from 'lucide-solid';
import styles from './SeedingToggle.module.css';

export interface SeedingToggleProps {
  enabled: boolean;
  disabled?: boolean;
  onChange: (enabled: boolean) => void;
  size?: 'sm' | 'md';
  class?: string;
  ariaLabel?: string;
}

export const SeedingToggle: Component<SeedingToggleProps> = props => {
  const [local, rest] = splitProps(props, [
    'enabled',
    'disabled',
    'onChange',
    'size',
    'class',
    'ariaLabel',
  ]);

  const isOn = () => local.enabled !== false;

  const handleClick = () => {
    if (local.disabled) return;
    local.onChange(!isOn());
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isOn()}
      aria-label={
        local.ariaLabel ??
        (isOn() ? 'Seeding active — click to pause' : 'Seeding paused — click to enable')
      }
      disabled={local.disabled}
      class={`${styles.seedingToggle} ${isOn() ? styles.on : styles.off} ${
        local.size === 'md' ? styles.sizeMd : ''
      } ${local.class ?? ''}`}
      onClick={handleClick}
      {...rest}
    >
      <span class={styles.signalCluster} aria-hidden="true">
        <Show when={isOn()} fallback={<PauseCircle size={14} class={styles.iconOff} />}>
          <>
            <span class={styles.pulseRingOuter} />
            <span class={styles.pulseRing} />
            <Radio size={14} class={styles.iconOn} />
          </>
        </Show>
      </span>
      <span class={styles.label}>Seeding</span>
      <span
        class={`${styles.track} ${isOn() ? styles.trackOn : styles.trackOff}`}
        aria-hidden="true"
      >
        <span class={`${styles.thumb} ${isOn() ? styles.thumbOn : styles.thumbOff}`} />
      </span>
    </button>
  );
};
