import { Component, createEffect, createResource, createSignal, onCleanup, onMount } from 'solid-js';
import { Modal } from '@/components/foundation/Modal';
import { torAdapter } from '@/services/network/torAdapter';

interface TorLogViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TorLogViewer: Component<TorLogViewerProps> = props => {
  const [lines, setLines] = createSignal(200);
  const [log] = createResource(
    () => (props.isOpen ? lines() : null),
    async (count) => {
      if (!count) return '';
      return await torAdapter.getLogTail(count);
    }
  );

  // Auto-refresh tail every 2s only while the modal is open
  onMount(() => {
    let id: any;
    const ensureTimer = () => {
      if (props.isOpen && !id) {
        id = globalThis.setInterval(async () => {
          try { await log.refetch?.(); } catch {}
        }, 2000);
      }
      if (!props.isOpen && id) {
        globalThis.clearInterval(id);
        id = undefined;
      }
    };
    // react to open/close changes
    createEffect(() => {
      const _ = props.isOpen;
      ensureTimer();
    });
    onCleanup(() => { if (id) globalThis.clearInterval(id); });
  });

  return (
    <Modal isOpen={props.isOpen} onClose={props.onClose} title="Tor Log (tail)">
      <div style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'center', 'margin-bottom': '8px' }}>
        <label for="tor-log-lines">Lines:&nbsp;</label>
        <input
          id="tor-log-lines"
          type="number"
          min="50"
          max="1000"
          value={String(lines())}
          onInput={e => setLines(Number((e.currentTarget as HTMLInputElement).value || 200))}
          style={{ width: '90px' }}
        />
      </div>
      <pre style={{ 'max-height': '60vh', 'overflow': 'auto', padding: '8px', 'white-space': 'pre-wrap' }}>{log() || 'Loading...'}</pre>
    </Modal>
  );
};

export default TorLogViewer;



