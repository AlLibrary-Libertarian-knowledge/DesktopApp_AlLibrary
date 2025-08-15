import { Component, Show, createEffect, createResource, createSignal, onCleanup, onMount } from 'solid-js';
import styles from './TorTerminal.module.css';
import type { TorTerminalProps } from './types/Types';
import { torAdapter } from '@/services/network/torAdapter';

export const TorTerminal: Component<TorTerminalProps> = (props) => {
  const [lines, setLines] = createSignal<number>(props.lines ?? 500);
  const [log, { refetch }] = createResource(async () => {
    try {
      return await torAdapter.getLogTail(lines());
    } catch {
      return 'Tor log not available. Starting...';
    }
  }, { initialValue: '' });

  let scrollerRef: HTMLDivElement | undefined;

  const scrollToBottom = () => {
    if (!scrollerRef) return;
    // Defer to next microtask so DOM has updated
    queueMicrotask(() => {
      try {
        scrollerRef!.scrollTop = scrollerRef!.scrollHeight;
      } catch {}
    });
  };

  onMount(() => {
    const interval = props.pollIntervalMs ?? 1500;
    const id = globalThis.setInterval(() => {
      void refetch();
    }, interval);
    onCleanup(() => globalThis.clearInterval(id));
  });

  // Preserve page scroll position while updating terminal content, then auto-scroll terminal
  createEffect(() => {
    const _ = log();
    // Only manage the terminal's own scroll; never change page scroll position
    queueMicrotask(() => {
      scrollToBottom();
    });
  });

  return (
    <div class={`${styles.terminal} ${props.class || ''}`} data-testid={props['data-testid']}> 
      <div class={styles.header}>
        <span class={styles.dot} data-color="red" />
        <span class={styles.dot} data-color="yellow" />
        <span class={styles.dot} data-color="green" />
        <span class={styles.title}>Tor Logs</span>
        <div class={styles.meta}>tail -n {lines()}</div>
      </div>
      <div class={styles.body} ref={scrollerRef}>
        <pre class={styles.pre}>
<Show when={!log.loading} fallback={'Loading tor log...'}>
{log()}
</Show>
        </pre>
      </div>
    </div>
  );
};

export default TorTerminal;


