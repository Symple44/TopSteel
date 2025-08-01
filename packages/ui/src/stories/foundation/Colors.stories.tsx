import type { Meta } from '@storybook/react'

const meta: Meta = {
  title: '01-Foundation/Colors',
  parameters: {
    docs: {
      description: {
        component: 'Palette de couleurs du design system TopSteel ERP',
      },
    },
  },
}

export default meta

export const PrimaryColors = () => (
  <div className="grid grid-cols-4 gap-4">
    <div className="text-center">
      <div className="w-16 h-16 bg-primary rounded-lg mb-2" />
      <span className="text-sm">Primary</span>
    </div>
    <div className="text-center">
      <div className="w-16 h-16 bg-secondary rounded-lg mb-2" />
      <span className="text-sm">Secondary</span>
    </div>
    <div className="text-center">
      <div className="w-16 h-16 bg-accent rounded-lg mb-2" />
      <span className="text-sm">Accent</span>
    </div>
    <div className="text-center">
      <div className="w-16 h-16 bg-muted rounded-lg mb-2" />
      <span className="text-sm">Muted</span>
    </div>
  </div>
)

export const SemanticColors = () => (
  <div className="grid grid-cols-4 gap-4">
    <div className="text-center">
      <div className="w-16 h-16 bg-destructive rounded-lg mb-2" />
      <span className="text-sm">Destructive</span>
    </div>
    <div className="text-center">
      <div className="w-16 h-16 bg-green-500 rounded-lg mb-2" />
      <span className="text-sm">Success</span>
    </div>
    <div className="text-center">
      <div className="w-16 h-16 bg-yellow-500 rounded-lg mb-2" />
      <span className="text-sm">Warning</span>
    </div>
    <div className="text-center">
      <div className="w-16 h-16 bg-blue-500 rounded-lg mb-2" />
      <span className="text-sm">Info</span>
    </div>
  </div>
)
