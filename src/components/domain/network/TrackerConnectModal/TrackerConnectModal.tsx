import { type Component, Show, createSignal, onMount, onCleanup } from 'solid-js';
import { Modal } from '@/components/foundation/Modal';
import { ArrowRight, Library, Radio, Wifi, WifiOff } from 'lucide-solid';
import {
  DEFAULT_LOCAL_TRACKER_URL,
  trackerGetConfig,
  trackerProbe,
  trackerSetConfig,
  type TrackerProbeResult,
} from '@/services/network/onionShareService';
import { transferFacade } from '@/services/network/transferFacade';
import { networkFacade } from '@/services/network/networkFacade';
import styles from './TrackerConnectModal.module.css';

export interface TrackerConnectModalProps {
  isOpen: boolean;
  onConnected: () => void;
  onSkip?: () => void;
}

type ProbeUi = 'checking' | 'online' | 'offline';

export const TrackerConnectModal: Component<TrackerConnectModalProps> = props => {
  const [probe, setProbe] = createSignal<TrackerProbeResult | null>(null);
  const [probeUi, setProbeUi] = createSignal<ProbeUi>('checking');
  const [customUrl, setCustomUrl] = createSignal('');
  const [busy, setBusy] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [savedUrl, setSavedUrl] = createSignal('');
  const [firstProbeDone, setFirstProbeDone] = createSignal(false);

  let pollTimer: number | undefined;

  const defaultLocal = () => probe()?.defaultLocalUrl || DEFAULT_LOCAL_TRACKER_URL;

  const refreshProbe = async (showChecking = false) => {
    if (showChecking || !firstProbeDone()) setProbeUi('checking');
    try {
      const r = await trackerProbe(defaultLocal());
      setProbe(r);
      setProbeUi(r.online ? 'online' : 'offline');
      setFirstProbeDone(true);
    } catch (e) {
      setProbe(null);
      setProbeUi('offline');
      setFirstProbeDone(true);
      setError(String(e instanceof Error ? e.message : e));
    }
  };

  onMount(() => {
    void (async () => {
      try {
        const cfg = await trackerGetConfig();
        setSavedUrl(cfg.trackerUrl?.trim() ?? '');
        if (cfg.trackerUrl && !cfg.trackerUrl.includes('127.0.0.1')) {
          setCustomUrl(cfg.trackerUrl);
        }
      } catch {
        /* ignore */
      }
      await refreshProbe(true);
    })();
    pollTimer = globalThis.setInterval(() => {
      void refreshProbe(false);
    }, 8000);
  });

  onCleanup(() => {
    if (pollTimer) globalThis.clearInterval(pollTimer);
  });

  const connectTo = async (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) {
      setError('Informe a URL do tracker.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const cfg = await trackerGetConfig();
      await trackerSetConfig({
        trackerUrl: trimmed,
        nodeId: cfg.nodeId,
        sharePublicly: cfg.sharePublicly ?? true,
        tryLocalTrackerFallback: cfg.tryLocalTrackerFallback,
        torBridges: cfg.torBridges,
      });
      try {
        await transferFacade.syncAllEnabledSeeds();
      } catch {
        /* seeds optional at cold start */
      }
      try {
        await networkFacade.refreshLobby();
      } catch {
        /* lobby may fail until Tor is up for onion URLs */
      }
      props.onConnected();
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setBusy(false);
    }
  };

  const statusCopy = () => {
    if (probeUi() === 'checking') return 'Procurando servidor…';
    if (probeUi() === 'online') return 'Pronto para conectar';
    return 'Servidor indisponível';
  };

  const radarClass = () => {
    if (probeUi() === 'online') return styles.radarOnline;
    if (probeUi() === 'offline') return styles.radarOffline;
    return styles.radarChecking;
  };

  const liveClass = () => {
    if (probeUi() === 'online') return styles.liveOnline;
    if (probeUi() === 'offline') return styles.liveOffline;
    return styles.liveChecking;
  };

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={() => props.onSkip?.()}
      size="md"
      showCloseButton={false}
      closeOnOutsideClick={false}
      closeOnEsc={false}
      ariaLabel="Conectar ao tracker"
      data-testid="tracker-connect-modal"
      class={styles.modalChrome}
      panelClass={styles.modalPanel}
      contentClass={styles.modalContent}
    >
      <div class={styles.shell}>
        <div class={styles.brandRow}>
          <div class={styles.brandMark}>
            <span class={styles.brandGlyph} aria-hidden="true">
              <Library size={18} strokeWidth={2.4} />
            </span>
            <div>
              <p class={styles.brandName}>AlLibrary</p>
              <p class={styles.brandTag}>Rede · Lobby</p>
            </div>
          </div>
          <span class={styles.sessionChip}>Ao iniciar</span>
        </div>

        <section class={styles.hero} aria-live="polite">
          <div class={`${styles.radar} ${radarClass()}`} aria-hidden="true">
            <span class={styles.radarRing} />
            <span class={styles.radarRing} />
            <span class={styles.radarRing} />
            <span class={styles.radarCore}>
              {probeUi() === 'online' ? (
                <Wifi size={18} />
              ) : probeUi() === 'offline' ? (
                <WifiOff size={18} />
              ) : (
                <Radio size={18} />
              )}
            </span>
          </div>

          <div class={styles.heroCopy}>
            <p class={styles.kicker}>Tracker server</p>
            <h2 class={styles.title}>Onde você quer entrar na rede?</h2>
            <p class={styles.lede}>
              Um toque no padrão local — ou cole outro endereço se for lab remoto / Docker.
            </p>

            <div class={`${styles.statusLine} ${liveClass()}`}>
              <span class={styles.liveDot} />
              <span class={styles.statusText}>{statusCopy()}</span>
              <span class={styles.endpoint} title={defaultLocal()}>
                {defaultLocal()}
              </span>
            </div>

            <Show when={probeUi() === 'online'}>
              <div class={styles.stats}>
                <span class={styles.stat}>{probe()?.onlineNodes ?? 0} nós no lobby</span>
                <Show when={probe()?.latencyMs != null}>
                  <span class={styles.stat}>{probe()!.latencyMs} ms</span>
                </Show>
              </div>
            </Show>

            <Show when={probeUi() === 'offline'}>
              <p class={styles.offlineHint}>
                Suba o TrackerRust na porta 8080, ou escolha outra URL abaixo.
              </p>
            </Show>
          </div>
        </section>

        <div class={styles.actions}>
          <button
            type="button"
            class={styles.cta}
            disabled={busy()}
            onClick={() => void connectTo(defaultLocal())}
          >
            <span>Conectar ao tracker padrão</span>
            <span class={styles.ctaIcon}>
              <ArrowRight size={18} strokeWidth={2.5} />
            </span>
          </button>

          <details class={styles.advanced}>
            <summary class={styles.advancedSummary}>Usar outro endereço</summary>
            <div class={styles.advancedBody}>
              <div class={styles.inputRow}>
                <input
                  class={styles.input}
                  type="url"
                  placeholder="http://127.0.0.1:8080 ou http://….onion"
                  value={customUrl()}
                  onInput={e => setCustomUrl(e.currentTarget.value)}
                  disabled={busy()}
                />
                <button
                  type="button"
                  class={styles.secondaryBtn}
                  disabled={busy() || !customUrl().trim()}
                  onClick={() => void connectTo(customUrl())}
                >
                  Conectar
                </button>
              </div>

              <div class={styles.presetRow}>
                <button
                  type="button"
                  class={styles.chipBtn}
                  disabled={busy()}
                  onClick={() => setCustomUrl(defaultLocal())}
                >
                  Lab local
                </button>
                <Show when={probe()?.defaultOnionUrl}>
                  <button
                    type="button"
                    class={styles.chipBtn}
                    disabled={busy()}
                    onClick={() => setCustomUrl(probe()!.defaultOnionUrl)}
                  >
                    Onion Docker
                  </button>
                </Show>
              </div>

              <Show when={savedUrl()}>
                <p class={styles.saved}>Última salva: {savedUrl()}</p>
              </Show>
            </div>
          </details>
        </div>

        <Show when={error()}>
          <p class={styles.error} role="alert">
            {error()}
          </p>
        </Show>

        <div class={styles.footer}>
          <Show when={props.onSkip}>
            <button
              type="button"
              class={styles.skip}
              disabled={busy()}
              onClick={() => props.onSkip?.()}
            >
              Continuar sem conectar
            </button>
          </Show>
          <p class={styles.footnote}>
            Aparece a cada abertura para não misturar tracker local com onion remoto.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default TrackerConnectModal;
