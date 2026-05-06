# TopCard Component

A reusable header card component that follows SOLID architecture principles and provides a standardized way to display page headers with customizable content.

## Features

- **Height Constraint**: Never exceeds 40% of screen height
- **Two-Column Layout**: Left column for title/subtitle, right column for custom content
- **Responsive Design**: Adapts to different screen sizes with mobile-first approach
- **Customizable Styling**: Support for custom colors and CSS classes
- **Accessibility**: Full WCAG 2.1 AA compliance with proper ARIA labels
- **Interactive Support**: Optional click handlers with keyboard navigation
- **Anti-Censorship Compliant**: No content filtering, educational information only

## Usage

### Basic Usage

```tsx
import { TopCard } from '../../components/composite';

<TopCard
  title="Page Title"
  subtitle="Optional subtitle description"
  rightContent={<div>Your custom content here</div>}
/>;
```

### With Document Status (Document Management Example)

```tsx
import { TopCard } from '../../components/composite';
import { DocumentStatus } from '../../components/domain';

<TopCard
  title="Document Management"
  subtitle="Upload, organize, and manage your cultural heritage documents"
  rightContent={
    <DocumentStatus
      stats={{
        totalDocuments: 150,
        totalSize: 2547892,
        culturalContexts: 23,
        recentUploads: 5,
      }}
    />
  }
  aria-label="Document Management Dashboard"
/>;
```

### Custom Colors

```tsx
<TopCard
  title="Cultural Heritage"
  subtitle="Preserving traditional knowledge"
  rightContent={<YourContent />}
  gradientColors={{
    primary: 'rgba(139, 92, 246, 0.95)',
    secondary: 'rgba(79, 70, 229, 0.9)',
  }}
/>
```

### Interactive Card

```tsx
<TopCard
  title="Network Status"
  subtitle="P2P connectivity information"
  rightContent={<NetworkInfo />}
  onClick={() => console.log('Card clicked!')}
  aria-label="Network status dashboard - click to view details"
/>
```

## Props

| Prop             | Type                                   | Required | Description                                          |
| ---------------- | -------------------------------------- | -------- | ---------------------------------------------------- |
| `title`          | `string`                               | ✅       | Main title displayed in left column                  |
| `subtitle`       | `string`                               | ❌       | Optional subtitle below the title                    |
| `rightContent`   | `JSX.Element`                          | ✅       | Custom content for right column                      |
| `class`          | `string`                               | ❌       | Additional CSS classes for styling                   |
| `gradientColors` | `{primary: string, secondary: string}` | ❌       | Custom gradient colors                               |
| `onClick`        | `() => void`                           | ❌       | Click handler for interactive cards                  |
| `aria-label`     | `string`                               | ❌       | Accessibility label (auto-generated if not provided) |

## Responsive Behavior

### Desktop (>1024px)

- Two-column horizontal layout
- Left column: 45% max width
- Right column: 55% max width
- Maximum height: 40vh

### Tablet (768px - 1024px)

- Stacked vertical layout
- Centered text alignment
- Maximum height: 45vh

### Mobile (<768px)

- Compact vertical layout
- Reduced padding and font sizes
- Maximum height: 50vh (up to 60vh on very small screens)

## Styling Customization

### CSS Custom Properties

The component uses CSS custom properties that can be overridden:

```css
.your-custom-class {
  --top-card-bg-primary: rgba(30, 41, 59, 0.95);
  --top-card-bg-secondary: rgba(51, 65, 85, 0.9);
  --top-card-border-color: rgba(148, 163, 184, 0.1);
  --top-card-text-primary: #ffffff;
  --top-card-text-secondary: rgba(203, 213, 225, 0.8);
}
```

### Custom CSS Classes

```tsx
<TopCard title="Custom Styled Card" rightContent={<Content />} class="my-custom-card" />
```

## Accessibility Features

- **Semantic HTML**: Uses proper `<header>` element with appropriate roles
- **Keyboard Navigation**: Interactive cards support Enter and Space key activation
- **Screen Reader Support**: Comprehensive ARIA labels and descriptions
- **High Contrast Mode**: Automatic adaptation for users with contrast preferences
- **Reduced Motion**: Respects user's motion preferences
- **Focus Management**: Proper focus indicators and tab order

## Architecture Compliance

### SOLID Principles

- **Single Responsibility**: Handles only header card display and interaction
- **Open/Closed**: Extensible through props without modifying component code
- **Liskov Substitution**: Can be used anywhere a header component is expected
- **Interface Segregation**: Clean, focused prop interface
- **Dependency Inversion**: Depends on abstractions (JSX.Element) not concrete implementations

### Anti-Censorship Compliance

- **No Content Filtering**: Component displays all provided content without restriction
- **Educational Information**: Supports cultural context display for educational purposes
- **Information Freedom**: No approval workflows or access control mechanisms
- **Transparency**: All functionality is open and auditable

## Performance Considerations

- **Lightweight**: Minimal CSS and JavaScript footprint
- **Efficient Rendering**: Uses SolidJS reactive patterns for optimal updates
- **Memory Efficient**: Proper cleanup of event listeners and reactive subscriptions
- **Animation Performance**: Hardware-accelerated CSS animations where possible

## Examples

See `TopCard.example.tsx` for comprehensive usage examples including:

- Basic content display
- Custom color schemes
- Interactive functionality
- Complex multi-section content
- Minimal configurations

## Integration with Other Components

The TopCard is designed to work seamlessly with:

- **Domain Components**: DocumentStatus, NetworkStatus, UploadProgress
- **Foundation Components**: Buttons, Cards, Modals within right content
- **Page Components**: As the primary header for all major screens

## Migration Guide

If you're replacing existing header implementations:

1. **Identify Current Header**: Locate your existing page header code
2. **Extract Title/Subtitle**: Move title and subtitle to TopCard props
3. **Move Content**: Wrap existing status/dashboard content in rightContent prop
4. **Update Styling**: Remove old header CSS, add TopCard customizations if needed
5. **Test Responsiveness**: Verify behavior across different screen sizes

## Browser Support

- **Modern Browsers**: Full support for Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **CSS Features**: Uses modern CSS Grid, Flexbox, and CSS Custom Properties
- **JavaScript**: ES2020+ features with SolidJS reactive system
- **Accessibility**: WCAG 2.1 AA compliance across all supported browsers
