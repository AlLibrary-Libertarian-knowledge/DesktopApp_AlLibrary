import { type Component, createSignal, Show, onMount, onCleanup } from 'solid-js';
import { listen } from '@tauri-apps/api/event';
import styles from './FirstRunWizard.module.css';
import { settingsService } from '@/services/storage/settingsService';
import {
  ensureTorForOnionShare,
  type TorSetupProgressPayload,
} from '@/services/network/onionShareService';
import { pickLibraryFolder } from '@/services/system/fileDialogs';

interface FirstRunWizardProps {
  onComplete: () => void;
}

type TorUi = 'idle' | 'working' | 'done' | 'error';

export const FirstRunWizard: Component<FirstRunWizardProps> = props => {
  const [step, setStep] = createSignal(1);
  const [pickedPath, setPickedPath] = createSignal<string | null>(null);
  const [busy, setBusy] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  const [torUi, setTorUi] = createSignal<TorUi>('idle');
  const [torProgress, setTorProgress] = createSignal(0);
  const [torMessage, setTorMessage] = createSignal('');
  const [torErr, setTorErr] = createSignal<string | null>(null);

  const next = () => {
    const s = step();
    if (s === 1) {
      setStep(2);
      void runTorSetup();
      return;
    }
    if (s < 4) setStep(s + 1);
  };

  const back = () => setStep(Math.max(1, step() - 1));

  onMount(() => {
    let unlisten: (() => void) | undefined;
    void listen<TorSetupProgressPayload>('tor-setup-progress', e => {
      const p = e.payload;
      setTorProgress(p.progress);
      setTorMessage(p.message);
    }).then(fn => {
      unlisten = fn;
    });
    onCleanup(() => unlisten?.());
  });

  const runTorSetup = async () => {
    setTorErr(null);
    setTorUi('working');
    setTorProgress(0);
    setTorMessage('');
    try {
      await ensureTorForOnionShare();
      setTorUi('done');
      setTorProgress(1);
    } catch (e: unknown) {
      setTorUi('error');
      setTorErr(String(e instanceof Error ? e.message : e));
    }
  };

  const pickFolder = async () => {
    setError(null);
    try {
      const path = await pickLibraryFolder();
      if (path && path.trim().length > 0) setPickedPath(path);
    } catch {
      setError('Failed to open folder picker');
    }
  };

  const finish = async () => {
    const path = pickedPath();
    if (!path) return;
    setBusy(true);
    setError(null);
    try {
      await settingsService.setProjectFolder(path);
      try {
        globalThis.localStorage?.setItem('FIRST_RUN_DONE', '1');
      } catch {
        /* noop */
      }
      props.onComplete();
    } catch {
      setError('Failed to save folder');
    } finally {
      setBusy(false);
    }
  };

  const torPct = () => Math.round(Math.min(100, Math.max(0, torProgress() * 100)));

  return (
    <div class={styles.overlay} role="dialog" aria-modal="true">
      <div class={styles.container}>
        <div class={styles.header}>Welcome to AlLibrary</div>
        <div class={styles.body}>
          <Show when={step() === 1}>
            <div class={styles.section}>
              <h3 class={styles.title}>Private P2P over Tor</h3>
              <p class={styles.text}>
                Your library shares documents over an anonymous network. Cultural info is
                educational only.
              </p>
              <ul class={styles.list}>
                <li>Security-first: malware/legal checks only</li>
                <li>No censorship: information-only cultural context</li>
                <li>Offline-capable: everything works without internet</li>
              </ul>
            </div>
          </Show>
          <Show when={step() === 2}>
            <div class={styles.section}>
              <h3 class={styles.title}>Tor for private sharing</h3>
              <p class={styles.text}>
                We set up the Tor executable used for onion-address file sharing. On Windows this
                may download the Tor Expert Bundle once.
              </p>
              <div class={styles.progressTrack} role="progressbar" aria-valuenow={torPct()}>
                <div class={styles.progressFill} style={{ width: `${torPct()}%` }} />
              </div>
              <p class={styles.progressCaption}>{torMessage() || '\u00a0'}</p>
              <Show when={torUi() === 'error' && torErr()}>
                <div class={styles.error}>{torErr()}</div>
                <p class={styles.text}>
                  On macOS or Linux, install Tor with your package manager, then use Retry.
                </p>
              </Show>
              <Show when={torUi() === 'error'}>
                <button type="button" class={styles.btn} onClick={() => void runTorSetup()}>
                  Retry
                </button>
              </Show>
            </div>
          </Show>
          <Show when={step() === 3}>
            <div class={styles.section}>
              <h3 class={styles.title}>Choose your Library Folder</h3>
              <p class={styles.text}>All documents, indexes and cache will be stored here.</p>
              <div class={styles.pathRow}>
                <div class={styles.pathBox}>{pickedPath() || 'No folder selected'}</div>
                <button class={styles.btn} onClick={pickFolder}>
                  Pick Folder
                </button>
              </div>
              <Show when={error()}>
                <div class={styles.error}>{error()}</div>
              </Show>
            </div>
          </Show>
          <Show when={step() === 4}>
            <div class={styles.section}>
              <h3 class={styles.title}>Ready</h3>
              <p class={styles.text}>We will index your folder and prepare private networking.</p>
              <div class={styles.summary}>
                <span>Folder</span>
                <span>{pickedPath() || '-'}</span>
              </div>
            </div>
          </Show>
        </div>
        <div class={styles.footer}>
          <button class={styles.btnSecondary} disabled={step() === 1 || busy()} onClick={back}>
            Back
          </button>
          <Show when={step() < 4}>
            <button
              class={styles.btnPrimary}
              onClick={next}
              disabled={
                busy() || (step() === 2 && torUi() !== 'done') || (step() === 3 && !pickedPath())
              }
            >
              Next
            </button>
          </Show>
          <Show when={step() === 4}>
            <button class={styles.btnPrimary} onClick={finish} disabled={busy() || !pickedPath()}>
              {busy() ? 'Saving...' : 'Finish'}
            </button>
          </Show>
        </div>
      </div>
    </div>
  );
};

export default FirstRunWizard;
