import { type Component, Show, createSignal, For } from 'solid-js';
import { Modal } from '@/components/foundation/Modal';
import { Check, Copy, Link2, X } from 'lucide-solid';
import type { Node } from '../types';
import styles from './PeerNodeModal.module.css';

export interface PeerNodeModalProps {
  node: Node | null;
  onClose: () => void;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes < 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

function shortHash(hash: string): string {
  if (!hash) return '—';
  if (hash.length <= 12) return hash;
  return `${hash.slice(0, 6)}…${hash.slice(-4)}`;
}

function localizeSeen(label?: string): string {
  if (!label) return '—';
  const map: Record<string, string> = {
    now: 'agora',
    agora: 'agora',
    'just now': 'agora',
    '2m ago': 'há 2 min',
    '1h ago': 'há 1 h',
  };
  if (map[label]) return map[label];
  return label
    .replace(/(\d+)m ago/i, 'há $1 min')
    .replace(/(\d+)h ago/i, 'há $1 h')
    .replace(/(\d+)d ago/i, 'há $1 d');
}

export const PeerNodeModal: Component<PeerNodeModalProps> = props => {
  const [copiedKey, setCopiedKey] = createSignal<string | null>(null);

  const node = () => props.node;
  const isSelf = () => Boolean(node()?.isLocalSelf || node()?.type === 'self');
  const isLive = () => node()?.status === 'connected';
  const fileCount = () => node()?.sharedFileCount ?? node()?.sharedFiles?.length ?? 0;
  const sharedBytes = () =>
    node()?.sharedBytes ?? (node()?.sharedFiles ?? []).reduce((s, f) => s + (f.size || 0), 0);
  const displayName = () =>
    isSelf() ? 'Você' : node()?.username || node()?.label || node()?.onionShort || 'Peer';

  const flashCopied = (key: string) => {
    setCopiedKey(key);
    globalThis.setTimeout(() => {
      if (copiedKey() === key) setCopiedKey(null);
    }, 1500);
  };

  const copyText = async (key: string, value?: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      flashCopied(key);
    } catch {
      /* ignore */
    }
  };

  return (
    <Modal
      isOpen={Boolean(node())}
      onClose={props.onClose}
      size="md"
      showCloseButton={false}
      closeOnOutsideClick
      closeOnEsc
      ariaLabel={isSelf() ? 'Seu nó na rede' : 'Detalhes do peer'}
      data-testid="peer-node-modal"
      class={styles.modalChrome}
    >
      <Show when={node()}>
        <div class={styles.panel}>
          <header class={styles.top}>
            <div class={styles.identity}>
              <span class={`${styles.dot} ${isLive() ? styles.dotOn : styles.dotOff}`} />
              <div class={styles.identityText}>
                <p class={styles.role}>{isSelf() ? 'Seu nó' : 'Peer na rede'}</p>
                <h2 class={styles.name}>{displayName()}</h2>
              </div>
            </div>
            <div class={styles.topActions}>
              <span class={`${styles.pill} ${isLive() ? styles.pillOn : styles.pillOff}`}>
                {isLive() ? 'Online' : 'Ausente'}
              </span>
              <button
                type="button"
                class={styles.close}
                onClick={props.onClose}
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>
          </header>

          <dl class={styles.stats}>
            <div>
              <dt>Arquivos</dt>
              <dd>{fileCount()}</dd>
            </div>
            <div>
              <dt>Volume</dt>
              <dd>{formatBytes(sharedBytes())}</dd>
            </div>
            <div>
              <dt>Visto</dt>
              <dd>{localizeSeen(node()!.lastSeenLabel)}</dd>
            </div>
          </dl>

          <Show when={node()!.onionAddress}>
            <div class={styles.onion}>
              <code class={styles.onionCode} title={node()!.onionAddress}>
                {node()!.onionAddress}
              </code>
              <button
                type="button"
                class={styles.copy}
                onClick={() => void copyText('onion', node()!.onionAddress)}
              >
                {copiedKey() === 'onion' ? <Check size={15} /> : <Copy size={15} />}
                {copiedKey() === 'onion' ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          </Show>

          <div class={styles.filesHead}>
            <h3 class={styles.filesTitle}>Arquivos compartilhados</h3>
            <span class={styles.filesCount}>{fileCount()}</span>
          </div>

          <Show
            when={(node()!.sharedFiles?.length ?? 0) > 0}
            fallback={
              <p class={styles.empty}>
                {isSelf() ? 'Nenhum arquivo anunciado ainda.' : 'Este peer não anunciou arquivos.'}
              </p>
            }
          >
            <ul class={styles.files}>
              <For each={(node()!.sharedFiles ?? []).slice(0, 20)}>
                {file => (
                  <li class={styles.file}>
                    <div class={styles.fileInfo}>
                      <p class={styles.fileName} title={file.name}>
                        {file.name}
                      </p>
                      <p class={styles.fileMeta}>
                        {formatBytes(file.size)}
                        <Show when={file.contentHash}>
                          <button
                            type="button"
                            class={styles.hash}
                            title="Copiar hash"
                            onClick={() => void copyText(`h-${file.contentHash}`, file.contentHash)}
                          >
                            {copiedKey() === `h-${file.contentHash}`
                              ? 'copiado'
                              : shortHash(file.contentHash)}
                          </button>
                        </Show>
                      </p>
                    </div>
                    <Show when={file.link}>
                      <button
                        type="button"
                        class={styles.iconBtn}
                        title="Copiar link"
                        onClick={() => void copyText(`l-${file.contentHash}`, file.link)}
                      >
                        {copiedKey() === `l-${file.contentHash}` ? (
                          <Check size={16} />
                        ) : (
                          <Link2 size={16} />
                        )}
                      </button>
                    </Show>
                  </li>
                )}
              </For>
            </ul>
          </Show>

          <p class={styles.foot}>
            ID{' '}
            <button
              type="button"
              class={styles.id}
              onClick={() => void copyText('id', node()!.userId || node()!.id)}
            >
              {shortHash(node()!.userId || node()!.id)}
              {copiedKey() === 'id' ? ' · ok' : ''}
            </button>
          </p>
        </div>
      </Show>
    </Modal>
  );
};

export default PeerNodeModal;
