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
import { render, screen, fireEvent, waitFor } from '@testing-library/solid-js';
import { createSignal } from 'solid-js';
import Input, { type InputProps, type CulturalTheme, type InputValidationType } from '../Input';
import { validationService } from '../../../../services/validationService';

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
      render(() => <Input label="Test Label" />);
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
    it.each(['text', 'email', 'password', 'number', 'search', 'url', 'tel'])(
      'renders with type %s',
      type => {
        render(() => <Input type={type as any} />);
        const input = screen.getByRole(type === 'search' ? 'searchbox' : 'textbox');
        expect(input).toHaveAttribute('type', type);
      }
    );
  });

  describe('Input Sizes', () => {
    it.each(['sm', 'md', 'lg'])('renders with size %s', size => {
      render(() => <Input size={size as any} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass(`input-${size}`);
    });
  });

  describe('Input Variants', () => {
    it.each(['default', 'filled', 'outline'])('renders with variant %s', variant => {
      render(() => <Input variant={variant as any} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass(`input-${variant}`);
    });
  });

  describe('Cultural Theme Support (INFORMATION ONLY)', () => {
    it.each(['indigenous', 'traditional', 'modern', 'ceremonial', 'community', 'default'])(
      'renders with cultural theme %s',
      theme => {
        render(() => <Input culturalTheme={theme as CulturalTheme} />);
        const input = screen.getByRole('textbox');
        if (theme !== 'default') {
          expect(input).toHaveClass(`input-cultural-${theme}`);
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
      expect(input).toHaveClass('input-traditional');
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

      const input = screen.getByRole('textbox');
      fireEvent.input(input, { target: { value: 'short' } });
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
      });
    });

    it('performs security validation', async () => {
      const mockValidationResult = {
        valid: false,
        error: 'Security threat detected',
        securityLevel: 'BLOCKED' as const,
        validatedAt: new Date(),
        validationId: 'test-id',
      };

      (validationService.validateUserInput as any).mockResolvedValue(mockValidationResult);

      render(() => <Input validationType="security" requiresValidation={true} />);

      const input = screen.getByRole('textbox');
      fireEvent.input(input, { target: { value: 'suspicious content' } });

      await waitFor(() => {
        expect(validationService.validateUserInput).toHaveBeenCalledWith('suspicious content', {
          userId: 'current-user',
          sessionId: 'current-session',
          inputType: 'text',
          source: 'user_input',
        });
      });
    });

    it('performs custom pattern validation', async () => {
      render(() => (
        <Input
          validationType="custom"
          validationPattern="^[A-Z]{2}\\d{4}$"
          validationMessage="Must be 2 letters followed by 4 digits"
          requiresValidation={true}
        />
      ));

      const input = screen.getByRole('textbox');
      fireEvent.input(input, { target: { value: 'invalid' } });
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.getByText('Must be 2 letters followed by 4 digits')).toBeInTheDocument();
      });
    });

    it('calls onValidationChange callback', async () => {
      const onValidationChange = vi.fn();
      render(() => (
        <Input
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
        <Input
          label="Test Input"
          ariaLabel="Custom aria label"
          ariaDescribedBy="description-id"
          ariaRequired={true}
          role="searchbox"
        />
      ));

      const input = screen.getByRole('searchbox');
      expect(input).toHaveAttribute('aria-label', 'Custom aria label');
      expect(input).toHaveAttribute('aria-describedby', 'description-id');
      expect(input).toHaveAttribute('aria-required', 'true');
    });

    it('shows required indicator', () => {
      render(() => <Input label="Required Field" required={true} />);
      const requiredIndicator = screen.getByText('*');
      expect(requiredIndicator).toBeInTheDocument();
      expect(requiredIndicator).toHaveClass('input-required');
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
      expect(hintMessage).toHaveClass('input-hint');
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
          name="username"
          id="user-input"
          autocomplete="username"
          maxlength={50}
          minlength={3}
          pattern="[A-Za-z0-9]+"
        />
      ));

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('name', 'username');
      expect(input).toHaveAttribute('id', 'user-input');
      expect(input).toHaveAttribute('autocomplete', 'username');
      expect(input).toHaveAttribute('maxlength', '50');
      expect(input).toHaveAttribute('minlength', '3');
      expect(input).toHaveAttribute('pattern', '[A-Za-z0-9]+');
    });

    it('generates unique ID when not provided', () => {
      render(() => <Input label="Test Label" />);
      const input = screen.getByLabelText('Test Label');
      expect(input).toHaveAttribute('id');
      expect(input.getAttribute('id')).toMatch(/^input-/);
    });
  });

  describe('State Management', () => {
    it('handles disabled state', () => {
      render(() => <Input disabled={true} />);
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
      expect(input).toHaveClass('input-disabled');
    });

    it('handles readonly state', () => {
      render(() => <Input readonly={true} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('readonly');
      expect(input).toHaveClass('input-readonly');
    });

    it('handles error state', () => {
      render(() => <Input error="Error message" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('input-error');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('handles focus state', () => {
      render(() => <Input />);
      const input = screen.getByRole('textbox');
      fireEvent.focus(input);
      expect(input).toHaveClass('input-focused');
    });
  });

  describe('Icon Support', () => {
    it('renders with icon', () => {
      const icon = <span data-testid="test-icon">🔍</span>;
      render(() => <Input icon={icon} />);

      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toHaveClass('input-with-icon');
    });
  });

  describe('Error Handling', () => {
    it('handles validation errors gracefully', async () => {
      (validationService.validateUserInput as any).mockRejectedValue(
        new Error('Validation failed')
      );

      render(() => <Input validationType="security" requiresValidation={true} />);

      const input = screen.getByRole('textbox');
      fireEvent.input(input, { target: { value: 'test' } });

      await waitFor(() => {
        expect(screen.getByText('Validation failed')).toBeInTheDocument();
      });
    });
  });

  describe('Integration Tests', () => {
    it('works with controlled component pattern', () => {
      const TestComponent = () => {
        const [value, setValue] = createSignal('');
        return <Input value={value()} onInput={setValue} label="Controlled Input" />;
      };

      render(() => <TestComponent />);
      const input = screen.getByLabelText('Controlled Input');

      fireEvent.input(input, { target: { value: 'new value' } });
      expect(input).toHaveValue('new value');
    });

    it('supports complex cultural validation scenarios', async () => {
      const onValidationChange = vi.fn();
      render(() => (
        <Input
          culturalTheme="sacred"
          culturalContext="Sacred knowledge input"
          culturalSensitivityLevel={4}
          validationType="cultural"
          requiresValidation={true}
          onValidationChange={onValidationChange}
        />
      ));

      const input = screen.getByRole('textbox');
      fireEvent.input(input, { target: { value: 'sacred content' } });
      fireEvent.blur(input);

      // Cultural validation should provide information only, never block
      await waitFor(() => {
        expect(onValidationChange).toHaveBeenCalledWith(true, []);
      });
    });
  });
});
