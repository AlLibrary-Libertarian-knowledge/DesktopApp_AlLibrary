/**
 * PeerTransfers — sharing + downloads with tables and throughput charts (mock data for shell UI).
 */

import type { Component } from 'solid-js';
import { For, Show, createSignal, onMount } from 'solid-js';
import Button from '@/components/foundation/Button/Button';
import * as onionShare from '@/services/network/onionShareService';
import { pickAnyFiles, pickFolder } from '@/services/system/fileDialogs';
import { Card } from '@/components/foundation/Card';
import { Badge } from '@/components/foundation/Badge';
import { Upload, Download, Activity } from 'lucide-solid';
import styles from './PeerTransfers.module.css';

type OutStatus = 'seeding' | 'queued' | 'paused';
type InStatus = 'active' | 'queued' | 'verifying';

const THROUGHPUT_SAMPLES = [
  { label: '-11h', up: 0.12, down: 0.45 },
  { label: '-10h', up: 0.18, down: 0.38 },
  { label: '-9h', up: 0.22, down: 0.52 },
  { label: '-8h', up: 0.31, down: 0.41 },
  { label: '-7h', up: 0.28, down: 0.67 },
  { label: '-6h', up: 0.35, down: 0.55 },
  { label: '-5h', up: 0.42, down: 0.48 },
  { label: '-4h', up: 0.39, down: 0.72 },
  { label: '-3h', up: 0.44, down: 0.61 },
  { label: '-2h', up: 0.51, down: 0.58 },
  { label: '-1h', up: 0.47, down: 0.64 },
  { label: 'now', up: 0.33, down: 0.49 },
];

const MOCK_OUTBOUND = [
  {
    id: 'seed-q8f2',
    name: 'Folklore archive — northeast (PDF bundle)',
    peers: 3,
    progress: 0.68,
    speedMbps: 0.31,
    status: 'seeding' as OutStatus,
  },
  {
    id: 'seed-m11a',
    name: 'Oral histories — session 12 (FLAC)',
    peers: 0,
    progress: 0,
    speedMbps: 0,
    status: 'queued' as OutStatus,
  },
  {
    id: 'seed-j4bt',
    name: 'Traditional medicine index (JSON)',
    peers: 1,
    progress: 1,
    speedMbps: 0.06,
    status: 'paused' as OutStatus,
  },
];

const MOCK_INBOUND = [
  {
    id: 'dwn-991',
    name: 'Community scan — treaties batch 03',
    sizeMb: 420,
    progress: 0.37,
    etaMin: 48,
    status: 'active' as InStatus,
  },
  {
    id: 'dwn-884',
    name: 'Historical maps — watershed A (GeoTIFF)',
    sizeMb: 1280,
    progress: 0.82,
    etaMin: 12,
    status: 'active' as InStatus,
  },
  {
    id: 'dwn-772',
    name: 'Annotated corpus — folklore tags v2',
    sizeMb: 96,
    progress: 0,
    etaMin: null,
    status: 'queued' as InStatus,
  },
  {
    id: 'dwn-661',
    name: 'Field recordings — reel 41',
    sizeMb: 210,
    progress: 1,
    etaMin: 0,
    status: 'verifying' as InStatus,
  },
];

const MOCK_COMPLETED = [
  {
    id: 'cmp-a1',
    name: 'Catalog migration diff',
    routed: 'Outbound',
    mib: 5.2,
    ended: 'Today 06:41',
  },
  {
    id: 'cmp-a2',
    name: 'OCR bundle — pamphlets',
    routed: 'Inbound',
    mib: 88.4,
    ended: 'Today 03:09',
  },
  {
    id: 'cmp-a3',
    name: 'Metadata patch set',
    routed: 'Outbound',
    mib: 1.4,
    ended: 'Yesterday 22:18',
  },
  {
    id: 'cmp-a4',
    name: 'Scanned negatives pack 07',
    routed: 'Inbound',
    mib: 312.0,
    ended: 'Yesterday 19:54',
  },
  {
    id: 'cmp-a5',
    name: 'Community manifest v0.9',
    routed: 'Inbound',
    mib: 0.8,
    ended: 'Yesterday 11:02',
  },
];

const VOLUME_BY_INTENT = [
  { label: 'Seeded to peers', mib: 186.4, pct: 0.44 },
  { label: 'Fetched from network', mib: 238.9, pct: 0.56 },
];

