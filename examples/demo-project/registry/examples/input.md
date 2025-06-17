# Input

A flexible input component with consistent styling and accessibility features. Built with React forwardRef for proper form integration.

## Installation

```bash
npx shadcn-ui@latest add input
```

## Usage

```tsx
import { Input } from "@/components/ui/input"
```

## Examples

```tsx
<Input />
```
```tsx
// Default example
<Input placeholder="Enter text..." />
```
```tsx
// With Value example
<Input value="Hello World" placeholder="Enter text..." />
```
```tsx
// Email example
<Input type="email" placeholder="Enter your email..." />
```
```tsx
// Password example
<Input type="password" placeholder="Enter your password..." />
```
```tsx
// Number example
<Input type="number" placeholder="Enter a number..." />
```
```tsx
// Search example
<Input type="search" placeholder="Search..." />
```
```tsx
// Disabled example
<Input placeholder="Disabled input" disabled />
```
```tsx
// With Label example
<Input type="email" placeholder="Email" />
```