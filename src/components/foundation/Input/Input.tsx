import { Component, JSX, createSignal, Show } from 'solid-js';
import styles from './Input.module.css';

export interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'search' | 'url' | 'tel';
  placeholder?: string;
  value?: string;
  disabled?: boolean;
  required?: boolean;
  readonly?: boolean;
  error?: string;
  label?: string;
  hint?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'outline';
  icon?: JSX.Element;
  onInput?: (value: string) => void;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  class?: string;
  id?: string;
  name?: string;
  autocomplete?: string;
  maxlength?: number;
  minlength?: number;
  pattern?: string;
  'aria-describedby'?: string;
}

const Input: Component<InputProps> = props => {
  const [isFocused, setIsFocused] = createSignal(false);
  const [internalValue, setInternalValue] = createSignal(props.value || '');

  const handleInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const value = target.value;
    setInternalValue(value);
    props.onInput?.(value);
  };

  const handleChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const value = target.value;
    props.onChange?.(value);
  };

  const handleFocus = () => {
    setIsFocused(true);
    props.onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    props.onBlur?.();
  };

  const inputClasses = () =>
    [
      styles['input'],
      styles[`input-${props.size || 'md'}`],
      styles[`input-${props.variant || 'default'}`],
      props.error && styles['input-error'],
      props.disabled && styles['input-disabled'],
      isFocused() && styles['input-focused'],
      props.icon && styles['input-with-icon'],
      props.class,
    ]
      .filter(Boolean)
      .join(' ');

  const inputId = () => props.id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div class={styles['input-wrapper']}>
      <Show when={props.label}>
        <label class={styles['input-label']} for={inputId()}>
          {props.label}
          {props.required && <span class={styles['input-required']}>*</span>}
        </label>
      </Show>

      <div class={styles['input-container']}>
        <Show when={props.icon}>
          <div class={styles['input-icon']}>{props.icon}</div>
        </Show>

        <input
          id={inputId()}
          type={props.type || 'text'}
          class={inputClasses()}
          placeholder={props.placeholder}
          value={internalValue()}
          disabled={props.disabled}
          readonly={props.readonly}
          required={props.required}
          name={props.name}
          autocomplete={props.autocomplete}
          maxlength={props.maxlength}
          minlength={props.minlength}
          pattern={props.pattern}
          aria-describedby={props['aria-describedby']}
          aria-invalid={!!props.error}
          onInput={handleInput}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </div>

      <Show when={props.error}>
        <div class={styles['input-error-message']} role="alert">
          {props.error}
        </div>
      </Show>

      <Show when={props.hint && !props.error}>
        <div class={styles['input-hint']}>{props.hint}</div>
      </Show>
    </div>
  );
};

export default Input;
