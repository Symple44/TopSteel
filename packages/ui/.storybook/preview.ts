import type { Preview } from '@storybook/react'
import '../src/styles/globals.css' // Si vous avez des styles globaux

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    docs: {
      description: {
        component: 'Design System TopSteel ERP - Composants UI enterprise',
      },
    },
    options: {
      storySort: {
        order: [
          '01-Foundation',
          ['Colors', 'Typography', 'Spacing'],
          '02-Primitives',
          ['Button', 'Input', 'Select', 'Textarea', 'Checkbox'],
          '03-Layout',
          ['Card', 'Container', 'Grid'],
          '04-Navigation',
          ['Tabs', 'Breadcrumb', 'Menu'],
          '05-Data Display',
          ['Badge', 'Table', 'Avatar', 'Progress'],
          '06-Feedback', 
          ['Alert', 'Dialog', 'Toast'],
          '07-Forms',
          ['Form Components', 'Validation'],
          '08-ERP Patterns',
          ['Dashboard', 'Project Details', 'Lists'],
        ],
      },
    },
  },
}

export default preview
