/**
 * Exemple d'utilisation basique du hook useDataTable
 */

import { useDataTable } from '../useDataTable'
import type { ColumnConfig } from '../../types'

// Type de données
interface User extends Record<string, unknown> {
  id: number
  name: string
  email: string
  role: string
  status: 'active' | 'inactive'
  createdAt: string
}

// Données exemple
const users: User[] = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Admin',
    status: 'active',
    createdAt: '2024-01-15',
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'User',
    status: 'active',
    createdAt: '2024-02-20',
  },
  {
    id: 3,
    name: 'Bob Johnson',
    email: 'bob@example.com',
    role: 'User',
    status: 'inactive',
    createdAt: '2024-03-10',
  },
]

// Configuration des colonnes
const columns: ColumnConfig<User>[] = [
  {
    id: 'id',
    key: 'id',
    title: 'ID',
    type: 'number',
    sortable: true,
  },
  {
    id: 'name',
    key: 'name',
    title: 'Name',
    type: 'text',
    sortable: true,
  },
  {
    id: 'email',
    key: 'email',
    title: 'Email',
    type: 'text',
    sortable: true,
  },
  {
    id: 'role',
    key: 'role',
    title: 'Role',
    type: 'text',
    sortable: true,
  },
  {
    id: 'status',
    key: 'status',
    title: 'Status',
    type: 'select',
    sortable: true,
  },
  {
    id: 'createdAt',
    key: 'createdAt',
    title: 'Created At',
    type: 'date',
    sortable: true,
  },
]

/**
 * Exemple 1: Table basique avec tri et recherche
 */
