import { type Component, createSignal, Show, onMount, onCleanup } from 'solid-js';
import { listen } from '@tauri-apps/api/event';
import styles from './FirstRunWizard.module.css';
import { settingsService } from '@/services/storage/settingsService';
import {
  ensureTorForOnionShare,
  type TorSetupProgressPayload,
} from '@/services/network/onionShareService';
import { pickLibraryFolder, pickFolder } from '@/services/system/fileDialogs';

interface FirstRunWizardProps {
  onComplete: () => void;
}

type TorUi = 'idle' | 'working' | 'done' | 'error';

export const FirstRunWizard: Component<FirstRunWizardProps> = props => {
  const [step, setStep] = createSignal(1);
  const [sharePath, setSharePath] = createSignal<string | null>(null);
  const [downloadPath, setDownloadPath] = createSignal<string | null>(null);
  const [busy, setBusy] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  const [torUi, setTorUi] = createSignal<TorUi>('idle');
  const [torProgress, setTorProgress] = createSignal(0);
  const [torMessage, setTorMessage] = createSignal('');
  const [torErr, setTorErr] = createSignal<string | null>(null);

  // Steps: 1=Welcome, 2=Tor Setup, 3=Project Folder, 4=Download Folder, 5=Ready
  const TOTAL_STEPS = 5;

  const next = () => {
    const s = step();
    if (s === 1) {
      setStep(2);
      void runTorSetup();
      return;
    }
    if (s < TOTAL_STEPS) setStep(s + 1);
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
    setTorMessage('Starting Tor setup...');
    try {
      await ensureTorForOnionShare();
      setTorUi('done');
      setTorProgress(1);
      setTorMessage('Tor is ready!');
    } catch (e: unknown) {
      setTorUi('error');
      setTorErr(String(e instanceof Error ? e.message : e));
    }
  };

  const pickShareFolder = async () => {
    setError(null);
    try {
      const path = await pickLibraryFolder();
      if (path && path.trim().length > 0) setSharePath(path);
    } catch {
      setError('Failed to open folder picker');
    }
  };

  const pickDownloadFolder = async () => {
    setError(null);
    try {
      const path = await pickFolder('Select Download Folder');
      if (path && path.trim().length > 0) setDownloadPath(path);
    } catch {
      setError('Failed to open folder picker');
    }
  };

  const finish = async () => {
    const share = sharePath();
    if (!share) return;
    setBusy(true);
    setError(null);
    try {
      await settingsService.saveProjectSetup(share, downloadPath());
      try {
        globalThis.localStorage?.setItem('FIRST_RUN_DONE', '1');
      } catch {
        /* noop */
      }
      props.onComplete();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save settings. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const torPct = () => Math.round(Math.min(100, Math.max(0, torProgress() * 100)));

  const canGoNext = () => {
    const s = step();
    if (s === 2) return torUi() === 'done' || torUi() === 'error';
    if (s === 3) return !!sharePath();
    return true;
  };

  const stepLabel = (n: number) => {
    const labels = ['Welcome', 'Tor Setup', 'Project Folder', 'Download Folder', 'Ready'];
    return labels[n - 1] || '';
  };

  return (
    <div class={styles.overlay} role="dialog" aria-modal="true" aria-label="AlLibrary Setup">
      <div class={styles.container}>
        {/* Header with step indicator */}
        <div class={styles.header}>
          <span>Welcome to AlLibrary</span>
          <div class={styles.stepIndicator}>
            {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map(n => (
              <div
                class={`${styles.stepDot} ${n < step() ? styles.stepDone : ''} ${n === step() ? styles.stepActive : ''}`}
                title={stepLabel(n)}
              />
            ))}
          </div>
        </div>

        <div class={styles.body}>
          {/* Step 1: Welcome */}
          <Show when={step() === 1}>
            <div class={styles.section}>
              <div class={styles.stepIcon}>🌐</div>
              <h3 class={styles.title}>Private P2P Document Sharing</h3>
              <p class={styles.text}>
                AlLibrary lets you share and discover documents anonymously using the Tor network.
                No central server holds your data — everything is peer-to-peer.
              </p>
              <ul class={styles.list}>
                <li>🔒 Anonymous sharing via Tor hidden services (.onion)</li>
                <li>🌍 Discover documents from peers worldwide via tracker</li>
                <li>📚 Supports PDF and EPUB formats</li>
                <li>🚫 No censorship: information-only, no content filtering</li>
              </ul>
              <p class={styles.hint}>
                This wizard will set up Tor and configure your folders. It takes about 2 minutes.
              </p>
            </div>
          </Show>

          {/* Step 2: Tor Setup */}
          <Show when={step() === 2}>
            <div class={styles.section}>
              <div class={styles.stepIcon}>
                {torUi() === 'done' ? '✅' : torUi() === 'error' ? '⚠️' : '🔧'}
              </div>
              <h3 class={styles.title}>Setting up Tor Network</h3>
              <p class={styles.text}>
                Tor enables anonymous, encrypted communication between peers. On Windows, this may
                download the Tor Expert Bundle once (~50 MB).
              </p>
              <div
                class={styles.progressTrack}
                role="progressbar"
                aria-valuenow={torPct()}
                aria-valuemax={100}
              >
                <div class={styles.progressFill} style={{ width: `${torPct()}%` }} />
              </div>
              <p class={styles.progressCaption}>
                {torMessage() || (torUi() === 'working' ? 'Initializing...' : '\u00a0')}
              </p>
              <Show when={torUi() === 'error' && torErr()}>
                <div class={styles.error}>⚠️ {torErr()}</div>
                <p class={styles.hint}>
                  On Linux/macOS: install Tor via your package manager (e.g.{' '}
                  <code>sudo apt install tor</code>
                  ), then retry. You can also skip and set up Tor later.
                </p>
              </Show>
              <Show when={torUi() === 'done'}>
                <div class={styles.successMsg}>
                  ✅ Tor is ready! Your anonymous network is active.
                </div>
              </Show>
              <Show when={torUi() === 'error'}>
                <button type="button" class={styles.btn} onClick={() => void runTorSetup()}>
                  🔄 Retry Tor Setup
                </button>
              </Show>
            </div>
          </Show>

          {/* Step 3: Project Folder */}
          <Show when={step() === 3}>
            <div class={styles.section}>
              <div class={styles.stepIcon}>📂</div>
              <h3 class={styles.title}>Choose Project Folder</h3>
              <p class={styles.text}>
                This is your AlLibrary <strong>project root</strong>. The app will create subfolders
                here — your library files go in <code>documents/</code>, and files you share with
                the network are announced from there via your Tor onion address.
              </p>
              <div class={styles.pathRow}>
                <div class={styles.pathBox} title={sharePath() || ''}>
                  {sharePath() || 'No folder selected'}
                </div>
                <button class={styles.btnPick} onClick={pickShareFolder}>
                  📁 Pick Folder
                </button>
              </div>
              <Show when={error()}>
                <div class={styles.error}>{error()}</div>
              </Show>
              <Show when={!sharePath()}>
                <p class={styles.hint}>⚠️ You must select a project folder to continue.</p>
              </Show>
            </div>
          </Show>

          {/* Step 4: Download Folder */}
          <Show when={step() === 4}>
            <div class={styles.section}>
              <div class={styles.stepIcon}>⬇️</div>
              <h3 class={styles.title}>Choose Download Folder</h3>
              <p class={styles.text}>
                Files you download from other peers will be saved here. By default they go in a{' '}
                <code>downloads/</code> subfolder under your project root.
              </p>
              <div class={styles.pathRow}>
                <div class={styles.pathBox} title={downloadPath() || ''}>
                  {downloadPath() || `${sharePath() || 'project'}/downloads (default)`}
                </div>
                <button class={styles.btnPick} onClick={pickDownloadFolder}>
                  📁 Pick Folder
                </button>
              </div>
              <Show when={error()}>
                <div class={styles.error}>{error()}</div>
              </Show>
              <p class={styles.hint}>
                💡 Leave empty to use <code>{sharePath() || 'project'}/downloads</code>.
              </p>
            </div>
          </Show>

          {/* Step 5: Ready */}
          <Show when={step() === 5}>
            <div class={styles.section}>
              <div class={styles.stepIcon}>🚀</div>
              <h3 class={styles.title}>All Set!</h3>
              <p class={styles.text}>
                AlLibrary is configured and ready. Your documents will be shared anonymously via Tor
                onion services and discovered by peers worldwide.
              </p>
              <div class={styles.summaryGrid}>
                <div class={styles.summaryItem}>
                  <span class={styles.summaryLabel}>📂 Project Folder</span>
                  <span class={styles.summaryValue} title={sharePath() || '-'}>
                    {sharePath() || '-'}
                  </span>
                </div>
                <div class={styles.summaryItem}>
                  <span class={styles.summaryLabel}>⬇️ Download Folder</span>
                  <span
                    class={styles.summaryValue}
                    title={downloadPath() || `${sharePath() || ''}/downloads`}
                  >
                    {downloadPath() || `${sharePath() || '-'}/downloads`}
                  </span>
                </div>
                <div class={styles.summaryItem}>
                  <span class={styles.summaryLabel}>🔒 Tor Network</span>
                  <span class={styles.summaryValue}>
                    {torUi() === 'done' ? '✅ Active' : '⚠️ Needs attention'}
                  </span>
                </div>
              </div>
            </div>
          </Show>
        </div>

        <div class={styles.footer}>
          <button class={styles.btnSecondary} disabled={step() === 1 || busy()} onClick={back}>
            ← Back
          </button>
          <Show when={step() < TOTAL_STEPS}>
            <button class={styles.btnPrimary} onClick={next} disabled={busy() || !canGoNext()}>
              {step() === 2 && torUi() === 'working' ? 'Setting up...' : 'Next →'}
            </button>
          </Show>
          <Show when={step() === TOTAL_STEPS}>
            <button class={styles.btnPrimary} onClick={finish} disabled={busy() || !sharePath()}>
              {busy() ? 'Saving...' : '🚀 Launch AlLibrary'}
            </button>
          </Show>
        </div>
      </div>
    </div>
  );
};

export default FirstRunWizard;
