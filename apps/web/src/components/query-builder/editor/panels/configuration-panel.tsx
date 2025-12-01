'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@erp/ui'
import {
  Calculator,
  Columns3,
  Filter,
  Link2,
  MousePointerClick,
  Settings,
  SortAsc,
} from 'lucide-react'
import type {
  DatabaseTable,
  QueryBuilderCalculatedField,
  QueryBuilderColumn,
  QueryBuilderData,
  QueryBuilderJoin,
} from '../../../../types/query-builder.types'
import { ColumnsTab } from './tabs/columns-tab'
import { JoinsTab } from './tabs/joins-tab'
import { FiltersTab } from './tabs/filters-tab'
import { SortTab } from './tabs/sort-tab'
import { CalculatedTab } from './tabs/calculated-tab'
import { ActionsTab } from './tabs/actions-tab'
import { SettingsTab } from './tabs/settings-tab'

interface ConfigurationPanelProps {
  activeTab: string
  onTabChange: (tab: string) => void
  queryBuilder: QueryBuilderData
  selectedTable?: DatabaseTable
  onColumnsReorder: (columns: QueryBuilderColumn[]) => void
  onColumnUpdate: (columnId: string, updates: Partial<QueryBuilderColumn>) => void
  onJoinsChange: (joins: QueryBuilderJoin[]) => void
  onCalculatedFieldsChange: (fields: QueryBuilderCalculatedField[]) => void
  onSettingsChange: (updates: Partial<QueryBuilderData>) => void
}

const tabs = [
  { id: 'columns', label: 'Colonnes', icon: Columns3 },
  { id: 'joins', label: 'Jointures', icon: Link2 },
  { id: 'filters', label: 'Filtres', icon: Filter },
  { id: 'sort', label: 'Tri', icon: SortAsc },
  { id: 'calculated', label: 'Calculés', icon: Calculator },
  { id: 'actions', label: 'Actions', icon: MousePointerClick },
  { id: 'settings', label: 'Paramètres', icon: Settings },
]

export function ConfigurationPanel({
  activeTab,
  onTabChange,
  queryBuilder,
  selectedTable,
  onColumnsReorder,
  onColumnUpdate,
  onJoinsChange,
  onCalculatedFieldsChange,
  onSettingsChange,
}: ConfigurationPanelProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="flex flex-col h-full">
      {/* Tabs Header */}
      <div className="border-b bg-card px-2">
        <TabsList className="h-10 w-full justify-start gap-1 bg-transparent">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 py-1.5 text-xs gap-1.5"
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
              {tab.id === 'columns' && queryBuilder.columns.length > 0 && (
                <span className="ml-1 bg-primary/20 text-primary px-1.5 py-0.5 rounded-full text-[10px]">
                  {queryBuilder.columns.length}
                </span>
              )}
              {tab.id === 'joins' && queryBuilder.joins.length > 0 && (
                <span className="ml-1 bg-blue-500/20 text-blue-600 px-1.5 py-0.5 rounded-full text-[10px]">
                  {queryBuilder.joins.length}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        <TabsContent value="columns" className="h-full m-0 p-4">
          <ColumnsTab
            columns={queryBuilder.columns}
            onReorder={onColumnsReorder}
            onUpdate={onColumnUpdate}
          />
        </TabsContent>

        <TabsContent value="joins" className="h-full m-0 p-4">
          <JoinsTab
            joins={queryBuilder.joins}
            mainTable={queryBuilder.mainTable}
            selectedTable={selectedTable}
            onChange={onJoinsChange}
          />
        </TabsContent>

        <TabsContent value="filters" className="h-full m-0 p-4">
          <FiltersTab
            columns={queryBuilder.columns}
            queryBuilder={queryBuilder}
            onSettingsChange={onSettingsChange}
          />
        </TabsContent>

        <TabsContent value="sort" className="h-full m-0 p-4">
          <SortTab
            columns={queryBuilder.columns}
            queryBuilder={queryBuilder}
            onSettingsChange={onSettingsChange}
          />
        </TabsContent>

        <TabsContent value="calculated" className="h-full m-0 p-4">
          <CalculatedTab
            fields={queryBuilder.calculatedFields}
            columns={queryBuilder.columns}
            onChange={onCalculatedFieldsChange}
          />
        </TabsContent>

        <TabsContent value="actions" className="h-full m-0 p-4">
          <ActionsTab
            settings={queryBuilder.settings}
            onSettingsChange={onSettingsChange}
          />
        </TabsContent>

        <TabsContent value="settings" className="h-full m-0 p-4">
          <SettingsTab
            queryBuilder={queryBuilder}
            onSettingsChange={onSettingsChange}
          />
        </TabsContent>
      </div>
    </Tabs>
  )
}