function statusToneOut(s: OutStatus): 'success' | 'secondary' | 'warning' {
  if (s === 'seeding') return 'success';
  if (s === 'paused') return 'warning';
  return 'secondary';
}

function statusToneIn(s: InStatus): 'success' | 'secondary' | 'warning' {
  if (s === 'active') return 'success';
  if (s === 'verifying') return 'warning';
  return 'secondary';
}

function throughputPath(
  values: number[],
  plotWidth: number,
  plotHeight: number,
  offsetX: number,
  offsetY: number
): string {
  const maxVal = Math.max(...values, 0.001);
  const step = plotWidth / Math.max(values.length - 1, 1);
  return values
    .map((v, i) => {
      const x = offsetX + i * step;
      const y = offsetY + plotHeight - (v / maxVal) * plotHeight;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

const PeerTransfers: Component = () => {
  const [onionRunning, setOnionRunning] = createSignal(false);
  const [onionAddr, setOnionAddr] = createSignal<string | null>(null);
  const [onionErr, setOnionErr] = createSignal('');
  const [busy, setBusy] = createSignal(false);
  const [sharePath, setSharePath] = createSignal('');
  const [fetchLink, setFetchLink] = createSignal('');
  const [fetchOutDir, setFetchOutDir] = createSignal('');
  const [lobbySnippet, setLobbySnippet] = createSignal('');
  const [localList, setLocalList] = createSignal('');
  const [fetchResult, setFetchResult] = createSignal('');

  const snapshotLobby = async () => {
    try {
      const l = await onionShare.trackerGetCachedLobby();
      setLobbySnippet(
        `online_nodes: ${l.online_nodes}\nfiles: ${l.files.length}\n${l.files
          .slice(0, 12)
          .map(f => f.link)
          .join('\n')}`
      );
    } catch {
      setLobbySnippet('(tracker lobby unavailable)');
    }
  };

  const refreshUi = async () => {
    setOnionErr('');
    try {
      const st = await onionShare.onionShareStatus();
      setOnionRunning(st.running);
      setOnionAddr(st.running ? st.onion : null);
      const loc = await onionShare.onionShareListLocal().catch(() => []);
      setLocalList(loc.map(e => `${e.name} → ${e.link}`).join('\n') || '(no files shared)');
      await snapshotLobby();
    } catch (e: unknown) {
      setOnionErr(String(e instanceof Error ? e.message : e));
    }
  };

  onMount(() => {
    void refreshUi();
  });

  const activeOut = MOCK_OUTBOUND.filter(o => o.status === 'seeding').length;
  const queuedOut = MOCK_OUTBOUND.filter(o => o.status === 'queued').length;
  const activeIn = MOCK_INBOUND.filter(i => i.status === 'active').length;
  const queuedIn = MOCK_INBOUND.filter(i => i.status === 'queued').length;
  const activeTotal = activeOut + activeIn;
  const queuedTotal = queuedOut + queuedIn;

  const upSeries = THROUGHPUT_SAMPLES.map(s => s.up);
  const downSeries = THROUGHPUT_SAMPLES.map(s => s.down);

  return (
    <div class={styles.page}>
      <header class={styles.header}>
        <div class={styles.headerRow}>
          <h1 class={styles.title}>Sharing & downloads</h1>
          <Badge variant="secondary" class={styles.kickerBadge}>
            Transfers
          </Badge>
        </div>
        <p class={styles.description}>
          Charts below still use illustrative sample data; the onion panel connects to the vendored
          onion-poc transfer core (Tor + Axum chunks + tracker) when Tor is installed.
        </p>
      </header>

      <Card class={styles.onionPanel}>
        <h2 class={styles.onionTitle}>Onion mesh (live)</h2>
        <div class={styles.onionStatus} aria-live="polite">
          <strong>Tor onion share:</strong>{' '}
          {onionRunning() ? (onionAddr() ?? 'starting…') : 'stopped'} |{' '}
          <strong title="Listed opoc:// shares on this onion">Local manifests</strong> below.
        </div>
        <div class={styles.onionToolbar}>
          <Button
            variant="primary"
            size="sm"
            disabled={busy() || onionRunning()}
            loading={busy()}
            onClick={() => {
              void (async () => {
                setBusy(true);
                setOnionErr('');
                try {
                  const r = await onionShare.onionShareStart();
                  setOnionAddr(r.onion);
                  setOnionRunning(true);
                } catch (e: unknown) {
                  setOnionErr(String(e instanceof Error ? e.message : e));
                } finally {
                  setBusy(false);
                  await refreshUi();
                }
              })();
            }}
          >
            Start onion share
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={busy() || !onionRunning()}
            onClick={() => {
              void (async () => {
                setBusy(true);
                setOnionErr('');
                try {
                  await onionShare.onionShareStop();
                  setOnionRunning(false);
                  setOnionAddr(null);
                } catch (e: unknown) {
                  setOnionErr(String(e instanceof Error ? e.message : e));
                } finally {
                  setBusy(false);
                  await refreshUi();
                }
              })();
            }}
          >
            Stop
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!onionRunning()}
            onClick={() => void snapshotLobby()}
          >
            Refresh lobby (cache)
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!onionRunning()}
            onClick={() => {
              void (async () => {
                try {
                  await onionShare.trackerRefreshLobby();
                  await snapshotLobby();
                } catch (e: unknown) {
                  setOnionErr(String(e instanceof Error ? e.message : e));
                }
              })();
            }}
          >
            Tracker HTTP refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!onionRunning()}
            onClick={() => {
              void (async () => {
                try {
                  await onionShare.trackerStartWsLoop();
                } catch (e: unknown) {
                  setOnionErr(String(e instanceof Error ? e.message : e));
                }
              })();
            }}
          >
            Start tracker WS
          </Button>
          <Button variant="outline" size="sm" onClick={() => void onionShare.trackerStopWsLoop()}>
            Stop tracker WS
          </Button>
        </div>
        <div class={styles.onionFields}>
          <input
            class={styles.onionField}
            type="text"
            placeholder="Path to file on disk (e.g. C:\path\file.bin)"
            value={sharePath()}
            onInput={e => setSharePath(e.currentTarget.value)}
          />
          <div class={styles.onionToolbar} style={{ 'margin-bottom': 0 }}>
            <Button
              variant="outline"
              size="sm"
              disabled={!onionRunning()}
              onClick={() => {
                void (async () => {
                  try {
                    const picked = await pickAnyFiles();
                    if (picked?.[0]) setSharePath(picked[0]);
                  } catch {
                    /* picker cancelled */
                  }
                })();
              }}
            >
              Pick file…
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!sharePath().trim() || !onionRunning()}
              onClick={() => {
                void (async () => {
                  setOnionErr('');
                  try {
                    await onionShare.onionShareAddFile(sharePath().trim());
                    await refreshUi();
                  } catch (e: unknown) {
                    setOnionErr(String(e instanceof Error ? e.message : e));
                  }
                })();
              }}
            >
              Add share
            </Button>
          </div>
          <textarea
            class={styles.onionField}
            style={{ 'min-height': '72px', 'grid-column': '1 / -1' }}
            readOnly
            value={localList()}
            placeholder="Locally registered shares (manifests)"
          />
          <input
            class={styles.onionField}
            type="text"
            placeholder="opoc://… or opocswarm://… link"
            value={fetchLink()}
            onInput={e => setFetchLink(e.currentTarget.value)}
            style={{ 'grid-column': '1 / -1' }}
          />
          <input
            class={styles.onionField}
            type="text"
            placeholder="Output folder (absolute path)"
            value={fetchOutDir()}
            onInput={e => setFetchOutDir(e.currentTarget.value)}
            style={{ 'grid-column': '1 / -1' }}
          />
          <div class={styles.onionToolbar}>
            <Button
              variant="outline"
              size="sm"
              disabled={!onionRunning()}
              onClick={() => {
                void (async () => {
                  const d = await pickFolder('Select download folder for fetched files');
                  if (d) setFetchOutDir(d);
                })();
              }}
            >
              Pick output folder…
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!onionRunning() || !fetchLink().trim() || !fetchOutDir().trim()}
              onClick={() => {
                void (async () => {
                  setFetchResult('');
                  setOnionErr('');
                  try {
                    const p = await onionShare.onionShareFetch(
                      fetchLink().trim(),
                      fetchOutDir().trim()
                    );
                    setFetchResult(`Saved to: ${p}`);
                  } catch (e: unknown) {
                    setOnionErr(String(e instanceof Error ? e.message : e));
                  }
                })();
              }}
            >
              Download link
            </Button>
          </div>
          <Show when={fetchResult()}>
            <p class={styles.onionLobby}>{fetchResult()}</p>
          </Show>
          <Show when={lobbySnippet()}>
            <pre class={styles.onionLobby}>{lobbySnippet()}</pre>
          </Show>
          <Show when={onionErr()}>
            <p class={styles.onionError}>{onionErr()}</p>
          </Show>
        </div>
      </Card>

      <div class={styles.summaryRow}>
        <Card class={styles.summaryCard}>
          <span class={styles.summaryLabel}>Active transfers</span>
          <strong class={styles.summaryValue}>{activeTotal}</strong>
          <div class={styles.sparkLine} aria-hidden>
            <For each={[0.35, 0.42, 0.38, 0.52, 0.48, 0.61, 0.55].map(x => `${x * 100}%`)}>
              {height => <div class={styles.sparkBar} style={{ height }} />}
            </For>
          </div>
        </Card>
        <Card class={styles.summaryCard}>
          <span class={styles.summaryLabel}>Queued</span>
          <strong class={styles.summaryValue}>{queuedTotal}</strong>
          <div class={styles.sparkLine} aria-hidden>
            <For each={[0.52, 0.48, 0.41, 0.44, 0.46, 0.39, 0.43].map(x => `${x * 100}%`)}>
              {height => <div class={styles.sparkAlt} style={{ height }} />}
            </For>
          </div>
        </Card>
        <Card class={styles.summaryCard}>
          <span class={styles.summaryLabel}>Completed (24h)</span>
          <strong class={styles.summaryValue}>{MOCK_COMPLETED.length}</strong>
          <div class={styles.sparkLine} aria-hidden>
            <For each={[0.22, 0.35, 0.31, 0.58, 0.44, 0.72, 0.66].map(x => `${x * 100}%`)}>
              {height => <div class={styles.sparkBar} style={{ height }} />}
            </For>
          </div>
        </Card>
      </div>

      <section class={styles.visualGrid} aria-labelledby="transfers-charts-heading">
        <Card class={styles.chartCard}>
          <div class={styles.chartHead}>
            <Activity size={18} class={styles.chartIcon} aria-hidden />
            <div>
              <h2 id="transfers-charts-heading" class={styles.chartTitle}>
                Throughput trend
              </h2>
              <p class={styles.chartSub}>Mock Mbps — outbound vs inbound (rolling window)</p>
            </div>
          </div>
          <svg
            class={styles.chartSvg}
            viewBox="0 0 520 148"
            role="img"
            aria-label="Line chart comparing upload and download megabits per second over twelve samples"
          >
            <rect x={32} y={8} width={472} height={92} rx={6} class={styles.chartPlotBg} />
            <For each={[0.25, 0.5, 0.75] as const}>
              {t => (
                <line
                  x1={32}
                  x2={504}
                  y1={8 + (1 - t) * 92}
                  y2={8 + (1 - t) * 92}
                  class={styles.chartGrid}
                />
              )}
            </For>
            <path
              d={`${throughputPath(upSeries, 472, 92, 32, 8)}`}
              fill="none"
              class={styles.strokeUp}
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d={`${throughputPath(downSeries, 472, 92, 32, 8)}`}
              fill="none"
              class={styles.strokeDown}
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <div class={styles.chartLegend}>
            <span class={styles.legendDotUp}>Outbound Mbps</span>
            <span class={styles.legendDotDown}>Inbound Mbps</span>
            <span class={styles.chartAxis}>
              <For each={THROUGHPUT_SAMPLES.filter((_, i) => i % 3 === 0)}>
                {pt => <span>{pt.label}</span>}
              </For>
            </span>
          </div>
          <div class={styles.miniBars} aria-hidden>
            <For each={THROUGHPUT_SAMPLES}>
              {pt => (
                <div class={styles.miniBarPair}>
                  <div
                    class={styles.miniUp}
                    style={{ height: `${(pt.up / 0.72) * 100}%`, 'min-height': '3px' }}
                  />
                  <div
                    class={styles.miniDown}
                    style={{ height: `${(pt.down / 0.72) * 100}%`, 'min-height': '3px' }}
                  />
                </div>
              )}
            </For>
          </div>
        </Card>

        <Card class={styles.chartCard}>
          <div class={styles.chartHead}>
            <Download size={18} class={styles.chartIcon} aria-hidden />
            <div>
              <h2 class={styles.chartTitle}>Volume by direction</h2>
              <p class={styles.chartSub}>MiB moved — mock aggregates for yesterday + today</p>
            </div>
          </div>
          <ul class={styles.horizontalBars}>
            <For each={VOLUME_BY_INTENT}>
              {row => (
                <li class={styles.hBarRow}>
                  <div class={styles.hBarMeta}>
                    <span>{row.label}</span>
                    <span class={styles.hBarVal}>{row.mib.toFixed(1)} MiB</span>
                  </div>
                  <div class={styles.hBarTrack}>
                    <div class={styles.hBarFill} style={{ width: `${row.pct * 100}%` }} />
                  </div>
                </li>
              )}
            </For>
          </ul>
        </Card>
      </section>

      <section class={styles.tablesBlock} aria-label="Transfer queues">
        <Card class={styles.tableCard}>
          <div class={styles.panelHead}>
            <Upload size={20} class={styles.panelIcon} aria-hidden />
            <h2 class={styles.panelTitle}>Outbound — sharing & seeding</h2>
          </div>
          <div class={styles.tableScroll}>
            <table class={styles.table}>
              <caption class={styles.srOnly}>Outbound transfers and seeding jobs</caption>
              <thead>
                <tr>
                  <th scope="col">Item</th>
                  <th scope="col">Peers</th>
                  <th scope="col">Progress</th>
                  <th scope="col">Mbps</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                <For each={MOCK_OUTBOUND}>
                  {row => (
                    <tr>
                      <td>
                        <div class={styles.mono}>{row.id}</div>
                        <div class={styles.cellTitle}>{row.name}</div>
                      </td>
                      <td>{row.peers}</td>
                      <td>
                        <div class={styles.barCell}>
                          <div class={styles.barFill} style={{ width: `${row.progress * 100}%` }} />
                        </div>
                        <span class={styles.barLabel}>{`${Math.round(row.progress * 100)}%`}</span>
                      </td>
                      <td>{row.speedMbps.toFixed(2)}</td>
                      <td>
                        <Badge variant={statusToneOut(row.status)}>{row.status}</Badge>
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </Card>

        <Card class={styles.tableCard}>
          <div class={styles.panelHead}>
            <Download size={20} class={styles.panelIcon} aria-hidden />
            <h2 class={styles.panelTitle}>Inbound — downloads</h2>
          </div>
          <div class={styles.tableScroll}>
            <table class={styles.table}>
              <caption class={styles.srOnly}>Downloads in progress or queued</caption>
              <thead>
                <tr>
                  <th scope="col">Item</th>
                  <th scope="col">Size</th>
                  <th scope="col">Progress</th>
                  <th scope="col">ETA</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                <For each={MOCK_INBOUND}>
                  {row => (
                    <tr>
                      <td>
                        <div class={styles.mono}>{row.id}</div>
                        <div class={styles.cellTitle}>{row.name}</div>
                      </td>
                      <td>{`${row.sizeMb} MB`}</td>
                      <td>
                        <div class={styles.barCell}>
                          <div
                            class={styles.barFillAlt}
                            style={{ width: `${row.progress * 100}%` }}
                          />
                        </div>
                        <span class={styles.barLabel}>{`${Math.round(row.progress * 100)}%`}</span>
                      </td>
                      <td>{row.status === 'queued' ? '—' : `${row.etaMin} min`}</td>
                      <td>
                        <Badge variant={statusToneIn(row.status)}>{row.status}</Badge>
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </Card>

        <Card class={styles.tableCard}>
          <div class={styles.panelHead}>
            <Activity size={20} class={styles.panelIcon} aria-hidden />
            <h2 class={styles.panelTitle}>Recently completed</h2>
          </div>
          <div class={styles.tableScroll}>
            <table class={styles.table}>
              <caption class={styles.srOnly}>Recently finished transfers</caption>
              <thead>
                <tr>
                  <th scope="col">Item</th>
                  <th scope="col">Direction</th>
                  <th scope="col">Size</th>
                  <th scope="col">Ended</th>
                </tr>
              </thead>
              <tbody>
                <For each={MOCK_COMPLETED}>
                  {row => (
                    <tr>
                      <td>
                        <div class={styles.mono}>{row.id}</div>
                        <div class={styles.cellTitle}>{row.name}</div>
                      </td>
                      <td>{row.routed}</td>
                      <td>{`${row.mib.toFixed(1)} MiB`}</td>
                      <td class={styles.mutedTd}>{row.ended}</td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  );
};

export { PeerTransfers };
export default PeerTransfers;
