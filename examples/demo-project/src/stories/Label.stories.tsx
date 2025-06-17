import type { Meta, StoryObj } from '@storybook/react';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';

const meta: Meta<typeof Label> = {
  title: 'UI/Label',
  component: Label,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A label component built with Radix UI that provides accessible labeling for form controls. Automatically handles disabled states and cursor behavior.',
      },
    },
  },
  argTypes: {
    children: {
      control: { type: 'text' },
      description: 'The content of the label',
    },
    htmlFor: {
      control: { type: 'text' },
      description: 'The id of the form control this label is associated with',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Label',
  },
};

export const WithInput: Story = {
  render: (args) => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label {...args} htmlFor="email" />
      <Input type="email" id="email" placeholder="Email" />
    </div>
  ),
  args: {
    children: 'Email',
  },
  parameters: {
    docs: {
      description: {
        story: 'Label component properly associated with an input field using htmlFor and id attributes.',
      },
    },
  },
};

export const Required: Story = {
  render: (args) => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label {...args} htmlFor="required-field" />
      <Input type="text" id="required-field" placeholder="Required field" required />
    </div>
  ),
  args: {
    children: (
      <>
        Username <span className="text-red-500">*</span>
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Label with required field indicator.',
      },
    },
  },
};

export const Disabled: Story = {
  render: (args) => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label {...args} htmlFor="disabled-field" />
      <Input type="text" id="disabled-field" placeholder="Disabled field" disabled />
    </div>
  ),
  args: {
    children: 'Disabled Field',
  },
  parameters: {
    docs: {
      description: {
        story: 'Label automatically handles disabled state styling when associated input is disabled.',
      },
    },
  },
};

