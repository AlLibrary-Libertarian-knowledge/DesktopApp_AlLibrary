import { type Component, splitProps } from 'solid-js';
import styles from './Textarea.module.css';

export interface TextareaProps {
  value?: string;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  required?: boolean;
  class?: string;
  id?: string;
  name?: string;
  'aria-label'?: string;
  'data-testid'?: string;
  onInput?: (value: string) => void;
  onChange?: (value: string) => void;
}

export const Textarea: Component<TextareaProps> = props => {
  const [local, rest] = splitProps(props, [
    'value',
    'placeholder',
    'rows',
    'disabled',
    'required',
    'class',
    'id',
    'name',
    'onInput',
    'onChange',
  ]);

  return (
    <textarea
      {...rest}
      id={local.id}
      name={local.name}
      class={`${styles.textarea} ${local.class ?? ''}`}
      rows={local.rows ?? 4}
      value={local.value ?? ''}
      placeholder={local.placeholder}
      disabled={local.disabled}
      required={local.required}
      onInput={e => {
        const v = e.currentTarget.value;
        local.onInput?.(v);
        local.onChange?.(v);
      }}
    />
  );
};

export default Textarea;
