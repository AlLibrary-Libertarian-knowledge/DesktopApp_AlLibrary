import { render, screen, fireEvent, waitFor } from '@solidjs/testing-library';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import Button from './Button';

describe('Button Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('renders with default props', () => {
      render(() => <Button>Click me</Button>);
      const button = screen.getByRole('button', { name: 'Click me' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('btn', 'btn-primary', 'btn-md');
    });

    it('renders with custom variant', () => {
      render(() => <Button variant="secondary">Secondary Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-secondary');
    });

    it('renders with custom size', () => {
      render(() => <Button size="lg">Large Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-lg');
    });

    it('renders with custom color', () => {
      render(() => <Button color="purple">Purple Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-color-purple');
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
      expect(button).toHaveClass('btn-disabled');

      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('handles loading state', () => {
      render(() => <Button loading>Loading Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('btn-loading');
      expect(button).toHaveAttribute('aria-busy', 'true');

      const spinner = button.querySelector('.btn-spinner');
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
      expect(button).toHaveClass('btn-cultural-indigenous');

      const indicator = button.querySelector('.btn-cultural-indicator');
      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveTextContent('🌿');
    });

    it('renders with traditional cultural theme', () => {
      render(() => <Button culturalTheme="traditional">Traditional Knowledge</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-cultural-traditional');
    });

    it('renders with ceremonial cultural theme', () => {
      render(() => <Button culturalTheme="ceremonial">Ceremonial Content</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-cultural-ceremonial');
    });

    it('renders with community cultural theme', () => {
      render(() => <Button culturalTheme="community">Community Knowledge</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-cultural-community');
    });

    it('renders with modern cultural theme', () => {
      render(() => <Button culturalTheme="modern">Modern Knowledge</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-cultural-modern');
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
      const handleClick = vi.fn();
      render(() => <Button onClick={handleClick}>Keyboard Button</Button>);

      const button = screen.getByRole('button');

      // Test Enter key
      fireEvent.keyDown(button, { key: 'Enter' });
      expect(handleClick).toHaveBeenCalledTimes(1);

      // Test Space key
      fireEvent.keyDown(button, { key: ' ' });
      expect(handleClick).toHaveBeenCalledTimes(2);
    });

    it('supports focus and blur events', () => {
      const handleFocus = vi.fn();
      const handleBlur = vi.fn();

      render(() => (
        <Button onFocus={handleFocus} onBlur={handleBlur}>
          Focus Button
        </Button>
      ));

      const button = screen.getByRole('button');

      fireEvent.focus(button);
      expect(handleFocus).toHaveBeenCalledTimes(1);

      fireEvent.blur(button);
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('shows focus styles', () => {
      render(() => <Button>Focusable Button</Button>);

      const button = screen.getByRole('button');
      fireEvent.focus(button);

      expect(button).toHaveClass('btn-focused');
    });
  });

  describe('Security Validation', () => {
    it('shows security indicator when validation required', () => {
      render(() => (
        <Button requiresValidation securityLevel="high">
          Secure Button
        </Button>
      ));

      const button = screen.getByRole('button');
      const indicator = button.querySelector('.btn-security-indicator');
      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveTextContent('⚠️');
    });

    it('shows validation success indicator', async () => {
      render(() => (
        <Button requiresValidation securityLevel="high">
          Secure Button
        </Button>
      ));

      const button = screen.getByRole('button');

      // Simulate successful validation
      await waitFor(() => {
        const indicator = button.querySelector('.btn-security-indicator');
        expect(indicator).toHaveTextContent('✅');
      });
    });

    it('prevents click when validation fails', () => {
      const handleClick = vi.fn();
      render(() => (
        <Button requiresValidation securityLevel="high" onClick={handleClick}>
          Secure Button
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
          requiresValidation
          securityLevel="critical"
          validationMessage="Custom validation error"
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
      render(() => (
        <Button requiresValidation securityLevel="medium">
          Unvalidated Button
        </Button>
      ));

      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-unvalidated');
    });

    it('applies error styling when validation fails', async () => {
      render(() => (
        <Button requiresValidation securityLevel="high">
          Error Button
        </Button>
      ));

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(button).toHaveClass('btn-error');
      });
    });
  });

  describe('Form Integration', () => {
    it('supports form attributes', () => {
      render(() => (
        <Button type="submit" name="submit-btn" value="submit-value" form="test-form">
          Submit
        </Button>
      ));

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
      expect(button).toHaveAttribute('name', 'submit-btn');
      expect(button).toHaveAttribute('value', 'submit-value');
      expect(button).toHaveAttribute('form', 'test-form');
    });

    it('handles submit type correctly', () => {
      render(() => <Button type="submit">Submit Form</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('handles reset type correctly', () => {
      render(() => <Button type="reset">Reset Form</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'reset');
    });
  });

  describe('Combined Features', () => {
    it('combines cultural theme with accessibility', () => {
      render(() => (
        <Button
          culturalTheme="indigenous"
          showCulturalIndicator
          ariaLabel="Share indigenous knowledge"
          culturalContext="Traditional knowledge sharing"
        >
          Share Knowledge
        </Button>
      ));

      const button = screen.getByRole('button', { name: 'Share indigenous knowledge' });
      expect(button).toHaveClass('btn-cultural-indigenous');

      const indicator = button.querySelector('.btn-cultural-indicator');
      expect(indicator).toBeInTheDocument();
    });

    it('combines security validation with cultural theme', () => {
      render(() => (
        <Button
          culturalTheme="traditional"
          requiresValidation
          securityLevel="high"
          culturalContext="Traditional knowledge validation"
        >
          Secure Traditional Button
        </Button>
      ));

      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-cultural-traditional', 'btn-unvalidated');

      const securityIndicator = button.querySelector('.btn-security-indicator');
      expect(securityIndicator).toBeInTheDocument();
    });

    it('combines all features together', () => {
      render(() => (
        <Button
          variant="primary"
          size="lg"
          color="purple"
          culturalTheme="ceremonial"
          showCulturalIndicator
          requiresValidation
          securityLevel="critical"
          ariaLabel="Complete ceremonial button"
          culturalContext="Ceremonial knowledge sharing"
          culturalSensitivityLevel={5}
        >
          Complete Button
        </Button>
      ));

      const button = screen.getByRole('button', { name: 'Complete ceremonial button' });
      expect(button).toHaveClass(
        'btn',
        'btn-primary',
        'btn-lg',
        'btn-color-purple',
        'btn-cultural-ceremonial',
        'btn-unvalidated'
      );

      const culturalIndicator = button.querySelector('.btn-cultural-indicator');
      const securityIndicator = button.querySelector('.btn-security-indicator');

      expect(culturalIndicator).toBeInTheDocument();
      expect(securityIndicator).toBeInTheDocument();
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
      render(() => (
        <Button variant={undefined} size={undefined} color={undefined} culturalTheme={undefined}>
          Undefined Props
        </Button>
      ));

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('btn', 'btn-primary', 'btn-md');
    });

    it('handles rapid state changes', async () => {
      render(() => (
        <Button
          requiresValidation
          securityLevel="high"
          culturalTheme="indigenous"
          culturalContext="Test context"
        >
          Rapid Changes
        </Button>
      ));

      const button = screen.getByRole('button');

      // Rapidly trigger multiple events
      fireEvent.mouseEnter(button);
      fireEvent.click(button);
      fireEvent.mouseLeave(button);
      fireEvent.focus(button);
      fireEvent.blur(button);

      // Should not crash and should handle state properly
      expect(button).toBeInTheDocument();
    });
  });
});
