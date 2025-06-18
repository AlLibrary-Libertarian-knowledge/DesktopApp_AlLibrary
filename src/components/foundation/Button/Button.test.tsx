import { render, screen, fireEvent, waitFor } from '@solidjs/testing-library';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createSignal } from 'solid-js';
import Button from './Button';
import styles from './Button.module.css';

describe('Button Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('renders with default props', () => {
      render(() => <Button>Click me</Button>);
      const button = screen.getByRole('button', { name: 'Click me' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass(styles.btn, styles['btn-primary'], styles['btn-md']);
    });

    it('renders with custom variant', () => {
      render(() => <Button variant="secondary">Secondary Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass(styles['btn-secondary']);
    });

    it('renders with custom size', () => {
      render(() => <Button size="lg">Large Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass(styles['btn-lg']);
    });

    it('renders with custom color', () => {
      render(() => <Button color="purple">Purple Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass(styles['btn-color-purple']);
    });

    it('handles click events', () => {
      const handleClick = vi.fn();
      render(() => <Button onClick={handleClick}>Click me</Button>);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('handles disabled state', () => {
      const handleClick = vi.fn();
      render(() => (
        <Button disabled onClick={handleClick}>
          Disabled Button
        </Button>
      ));

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass(styles['btn-disabled']);

      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('handles loading state', () => {
      render(() => <Button loading>Loading Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass(styles['btn-loading']);
      expect(button).toHaveAttribute('aria-busy', 'true');

      const spinner = button.querySelector(`.${styles['btn-spinner']}`);
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Cultural Themes', () => {
    it('renders with indigenous cultural theme', () => {
      render(() => (
        <Button culturalTheme="indigenous" showCulturalIndicator>
          Indigenous Knowledge
        </Button>
      ));

      const button = screen.getByRole('button');
      expect(button).toHaveClass(styles['btn-cultural-indigenous']);

      const indicator = button.querySelector(`.${styles['btn-cultural-indicator']}`);
      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveTextContent('🌿');
    });

    it('renders with traditional cultural theme', () => {
      render(() => <Button culturalTheme="traditional">Traditional Knowledge</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass(styles['btn-cultural-traditional']);
    });

    it('renders with ceremonial cultural theme', () => {
      render(() => <Button culturalTheme="ceremonial">Ceremonial Content</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass(styles['btn-cultural-ceremonial']);
    });

    it('renders with community cultural theme', () => {
      render(() => <Button culturalTheme="community">Community Knowledge</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass(styles['btn-cultural-community']);
    });

    it('renders with modern cultural theme', () => {
      render(() => <Button culturalTheme="modern">Modern Knowledge</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass(styles['btn-cultural-modern']);
    });

    it('shows cultural tooltip on hover', async () => {
      render(() => (
        <Button
          culturalTheme="indigenous"
          culturalContext="Traditional knowledge sharing"
          culturalSensitivityLevel={3}
        >
          Share Knowledge
        </Button>
      ));

      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);

      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).toBeInTheDocument();
        expect(tooltip).toHaveTextContent('Traditional knowledge sharing');
        expect(tooltip).toHaveTextContent('Traditional Knowledge');
        expect(tooltip).toHaveTextContent(
          'Cultural context provided for educational purposes only'
        );
      });
    });

    it('hides cultural tooltip on mouse leave', async () => {
      render(() => (
        <Button culturalTheme="indigenous" culturalContext="Traditional knowledge sharing">
          Share Knowledge
        </Button>
      ));

      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });

      fireEvent.mouseLeave(button);

      await waitFor(() => {
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('supports custom aria-label', () => {
      render(() => <Button ariaLabel="Custom accessible label">Button</Button>);

      const button = screen.getByRole('button', { name: 'Custom accessible label' });
      expect(button).toBeInTheDocument();
    });

    it('supports aria-describedby', () => {
      render(() => (
        <div>
          <div id="description">Button description</div>
          <Button ariaDescribedBy="description">Button</Button>
        </div>
      ));

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-describedby', 'description');
    });

    it('supports aria-expanded', () => {
      render(() => <Button ariaExpanded={true}>Expandable Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('supports aria-pressed', () => {
      render(() => <Button ariaPressed={true}>Toggle Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-pressed', 'true');
    });

    it('supports aria-controls', () => {
      render(() => <Button ariaControls="controlled-element">Control Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-controls', 'controlled-element');
    });

    it('supports custom role', () => {
      render(() => <Button role="menuitem">Menu Item</Button>);

      const button = screen.getByRole('menuitem');
      expect(button).toBeInTheDocument();
    });

    it('handles keyboard navigation', () => {
      const onKeyDown = vi.fn();
      render(() => <Button onKeyDown={onKeyDown}>Keyboard Button</Button>);

      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: 'Enter' });

      expect(onKeyDown).toHaveBeenCalled();
    });

    it('supports focus and blur events', () => {
      const onFocus = vi.fn();
      const onBlur = vi.fn();
      render(() => (
        <Button onFocus={onFocus} onBlur={onBlur}>
          Focus Button
        </Button>
      ));

      const button = screen.getByRole('button');
      fireEvent.focus(button);
      expect(onFocus).toHaveBeenCalled();

      fireEvent.blur(button);
      expect(onBlur).toHaveBeenCalled();
    });

    it('shows focus styles', () => {
      render(() => <Button>Focus Button</Button>);
      const button = screen.getByRole('button');

      fireEvent.focus(button);

      expect(button).toHaveClass(styles['btn-focused']);
    });
  });

  describe('Security Validation', () => {
    it('shows security indicator when validation required', () => {
      render(() => <Button requiresValidation={true}>Validation Button</Button>);

      const button = screen.getByRole('button');
      const indicator = button.querySelector(`.${styles['btn-security-indicator']}`);
      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveTextContent('⚠️');
    });

    it('shows validation success indicator', async () => {
      render(() => (
        <Button requiresValidation={true} securityLevel="high">
          Secure Button
        </Button>
      ));

      const button = screen.getByRole('button');

      await waitFor(() => {
        const indicator = button.querySelector(`.${styles['btn-security-indicator']}`);
        expect(indicator).toHaveTextContent('✅');
      });
    });

    it('prevents click when validation fails', () => {
      const handleClick = vi.fn();
      render(() => (
        <Button requiresValidation={true} securityLevel="critical" onClick={handleClick}>
          Critical Button
        </Button>
      ));

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(handleClick).not.toHaveBeenCalled();
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveTextContent('Please complete security validation');
    });

    it('shows validation error message', async () => {
      render(() => (
        <Button
          requiresValidation={true}
          securityLevel="critical"
          validationMessage="Please complete security validation"
        >
          Critical Button
        </Button>
      ));

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        const errorMessage = screen.getByRole('alert');
        expect(errorMessage).toHaveTextContent('Please complete security validation');
      });
    });

    it('applies unvalidated styling', () => {
      render(() => <Button requiresValidation={true}>Unvalidated Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass(styles['btn-unvalidated']);
    });

    it('applies error styling when validation fails', async () => {
      render(() => (
        <Button requiresValidation={true} securityLevel="critical">
          Error Button
        </Button>
      ));

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(button).toHaveClass(styles['btn-error']);
      });
    });
  });

  describe('Form Integration', () => {
    it('supports form attributes', () => {
      render(() => (
        <Button type="submit" name="submit-btn" value="submit-value">
          Submit Button
        </Button>
      ));

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
      expect(button).toHaveAttribute('name', 'submit-btn');
      expect(button).toHaveAttribute('value', 'submit-value');
    });

    it('handles submit type correctly', () => {
      render(() => <Button type="submit">Submit Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('handles reset type correctly', () => {
      render(() => <Button type="reset">Reset Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'reset');
    });
  });

  describe('Combined Features', () => {
    it('combines cultural theme with accessibility', () => {
      render(() => (
        <Button
          culturalTheme="indigenous"
          showCulturalIndicator={true}
          ariaLabel="Share indigenous knowledge"
        >
          Indigenous Button
        </Button>
      ));

      const button = screen.getByRole('button', { name: 'Share indigenous knowledge' });
      expect(button).toHaveClass(styles['btn-cultural-indigenous']);

      const indicator = button.querySelector(`.${styles['btn-cultural-indicator']}`);
      expect(indicator).toBeInTheDocument();
    });

    it('combines security validation with cultural theme', () => {
      render(() => (
        <Button culturalTheme="traditional" requiresValidation={true} showCulturalIndicator={true}>
          Traditional Secure Button
        </Button>
      ));

      const button = screen.getByRole('button');
      expect(button).toHaveClass(styles['btn-cultural-traditional'], styles['btn-unvalidated']);

      const securityIndicator = button.querySelector(`.${styles['btn-security-indicator']}`);
      expect(securityIndicator).toBeInTheDocument();

      const culturalIndicator = button.querySelector(`.${styles['btn-cultural-indicator']}`);
      expect(culturalIndicator).toBeInTheDocument();
    });

    it('combines all features together', () => {
      render(() => (
        <Button
          variant="primary"
          size="lg"
          color="purple"
          culturalTheme="ceremonial"
          requiresValidation={true}
          ariaLabel="Complete ceremonial button"
          disabled={false}
        >
          Complete Button
        </Button>
      ));

      const button = screen.getByRole('button', { name: 'Complete ceremonial button' });
      expect(button).toHaveClass(
        styles.btn,
        styles['btn-primary'],
        styles['btn-lg'],
        styles['btn-color-purple'],
        styles['btn-cultural-ceremonial'],
        styles['btn-unvalidated']
      );
    });
  });

  describe('Edge Cases', () => {
    it('handles empty children', () => {
      render(() => <Button />);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('');
    });

    it('handles undefined props gracefully', () => {
      render(() => <Button>{undefined}</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass(styles.btn, styles['btn-primary'], styles['btn-md']);
    });

    it('handles rapid state changes', () => {
      const TestComponent = () => {
        const [isLoading, setIsLoading] = createSignal(false);
        const [isDisabled, setIsDisabled] = createSignal(false);

        const handleRapidChanges = () => {
          setIsLoading(true);
          setIsDisabled(true);
          setTimeout(() => {
            setIsLoading(false);
            setIsDisabled(false);
          }, 10);
        };

        return (
          <div>
            <Button loading={isLoading()} disabled={isDisabled()}>
              Rapid Change Button
            </Button>
            <button onClick={handleRapidChanges}>Trigger Changes</button>
          </div>
        );
      };

      render(() => <TestComponent />);

      const button = screen.getByRole('button', { name: 'Rapid Change Button' });
      const triggerButton = screen.getByRole('button', { name: 'Trigger Changes' });

      fireEvent.click(triggerButton);

      // Should not crash and should handle state properly
      expect(button).toBeInTheDocument();
    });
  });
});
