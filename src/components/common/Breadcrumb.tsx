import { Component, For, JSX } from 'solid-js';
import { A } from '@solidjs/router';
import './Breadcrumb.css';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: JSX.Element;
  disabled?: boolean;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: JSX.Element | string;
  class?: string;
  maxItems?: number;
  showHomeIcon?: boolean;
}

const Breadcrumb: Component<BreadcrumbProps> = props => {
  const separator = () => props.separator || '/';
  const items = () => {
    const allItems = props.items;
    const maxItems = props.maxItems;

    if (!maxItems || allItems.length <= maxItems) {
      return allItems;
    }

    // Show first item, ellipsis, and last few items
    const start = allItems.slice(0, 1);
    const end = allItems.slice(-(maxItems - 2));
    return [...start, { label: '...', disabled: true }, ...end];
  };

  const breadcrumbClasses = () => ['breadcrumb', props.class].filter(Boolean).join(' ');

  return (
    <nav class={breadcrumbClasses()} aria-label="Breadcrumb">
      <ol class="breadcrumb-list">
        <For each={items()}>
          {(item, index) => (
            <li class="breadcrumb-item">
              {item.href && !item.disabled ? (
                <A
                  href={item.href}
                  class="breadcrumb-link"
                  aria-current={index() === items().length - 1 ? 'page' : undefined}
                >
                  {item.icon && <span class="breadcrumb-icon">{item.icon}</span>}
                  <span class="breadcrumb-label">{item.label}</span>
                </A>
              ) : (
                <span
                  class={`breadcrumb-text ${item.disabled ? 'breadcrumb-disabled' : 'breadcrumb-current'}`}
                  aria-current={index() === items().length - 1 ? 'page' : undefined}
                >
                  {item.icon && <span class="breadcrumb-icon">{item.icon}</span>}
                  <span class="breadcrumb-label">{item.label}</span>
                </span>
              )}

              {index() < items().length - 1 && (
                <span class="breadcrumb-separator" aria-hidden="true">
                  {separator()}
                </span>
              )}
            </li>
          )}
        </For>
      </ol>
    </nav>
  );
};

export default Breadcrumb;