export function BasicTableExample() {
  const table = useDataTable<User>({
    data: users,
    columns,
    keyField: 'id',
    sortable: true,
    searchable: true,
  })

  return (
    <div>
      <input
        type="text"
        placeholder="Search..."
        value={table.searchTerm}
        onChange={(e) => table.setSearchTerm(e.target.value)}
      />

      <table>
        <thead>
          <tr>
            {table.visibleColumns.map((col) => (
              <th key={col.id} onClick={() => table.handleSort(col.id)}>
                {col.title}
                {table.isSorted(col.id) && (
                  <span>{table.getSortDirection(col.id) === 'asc' ? ' ↑' : ' ↓'}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.data.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>{user.status}</td>
              <td>{user.createdAt}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div>
        Total: {table.totalCount} users
        {table.isFiltered && ' (filtered)'}
      </div>
    </div>
  )
}

/**
 * Exemple 2: Table avec pagination
 */
export function PaginatedTableExample() {
  const table = useDataTable<User>({
    data: users,
    columns,
    keyField: 'id',
    sortable: true,
    searchable: true,
    pagination: {
      pageSize: 10,
      showPageSizeSelector: true,
    },
  })

  return (
    <div>
      <input
        type="text"
        placeholder="Search..."
        value={table.searchTerm}
        onChange={(e) => table.setSearchTerm(e.target.value)}
      />

      <table>
        <thead>
          <tr>
            {table.visibleColumns.map((col) => (
              <th key={col.id} onClick={() => table.handleSort(col.id)}>
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.data.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>{user.status}</td>
              <td>{user.createdAt}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div>
        <button onClick={table.prevPage} disabled={table.currentPage === 1}>
          Previous
        </button>
        <span>
          Page {table.currentPage} of {table.totalPages}
        </span>
        <button onClick={table.nextPage} disabled={table.currentPage === table.totalPages}>
          Next
        </button>

        <select value={table.pageSize} onChange={(e) => table.setPageSize(Number(e.target.value))}>
          <option value="10">10 per page</option>
          <option value="20">20 per page</option>
          <option value="50">50 per page</option>
        </select>
      </div>
    </div>
  )
}

/**
 * Exemple 3: Table avec sélection
 */
export function SelectableTableExample() {
  const table = useDataTable<User>({
    data: users,
    columns,
    keyField: 'id',
    sortable: true,
    searchable: true,
    selectable: true,
  })

  return (
    <div>
      <input
        type="text"
        placeholder="Search..."
        value={table.searchTerm}
        onChange={(e) => table.setSearchTerm(e.target.value)}
      />

      <table>
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={table.selection.isAllSelected}
                onChange={table.toggleAll}
              />
            </th>
            {table.visibleColumns.map((col) => (
              <th key={col.id} onClick={() => table.handleSort(col.id)}>
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.data.map((user) => (
            <tr
              key={user.id}
              style={{
                backgroundColor: table.selection.selectedRows.has(user.id)
                  ? '#e3f2fd'
                  : 'transparent',
              }}
            >
              <td>
                <input
                  type="checkbox"
                  checked={table.selection.selectedRows.has(user.id)}
                  onChange={() => table.toggleRow(user.id)}
                />
              </td>
              <td>{user.id}</td>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>{user.status}</td>
              <td>{user.createdAt}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div>
        {table.selection.selectedCount} of {table.totalCount} selected
        {table.selection.selectedCount > 0 && (
          <button onClick={table.clearSelection}>Clear selection</button>
        )}
      </div>
    </div>
  )
}

/**
 * Exemple 4: Table complète avec toutes les fonctionnalités
 */
export function FullFeaturedTableExample() {
  const table = useDataTable<User>({
    data: users,
    columns,
    keyField: 'id',
    sortable: true,
    filterable: true,
    searchable: true,
    selectable: true,
    exportable: true,
    pagination: {
      pageSize: 10,
      showPageSizeSelector: true,
    },
    onSelectionChange: (selection) => {
      console.log('Selection changed:', selection)
    },
  })

  const handleExport = async () => {
    await table.exportData('csv', {
      includeHeaders: true,
      selectedOnly: false,
    })
  }

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Search..."
          value={table.searchTerm}
          onChange={(e) => table.setSearchTerm(e.target.value)}
          style={{ flex: 1 }}
        />

        <button onClick={handleExport} disabled={table.isExporting}>
          {table.isExporting ? 'Exporting...' : 'Export CSV'}
        </button>

        {table.isFiltered && (
          <button onClick={table.clearFilters}>Clear filters ({table.filters.length})</button>
        )}
      </div>

      {/* Table */}
      <table>
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={table.selection.isAllSelected}
                onChange={table.toggleAll}
              />
            </th>
            {table.visibleColumns.map((col) => (
              <th key={col.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span onClick={() => table.handleSort(col.id)}>{col.title}</span>
                  {table.isSorted(col.id) && (
                    <span>{table.getSortDirection(col.id) === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.data.map((user) => (
            <tr key={user.id}>
              <td>
                <input
                  type="checkbox"
                  checked={table.selection.selectedRows.has(user.id)}
                  onChange={() => table.toggleRow(user.id)}
                />
              </td>
              <td>{user.id}</td>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>
                <span
                  style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    backgroundColor: user.status === 'active' ? '#4caf50' : '#f44336',
                    color: 'white',
                  }}
                >
                  {user.status}
                </span>
              </td>
              <td>{user.createdAt}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
        <div>
          {table.selection.selectedCount > 0
            ? `${table.selection.selectedCount} selected`
            : `${table.totalCount} total`}
          {table.isFiltered && ' (filtered)'}
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select
            value={table.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
          >
            <option value="10">10 per page</option>
            <option value="20">20 per page</option>
            <option value="50">50 per page</option>
          </select>

          <button onClick={table.prevPage} disabled={table.currentPage === 1}>
            Previous
          </button>
          <span>
            Page {table.currentPage} of {table.totalPages}
          </span>
          <button onClick={table.nextPage} disabled={table.currentPage === table.totalPages}>
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Exemple 5: Table avec filtres avancés
 */
export function AdvancedFiltersExample() {
  const table = useDataTable<User>({
    data: users,
    columns,
    keyField: 'id',
    sortable: true,
    filterable: true,
    searchable: true,
  })

  const handleAddFilter = () => {
    table.addFilter({
      field: 'status',
      operator: 'equals',
      value: 'active',
    })
  }

  const handleSetAdvancedFilters = () => {
    table.setAdvancedFilters({
      condition: 'AND',
      rules: [
        {
          field: 'status',
          operator: 'equals',
          value: 'active',
        },
        {
          field: 'role',
          operator: 'equals',
          value: 'Admin',
        },
      ],
    })
  }

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <button onClick={handleAddFilter}>Add filter (status = active)</button>
        <button onClick={handleSetAdvancedFilters}>
          Advanced filter (active + Admin)
        </button>
        {table.filters.length > 0 && (
          <button onClick={table.clearFilters}>Clear filters</button>
        )}
      </div>

      <div style={{ marginBottom: '1rem' }}>
        Active filters:
        {table.filters.map((filter, index) => (
          <div key={index}>
            {filter.field} {filter.operator} {String(filter.value)}
            <button onClick={() => table.removeFilter(filter.field)}>Remove</button>
          </div>
        ))}
      </div>

      <table>
        <thead>
          <tr>
            {table.visibleColumns.map((col) => (
              <th key={col.id}>{col.title}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.data.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>{user.status}</td>
              <td>{user.createdAt}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div>
        Showing {table.data.length} of {table.totalCount} users
      </div>
    </div>
  )
}
