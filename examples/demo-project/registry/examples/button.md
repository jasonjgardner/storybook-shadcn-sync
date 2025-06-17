# Button

A versatile button component built with Radix UI and class-variance-authority. Supports multiple variants, sizes, and can be used as a child component.

## Installation

```bash
npx shadcn-ui@latest add button
```

## Usage

```tsx
import { Button } from "@/components/ui/button"
```

## Examples

```tsx
<Button />
```
```tsx
// Default example
<Button children="Button" />
```
```tsx
// Primary example
<Button children="Primary Button" variant="default" />
```
```tsx
// Secondary example
<Button children="Secondary Button" variant="secondary" />
```
```tsx
// Destructive example
<Button children="Destructive Button" variant="destructive" />
```
```tsx
// Outline example
<Button children="Outline Button" variant="outline" />
```
```tsx
// Ghost example
<Button children="Ghost Button" variant="ghost" />
```
```tsx
// Link example
<Button children="Link Button" variant="link" />
```
```tsx
// Small example
<Button children="Small Button" size="sm" />
```
```tsx
// Large example
<Button children="Large Button" size="lg" />
```
```tsx
// Icon example
<Button children="🚀" size="icon" />
```
```tsx
// Disabled example
<Button children="Disabled Button" disabled />
```
```tsx
// Loading example
<Button children="Loading..." disabled />
```