import { Component, ParentProps, JSX, Show } from 'solid-js';
import './Card.css';

export interface CardProps extends ParentProps {
  variant?: 'default' | 'outlined' | 'elevated' | 'filled';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  header?: JSX.Element;
  footer?: JSX.Element;
  title?: string;
  subtitle?: string;
  hoverable?: boolean;
  clickable?: boolean;
  loading?: boolean;
  class?: string;
  onClick?: (e: MouseEvent) => void;
}

const Card: Component<CardProps> = props => {
  const classes = () =>
    [
      'card',
      `card-${props.variant || 'default'}`,
      `card-padding-${props.padding || 'md'}`,
      props.hoverable && 'card-hoverable',
      props.clickable && 'card-clickable',
      props.loading && 'card-loading',
      props.class,
    ]
      .filter(Boolean)
      .join(' ');

  const handleClick = (e: MouseEvent) => {
    if (props.clickable && props.onClick) {
      props.onClick(e);
    }
  };

  return (
    <div
      class={classes()}
      onClick={handleClick}
      role={props.clickable ? 'button' : undefined}
      tabindex={props.clickable ? 0 : undefined}
    >
      <Show when={props.loading}>
        <div class="card-loading-overlay">
          <div class="card-spinner" />
        </div>
      </Show>

      <Show when={props.header}>
        <div class="card-header">{props.header}</div>
      </Show>

      <Show when={props.title || props.subtitle}>
        <div class="card-title-section">
          <Show when={props.title}>
            <h3 class="card-title">{props.title}</h3>
          </Show>
          <Show when={props.subtitle}>
            <p class="card-subtitle">{props.subtitle}</p>
          </Show>
        </div>
      </Show>

      <Show when={props.children}>
        <div class="card-content">{props.children}</div>
      </Show>

      <Show when={props.footer}>
        <div class="card-footer">{props.footer}</div>
      </Show>
    </div>
  );
};

export default Card;
