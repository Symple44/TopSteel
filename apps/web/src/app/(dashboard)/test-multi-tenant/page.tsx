'use client'

export const dynamic = 'force-dynamic'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@erp/ui'
import { Database, Lock, ShieldAlert, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@erp/ui'
import { Badge } from '@erp/ui'
import { Button } from '@erp/ui/primitives'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@erp/ui'
import { Textarea } from '@erp/ui/primitives'
import { callClientApi } from '@/utils/backend-api'

export default function TestMultiTenantPage() {
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM clients LIMIT 10')
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [tables, setTables] = useState<any[]>([])
  const [loadingColumns, setLoadingColumns] = useState<string | null>(null) // Table en cours de chargement des colonnes

  const testQueries = [
    {
      name: 'Requête autorisée',
      sql: 'SELECT id, nom, code FROM clients LIMIT 5',
      description: 'Requête simple sur la table clients',
      expected: 'success',
    },
    {
      name: 'Accès table système',
      sql: 'SELECT * FROM topsteel_auth.users',
      description: "Tentative d'accès à la table users",
      expected: 'blocked',
    },
    {
      name: 'Opération DELETE',
      sql: 'DELETE FROM clients WHERE id = 1',
      description: 'Tentative de suppression',
      expected: 'blocked',
    },
    {
      name: 'Accès information_schema',
      sql: 'SELECT * FROM information_schema.tables',
      description: "Tentative d'accès aux métadonnées",
      expected: 'blocked',
    },
    {
      name: 'UPDATE company_id',
      sql: 'UPDATE clients SET company_id = 999',
      description: 'Tentative de modification du tenant',
      expected: 'blocked',
    },
  ]

  const fetchTables = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await callClientApi('query-builder/schema/tables')

      if (response.ok) {
        const responseData = await response.json()

        let tables = []
        if (Array.isArray(responseData)) {
          tables = responseData
        } else if (responseData.data && Array.isArray(responseData.data)) {
          tables = responseData.data.map((table: any) => ({
            name: table.tableName,
            schema: table.schemaName,
            type: 'table',
            description: table.comment || `Table ${table.tableName}`,
            columns: [],
          }))
        } else {
          setError('Format de données inattendu')
          return
        }

        setTables(tables)
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        setError(`Erreur ${response.status}: ${errorData.error}`)
      }
    } catch (err) {
      setError(
        'Erreur lors de la récupération des tables: ' +
          (err instanceof Error ? err.message : 'Unknown')
      )
    } finally {
      setLoading(false)
    }
  }

  const loadTableColumns = async (tableName: string) => {
    setLoadingColumns(tableName)
    try {
      const response = await callClientApi(`query-builder/schema/tables/${tableName}/columns`)
      if (response.ok) {
        const columns = await response.json()

        setTables((prevTables) =>
          prevTables.map((table) =>
            table.name === tableName ? { ...table, columns: columns.data || columns } : table
          )
        )
      }
    } catch (_err) {
      // Silently handle errors - user will see loading state stop
    } finally {
      setLoadingColumns(null)
    }
  }

  const executeSql = async (sql?: string) => {
    const query = sql || sqlQuery
    setLoading(true)
    setError(null)
    setResults(null)

    try {
      const response = await callClientApi('query-builder/execute-sql', {
        method: 'POST',
        body: JSON.stringify({ sql: query, limit: 100 }),
      })

      const data = await response.json()

      if (response.ok) {
        setResults({
          status: 'success',
          data: data,
          count: data.length,
        })
      } else {
        setError(data.error || 'Erreur inconnue')
        setResults({
          status: 'error',
          statusCode: response.status,
          error: data.error,
        })
      }
    } catch (_err) {
      setError('Erreur de connexion')
      setResults({
        status: 'error',
        error: 'Erreur de connexion',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Test Sécurité Multi-Tenant</h1>
            <p className="text-muted-foreground">
              Vérification de l'isolation des données et de la sécurité multi-tenant
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="manual" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="manual">Test Manuel</TabsTrigger>
          <TabsTrigger value="automated">Tests Automatisés</TabsTrigger>
          <TabsTrigger value="tables">Tables Disponibles</TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Exécuteur SQL
              </CardTitle>
              <CardDescription>
                Testez manuellement des requêtes SQL pour vérifier l'isolation tenant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                placeholder="Entrez votre requête SQL..."
                className="font-mono text-sm h-32"
              />
              <Button onClick={() => executeSql()} disabled={loading} className="w-full">
                {loading ? 'Exécution...' : 'Exécuter la requête'}
              </Button>

              {error && (
                <Alert variant="destructive">
                  <ShieldAlert className="h-4 w-4" />
                  <AlertTitle>Erreur</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {results && results.status === 'success' && (
                <Alert>
                  <ShieldCheck className="h-4 w-4" />
                  <AlertTitle>Succès</AlertTitle>
                  <AlertDescription>{results.count} résultats retournés</AlertDescription>
                </Alert>
              )}

              {results?.data && (
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {Object.keys(results.data[0] || {}).map((key) => (
                          <th
                            key={key}
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {results.data.slice(0, 10).map((row: any, idx: number) => {
                        const rowId = row.id || Object.values(row).slice(0, 3).join('-') || `row-${idx}`;
                        return (
                          <tr key={rowId}>
                            {Object.entries(row).map(([columnName, value]) => (
                              <td
                                key={`${rowId}-${columnName}`}
                                className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                              >
                                {String(value)}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automated" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Tests de Sécurité Automatisés
              </CardTitle>
              <CardDescription>
                Vérification automatique des protections multi-tenant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {testQueries.map((test, idx) => (
                  <div key={test.name || `test-${idx}`} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold">{test.name}</h3>
                        <p className="text-sm text-muted-foreground">{test.description}</p>
                        <code className="text-xs bg-muted p-1 rounded mt-1 block">{test.sql}</code>
                      </div>
                      <Badge variant={test.expected === 'success' ? 'default' : 'destructive'}>
                        {test.expected === 'success' ? 'Autorisé' : 'Bloqué'}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => executeSql(test.sql)}
                      disabled={loading}
                    >
                      Tester
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tables" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Tables Accessibles
                  </CardTitle>
                  <CardDescription>Liste des tables disponibles pour votre tenant</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button onClick={fetchTables} disabled={loading} className="mb-4">
                {loading ? 'Chargement...' : 'Charger les tables'}
              </Button>

              {error && (
                <div className="mb-4 p-3 border border-red-200 rounded bg-red-50 text-red-700">
                  <strong>Erreur:</strong> {error}
                </div>
              )}

              {tables && tables.length > 0 ? (
                <div className="space-y-4">
                  <div className="mb-2 text-sm text-blue-600">
                    Affichage de {tables.length} tables
                  </div>
                  {tables.map((table, idx) => (
                    <div
                      key={table.name || table.tableName || `table-${idx}`}
                      className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{table.name}</h3>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 text-xs bg-gray-100 rounded">
                            {table.schema}
                          </span>
                          <button
                            className="px-2 py-1 text-xs border rounded hover:bg-gray-50"
                            onClick={() => loadTableColumns(table.name)}
                            disabled={loadingColumns === table.name}
                          >
                            {loadingColumns === table.name ? 'Chargement...' : 'Colonnes'}
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{table.description}</p>
                      <div className="flex items-center gap-2 text-sm">
                        {['clients', 'fournisseurs', 'materiaux', 'stocks', 'commandes'].includes(
                          table.name
                        ) ? (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                            🛡️ Multi-tenant
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                            🗄️ Système
                          </span>
                        )}
                        <span className="text-gray-500">
                          {table.columns?.length > 0
                            ? `${table.columns.length} colonnes`
                            : 'Colonnes non chargées'}
                        </span>
                      </div>

                      {table.columns && table.columns.length > 0 && (
                        <div className="mt-3 p-3 bg-gray-50 rounded">
                          <div className="text-xs font-medium text-gray-700 mb-2">
                            Colonnes ({table.columns.length})
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {table.columns.map((col: any, colIdx: number) => {
                              const isPrimaryKey = col.isPrimaryKey || col.primary
                              const isForeignKey = col.isForeignKey || col.foreign
                              const isCompanyId =
                                col.columnName === 'company_id' || col.name === 'company_id'

                              return (
                                <div
                                  key={colIdx}
                                  className={`
                                    inline-flex items-center gap-1 px-2 py-1 rounded text-xs border
                                    ${
                                      isPrimaryKey
                                        ? 'bg-blue-100 border-blue-300 text-blue-800'
                                        : isForeignKey
                                          ? 'bg-purple-100 border-purple-300 text-purple-800'
                                          : isCompanyId
                                            ? 'bg-green-100 border-green-300 text-green-800'
                                            : 'bg-white border-gray-200 text-gray-700'
                                    }
                                  `}
                                >
                                  <span className="font-mono font-medium">
                                    {col.columnName || col.name}
                                  </span>
                                  <span className="text-xs opacity-75">
                                    ({col.dataType || col.type})
                                  </span>
                                  {isPrimaryKey && (
                                    <span
                                      className="ml-1 text-blue-600 font-bold"
                                      title="Clé primaire"
                                    >
                                      🔑
                                    </span>
                                  )}
                                  {isForeignKey && (
                                    <span
                                      className="ml-1 text-purple-600 font-bold"
                                      title="Clé étrangère"
                                    >
                                      🔗
                                    </span>
                                  )}
                                  {isCompanyId && (
                                    <span
                                      className="ml-1 text-green-600 font-bold"
                                      title="Isolation multi-tenant"
                                    >
                                      🛡️
                                    </span>
                                  )}
                                  {col.nullable === false && !isPrimaryKey && (
                                    <span className="ml-1 text-red-500 text-xs" title="Non-null">
                                      *
                                    </span>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            <span className="font-medium">Légende:</span>
                            <span className="ml-2">🔑 Clé primaire</span>
                            <span className="ml-2">🔗 Clé étrangère</span>
                            {[
                              'clients',
                              'fournisseurs',
                              'materiaux',
                              'stocks',
                              'commandes',
                            ].includes(table.name) && <span className="ml-2">🛡️ Multi-tenant</span>}
                            <span className="ml-2">* Obligatoire</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune table trouvée</p>
                  <p className="text-sm">Les tables devraient apparaître ici après le chargement</p>
                </div>
              )}

              {!loading && tables.length === 0 && !error && (
                <div className="text-center py-8 text-muted-foreground">
                  <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune table chargée</p>
                  <p className="text-sm">Cliquez sur "Charger les tables" pour commencer</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
