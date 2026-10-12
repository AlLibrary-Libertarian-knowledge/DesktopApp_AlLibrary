import { type Component, Show, createSignal, For } from 'solid-js';
import { BookOpen, Pin, PinOff, X } from 'lucide-solid';
import './TransferLegend.css';

export interface TransferLegendProps {
  className?: string;
}

type LegendRow = { kind: 'dot' | 'line'; className: string; label: string };

const TRANSFER_ROWS: LegendRow[] = [
  { kind: 'dot', className: 'downloading-active', label: 'Baixando' },
  { kind: 'dot', className: 'uploading-active', label: 'Enviando' },
  { kind: 'dot', className: 'reconnecting', label: 'Reconectando' },
  { kind: 'dot', className: 'interrupted', label: 'Interrompido' },
];

const FILE_ROWS: LegendRow[] = [
  { kind: 'dot', className: 'corrupted', label: 'Corrompido' },
  { kind: 'dot', className: 'slow-transfer', label: 'Download lento' },
  { kind: 'dot', className: 'verified', label: 'Verificado' },
  { kind: 'dot', className: 'pending', label: 'Na fila' },
];

const LINK_ROWS: LegendRow[] = [
  { kind: 'line', className: 'solid-line', label: 'Alta velocidade' },
  { kind: 'line', className: 'dashed-line', label: 'Média' },
  { kind: 'line', className: 'dotted-line', label: 'Instável' },
];

const TransferLegend: Component<TransferLegendProps> = props => {
  const [open, setOpen] = createSignal(false);
  const [pinned, setPinned] = createSignal(false);

  const expanded = () => open() || pinned();

  const close = () => {
    setPinned(false);
    setOpen(false);
  };

  const togglePin = (e: MouseEvent) => {
    e.stopPropagation();
    setPinned(p => !p);
    if (!pinned()) setOpen(true);
  };

  return (
    <div
      class={`transfer-legend ${expanded() ? 'is-open' : ''} ${pinned() ? 'is-pinned' : ''} ${props.className || ''}`}
      onMouseEnter={() => {
        if (!pinned()) setOpen(true);
      }}
      onMouseLeave={() => {
        if (!pinned()) setOpen(false);
      }}
    >
      <Show
        when={expanded()}
        fallback={
          <button
            type="button"
            class="legend-chip"
            onClick={e => {
              e.stopPropagation();
              setOpen(true);
            }}
            aria-expanded={false}
            aria-label="Abrir legenda do gráfico"
          >
            <BookOpen size={14} strokeWidth={2.2} />
            <span>Legenda</span>
          </button>
        }
      >
        <div
          class="legend-card"
          role="dialog"
          aria-label="Legenda do gráfico"
          onClick={e => e.stopPropagation()}
        >
          <header class="legend-head">
            <div>
              <p class="legend-kicker">Gráfico</p>
              <h3 class="legend-title">Legenda</h3>
            </div>
            <div class="legend-actions">
              <button
                type="button"
                class={`legend-icon-btn ${pinned() ? 'active' : ''}`}
                onClick={togglePin}
                title={pinned() ? 'Desafixar' : 'Fixar aberta'}
                aria-pressed={pinned()}
              >
                {pinned() ? <PinOff size={14} /> : <Pin size={14} />}
              </button>
              <button
                type="button"
                class="legend-icon-btn"
                onClick={e => {
                  e.stopPropagation();
                  close();
                }}
                aria-label="Fechar legenda"
              >
                <X size={15} />
              </button>
            </div>
          </header>

          <div class="legend-body">
            <section class="legend-section">
              <h4 class="legend-section-title">Transferência</h4>
              <ul class="legend-items">
                <For each={TRANSFER_ROWS}>
                  {row => (
                    <li class="legend-item">
                      <span class={`legend-indicator ${row.className}`} />
                      <span>{row.label}</span>
                    </li>
                  )}
                </For>
              </ul>
            </section>

            <section class="legend-section">
              <h4 class="legend-section-title">Arquivo</h4>
              <ul class="legend-items">
                <For each={FILE_ROWS}>
                  {row => (
                    <li class="legend-item">
                      <span class={`legend-indicator ${row.className}`} />
                      <span>{row.label}</span>
                    </li>
                  )}
                </For>
              </ul>
            </section>

            <section class="legend-section legend-section-full">
              <h4 class="legend-section-title">Conexão</h4>
              <ul class="legend-items legend-items-inline">
                <For each={LINK_ROWS}>
                  {row => (
                    <li class="legend-item">
                      <span class={`legend-line ${row.className}`} />
                      <span>{row.label}</span>
                    </li>
                  )}
                </For>
              </ul>
            </section>

            <section class="legend-section legend-section-full">
              <h4 class="legend-section-title">Rede do nó</h4>
              <ul class="legend-items legend-items-inline">
                <li class="legend-item">
                  <span class="legend-badge legend-badge-tor" aria-hidden="true">
                    T
                  </span>
                  <span>Tor / híbrido</span>
                </li>
                <li class="legend-item">
                  <span class="legend-badge legend-badge-net" aria-hidden="true">
                    N
                  </span>
                  <span>Internet</span>
                </li>
              </ul>
            </section>
          </div>

          <p class="legend-tip">Passe o mouse nos nós · clique para detalhes</p>
        </div>
      </Show>
    </div>
  );
};

export default TransferLegend;
