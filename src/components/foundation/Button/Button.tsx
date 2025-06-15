import { Component, ParentProps } from 'solid-js';
import styles from './Button.module.css';

export interface ButtonProps extends ParentProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'futuristic';
  size?: 'sm' | 'md' | 'lg';
  color?: 'purple' | 'blue' | 'green' | 'red' | 'orange' | 'default';
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  class?: string;
  title?: string;
  onClick?: (e: MouseEvent) => void;
}

const Button: Component<ButtonProps> = props => {
  const classes = () =>
    [
      styles.btn,
      styles[`btn-${props.variant || 'primary'}`],
      styles[`btn-${props.size || 'md'}`],
      props.color && styles[`btn-color-${props.color}`],
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
      title={props.title}
      onClick={props.onClick}
    >
      {props.loading && <span class={styles['btn-spinner']} />}
      <span class={styles['btn-content']}>{props.children}</span>
    </button>
  );
};

export default Button;
