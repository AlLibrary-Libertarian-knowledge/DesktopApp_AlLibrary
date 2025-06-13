import { Component, ParentProps, JSX, Show } from 'solid-js';
import styles from './Card.module.css';

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
      styles.card,
      styles[`card-${props.variant || 'default'}`],
      styles[`card-padding-${props.padding || 'md'}`],
      props.hoverable && styles['card-hoverable'],
      props.clickable && styles['card-clickable'],
      props.loading && styles['card-loading'],
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
        <div class={styles['card-loading-overlay']}>
          <div class={styles['card-spinner']} />
        </div>
      </Show>

      <Show when={props.header}>
        <div class={styles['card-header']}>{props.header}</div>
      </Show>

      <Show when={props.title || props.subtitle}>
        <div class={styles['card-title-section']}>
          <Show when={props.title}>
            <h3 class={styles['card-title']}>{props.title}</h3>
          </Show>
          <Show when={props.subtitle}>
            <p class={styles['card-subtitle']}>{props.subtitle}</p>
          </Show>
        </div>
      </Show>

      <Show when={props.children}>
        <div class={styles['card-content']}>{props.children}</div>
      </Show>

      <Show when={props.footer}>
        <div class={styles['card-footer']}>{props.footer}</div>
      </Show>
    </div>
  );
};

export default Card;
