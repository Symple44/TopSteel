'use client'

export const dynamic = 'force-dynamic'

import { useMemo, useState } from 'react'
import {
  CalendarView,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardsView,
  DataTable,
  HierarchicalDataTable,
  ImportDialog,
  KanbanView,
  LocalAdapter,
  MapView,
  PageContainer,
  PageHeader,
  PageSection,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TimelineView,
  useDataAdapter,
  useDataViews,
  type ColumnConfig,
  type MapMarker,
  type ValidationSchema,
} from '@erp/ui'
import {
  Calendar,
  Clock,
  Database,
  Grid3X3,
  Import,
  Kanban,
  Map,
  Settings2,
  Table,
  TableProperties,
  TreePine,
} from 'lucide-react'

// =============================================================================
// DONNÉES DE DÉMONSTRATION
// =============================================================================

interface DemoUser extends Record<string, unknown> {
  id: string
  name: string
  email: string
  role: string
  status: string
  age: number
  salary: number
  department: string
  hireDate: string
  isActive: boolean
  lat: number
  lng: number
  city: string
}

const demoData: DemoUser[] = [
  {
    id: '1',
    name: 'Jean Dupont',
    email: 'jean.dupont@example.com',
    role: 'Développeur',
    status: 'En cours',
    age: 32,
    salary: 45000,
    department: 'IT',
    hireDate: '2023-01-15',
    isActive: true,
    lat: 48.8566,
    lng: 2.3522,
    city: 'Paris',
  },
  {
    id: '2',
    name: 'Marie Martin',
    email: 'marie.martin@example.com',
    role: 'Designer',
    status: 'Terminé',
    age: 28,
    salary: 42000,
    department: 'Design',
    hireDate: '2023-03-20',
    isActive: true,
    lat: 45.764,
    lng: 4.8357,
    city: 'Lyon',
  },
  {
    id: '3',
    name: 'Pierre Bernard',
    email: 'pierre.bernard@example.com',
    role: 'Manager',
    status: 'À faire',
    age: 45,
    salary: 65000,
    department: 'Management',
    hireDate: '2022-06-10',
    isActive: true,
    lat: 43.2965,
    lng: 5.3698,
    city: 'Marseille',
  },
  {
    id: '4',
    name: 'Sophie Petit',
    email: 'sophie.petit@example.com',
    role: 'Développeur',
    status: 'En attente',
    age: 35,
    salary: 52000,
    department: 'IT',
    hireDate: '2023-09-01',
    isActive: false,
    lat: 43.6047,
    lng: 1.4442,
    city: 'Toulouse',
  },
  {
    id: '5',
    name: 'Lucas Moreau',
    email: 'lucas.moreau@example.com',
    role: 'Analyste',
    status: 'En cours',
    age: 29,
    salary: 48000,
    department: 'Finance',
    hireDate: '2024-01-05',
    isActive: true,
    lat: 47.2184,
    lng: -1.5536,
    city: 'Nantes',
  },
  {
    id: '6',
    name: 'Emma Leroy',
    email: 'emma.leroy@example.com',
    role: 'RH',
    status: 'Terminé',
    age: 38,
    salary: 55000,
    department: 'RH',
    hireDate: '2022-11-15',
    isActive: true,
    lat: 44.8378,
    lng: -0.5792,
    city: 'Bordeaux',
  },
]

// Données hiérarchiques - utilise le type HierarchicalItem du package UI
interface HierarchicalItemData {
  id: string
  parent_id: string | null
  name: string
  type: string
  value: number
  status: string
  level?: number
  display_order?: number
  [key: string]: string | number | boolean | null | undefined
}

const hierarchicalData: HierarchicalItemData[] = [
  { id: '1', parent_id: null, name: 'Direction Générale', type: 'Département', value: 1000000, status: 'Actif' },
  { id: '2', parent_id: '1', name: 'Finance', type: 'Service', value: 250000, status: 'Actif' },
  { id: '3', parent_id: '1', name: 'IT', type: 'Service', value: 350000, status: 'Actif' },
  { id: '4', parent_id: '2', name: 'Comptabilité', type: 'Équipe', value: 100000, status: 'Actif' },
  { id: '5', parent_id: '2', name: 'Contrôle de gestion', type: 'Équipe', value: 150000, status: 'Actif' },
  { id: '6', parent_id: '3', name: 'Développement', type: 'Équipe', value: 200000, status: 'Actif' },
  { id: '7', parent_id: '3', name: 'Infrastructure', type: 'Équipe', value: 150000, status: 'Actif' },
  { id: '8', parent_id: '6', name: 'Frontend', type: 'Sous-équipe', value: 100000, status: 'Actif' },
  { id: '9', parent_id: '6', name: 'Backend', type: 'Sous-équipe', value: 100000, status: 'Actif' },
]

