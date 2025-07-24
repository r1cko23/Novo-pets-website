# shadcn/ui Best Practices for Novo Pets

This document outlines the shadcn/ui implementation and best practices used in the Novo Pets website.

## 🎨 Design System

### Brand Colors
Our design system uses CSS custom properties for consistent theming:

```css
:root {
  --brand-primary: #9a7d62;    /* Warm brown */
  --brand-secondary: #8C636A;  /* Mauve */
  --brand-tertiary: #436e4f;   /* Forest green */
  --brand-light: #fcf7eb;      /* Cream */
  --brand-dark: #362f2d;       /* Dark brown */
}
```

### Component Variants
All components follow the shadcn/ui pattern with brand-specific variants:

#### Button Variants
- `default` - Standard primary button
- `brand` - Gradient brand colors
- `brand-outline` - Outlined brand style
- `brand-ghost` - Ghost brand style
- `glass` - Glassmorphism effect
- `neo` - Neumorphic design

#### Card Variants
- `default` - Standard card
- `glass` - Glassmorphism effect
- `brand` - Brand gradient background
- `elevated` - Enhanced shadow
- `outline` - Bordered style

#### Input Variants
- `default` - Standard input
- `brand` - Brand-colored focus states
- `glass` - Glassmorphism effect
- `outline` - Enhanced borders

## 🧩 Component Usage

### Layout Components

#### Container
```tsx
import { Container } from "@/components/ui"

<Container size="lg" padding="xl">
  <h1>Content</h1>
</Container>
```

#### Section
```tsx
import { Section } from "@/components/ui"

<Section spacing="lg" background="brand">
  <h2>Section Content</h2>
</Section>
```

### Form Components

#### Button
```tsx
import { Button } from "@/components/ui"

<Button variant="brand" size="xl" className="rounded-full">
  Book Appointment
</Button>
```

#### Input
```tsx
import { Input } from "@/components/ui"

<Input variant="brand" placeholder="Enter your name" />
```

### Display Components

#### Service Card
```tsx
import { ServiceCard } from "@/components/ui"

<ServiceCard
  title="Premium Grooming"
  description="Complete grooming package"
  price="₱1,500"
  duration="2-3 hours"
  image="/images/grooming.jpg"
  features={["Bath & blow dry", "Haircut", "Nail trim"]}
  popular={true}
  onCtaClick={() => handleBooking()}
/>
```

## 📁 File Structure

```
client/src/components/
├── ui/                    # shadcn/ui components
│   ├── index.ts          # Component exports
│   ├── button.tsx        # Enhanced button
│   ├── card.tsx          # Enhanced card
│   ├── input.tsx         # Enhanced input
│   ├── container.tsx     # Layout container
│   ├── section.tsx       # Section wrapper
│   ├── service-card.tsx  # Custom service card
│   └── ...               # Other components
├── layout/               # Layout components
├── home/                 # Home page components
├── booking/              # Booking components
└── ...
```

## 🎯 Best Practices

### 1. Component Composition
Always use composition over inheritance:

```tsx
// ✅ Good
<Card variant="brand">
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>

// ❌ Avoid
<div className="card-brand">
  <div className="card-header">...</div>
</div>
```

### 2. Variant Usage
Use semantic variants instead of custom classes:

```tsx
// ✅ Good
<Button variant="brand" size="xl">

// ❌ Avoid
<Button className="bg-gradient-to-r from-brand-primary to-brand-secondary">
```

### 3. Responsive Design
Use Tailwind's responsive prefixes:

```tsx
<Container size="default" className="px-4 md:px-8 lg:px-12">
```

### 4. Accessibility
Always include proper ARIA attributes:

```tsx
<Button aria-label="Close menu" variant="ghost" size="icon">
  <X className="h-4 w-4" />
</Button>
```

### 5. Performance
Use proper imports to avoid bundle bloat:

```tsx
// ✅ Good - Tree-shakeable
import { Button } from "@/components/ui/button"

// ❌ Avoid - Imports everything
import { Button } from "@/components/ui"
```

## 🎨 Styling Guidelines

### CSS Variables
Use CSS custom properties for consistent theming:

```css
.my-component {
  color: hsl(var(--brand-primary));
  background: hsl(var(--background));
}
```

### Glass Effects
Use the `.glass` utility class for glassmorphism:

```tsx
<div className="glass rounded-lg p-6">
  Glass content
</div>
```

### Animations
Use Framer Motion for complex animations:

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  Animated content
</motion.div>
```

## 🔧 Development Workflow

### Adding New Components
1. Create component in `client/src/components/ui/`
2. Follow shadcn/ui patterns with `cva` for variants
3. Add to `client/src/components/ui/index.ts`
4. Update this documentation

### Component Testing
Test components with different variants:

```tsx
// Test all button variants
<Button variant="default">Default</Button>
<Button variant="brand">Brand</Button>
<Button variant="glass">Glass</Button>
```

### Code Review Checklist
- [ ] Uses semantic variants
- [ ] Includes proper TypeScript types
- [ ] Follows accessibility guidelines
- [ ] Uses brand colors consistently
- [ ] Includes proper documentation

## 📚 Resources

- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [Radix UI Documentation](https://www.radix-ui.com/)

## 🚀 Migration Guide

When updating existing components:

1. Replace custom classes with variants
2. Use new layout components (Container, Section)
3. Update imports to use the index file
4. Test all variants and sizes
5. Update documentation

Example migration:

```tsx
// Before
<div className="container mx-auto px-4">
  <div className="bg-white rounded-lg shadow-md p-6">
    <h2 className="text-2xl font-bold text-brand-primary">Title</h2>
  </div>
</div>

// After
<Container>
  <Card variant="brand">
    <CardTitle>Title</CardTitle>
  </Card>
</Container>
``` 