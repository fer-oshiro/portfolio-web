import React from 'react';
import { fn } from 'storybook/test';

import { Button } from '@fer-oshiro/ui';
import '@fer-oshiro/ui/styles.css'

export default {
  title: 'Example/Button',
  component: Button,

  tags: ['autodocs'],

  args: {
    onClick: fn(),
    children: <>Click Me</>,
  },
};

export const Primary = {
  args: {
    variant: 'primary',
  },
};

export const Secondary = {
  args: {
    variant: 'secondary',
  },
};

export const Ghost = {
  args: {
    variant: 'ghost',
  },
};
