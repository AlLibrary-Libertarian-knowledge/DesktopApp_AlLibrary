import { render, screen, fireEvent } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { Modal } from './Modal';

const Wrapper = (props: any) => {
  const [open, setOpen] = createSignal(true);
  return (
    <Modal
      isOpen={open()}
      onClose={() => setOpen(false)}
      title="Test Modal"
      data-testid="modal"
    >
      <div>content</div>
    </Modal>
  );
};

describe('Modal (a11y basics)', () => {
  it('renders with role dialog and aria-modal', () => {
    render(() => <Wrapper />);
    const dlg = screen.getByRole('dialog');
    expect(dlg).toBeInTheDocument();
    expect(dlg).toHaveAttribute('aria-modal', 'true');
    expect(dlg).toHaveAttribute('aria-labelledby', 'modal-title');
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
  });

  it('closes on ESC key', async () => {
    render(() => <Wrapper />);
    const dlg = screen.getByRole('dialog');
    await fireEvent.keyDown(document, { key: 'Escape' });
    expect(dlg).not.toBeInTheDocument();
  });

  it('closes on backdrop click', async () => {
    // reopen
    render(() => <Wrapper />);
    const dlg = screen.getByRole('dialog');
    await fireEvent.click(dlg);
    // Backdrop click is on the overlay; since role=dialog is on overlay, clicking it should close
    expect(dlg).not.toBeInTheDocument();
  });
});

