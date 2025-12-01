'use client'

export const dynamic = 'force-dynamic'

import { Button, Card, CardContent, CardHeader, CardTitle, PageContainer, PageHeader, PageSection } from '@erp/ui'
import { Database, FlaskConical, Package, Table, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { callClientApi } from '../../../../utils/backend-api'

export default function QueryBuilderTestPage() {
  const router = useRouter()

  const createTestQueryBuilder = async () => {
    const testQueryBuilder = {
      name: 'Test Products Query',
      description: 'Query Builder de test pour les produits et catégories',
      database: 'default',
      mainTable: 'test_products',
      isPublic: true,
      maxRows: 500,
      settings: {
        enablePagination: true,
        pageSize: 50,
        enableSorting: true,
        enableFiltering: true,
        enableExport: true,
        exportFormats: ['csv', 'excel', 'json'],
      },
      columns: [
        {
          tableName: 'test_products',
          columnName: 'sku',
          alias: 'test_products.sku',
          label: 'SKU',
          dataType: 'varchar',
          isPrimaryKey: false,
          isForeignKey: false,
          isVisible: true,
          isFilterable: true,
          isSortable: true,
          displayOrder: 1,
        },
        {
          tableName: 'test_products',
          columnName: 'name',
          alias: 'test_products.name',
          label: 'Product Name',
          dataType: 'varchar',
          isPrimaryKey: false,
          isForeignKey: false,
          isVisible: true,
          isFilterable: true,
          isSortable: true,
          displayOrder: 2,
        },
        {
          tableName: 'test_categories',
          columnName: 'name',
          alias: 'test_categories.name',
          label: 'Category',
          dataType: 'varchar',
          isPrimaryKey: false,
          isForeignKey: false,
          isVisible: true,
          isFilterable: true,
          isSortable: true,
          displayOrder: 3,
        },
        {
          tableName: 'test_products',
          columnName: 'price',
          alias: 'test_products.price',
          label: 'Price',
          dataType: 'decimal',
          isPrimaryKey: false,
          isForeignKey: false,
          isVisible: true,
          isFilterable: true,
          isSortable: true,
          displayOrder: 4,
          format: {
            type: 'currency',
            decimals: 2,
          },
        },
        {
          tableName: 'test_products',
          columnName: 'stockQuantity',
          alias: 'test_products.stockQuantity',
          label: 'Stock',
          dataType: 'integer',
          isPrimaryKey: false,
          isForeignKey: false,
          isVisible: true,
          isFilterable: true,
          isSortable: true,
          displayOrder: 5,
        },
        {
          tableName: 'test_products',
          columnName: 'isActive',
          alias: 'test_products.isActive',
          label: 'Active',
          dataType: 'boolean',
          isPrimaryKey: false,
          isForeignKey: false,
          isVisible: true,
          isFilterable: true,
          isSortable: true,
          displayOrder: 6,
        },
      ],
      joins: [
        {
          fromTable: 'test_products',
          fromColumn: 'categoryId',
          toTable: 'test_categories',
          toColumn: 'id',
          joinType: 'INNER' as 'INNER' | 'LEFT' | 'RIGHT' | 'FULL',
          alias: 'category',
          order: 1,
        },
      ],
      calculatedFields: [
        {
          name: 'margin',
          label: 'Margin',
          description: 'Profit margin (price - cost)',
          expression: '[test_products.price] - [test_products.cost]',
          dataType: 'number',
          isVisible: true,
          displayOrder: 7,
          format: {
            type: 'currency',
            decimals: 2,
          },
        },
        {
          name: 'margin_percentage',
          label: 'Margin %',
          description: 'Profit margin percentage',
          expression:
            '(([test_products.price] - [test_products.cost]) / [test_products.price]) * 100',
          dataType: 'number',
          isVisible: true,
          displayOrder: 8,
          format: {
            type: 'percentage',
            decimals: 1,
          },
        },
      ],
    }

    try {
      const response = await callClientApi('query-builder', {
        method: 'POST',
        body: JSON.stringify(testQueryBuilder),
      })

      if (response?.ok) {
        const created = await response?.json()
        router?.push(`/query-builder/${created?.id}`)
      } else {
      }
    } catch (_error) {}
  }

  return (
    <PageContainer maxWidth="full" padding="default">
      <PageHeader
        title="Query Builder Test Environment"
        description="Créez un Query Builder de test avec des données d'exemple"
        icon={FlaskConical}
        iconBackground="bg-gradient-to-br from-emerald-500 to-teal-600"
      />

      <PageSection spacing="default">
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Tables de Test Disponibles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Table className="h-8 w-8 text-blue-500" />
                <div>
                  <h3 className="font-semibold">test_products</h3>
                  <p className="text-sm text-muted-foreground">
                    ~80 produits avec SKU, nom, prix, stock
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Package className="h-8 w-8 text-green-500" />
                <div>
                  <h3 className="font-semibold">test_categories</h3>
                  <p className="text-sm text-muted-foreground">
                    5 catégories (Électronique, Vêtements, etc.)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Users className="h-8 w-8 text-purple-500" />
                <div>
                  <h3 className="font-semibold">test_orders</h3>
                  <p className="text-sm text-muted-foreground">Commandes et lignes de commande</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fonctionnalités du Query Builder</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">✅ Sélection interactive des tables</li>
                <li className="flex items-center gap-2">✅ Configuration des jointures</li>
                <li className="flex items-center gap-2">✅ Drag & drop des colonnes</li>
                <li className="flex items-center gap-2">✅ Champs calculés personnalisés</li>
                <li className="flex items-center gap-2">✅ Prévisualisation SQL</li>
                <li className="flex items-center gap-2">✅ Exécution et affichage DataTable</li>
                <li className="flex items-center gap-2">✅ Configuration des permissions</li>
                <li className="flex items-center gap-2">✅ Export multi-formats</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button type="button" size="lg" onClick={createTestQueryBuilder}>
            Créer un Query Builder de Test
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            Cela créera un Query Builder pré-configuré avec les tables de test
          </p>
        </div>

        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">Structure du Query Builder de Test</h3>
          <div className="text-sm space-y-1">
            <p>
              <strong>Table principale :</strong> test_products
            </p>
            <p>
              <strong>Jointure :</strong> INNER JOIN test_categories ON test_products.categoryId =
              test_categories.id
            </p>
            <p>
              <strong>Colonnes :</strong> SKU, Nom, Catégorie, Prix, Stock, Statut
            </p>
            <p>
              <strong>Champs calculés :</strong> Marge (prix - coût), Marge % ((prix - coût) / prix)
            </p>
            <p>
              <strong>Limite :</strong> 500 lignes max
            </p>
          </div>
        </div>
      </PageSection>
    </PageContainer>
  )
}
