import { render, fireEvent } from '@solidjs/testing-library';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../../i18n/hooks', () => ({
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
}));

vi.mock('../../../../services/validationService', () => ({
  validationService: {
    validateUserInput: vi.fn().mockResolvedValue({ valid: true, sanitized: '' }),
  },
}));

import Input from '../Input';

describe('Input a11y (extended)', () => {
  it('associates label via aria-label or htmlFor', () => {
    const { container } = render(() => <Input placeholder="Name" ariaLabel="Your Name" />);
    const field = container.querySelector('input') as HTMLInputElement;
    expect(field.getAttribute('aria-label')).toBe('Your Name');
  });

  it('updates value with keyboard input', async () => {
    const { container } = render(() => <Input placeholder="Type" />);
    const field = container.querySelector('input') as HTMLInputElement;
    await fireEvent.input(field, { target: { value: 'hello' } });
    expect(field.value).toBe('hello');
  });

  it('reflects aria-invalid when error present', async () => {
    const { container } = render(() => <Input placeholder="Email" ariaInvalid={true} />);
    const field = container.querySelector('input') as HTMLInputElement;
    expect(field.getAttribute('aria-invalid')).toBe('true');
  });
});
