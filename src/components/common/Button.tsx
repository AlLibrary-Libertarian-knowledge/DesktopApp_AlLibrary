import { Component, ParentProps } from 'solid-js';
import './Button.css';

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
      'btn',
      `btn-${props.variant || 'primary'}`,
      `btn-${props.size || 'md'}`,
      props.loading && 'btn-loading',
      props.disabled && 'btn-disabled',
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
      {props.loading && <span class="btn-spinner" />}
      <span class="btn-content">{props.children}</span>
    </button>
  );
};

export default Button;
