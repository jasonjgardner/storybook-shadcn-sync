# Label

A label component built with Radix UI that provides accessible labeling for form controls. Automatically handles disabled states and cursor behavior.

## Installation

```bash
npx shadcn-ui@latest add label
```

## Usage

```tsx
import { Label } from "@/components/ui/label"
```

## Examples

```tsx
<Label />
```
```tsx
// Default example
<Label children="Label" />
```
```tsx
// With Input example
<Label children="Email" />
```
```tsx
// Required example
<Label children="(
      <>
        Username <span className="text-red-500">*</span>
      </>
    )" />
```
```tsx
// Disabled example
<Label children="Disabled Field" />
```