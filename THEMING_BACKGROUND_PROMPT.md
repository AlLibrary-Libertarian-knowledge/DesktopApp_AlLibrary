# 🎨 **AlLibrary Theming Application Background Prompt**

## **Core Principle**
Use CSS custom properties (design tokens) for ALL visual styling. No hard-coded values.

## **Token Usage**

```css
/* ✅ CORRECT */
.component {
  background-color: var(--color-surface-primary);
  color: var(--color-text-primary);
  padding: var(--space-component-md);
  border-radius: var(--radius-md);
  font: var(--font-body-medium);
}

/* ❌ WRONG */
.component {
  background-color: #ffffff;
  color: #111827;
  padding: 16px;
}
```

## **Required Component Features**

### 1. **Design Tokens**
- **Colors**: `--color-{semantic}-{shade}` (primary, secondary, surface, text, border)
- **Typography**: `--font-{type}-{size}` (heading, body, display, code)
- **Spacing**: `--space-{type}-{size}` (component, layout, section)
- **Borders**: `--radius-{size}`, `--color-border-{type}`
- **Shadows**: `--shadow-{size}`

### 2. **Cultural Themes** (Educational Only)
```css
.component[data-cultural-theme="indigenous"] {
  background-color: var(--color-cultural-indigenous-50);
  font: var(--font-indigenous-body);
}
```

### 3. **Accessibility**
```css
/* High contrast */
@media (prefers-contrast: high) {
  .component {
    background-color: var(--color-high-contrast-primary);
    border: 2px solid var(--color-high-contrast-accent);
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .component { transition: none; }
}
```

### 4. **Responsive Design**
```css
.component {
  padding: var(--space-mobile-md);
}

@media (min-width: 640px) {
  .component { padding: var(--space-tablet-md); }
}

@media (min-width: 1024px) {
  .component { padding: var(--space-desktop-md); }
}
```

### 5. **Dark Mode**
```css
@media (prefers-color-scheme: dark) {
  .component {
    background-color: var(--color-surface-primary-dark);
    color: var(--color-text-primary-dark);
  }
}
```

## **Implementation Checklist**
- [ ] Use semantic color tokens
- [ ] Apply typography tokens
- [ ] Use spacing tokens
- [ ] Add cultural theme support
- [ ] Include accessibility media queries
- [ ] Implement responsive breakpoints
- [ ] Support dark mode

## **Anti-Censorship Principles**
- Cultural themes are informational only - never restrict access
- Support multiple cultural perspectives equally
- Maintain transparency in all theming decisions

---

**Apply these patterns to every component for consistency, accessibility, and cultural respect.**