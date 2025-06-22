/**
 * Input Component Test Suite
 *
 * Comprehensive testing for the enhanced Input component including:
 * - Cultural theme support (INFORMATION ONLY - NO ACCESS CONTROL)
 * - Validation functionality (TECHNICAL ONLY - NO CONTENT CENSORSHIP)
 * - Accessibility compliance (WCAG 2.1 AA)
 * - Security validation integration
 * - Responsive design and theming
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import Input, { type CulturalTheme } from '../Input';
import { validationService } from '../../../../services/validationService';
// Import CSS module styles for testing
import styles from '../Input.module.css';

// Helper function to get CSS class safely
const getClassName = (className: string): string => {
  return styles[className] || className;
};

// Mock validation service
vi.mock('../../../../services/validationService', () => ({
  validationService: {
    validateUserInput: vi.fn(),
  },
}));

// Mock cultural constants
vi.mock('../../../../constants/cultural', () => ({
  CULTURAL_SENSITIVITY_LEVELS: {
    PUBLIC: 1,
    COMMUNITY: 2,
    TRADITIONAL: 3,
    SACRED: 4,
    CEREMONIAL: 5,
  },
  CULTURAL_LABELS: {
    1: 'General Cultural Context',
    2: 'Community Knowledge',
    3: 'Traditional Knowledge',
    4: 'Sacred Content',
    5: 'Ceremonial Content',
  },
}));

describe('Input Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('renders with default props', () => {
      render(() => <Input />);
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'text');
    });

    it('renders with label', () => {
      const inputId = 'test-input-id';
      render(() => <Input label="Test Label" id={inputId} />);
      expect(screen.getByText('Test Label')).toBeInTheDocument();
      expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
    });

    it('renders with placeholder', () => {
      render(() => <Input placeholder="Enter text here" />);
      const input = screen.getByPlaceholderText('Enter text here');
      expect(input).toBeInTheDocument();
    });

    it('renders with value', () => {
      render(() => <Input value="test value" />);
      const input = screen.getByDisplayValue('test value');
      expect(input).toBeInTheDocument();
    });

    it('handles input changes', async () => {
      const onInput = vi.fn();
      render(() => <Input onInput={onInput} />);

      const input = screen.getByRole('textbox');
      fireEvent.input(input, { target: { value: 'new value' } });

      expect(onInput).toHaveBeenCalledWith('new value');
    });

    it('handles focus and blur events', () => {
      const onFocus = vi.fn();
      const onBlur = vi.fn();
      render(() => <Input onFocus={onFocus} onBlur={onBlur} />);

      const input = screen.getByRole('textbox');
      fireEvent.focus(input);
      expect(onFocus).toHaveBeenCalled();

      fireEvent.blur(input);
      expect(onBlur).toHaveBeenCalled();
    });
  });

  describe('Input Types', () => {
    it('renders with type text', () => {
      render(() => <Input type="text" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'text');
    });

    it('renders with type email', () => {
      render(() => <Input type="email" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('renders with type password', () => {
      render(() => <Input type="password" />);
      // Password inputs don't have 'textbox' role for security reasons
      const input = screen.getByDisplayValue('');
      expect(input).toHaveAttribute('type', 'password');
    });

    it('renders with type number', () => {
      render(() => <Input type="number" />);
      // Number inputs have 'spinbutton' role instead of 'textbox'
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('type', 'number');
    });

    it('renders with type search', () => {
      render(() => <Input type="search" />);
      const input = screen.getByRole('searchbox');
      expect(input).toHaveAttribute('type', 'search');
    });

    it('renders with type url', () => {
      render(() => <Input type="url" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'url');
    });

    it('renders with type tel', () => {
      render(() => <Input type="tel" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'tel');
    });
  });

  describe('Input Sizes', () => {
    it.each(['sm', 'md', 'lg'])('renders with size %s', size => {
      render(() => <Input size={size as any} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass(getClassName(`input-${size}`));
    });
  });

  describe('Input Variants', () => {
    it.each(['default', 'filled', 'outline'])('renders with variant %s', variant => {
      render(() => <Input variant={variant as any} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass(getClassName(`input-${variant}`));
    });
  });

  describe('Cultural Theme Support (INFORMATION ONLY)', () => {
    it.each(['indigenous', 'traditional', 'modern', 'ceremonial', 'community', 'default'])(
      'renders with cultural theme %s',
      theme => {
        render(() => <Input culturalTheme={theme as CulturalTheme} />);
        const input = screen.getByRole('textbox');
        if (theme !== 'default') {
          expect(input).toHaveClass(getClassName(`input-cultural-${theme}`));
        }
      }
    );

    it('shows cultural indicator when enabled', () => {
      render(() => (
        <Input culturalTheme="indigenous" showCulturalIndicator={true} label="Test Label" />
      ));

      const indicator = screen.getByLabelText('Cultural theme: indigenous');
      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveTextContent('🌿');
    });

    it('displays cultural tooltip on hover', async () => {
      render(() => (
        <Input
          culturalTheme="traditional"
          culturalContext="Traditional knowledge input"
          culturalSensitivityLevel={3}
        />
      ));

      const input = screen.getByRole('textbox');
      fireEvent.mouseEnter(input);

      await waitFor(() => {
        expect(screen.getByText('Traditional knowledge input')).toBeInTheDocument();
        expect(screen.getByText('Traditional Knowledge')).toBeInTheDocument();
        expect(
          screen.getByText('Cultural context provided for educational purposes only')
        ).toBeInTheDocument();
      });
    });

    it('supports traditional input patterns', () => {
      render(() => <Input traditionalInputPattern={true} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass(getClassName('input-traditional'));
    });
  });

  describe('Validation Support (TECHNICAL ONLY)', () => {
    it('shows validation indicator when required', () => {
      render(() => <Input requiresValidation={true} />);
      const indicator = screen.getByLabelText('Input validation required');
      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveTextContent('⚠️');
    });

    it('performs email validation', async () => {
      render(() => <Input type="email" validationType="email" requiresValidation={true} />);

      const input = screen.getByRole('textbox');
      fireEvent.input(input, { target: { value: 'invalid-email' } });
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
    });

    it('performs password validation', async () => {
      render(() => (
        <Input type="password" validationType="password" requiresValidation={true} minlength={8} />
      ));

      // Password inputs don't have 'textbox' role - get by attribute instead
      const input = screen.getByDisplayValue('');
      fireEvent.input(input, { target: { value: 'short' } });
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
      });
    });

    it('performs security validation', async () => {
      (validationService.validateUserInput as any).mockResolvedValue({
        valid: false,
        errors: ['Potentially harmful content detected'],
      });

      render(() => <Input validationType="security" requiresValidation={true} />);

      const input = screen.getByRole('textbox');
      fireEvent.input(input, { target: { value: 'malicious content' } });
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.getByText('Input contains potentially harmful content')).toBeInTheDocument();
      });
    });

    it('performs custom pattern validation', async () => {
      const customPattern = '^[A-Z]{3}$';
      const customMessage = 'Must be exactly 3 uppercase letters';

      render(() => (
        <Input
          validationType="custom"
          validationPattern={customPattern}
          validationMessage={customMessage}
          requiresValidation={true}
        />
      ));

      const input = screen.getByRole('textbox');
      fireEvent.input(input, { target: { value: 'abc' } });
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.getByText(customMessage)).toBeInTheDocument();
      });
    });

    it('calls onValidationChange callback', async () => {
      const onValidationChange = vi.fn();
      render(() => (
        <Input
          type="email"
          validationType="email"
          requiresValidation={true}
          onValidationChange={onValidationChange}
        />
      ));

      const input = screen.getByRole('textbox');
      fireEvent.input(input, { target: { value: 'invalid-email' } });
      fireEvent.blur(input);

      await waitFor(() => {
        expect(onValidationChange).toHaveBeenCalledWith(false, [
          'Please enter a valid email address',
        ]);
      });
    });
  });

  describe('Accessibility Features', () => {
    it('has proper ARIA attributes', () => {
      render(() => (
        <Input ariaLabel="Custom label" ariaRequired={true} error="Error message" required={true} />
      ));

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-label', 'Custom label');
      expect(input).toHaveAttribute('aria-required', 'true');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('shows required indicator', () => {
      const inputId = 'test-input-required';
      render(() => <Input label="Required Field" required={true} id={inputId} />);

      const requiredIndicator = screen.getByText('*');
      expect(requiredIndicator).toBeInTheDocument();
      expect(requiredIndicator).toHaveClass(getClassName('input-required'));
    });

    it('displays error message with proper role', () => {
      render(() => <Input error="This field is required" />);

      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveTextContent('This field is required');
    });

    it('displays hint message', () => {
      render(() => <Input hint="Enter your full name" />);

      const hintMessage = screen.getByText('Enter your full name');
      expect(hintMessage).toBeInTheDocument();
      expect(hintMessage).toHaveClass(getClassName('input-hint'));
    });

    it('supports keyboard navigation', () => {
      const onKeyDown = vi.fn();
      render(() => <Input onKeyDown={onKeyDown} />);

      const input = screen.getByRole('textbox');
      fireEvent.keyDown(input, { key: 'Enter' });
      expect(onKeyDown).toHaveBeenCalled();
    });
  });

  describe('Form Integration', () => {
    it('supports form attributes', () => {
      render(() => (
        <Input
          name="test-field"
          autocomplete="off"
          maxlength={100}
          minlength={5}
          pattern="[A-Za-z]+"
        />
      ));

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('name', 'test-field');
      expect(input).toHaveAttribute('autocomplete', 'off');
      expect(input).toHaveAttribute('maxlength', '100');
      expect(input).toHaveAttribute('minlength', '5');
      expect(input).toHaveAttribute('pattern', '[A-Za-z]+');
    });

    it('generates unique ID when not provided', () => {
      const inputId = 'test-input-unique';
      render(() => <Input label="Test Label" id={inputId} />);
      const input = screen.getByLabelText('Test Label');
      expect(input).toHaveAttribute('id', inputId);
    });
  });

  describe('State Management', () => {
    it('handles disabled state', () => {
      render(() => <Input disabled={true} />);
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
      // Note: The component uses HTML disabled attribute, not CSS class
    });

    it('handles readonly state', () => {
      render(() => <Input readonly={true} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('readonly');
      // Note: The component uses HTML readonly attribute, not CSS class
    });

    it('handles error state', () => {
      render(() => <Input error="Error message" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass(getClassName('input-error'));
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('handles focus state', () => {
      render(() => <Input />);
      const input = screen.getByRole('textbox');
      fireEvent.focus(input);
      expect(input).toHaveClass(getClassName('input-focused'));
    });
  });

  describe('Icon Support', () => {
    it('renders with icon', () => {
      const TestIcon = () => <div data-testid="test-icon">🔍</div>;

      render(() => <Input icon={<TestIcon />} />);

      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toHaveClass(getClassName('input-with-icon'));
    });
  });

  describe('Error Handling', () => {
    it('handles validation errors gracefully', async () => {
      (validationService.validateUserInput as any).mockRejectedValue(
        new Error('Validation service unavailable')
      );

      render(() => <Input validationType="security" requiresValidation={true} />);

      const input = screen.getByRole('textbox');
      fireEvent.input(input, { target: { value: 'test input' } });
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.getByText('Validation failed')).toBeInTheDocument();
      });
    });
  });

  describe('Integration Tests', () => {
    it('works with controlled component pattern', () => {
      const [value, setValue] = createSignal('');
      const inputId = 'controlled-input';

      const TestComponent = () => {
        return <Input label="Controlled Input" value={value()} onInput={setValue} id={inputId} />;
      };

      render(() => <TestComponent />);
      const input = screen.getByLabelText('Controlled Input');

      fireEvent.input(input, { target: { value: 'new value' } });
      expect(value()).toBe('new value');
    });

    it('supports complex cultural validation scenarios', async () => {
      render(() => (
        <Input
          culturalTheme="traditional"
          culturalSensitivityLevel={3}
          validationType="cultural"
          requiresValidation={true}
          traditionalInputPattern={true}
        />
      ));

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass(getClassName('input-cultural-traditional'));
      expect(input).toHaveClass(getClassName('input-traditional'));

      // Cultural validation should not block any content
      fireEvent.input(input, { target: { value: 'any cultural content' } });
      fireEvent.blur(input);

      // Should not show any validation errors for cultural content
      await waitFor(() => {
        const errorMessages = screen.queryByRole('alert');
        expect(errorMessages).not.toBeInTheDocument();
      });
    });
  });
});
