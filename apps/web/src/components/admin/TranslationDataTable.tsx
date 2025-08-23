'use client'

import { AdvancedDataTable, type ColumnConfig } from '@erp/ui/data-display'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import type { TranslationEntry } from '@/lib/i18n/types'
import { SUPPORTED_LANGUAGES } from '@/lib/i18n/types'
import {
  CategoryCell,
  DescriptionCell,
  FullKeyCell,
  NamespaceCell,
  StatusCell,
  TranslationCell,
} from './TranslationCellComponents'

interface TranslationDataTableProps {
  entries: TranslationEntry[]
  loading: boolean
  onEdit: (entry: TranslationEntry) => void
  onCellEdit?: (
    value: unknown,
    row: TranslationEntry,
    column: ColumnConfig<TranslationEntry>
  ) => void
  onCreate?: () => void
  onDelete?: (entries: TranslationEntry[]) => void
  onExport?: (entries: TranslationEntry[]) => void
  onImport?: () => void
  onDuplicate?: (entry: TranslationEntry) => void
}

export const TranslationDataTable = memo(function TranslationDataTable({
  entries,
  loading,
  onEdit,
  onCellEdit,
  onCreate,
  onDelete,
  onExport,
  onImport,
  onDuplicate,
}: TranslationDataTableProps) {
  // État de pagination local
  const [currentPage, setCurrentPage] = useState(1)

  // Réajuster la page courante si nécessaire quand les données changent
  useEffect(() => {
    const maxPage = Math.ceil(entries.length / 50) // Default page size
    if (currentPage > maxPage && maxPage > 0) {
      setCurrentPage(maxPage)
    }
  }, [entries.length, currentPage])

  // Obtenir la liste des namespaces uniques pour les filtres
  const namespaces = useMemo(() => {
    const uniqueNamespaces = [...new Set(entries.map((entry) => entry.namespace))]
    return uniqueNamespaces.sort()
  }, [entries])

  // Obtenir la liste des catégories uniques pour les filtres
  const categories = useMemo(() => {
    const allCategories = entries
      .map((entry) => entry.category)
      .filter((cat) => cat != null && cat !== '')
    const uniqueCategories = [...new Set(allCategories)]
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
        render: (_value: unknown, row: TranslationEntry) => <FullKeyCell entry={row} />,
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
        options: namespaces.map((ns) => ({
          value: ns,
          label: ns,
          color: '#3b82f6',
        })),
        render: (value: unknown) => <NamespaceCell value={value} />,
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
        options: (() => {
          const opts = [
            { value: '', label: '(Aucune catégorie)', color: '#6b7280' },
            ...categories
              .filter((cat) => cat !== undefined)
              .map((cat) => ({
                value: cat,
                label: cat,
                color: '#10b981',
              })),
          ]
          return opts
        })(),
        render: (value: unknown) => <CategoryCell value={value} />,
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
        render: (value: unknown) => <DescriptionCell value={value} />,
        validation: {
          maxLength: 200,
        },
      },
      {
        id: 'isModified',
        key: 'isModified',
        title: 'Statut',
        description: 'Statut de modification de la traduction',
        type: 'boolean',
        width: 100,
        sortable: true,
        render: (value: unknown) => <StatusCell value={value} />,
      },
    ]

    // Ajouter une colonne par langue supportée
    const languageColumns: ColumnConfig<TranslationEntry>[] = SUPPORTED_LANGUAGES.map((lang) => ({
      id: `translation_${lang.code}`,
      key: 'id' as keyof TranslationEntry, // Utiliser une propriété existante comme fallback, on s'appuie sur getValue
      title: `${lang.flag} ${lang.nativeName}`,
      description: `Traduction en ${lang.nativeName}`,
      type: 'richtext', // Utiliser le rich text pour les traductions
      width: 300,
      sortable: true,
      editable: true,
      searchable: true,
      render: (_value: unknown, row: TranslationEntry) => {
        const translation = row.translations[lang.code] || ''
        return <TranslationCell translation={translation} />
      },
      validation: {
        custom: (value: unknown) => {
          if (typeof value === 'string' && value.length > 1000) {
            return 'La traduction ne peut pas dépasser 1000 caractères'
          }
          return null
        },
        required: lang.code === 'fr', // Le français est obligatoire
      },
      // Fonction personnalisée pour obtenir la valeur à éditer
      getValue: (row: TranslationEntry) => row.translations[lang.code] || '',
    }))

    return [...baseColumns, ...languageColumns]
  }, [namespaces, categories])

  const handleCellEdit = useCallback(
    (value: unknown, row: TranslationEntry, column: ColumnConfig<TranslationEntry>) => {
      if (column.id.startsWith('translation_')) {
        // Éditer une traduction spécifique
        const languageCode = column.id.replace('translation_', '')
        const updatedRow = {
          ...row,
          translations: {
            ...row.translations,
            [languageCode]: value,
          },
          isModified: true,
          updatedAt: new Date(),
        }
        onCellEdit?.(value, updatedRow, column)
      } else {
        // Éditer une autre propriété
        const updatedRow = {
          ...row,
          [column.key]: value,
          isModified: true,
          updatedAt: new Date(),
        }
        onCellEdit?.(value, updatedRow, column)
      }
    },
    [onCellEdit]
  )

  const handleCreate = useCallback(() => {
    onCreate?.()
  }, [onCreate])

  const handleDelete = useCallback(
    (rows: TranslationEntry[]) => {
      onDelete?.(rows)
    },
    [onDelete]
  )

  const handleEdit = useCallback(
    (row: TranslationEntry) => {
      onEdit(row)
    },
    [onEdit]
  )

  const _handleDuplicate = useCallback(
    (row: TranslationEntry) => {
      onDuplicate?.(row)
    },
    [onDuplicate]
  )

  const handleExport = useCallback(
    (rows: TranslationEntry[]) => {
      onExport?.(rows)
    },
    [onExport]
  )

  const handlePaginationChange = useCallback(
    ({ page, pageSize: _newPageSize }: { page: number; pageSize: number; total: number }) => {
      setCurrentPage(page)
    },
    []
  )

  return (
    <AdvancedDataTable
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
        // duplicate: onDuplicate ? handleDuplicate : undefined, // Not supported by DataTable
        export: onExport ? handleExport : undefined,
        import: onImport,
      }}
      // Callbacks
      onCellEdit={handleCellEdit}
      loading={loading}
      // Configuration personnalisée avec pagination activée et optimisée pour de gros datasets
      pagination={{
        page: currentPage,
        pageSize: 25, // Default page size
        total: entries.length,
        showSizeChanger: true,
        pageSizeOptions: [25, 50, 100, 200], // Options adaptées pour de gros volumes
      }}
      onPaginationChange={handlePaginationChange}
    />
  )
})

export default TranslationDataTable
