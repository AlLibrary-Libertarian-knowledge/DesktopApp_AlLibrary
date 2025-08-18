import { Component, createSignal, Show } from 'solid-js';
import styles from './FirstRunWizard.module.css';
import { settingsService } from '@/services/storage/settingsService';
import { invoke } from '@tauri-apps/api/core';

interface FirstRunWizardProps {
  onComplete: () => void;
}

export const FirstRunWizard: Component<FirstRunWizardProps> = props => {
  const [step, setStep] = createSignal(1);
  const [pickedPath, setPickedPath] = createSignal<string | null>(null);
  const [busy, setBusy] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  const next = () => setStep(step() + 1);
  const back = () => setStep(Math.max(1, step() - 1));

  const pickFolder = async () => {
    setError(null);
    try {
      const path = await invoke<string | null>('pick_library_folder');
      if (path && path.trim().length > 0) setPickedPath(path);
    } catch { setError('Failed to open folder picker'); }
  };

  const finish = async () => {
    const path = pickedPath();
    if (!path) return;
    setBusy(true);
    setError(null);
    try {
      await settingsService.setProjectFolder(path);
      try { globalThis.localStorage?.setItem('FIRST_RUN_DONE', '1'); } catch { /* noop */ }
      props.onComplete();
    } catch {
      setError('Failed to save folder');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div class={styles.overlay} role="dialog" aria-modal="true">
      <div class={styles.container}>
        <div class={styles.header}>Welcome to AlLibrary</div>
        <div class={styles.body}>
          <Show when={step() === 1}>
            <div class={styles.section}>
              <h3 class={styles.title}>Private P2P over Tor</h3>
              <p class={styles.text}>Your library shares only PDFs/EPUBs over an anonymous network. Cultural info is educational only.</p>
              <ul class={styles.list}>
                <li>Security-first: malware/legal checks only</li>
                <li>No censorship: information-only cultural context</li>
                <li>Offline-capable: everything works without internet</li>
              </ul>
            </div>
          </Show>
          <Show when={step() === 2}>
            <div class={styles.section}>
              <h3 class={styles.title}>Choose your Library Folder</h3>
              <p class={styles.text}>All documents, indexes and cache will be stored here.</p>
              <div class={styles.pathRow}>
                <div class={styles.pathBox}>{pickedPath() || 'No folder selected'}</div>
                <button class={styles.btn} onClick={pickFolder}>Pick Folder</button>
              </div>
              <Show when={error()}>
                <div class={styles.error}>{error()}</div>
              </Show>
            </div>
          </Show>
          <Show when={step() === 3}>
            <div class={styles.section}>
              <h3 class={styles.title}>Ready</h3>
              <p class={styles.text}>We will index your folder and prepare private networking.</p>
              <div class={styles.summary}><span>Folder</span><span>{pickedPath() || '-'}</span></div>
            </div>
          </Show>
        </div>
        <div class={styles.footer}>
          <button class={styles.btnSecondary} disabled={step() === 1 || busy()} onClick={back}>Back</button>
          <Show when={step() < 3}>
            <button class={styles.btnPrimary} onClick={next} disabled={busy() || (step() === 2 && !pickedPath())}>Next</button>
          </Show>
          <Show when={step() === 3}>
            <button class={styles.btnPrimary} onClick={finish} disabled={busy() || !pickedPath()}>{busy() ? 'Saving...' : 'Finish'}</button>
          </Show>
        </div>
      </div>
    </div>
  );
};

export default FirstRunWizard;


