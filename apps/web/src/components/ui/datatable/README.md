# DataTable Avancé - Documentation

Un composant de tableau professionnel avec des fonctionnalités avancées pour les applications ERP.

## 🚀 Fonctionnalités Principales

### ✅ **Types de Colonnes Supportés**
- `text` - Texte avec validation regex
- `number` - Nombres avec min/max
- `boolean` - Cases à cocher  
- `date` / `datetime` - Sélecteurs de date
- `select` / `multiselect` - Listes déroulantes
- `formula` - Calculs automatiques Excel-like
- `custom` - Rendu personnalisé

### ✅ **Validation Avancée**
- Validation en temps réel
- Regex patterns
- Min/max pour nombres et textes
- Validation personnalisée
- Messages d'erreur contextuels
- Icônes de statut (✓ ⚠ ✗)

### ✅ **Excel-like Features**
- **Copy-Paste**: Ctrl+C / Ctrl+V depuis Excel
- **Formules**: `=A1+B1`, `=SUM(A:A)`, `=IF(A1>0,B1,C1)`
- **Export/Import**: Excel (.xlsx), CSV
- **Tri multi-colonnes**
- **Filtrage avancé**

### ✅ **Interface Utilisateur**
- **Drag & Drop** des colonnes
- **Édition inline** avec validation
- **Colonnes verrouillées** (non déplaçables)
- **Sauvegarde automatique** des préférences
- **Recherche globale**
- **Pagination** (optionnelle)

## 📋 Utilisation de Base

```tsx
import { DataTable } from '@/components/ui/datatable/DataTable'
import { ColumnConfig } from '@/components/ui/datatable/types'

interface Employee {
  id: number
  nom: string
  age: number
  email: string
  actif: boolean
}

const columns: ColumnConfig<Employee>[] = [
  {
    id: 'nom',
    key: 'nom',
    title: 'Nom',
    type: 'text',
    required: true,
    editable: true,
    validation: {
      minLength: 2,
      maxLength: 50,
      pattern: /^[a-zA-ZÀ-ÿ\s-]+$/
    }
  },
  {
    id: 'age',
    key: 'age', 
    title: 'Âge',
    type: 'number',
    editable: true,
    validation: { min: 18, max: 65 },
    format: { suffix: ' ans' }
  },
  {
    id: 'email',
    key: 'email',
    title: 'Email', 
    type: 'text',
    editable: true,
    validation: {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    }
  },
  {
    id: 'actif',
    key: 'actif',
    title: 'Actif',
    type: 'boolean',
    editable: true
  }
]

function MyComponent() {
  const [data, setData] = useState<Employee[]>([...])
  
  const handleCellEdit = (value: any, row: Employee, column: ColumnConfig<Employee>) => {
    // Mettre à jour les données
    setData(prevData => 
      prevData.map(item => 
        item.id === row.id 
          ? { ...item, [column.key]: value }
          : item
      )
    )
  }
  
  return (
    <DataTable
      data={data}
      columns={columns}
      keyField="id"
      tableId="employees" // Pour la persistance des paramètres
      editable
      sortable
      searchable
      selectable
      onCellEdit={handleCellEdit}
      actions={{
        create: () => console.log('Créer'),
        delete: (rows) => console.log('Supprimer', rows)
      }}
    />
  )
}
```

## 🔧 Configuration des Colonnes

### Propriétés de Base
```tsx
interface ColumnConfig<T> {
  id: string           // Identifiant unique
  key: keyof T         // Propriété de l'objet
  title: string        // Titre affiché
  type: ColumnType     // Type de données
  width?: number       // Largeur en pixels
  sortable?: boolean   // Activé par défaut
  searchable?: boolean // Activé par défaut  
  editable?: boolean   // Édition inline
  required?: boolean   // Champ obligatoire
  visible?: boolean    // Affichage (défaut: true)
  locked?: boolean     // Empêche le drag & drop
}
```

### Validation
```tsx
validation?: {
  min?: number              // Min pour nombres/longueur
  max?: number              // Max pour nombres/longueur
  minLength?: number        // Longueur min pour texte
  maxLength?: number        // Longueur max pour texte
  pattern?: RegExp          // Expression régulière
  custom?: (value) => string | null  // Validation personnalisée
}
```

