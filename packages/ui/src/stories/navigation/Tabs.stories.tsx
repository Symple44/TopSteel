import type { Meta, StoryObj } from '@storybook/react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/navigation/tabs'

const meta: Meta<typeof Tabs> = {
  title: '03-Navigation/Tabs',
  component: Tabs,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Systeme d\'onglets pour organiser le contenu dans TopSteel ERP',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Tabs>

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="general" className="w-[400px]">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="technique">Technique</TabsTrigger>
        <TabsTrigger value="financier">Financier</TabsTrigger>
      </TabsList>
      <TabsContent value="general">
        <div className="p-4 border rounded">
          <h3 className="font-semibold">Informations generales</h3>
          <p className="text-sm text-gray-600">
            Donnees principales du projet metallurgique
          </p>
        </div>
      </TabsContent>
      <TabsContent value="technique">
        <div className="p-4 border rounded">
          <h3 className="font-semibold">Specifications techniques</h3>
          <p className="text-sm text-gray-600">
            Details techniques et dimensionnement
          </p>
        </div>
      </TabsContent>
      <TabsContent value="financier">
        <div className="p-4 border rounded">
          <h3 className="font-semibold">Aspects financiers</h3>
          <p className="text-sm text-gray-600">
            Budget, devis et facturation
          </p>
        </div>
      </TabsContent>
    </Tabs>
  ),
}



