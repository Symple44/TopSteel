'use client'

import React from 'react'
import { DropdownPortal, DropdownItem } from './dropdown-portal'
import { SelectPortal } from './select-portal'
import { Button } from '@erp/ui'
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react'

export function DropdownTest() {
  const [selectValue, setSelectValue] = React.useState('')
  
  return (
    <div className="p-6 space-y-4">
      <h3 className="text-lg font-semibold">Test DropdownPortal & SelectPortal</h3>
      
      <div className="space-y-4">
        <div>
          <h4>Test 1: Dropdown simple</h4>
          <DropdownPortal
            trigger={
              <Button variant="outline">
                Test Dropdown
              </Button>
            }
          >
            <DropdownItem onClick={() => alert('Item 1 clicked')}>
              Item 1
            </DropdownItem>
            <DropdownItem onClick={() => alert('Item 2 clicked')}>
              Item 2
            </DropdownItem>
          </DropdownPortal>
        </div>

        <div>
          <h4>Test 2: Dropdown avec icônes (comme dans le tableau)</h4>
          <DropdownPortal
            align="end"
            side="bottom"
            trigger={
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            }
          >
            <DropdownItem onClick={() => alert('Edit clicked')}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </DropdownItem>
            <DropdownItem 
              onClick={() => alert('Delete clicked')}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </DropdownItem>
          </DropdownPortal>
        </div>

        <div>
          <h4>Test 3: SelectPortal (comme colonne Statut)</h4>
          <div className="w-48">
            <SelectPortal
              value={selectValue}
              onValueChange={setSelectValue}
              placeholder="Choisir un statut..."
              options={[
                { value: 'actif', label: 'Actif', color: '#10b981' },
                { value: 'inactif', label: 'Inactif', color: '#6b7280' },
                { value: 'suspendu', label: 'Suspendu', color: '#ef4444' }
              ]}
            />
            <p className="text-sm text-gray-600 mt-2">Valeur sélectionnée: {selectValue || 'Aucune'}</p>
          </div>
        </div>

        <div>
          <h4>Test 4: Dans un tableau simulé</h4>
          <table className="w-full border">
            <thead>
              <tr>
                <th className="border p-2">Nom</th>
                <th className="border p-2 w-32">Statut</th>
                <th className="border p-2 w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-2">Test Row 1</td>
                <td className="border p-2">
                  <SelectPortal
                    value=""
                    onValueChange={(value) => alert(`Statut changé: ${value}`)}
                    options={[
                      { value: 'actif', label: 'Actif', color: '#10b981' },
                      { value: 'inactif', label: 'Inactif', color: '#6b7280' }
                    ]}
                    className="h-8"
                  />
                </td>
                <td className="border p-2">
                  <DropdownPortal
                    align="end"
                    side="bottom"
                    trigger={
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    }
                  >
                    <DropdownItem onClick={() => alert('Edit Row 1')}>
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier
                    </DropdownItem>
                    <DropdownItem onClick={() => alert('Delete Row 1')}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </DropdownItem>
                  </DropdownPortal>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}