// =============================================================================
// CONFIGURATION DES COLONNES
// =============================================================================

const columns: ColumnConfig<DemoUser>[] = [
  {
    id: 'name',
    key: 'name',
    title: 'Nom',
    type: 'text',
    sortable: true,
    filterable: true,
    editable: true,
    width: 180,
  },
  {
    id: 'email',
    key: 'email',
    title: 'Email',
    type: 'text',
    sortable: true,
    filterable: true,
    width: 220,
  },
  {
    id: 'role',
    key: 'role',
    title: 'Rôle',
    type: 'select',
    sortable: true,
    filterable: true,
    editable: true,
    width: 140,
    options: [
      { value: 'Développeur', label: 'Développeur', color: '#3b82f6' },
      { value: 'Designer', label: 'Designer', color: '#8b5cf6' },
      { value: 'Manager', label: 'Manager', color: '#10b981' },
      { value: 'Analyste', label: 'Analyste', color: '#f59e0b' },
      { value: 'RH', label: 'RH', color: '#ec4899' },
    ],
  },
  {
    id: 'status',
    key: 'status',
    title: 'Statut',
    type: 'select',
    sortable: true,
    filterable: true,
    editable: true,
    width: 120,
    options: [
      { value: 'À faire', label: 'À faire', color: '#ef4444' },
      { value: 'En cours', label: 'En cours', color: '#f59e0b' },
      { value: 'En attente', label: 'En attente', color: '#6b7280' },
      { value: 'Terminé', label: 'Terminé', color: '#10b981' },
    ],
  },
  {
    id: 'salary',
    key: 'salary',
    title: 'Salaire',
    type: 'number',
    sortable: true,
    filterable: true,
    width: 120,
    format: { currency: 'EUR', decimals: 0 },
  },
  {
    id: 'hireDate',
    key: 'hireDate',
    title: 'Date embauche',
    type: 'date',
    sortable: true,
    filterable: true,
    width: 130,
  },
  {
    id: 'isActive',
    key: 'isActive',
    title: 'Actif',
    type: 'boolean',
    sortable: true,
    filterable: true,
    width: 80,
  },
  {
    id: 'city',
    key: 'city',
    title: 'Ville',
    type: 'text',
    sortable: true,
    filterable: true,
    width: 120,
  },
  {
    id: 'lat',
    key: 'lat',
    title: 'Latitude',
    type: 'number',
    sortable: true,
    width: 100,
  },
  {
    id: 'lng',
    key: 'lng',
    title: 'Longitude',
    type: 'number',
    sortable: true,
    width: 100,
  },
]

const hierarchicalColumns: ColumnConfig<HierarchicalItemData>[] = [
  { id: 'name', key: 'name', title: 'Nom', type: 'text', editable: true },
  { id: 'type', key: 'type', title: 'Type', type: 'text' },
  { id: 'value', key: 'value', title: 'Budget', type: 'number', format: { currency: 'EUR', decimals: 0 } },
  { id: 'status', key: 'status', title: 'Statut', type: 'text' },
]

// =============================================================================
// COMPOSANT PRINCIPAL
// =============================================================================

