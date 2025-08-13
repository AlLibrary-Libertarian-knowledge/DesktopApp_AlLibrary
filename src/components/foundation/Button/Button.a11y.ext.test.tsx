import { render, screen, fireEvent } from '@solidjs/testing-library';
import { describe, it, expect, vi } from 'vitest';

// Mock i18n hooks used inside Button to avoid heavy wiring during tests
vi.mock('../../../i18n/hooks', () => ({
  useTranslation: () => ({
    t: (k: string) => k,
    tc: (_k: string, _c: number) => '',
    te: () => true,
    ready: () => true,
    isLoading: () => false,
    error: () => null,
    locale: () => 'en',
    changeLanguage: async () => {},
  }),
  useCulturalTranslation: () => ({
    getSensitivityLabel: () => 'Traditional Knowledge',
    getContextInfo: () => 'Context',
    getEducationalInfo: () => 'Education',
    isInformationOnly: () => true,
    hasAccessRestrictions: () => false,
    supportsMultiplePerspectives: () => true,
  }),
}));

import Button from './Button';

describe('Button a11y (extended)', () => {
  it('supports keyboard activation (Enter/Space)', async () => {
    const onClick = vi.fn();
    const { container } = render(() => <Button onClick={onClick}>Click</Button>);
    const btn = container.querySelector('button') as HTMLButtonElement;
    await fireEvent.keyDown(btn, { key: 'Enter' });
    await fireEvent.keyDown(btn, { key: ' ' });
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('exposes aria-label when icon-only', () => {
    const onClick = vi.fn();
    const { container } = render(() => (
      <Button onClick={onClick} ariaLabel="Search">
        {/* icon-only */}
      </Button>
    ));
    const btn = container.querySelector('button') as HTMLButtonElement;
    expect(btn.getAttribute('aria-label')).toBe('Search');
  });

  it('can receive focus', async () => {
    const { container } = render(() => <Button>Focusable</Button>);
    const btn = container.querySelector('button') as HTMLButtonElement;
    btn.focus();
    expect(btn).toHaveFocus();
  });
});