### Formatage
```tsx
format?: {
  decimals?: number         // Décimales pour nombres
  currency?: string         // Devise ('EUR', 'USD'...)
  dateFormat?: string       // Format de date
  prefix?: string           // Préfixe
  suffix?: string           // Suffixe
  transform?: (value) => string  // Transformation personnalisée
}
```

### Options Select
```tsx
options?: Array<{
  value: any              // Valeur
  label: string          // Libellé
  color?: string         // Couleur pour badges
}>
```

### Formules
```tsx
formula?: {
  expression: string      // Ex: "=A1+B1", "=SUM(A:A)"
  dependencies: string[]  // Colonnes dépendantes
}
```

## 🎨 Exemples de Colonnes Avancées

### Select avec Couleurs
```tsx
{
  id: 'statut',
  key: 'statut',
  title: 'Statut',
  type: 'select',
  editable: true,
  options: [
    { value: 'actif', label: 'Actif', color: '#10b981' },
    { value: 'inactif', label: 'Inactif', color: '#6b7280' },
    { value: 'suspendu', label: 'Suspendu', color: '#ef4444' }
  ]
}
```

### Formule Calculée
```tsx
{
  id: 'total',
  key: 'total',
  title: 'Total HT',
  type: 'formula',
  formula: {
    expression: '=B1*C1', // Quantité × Prix unitaire
    dependencies: ['quantity', 'unitPrice']
  },
  format: { currency: 'EUR' }
}
```

### Validation Personnalisée
```tsx
{
  id: 'email',
  key: 'email',
  title: 'Email',
  type: 'text', 
  editable: true,
  validation: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    custom: (value) => {
      if (value && !value.includes('@')) {
        return 'Format email invalide'
      }
      return null
    }
  }
}
```

### Rendu Personnalisé
```tsx
{
  id: 'competences',
  key: 'competences',
  title: 'Compétences',
  type: 'multiselect',
  render: (value) => (
    <div className="flex gap-1">
      {value?.slice(0, 2).map((skill, i) => (
        <Badge key={i} variant="outline">{skill}</Badge>
      ))}
      {value?.length > 2 && <span>+{value.length - 2}</span>}
    </div>
  )
}
```

## 🎯 Actions et Événements

```tsx
<DataTable
  // ... autres props
  actions={{
    create: () => handleCreate(),
    edit: (row) => handleEdit(row), 
    delete: (rows) => handleDelete(rows)
  }}
  onCellEdit={handleCellEdit}
  onRowClick={handleRowClick}
  onRowDoubleClick={handleRowDoubleClick}
  onSelectionChange={handleSelectionChange}
  onSettingsChange={handleSettingsChange}
/>
```

## 🔄 Persistance des Paramètres

Les paramètres utilisateur (ordre des colonnes, largeurs, visibilité) sont automatiquement sauvegardés dans le localStorage quand `tableId` est fourni :

```tsx
<DataTable
  tableId="mon-tableau-unique"
  userId="user123" // Optionnel pour isoler par utilisateur
  // ...
/>
```

## 🎭 Intégration avec Traductions

Pour les applications multilingues, utilisez `TranslationDataTable` :

```tsx
import { TranslationDataTable } from '@/components/admin/TranslationDataTable'

<TranslationDataTable
  entries={translations}
  filter={filter}
  loading={loading}
  onEdit={handleEdit}
  onCellEdit={handleCellEdit}
/>
```

## ⚡ Performance

- **Virtualisation** : Supporte plusieurs milliers de lignes
- **Mémorisation** : Colonnes et données optimisées avec `useMemo`
- **Rendu conditionnel** : Seules les cellules visibles sont mises à jour
- **Pagination** : Optionnelle pour de très gros datasets

## 🛠️ Extensions Possibles

Le composant est conçu pour être extensible :
- Nouveaux types de colonnes
- Validateurs personnalisés
- Rendus de cellules spécialisés
- Intégrations avec APIs externes
- Thèmes personnalisés

## 🔗 Fichiers Principaux

- `DataTable.tsx` - Composant principal
- `types.ts` - Définitions TypeScript
- `InlineEditor.tsx` - Éditeurs de cellules
- `validation-utils.ts` - Validation
- `clipboard-utils.ts` - Copy-paste Excel
- `formula-engine.ts` - Moteur de formules
- `settings-manager.ts` - Persistance paramètres
- `drag-drop-utils.ts` - Réorganisation colonnes

## 📞 Support

Pour toute question ou amélioration, consultez le code source ou créez une issue.