export default function DataTableTestPage() {
  const [data, setData] = useState(demoData)
  const [hierarchyData, setHierarchyData] = useState<HierarchicalItemData[]>(hierarchicalData)

  // Hook pour les vues alternatives
  const { kanbanData, cardsData, timelineData, calendarData, mapData } = useDataViews(data, columns, 'id')

  // Data Adapter - LocalAdapter avec les données
  const adapter = useMemo(() => new LocalAdapter<DemoUser>({ data, keyField: 'id' }), [data])
  const { data: adapterData, isLoading: adapterLoading, refetch } = useDataAdapter(adapter)

  // Validation schema for import
  const importValidationSchema: ValidationSchema = {
    name: { required: true, type: 'string' },
    email: { required: true, type: 'email' },
    age: { type: 'number', min: 18, max: 100 },
    salary: { type: 'number', min: 0 },
  }

  // Import handler
  const handleImport = (result: { success: boolean; data: DemoUser[]; errors: unknown[] }) => {
    if (result.success && result.data.length > 0) {
      setData((prev) => [...prev, ...result.data])
      console.log('Imported', result.data.length, 'records')
    }
  }

  // Données pour la carte (avec coordonnées GPS)
  const mapMarkers: MapMarker[] = data.map((user) => ({
    id: user.id,
    lat: user.lat,
    lng: user.lng,
    title: user.name,
    subtitle: user.city,
    description: `${user.role} - ${user.department}`,
    category: user.role,
    color: user.role === 'Développeur' ? '#3b82f6' : user.role === 'Designer' ? '#8b5cf6' : user.role === 'Manager' ? '#10b981' : user.role === 'Analyste' ? '#f59e0b' : '#ec4899',
    meta: [
      { label: 'Email', value: user.email },
      { label: 'Salaire', value: `${user.salary.toLocaleString()} €` },
      { label: 'Statut', value: user.status },
    ],
  }))

  const handleCellEdit = (row: DemoUser, column: ColumnConfig<DemoUser>, value: unknown) => {
    setData((prev) =>
      prev.map((item) => (item.id === row.id ? { ...item, [column.key]: value } : item))
    )
  }

  return (
    <PageContainer maxWidth="full" padding="default">
      <PageHeader
        title="Test DataTable"
        description="Démonstration complète de toutes les variantes du composant DataTable"
        icon={Table}
        iconBackground="bg-gradient-to-br from-violet-600 to-purple-700"
      />

      <PageSection spacing="default">
        <Tabs defaultValue="standard" className="w-full">
          <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10 mb-6">
            <TabsTrigger value="standard" className="flex items-center gap-2">
              <TableProperties className="h-4 w-4" />
              <span className="hidden sm:inline">Standard</span>
            </TabsTrigger>
            <TabsTrigger value="preset" className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              <span className="hidden sm:inline">Presets</span>
            </TabsTrigger>
            <TabsTrigger value="adapter" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Adapter</span>
            </TabsTrigger>
            <TabsTrigger value="import" className="flex items-center gap-2">
              <Import className="h-4 w-4" />
              <span className="hidden sm:inline">Import</span>
            </TabsTrigger>
            <TabsTrigger value="hierarchical" className="flex items-center gap-2">
              <TreePine className="h-4 w-4" />
              <span className="hidden sm:inline">Hiérarchie</span>
            </TabsTrigger>
            <TabsTrigger value="kanban" className="flex items-center gap-2">
              <Kanban className="h-4 w-4" />
              <span className="hidden sm:inline">Kanban</span>
            </TabsTrigger>
            <TabsTrigger value="cards" className="flex items-center gap-2">
              <Grid3X3 className="h-4 w-4" />
              <span className="hidden sm:inline">Cartes</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Calendrier</span>
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Timeline</span>
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center gap-2">
              <Map className="h-4 w-4" />
              <span className="hidden sm:inline">Carte</span>
            </TabsTrigger>
          </TabsList>

          {/* DATATABLE STANDARD */}
          <TabsContent value="standard">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TableProperties className="h-5 w-5 text-blue-600" />
                  DataTable Standard
                </CardTitle>
                <CardDescription>
                  Tableau avec tri, filtres, recherche, sélection, édition et export
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <DataTable
                  data={data}
                  columns={columns}
                  keyField="id"
                  tableId="demo-table"
                  sortable
                  filterable
                  searchable
                  selectable
                  editable
                  exportable
                  pagination={{ page: 1, pageSize: 10, total: data.length }}
                  striped
                  bordered
                  hoverable
                  onCellEdit={handleCellEdit}
                  onRowClick={(row) => console.log('Click:', row)}
                  actions={[
                    { label: 'Voir', onClick: (row) => console.log('View:', row), variant: 'outline' },
                    { label: 'Supprimer', onClick: (row) => console.log('Delete:', row), variant: 'destructive' },
                  ]}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* PRESET EXAMPLES */}
          <TabsContent value="preset">
            <div className="space-y-6">
              {/* Preset Minimal */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings2 className="h-5 w-5 text-gray-600" />
                    Preset: Minimal
                  </CardTitle>
                  <CardDescription>
                    Table basique sans pagination, filtres, recherche - juste les données
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <DataTable
                    preset="minimal"
                    data={data.slice(0, 3)}
                    columns={columns.slice(0, 4)}
                    keyField="id"
                    tableId="preset-minimal"
                  />
                </CardContent>
              </Card>

              {/* Preset Standard */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings2 className="h-5 w-5 text-blue-600" />
                    Preset: Standard
                  </CardTitle>
                  <CardDescription>
                    Pagination, recherche, tri - idéal pour les tables CRUD
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <DataTable
                    preset="standard"
                    data={data}
                    columns={columns.slice(0, 5)}
                    keyField="id"
                    tableId="preset-standard"
                  />
                </CardContent>
              </Card>

              {/* Preset Advanced */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings2 className="h-5 w-5 text-purple-600" />
                    Preset: Advanced
                  </CardTitle>
                  <CardDescription>
                    Standard + filtres, export, sélection - pour l&apos;analyse de données
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <DataTable
                    preset="advanced"
                    data={data}
                    columns={columns}
                    keyField="id"
                    tableId="preset-advanced"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ADAPTER EXAMPLE */}
          <TabsContent value="adapter">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-indigo-600" />
                  Data Adapter - LocalAdapter
                </CardTitle>
                <CardDescription>
                  Utilisation du système d&apos;adapter pour abstraire les sources de données.
                  Supporte aussi RestAdapter, GraphQLAdapter, SupabaseAdapter.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-4 bg-muted/50 rounded-lg font-mono text-sm">
                  <pre className="text-xs overflow-x-auto">
{`// Exemple de code:
const adapter = new LocalAdapter({ data, idField: 'id' })
const { data, isLoading, refetch } = useDataAdapter(adapter)

// Ou avec REST API:
const restAdapter = new RestAdapter({
  baseUrl: '/api/users',
  authToken: token
})

// Ou avec Supabase:
const supabaseAdapter = new SupabaseAdapter({
  client: supabase,
  table: 'users'
})`}
                  </pre>
                </div>
                <div className="mb-4 flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    Status: {adapterLoading ? 'Chargement...' : `${adapterData?.length || 0} enregistrements`}
                  </span>
                  <button
                    onClick={() => refetch()}
                    className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90"
                  >
                    Rafraîchir
                  </button>
                </div>
                <DataTable
                  data={adapterData || []}
                  columns={columns.slice(0, 5)}
                  keyField="id"
                  tableId="adapter-demo"
                  sortable
                  searchable
                  pagination={{ page: 1, pageSize: 10, total: adapterData?.length || 0 }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* IMPORT EXAMPLE */}
          <TabsContent value="import">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Import className="h-5 w-5 text-green-600" />
                  Import CSV/Excel
                </CardTitle>
                <CardDescription>
                  Import de données depuis des fichiers CSV ou Excel avec validation et mapping de colonnes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Schéma de validation</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• <strong>name</strong>: Requis, texte</li>
                    <li>• <strong>email</strong>: Requis, format email valide</li>
                    <li>• <strong>age</strong>: Nombre entre 18 et 100</li>
                    <li>• <strong>salary</strong>: Nombre positif</li>
                  </ul>
                </div>
                <ImportDialog
                  columns={columns}
                  validationSchema={importValidationSchema}
                  onImport={handleImport}
                />
                <div className="mt-4 text-sm text-muted-foreground">
                  <p>Données actuelles: {data.length} enregistrements</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* DATATABLE HIÉRARCHIQUE */}
          <TabsContent value="hierarchical">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TreePine className="h-5 w-5 text-green-600" />
                  DataTable Hiérarchique
                </CardTitle>
                <CardDescription>
                  Données arborescentes avec expand/collapse et drag & drop
                </CardDescription>
              </CardHeader>
              <CardContent>
                <HierarchicalDataTable
                  data={hierarchyData}
                  columns={hierarchicalColumns}
                  config={{
                    hierarchyConfig: {
                      parentField: 'parent_id',
                      childrenField: 'children',
                      levelField: 'level',
                      orderField: 'display_order',
                      maxDepth: 5,
                      allowNesting: true,
                      defaultExpanded: true,
                      expandedNodes: ['1', '2', '3', '6'],
                    },
                    displayConfig: {
                      showLevelIndicators: true,
                      showConnectionLines: true,
                      compactMode: false,
                      indentSize: 24,
                      levelColors: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899'],
                      collapsibleGroups: true,
                    },
                    reorderConfig: {
                      enableDragDrop: true,
                      dragHandleVisible: true,
                      dropIndicatorStyle: 'line',
                      allowLevelChange: true,
                      autoExpand: true,
                      preserveHierarchy: true,
                    },
                    hierarchyFilters: {
                      showOnlyLevels: [],
                      hideEmptyParents: false,
                      filterPreservesHierarchy: true,
                      searchInChildren: true,
                    },
                  }}
                  onDataChange={(data) => setHierarchyData(data as HierarchicalItemData[])}
                  onRowClick={(item) => console.log('Clicked:', item)}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* VUE KANBAN */}
          <TabsContent value="kanban">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Kanban className="h-5 w-5 text-purple-600" />
                  Vue Kanban
                </CardTitle>
                <CardDescription>
                  Tableau Kanban groupé par statut
                </CardDescription>
              </CardHeader>
              <CardContent>
                <KanbanView
                  columns={kanbanData}
                  onCardClick={(card) => console.log('Card:', card)}
                  onCardEdit={(card) => console.log('Edit:', card)}
                  onAddCard={(colId) => console.log('Add to:', colId)}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* VUE CARTES */}
          <TabsContent value="cards">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Grid3X3 className="h-5 w-5 text-orange-600" />
                  Vue Cartes
                </CardTitle>
                <CardDescription>
                  Grille de cartes responsive
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CardsView
                  cards={cardsData}
                  cardsPerRow={3}
                  onCardClick={(card) => console.log('Card:', card)}
                  onCardEdit={(card) => console.log('Edit:', card)}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* VUE CALENDRIER */}
          <TabsContent value="calendar">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-red-600" />
                  Vue Calendrier
                </CardTitle>
                <CardDescription>
                  Calendrier mensuel avec événements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CalendarView
                  events={calendarData}
                  onEventClick={(event) => console.log('Event:', event)}
                  onEventEdit={(event) => console.log('Edit:', event)}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* VUE TIMELINE */}
          <TabsContent value="timeline">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-cyan-600" />
                  Vue Timeline
                </CardTitle>
                <CardDescription>
                  Timeline verticale groupée par mois
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TimelineView
                  items={timelineData}
                  onItemClick={(item) => console.log('Item:', item)}
                  onItemEdit={(item) => console.log('Edit:', item)}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* VUE CARTE */}
          <TabsContent value="map">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Map className="h-5 w-5 text-emerald-600" />
                  Vue Carte (OpenStreetMap)
                </CardTitle>
                <CardDescription>
                  Carte interactive avec les localisations des employés
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MapView
                  markers={mapMarkers}
                  height="500px"
                  onMarkerClick={(marker) => console.log('Marker:', marker)}
                  onMarkerEdit={(marker) => console.log('Edit:', marker)}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* TYPES DE COLONNES */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Types de Colonnes Supportés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="font-mono font-medium">text</div>
                <div className="text-muted-foreground text-xs">Texte simple</div>
              </div>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="font-mono font-medium">number</div>
                <div className="text-muted-foreground text-xs">Nombres</div>
              </div>
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="font-mono font-medium">boolean</div>
                <div className="text-muted-foreground text-xs">Checkbox</div>
              </div>
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="font-mono font-medium">date</div>
                <div className="text-muted-foreground text-xs">Date</div>
              </div>
              <div className="p-3 bg-pink-50 border border-pink-200 rounded-lg">
                <div className="font-mono font-medium">select</div>
                <div className="text-muted-foreground text-xs">Liste</div>
              </div>
              <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
                <div className="font-mono font-medium">multiselect</div>
                <div className="text-muted-foreground text-xs">Multi-sélection</div>
              </div>
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="font-mono font-medium">richtext</div>
                <div className="text-muted-foreground text-xs">HTML</div>
              </div>
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                <div className="font-mono font-medium">formula</div>
                <div className="text-muted-foreground text-xs">Calculé</div>
              </div>
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="font-mono font-medium">datetime</div>
                <div className="text-muted-foreground text-xs">Date + Heure</div>
              </div>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="font-mono font-medium">custom</div>
                <div className="text-muted-foreground text-xs">Personnalisé</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </PageSection>
    </PageContainer>
  )
}
