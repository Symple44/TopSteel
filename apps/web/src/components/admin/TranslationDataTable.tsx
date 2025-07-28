'use client'

import React, { useMemo, useState } from 'react'
import { DataTable } from '@/components/ui/datatable/DataTable'
import { ColumnConfig } from '@/components/ui/datatable/types'
import { Badge, Button } from '@erp/ui'
import { Clock, Tag, Edit2, Download, Upload, Plus, Trash2, Copy } from 'lucide-react'
import type { TranslationEntry, TranslationFilter } from '@/lib/i18n/types'
import { SUPPORTED_LANGUAGES } from '@/lib/i18n/types'
import {
  NamespaceCell,
  CategoryCell,
  StatusCell,
  FullKeyCell,
  TranslationCell,
  DescriptionCell
} from './TranslationCellComponents'

interface TranslationDataTableProps {
  entries: TranslationEntry[]
  loading: boolean
  onEdit: (entry: TranslationEntry) => void
  onCellEdit?: (value: any, row: TranslationEntry, column: ColumnConfig<TranslationEntry>) => void
  onCreate?: () => void
  onDelete?: (entries: TranslationEntry[]) => void
  onExport?: (entries: TranslationEntry[]) => void
  onImport?: () => void
  onDuplicate?: (entry: TranslationEntry) => void
}

export function TranslationDataTable({
  entries,
  loading,
  onEdit,
  onCellEdit,
  onCreate,
  onDelete,
  onExport,
  onImport,
  onDuplicate
}: TranslationDataTableProps) {

  // Obtenir la liste des namespaces uniques pour les filtres
  const namespaces = useMemo(() => {
    const uniqueNamespaces = [...new Set(entries.map(entry => entry.namespace))]
    return uniqueNamespaces.sort()
  }, [entries])

  // Obtenir la liste des catégories uniques pour les filtres  
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(entries.map(entry => entry.category).filter(Boolean))]
    return uniqueCategories.sort()
  }, [entries])

  // Configuration des colonnes
  const columns: ColumnConfig<TranslationEntry>[] = useMemo(() => {
    const baseColumns: ColumnConfig<TranslationEntry>[] = [
      {
        id: 'fullKey',
        key: 'fullKey',
        title: 'Clé',
        description: 'Clé de traduction complète (namespace.key)',
        type: 'text',
        width: 300,
        sortable: true,
        searchable: true,
        locked: true, // Empêcher le déplacement de cette colonne importante
        render: (value, row) => <FullKeyCell entry={row} />
      },
      {
        id: 'namespace',
        key: 'namespace',
        title: 'Namespace',
        description: 'Espace de nom de la traduction',
        type: 'select',
        width: 150,
        sortable: true,
        searchable: true,
        options: namespaces.map(ns => ({
          value: ns,
          label: ns,
          color: '#3b82f6'
        })),
        render: (value) => <NamespaceCell value={value} />
      },
      {
        id: 'category',
        key: 'category',
        title: 'Catégorie',
        description: 'Catégorie de la traduction',
        type: 'select',
        width: 120,
        sortable: true,
        editable: true,
        options: categories.map(cat => ({
          value: cat,
          label: cat,
          color: '#10b981'
        })),
        render: (value) => <CategoryCell value={value} />
      },
      {
        id: 'description',
        key: 'description',
        title: 'Description',
        description: 'Description de la traduction',
        type: 'text',
        width: 200,
        sortable: true,
        searchable: true,
        editable: true,
        render: (value) => <DescriptionCell value={value} />,
        validation: {
          maxLength: 200
        }
      },
      {
        id: 'isModified',
        key: 'isModified',
        title: 'Statut',
        description: 'Statut de modification de la traduction',
        type: 'boolean',
        width: 100,
        sortable: true,
        render: (value) => <StatusCell value={value} />
      }
    ]

    // Ajouter une colonne par langue supportée
    const languageColumns: ColumnConfig<TranslationEntry>[] = SUPPORTED_LANGUAGES.map(lang => ({
      id: `translation_${lang.code}`,
      key: 'id' as keyof TranslationEntry, // Utiliser une propriété existante comme fallback, on s'appuie sur getValue
      title: `${lang.flag} ${lang.nativeName}`,
      description: `Traduction en ${lang.nativeName}`,
      type: 'richtext', // Utiliser le rich text pour les traductions
      width: 300,
      sortable: true,
      editable: true,
      searchable: true,
      render: (value, row) => {
        const translation = row.translations[lang.code] || ''
        return <TranslationCell translation={translation} />
      },
      validation: {
        custom: (value) => {
          if (typeof value === 'string' && value.length > 1000) {
            return 'La traduction ne peut pas dépasser 1000 caractères'
          }
          return null
        },
        required: lang.code === 'fr' // Le français est obligatoire
      },
      // Fonction personnalisée pour obtenir la valeur à éditer
      getValue: (row) => row.translations[lang.code] || ''
    }))

    return [
      ...baseColumns,
      ...languageColumns
    ]
  }, [namespaces, categories])

  const handleCellEdit = (value: any, row: TranslationEntry, column: ColumnConfig<TranslationEntry>) => {
    if (column.id.startsWith('translation_')) {
      // Éditer une traduction spécifique
      const languageCode = column.id.replace('translation_', '')
      const updatedRow = {
        ...row,
        translations: {
          ...row.translations,
          [languageCode]: value
        },
        isModified: true,
        updatedAt: new Date()
      }
      onCellEdit?.(value, updatedRow, column)
    } else {
      // Éditer une autre propriété
      const updatedRow = {
        ...row,
        [column.key]: value,
        isModified: true,
        updatedAt: new Date()
      }
      onCellEdit?.(value, updatedRow, column)
    }
  }

  const handleCreate = () => {
    onCreate?.()
  }

  const handleDelete = (rows: TranslationEntry[]) => {
    onDelete?.(rows)
  }

  const handleEdit = (row: TranslationEntry) => {
    onEdit(row)
  }

  const handleDuplicate = (row: TranslationEntry) => {
    onDuplicate?.(row)
  }

  const handleExport = (rows: TranslationEntry[]) => {
    onExport?.(rows)
  }

  return (
    <DataTable
      data={entries}
      columns={columns}
      keyField="id"
      tableId="translation-admin"
      // Fonctionnalités principales
      editable
      selectable
      sortable
      searchable
      filterable
      // Configuration de l'interface
      height={600}
      className="border rounded-lg"
      // Actions
      actions={{
        create: onCreate ? handleCreate : undefined,
        edit: handleEdit,
        delete: onDelete ? handleDelete : undefined,
        duplicate: onDuplicate ? handleDuplicate : undefined,
        export: onExport ? handleExport : undefined,
        import: onImport
      }}
      // Callbacks
      onCellEdit={handleCellEdit}
      loading={loading}
      // Configuration personnalisée avec pagination activée
      pagination={true}
      config={{
        enableColumnReorder: true,
        enableColumnResize: true,
        enableDensityToggle: true,
        enableFullscreen: true,
        pageSize: 25,
        pageSizeOptions: [10, 25, 50, 100]
      }}
    />
  )
}

export default TranslationDataTable