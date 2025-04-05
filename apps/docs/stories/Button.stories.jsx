import React from 'react';
import { fn } from '@storybook/test';

import { Button } from '@charmbyte/ui';
import '@charmbyte/ui/styles.css'
// apps/docs/.storybook/preview.ts

export default {
  title: 'Example/Button',
  component: Button,
 
  tags: ['autodocs'],

  args: { 
    onClick: fn() ,
    children: <>Click Me</>
    
  },
};

export const Primary = {
  args: {
    primary: true,
    label: 'Button',
    
  },
};
