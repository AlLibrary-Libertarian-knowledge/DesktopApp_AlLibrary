import { type Component, createSignal } from 'solid-js';
import './TransferLegend.css';

export interface TransferLegendProps {
  className?: string;
}

const TransferLegend: Component<TransferLegendProps> = props => {
  const [isLegendPinned, setIsLegendPinned] = createSignal(false);

  return (
    <div
      class={`transfer-legend ${isLegendPinned() ? 'pinned' : ''} ${props.className || ''}`}
      onClick={e => {
        e.stopPropagation();
        setIsLegendPinned(!isLegendPinned());
      }}
    >
      <div class="legend-title">
        Transfer Status Guide
        {isLegendPinned() && (
          <div
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: '#f59e0b',
              'border-radius': '50%',
              width: '16px',
              height: '16px',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              'font-size': '10px',
            }}
          >
            📌
          </div>
        )}
      </div>

      <div class="legend-sections">
        {/* Active File Transfers */}
        <div class="legend-section">
          <div class="legend-section-title">Transfer States</div>
          <div class="legend-items">
            <div class="legend-item">
              <div class="legend-indicator downloading-active" />
              <span>Downloading Files</span>
            </div>
            <div class="legend-item">
              <div class="legend-indicator uploading-active" />
              <span>Uploading/Sending Files</span>
            </div>
            <div class="legend-item">
              <div class="legend-indicator reconnecting" />
              <span>Reconnecting (Disconnected)</span>
            </div>
            <div class="legend-item">
              <div class="legend-indicator interrupted" />
              <span>Stopped/Interrupted</span>
            </div>
          </div>
        </div>

        {/* File Issues */}
        <div class="legend-section">
          <div class="legend-section-title">File Status</div>
          <div class="legend-items">
            <div class="legend-item">
              <div class="legend-indicator corrupted" />
              <span>Corrupted Files</span>
            </div>
            <div class="legend-item">
              <div class="legend-indicator slow-transfer" />
              <span>Slow Downloads (3+ days)</span>
            </div>
            <div class="legend-item">
              <div class="legend-indicator verified" />
              <span>Verified/Complete</span>
            </div>
            <div class="legend-item">
              <div class="legend-indicator pending" />
              <span>Pending/Queued</span>
            </div>
          </div>
        </div>

        {/* Connection Lines */}
        <div class="legend-section">
          <div class="legend-section-title">Connection Types</div>
          <div class="legend-items">
            <div class="legend-item">
              <div class="legend-line solid-line" />
              <span>━ High Speed</span>
            </div>
            <div class="legend-item">
              <div class="legend-line dashed-line" />
              <span>┅ Medium Speed</span>
            </div>
            <div class="legend-item">
              <div class="legend-line dotted-line" />
              <span>⋯ Low/Unstable</span>
            </div>
          </div>
        </div>
      </div>

      <div class="legend-footer">
        <div class="legend-tip">
          💡 <strong>Hover to expand • Click to pin</strong> • Click nodes for detailed P2P info
        </div>
      </div>
    </div>
  );
};

export default TransferLegend;
