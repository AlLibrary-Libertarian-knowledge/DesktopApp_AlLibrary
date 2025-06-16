import { createSignal, createEffect, onCleanup, JSX, For, Show } from 'solid-js';
import styles from './CustomDropdown.module.css';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: JSX.Element;
}

interface CustomDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  class?: string;
  ariaLabel?: string;
}

export const CustomDropdown = (props: CustomDropdownProps) => {
  const [open, setOpen] = createSignal(false);
  const [highlighted, setHighlighted] = createSignal(-1);
  let buttonRef: HTMLButtonElement | undefined;
  let listRef: HTMLUListElement | undefined;

  const handleClickOutside = (e: MouseEvent) => {
    if (!buttonRef?.contains(e.target as Node) && !listRef?.contains(e.target as Node)) {
      setOpen(false);
    }
  };
  createEffect(() => {
    if (open()) document.addEventListener('mousedown', handleClickOutside);
    else document.removeEventListener('mousedown', handleClickOutside);
    onCleanup(() => document.removeEventListener('mousedown', handleClickOutside));
  });

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!open()) return;
    switch (e.key) {
      case 'ArrowDown':
        setHighlighted(h => Math.min(h + 1, props.options.length - 1));
        e.preventDefault();
        break;
      case 'ArrowUp':
        setHighlighted(h => Math.max(h - 1, 0));
        e.preventDefault();
        break;
      case 'Enter':
        if (highlighted() >= 0) {
          const option = props.options[highlighted()];
          if (option) {
            props.onChange(option.value);
          }
          setOpen(false);
        }
        e.preventDefault();
        break;
      case 'Escape':
        setOpen(false);
        e.preventDefault();
        break;
    }
  };
  createEffect(() => {
    if (open()) document.addEventListener('keydown', handleKeyDown);
    else document.removeEventListener('keydown', handleKeyDown);
    onCleanup(() => document.removeEventListener('keydown', handleKeyDown));
  });

  createEffect(() => {
    if (open()) setHighlighted(props.options.findIndex(o => o.value === props.value));
  });

  const handleSelect = (value: string) => {
    props.onChange(value);
    setOpen(false);
  };

  const selected = () => props.options.find(o => o.value === props.value);

  return (
    <div
      class={`${styles.dropdown} ${props.class || ''}`}
      tabIndex={0}
      aria-haspopup="listbox"
      aria-expanded={open()}
      aria-label={props.ariaLabel || props.placeholder}
    >
      <button
        ref={buttonRef}
        class={styles.button}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open()}
        onClick={() => setOpen(o => !o)}
        tabIndex={0}
      >
        <span class={styles.selected}>
          <Show when={selected()?.icon}>{selected()?.icon}</Show>
          {selected()?.label || props.placeholder}
        </span>
        <span class={styles.arrow} aria-hidden="true" />
      </button>
      <Show when={open()}>
        <ul ref={listRef} class={styles.menu} role="listbox" tabIndex={-1}>
          <For each={props.options}>
            {(opt, i) => (
              <li
                class={`${styles.option} ${opt.value === props.value ? styles.selectedOption : ''} ${highlighted() === i() ? styles.highlighted : ''}`}
                role="option"
                aria-selected={opt.value === props.value}
                tabIndex={-1}
                onMouseDown={e => {
                  e.preventDefault();
                  handleSelect(opt.value);
                }}
                onMouseEnter={() => setHighlighted(i())}
              >
                <Show when={opt.icon}>
                  <span class={styles.icon}>{opt.icon}</span>
                </Show>
                {opt.label}
              </li>
            )}
          </For>
        </ul>
      </Show>
    </div>
  );
};
