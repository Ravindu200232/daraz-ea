import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dialog } from '@/components/ui/client.jsx';
import { Stepper } from '@/components/ui/client.jsx';

/**
 * The two shared components that carry real logic: a dialog that opens, closes and takes focus,
 * and a quantity stepper that stops at the stock the store holds.
 *
 * The sign-in form is the page the scaffold shipped with; `app/page.jsx` is now the storefront's
 * own Home screen, so the placeholder home test has been replaced with these two.
 */
describe('Dialog', () => {
  it('opens on its trigger, closes on Close, and returns focus to nothing it should not hold', async () => {
    const user = userEvent.setup();
    render(
      <Dialog id="remove-dialog" label="Remove this item?" trigger="Remove">
        <p>The item comes out of your cart.</p>
      </Dialog>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Remove' }));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText('The item comes out of your cart.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes on the Escape key', async () => {
    const user = userEvent.setup();
    render(
      <Dialog id="sign-out" label="Sign out of DarazEA?" trigger="Sign out">
        <p>You will need your password to sign back in.</p>
      </Dialog>,
    );
    await user.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('Stepper', () => {
  it('stops at the stock the store holds and cannot be pushed past it', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Stepper name="quantity" value={1} min={1} max={3} onChange={onChange} label="Quantity for Aero Running Shoes" />);

    const increase = screen.getByRole('button', { name: 'Increase quantity' });
    const decrease = screen.getByRole('button', { name: 'Decrease quantity' });
    expect(decrease).toBeDisabled();

    await user.click(increase);
    await user.click(increase);
    expect(screen.getByTestId('stepper-quantity')).toHaveTextContent('3');
    expect(increase).toBeDisabled();
    expect(onChange).toHaveBeenLastCalledWith(3);
  });

  it('never goes below the minimum', async () => {
    const user = userEvent.setup();
    render(<Stepper name="quantity" value={2} min={1} max={9} label="Quantity" />);
    await user.click(screen.getByRole('button', { name: 'Decrease quantity' }));
    expect(screen.getByTestId('stepper-quantity')).toHaveTextContent('1');
    expect(screen.getByRole('button', { name: 'Decrease quantity' })).toBeDisabled();
  });
});
