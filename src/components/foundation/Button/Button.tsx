import { Component, ParentProps } from 'solid-js';
import styles from './Button.module.css';

export interface ButtonProps extends ParentProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  class?: string;
  onClick?: (e: MouseEvent) => void;
}

const Button: Component<ButtonProps> = props => {
  const classes = () =>
    [
      styles.btn,
      styles[`btn-${props.variant || 'primary'}`],
      styles[`btn-${props.size || 'md'}`],
      props.loading && styles['btn-loading'],
      props.disabled && styles['btn-disabled'],
      props.class,
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <button
      type={props.type || 'button'}
      class={classes()}
      disabled={props.disabled || props.loading}
      onClick={props.onClick}
    >
      {props.loading && <span class={styles['btn-spinner']} />}
      <span class={styles['btn-content']}>{props.children}</span>
    </button>
  );
};

export default Button;
