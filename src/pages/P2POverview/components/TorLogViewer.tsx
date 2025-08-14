import { Component, createResource, createSignal, Show } from 'solid-js';
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



