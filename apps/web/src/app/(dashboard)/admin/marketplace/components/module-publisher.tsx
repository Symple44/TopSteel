'use client'

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  useFormFieldIds,
} from '@erp/ui'
import { Eye, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from '@/hooks/use-toast'

interface ModuleForm {
  moduleKey: string
  displayName: string
  description: string
  shortDescription: string
  category: string
  version: string
  publisher: string
  icon: string
  pricing: {
    type: string
    amount: number
    currency: string
    period: string
    description: string
  }
  dependencies: string[]
  permissions: Array<{
    moduleId: string
    action: string
    name: string
    description: string
  }>
  menuConfiguration: Array<{
    title: string
    type: string
    icon: string
    programId: string
  }>
}

const INITIAL_FORM: ModuleForm = {
  moduleKey: '',
  displayName: '',
  description: '',
  shortDescription: '',
  category: '',
  version: '1.0.0',
  publisher: 'TopSteel Solutions',
  icon: '',
  pricing: {
    type: 'FREE',
    amount: 0,
    currency: 'EUR',
    period: 'MONTH',
    description: '',
  },
  dependencies: [],
  permissions: [],
  menuConfiguration: [],
}

const CATEGORIES = [
  { value: 'HR', label: 'Ressources Humaines' },
  { value: 'PROCUREMENT', label: 'Achats & Approvisionnement' },
  { value: 'ANALYTICS', label: 'Analytique & BI' },
  { value: 'INTEGRATION', label: 'Intégrations' },
  { value: 'QUALITY', label: 'Qualité' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'FINANCE', label: 'Finance' },
]

const PRICING_TYPES = [
  { value: 'FREE', label: 'Gratuit' },
  { value: 'ONE_TIME', label: 'Paiement unique' },
  { value: 'SUBSCRIPTION', label: 'Abonnement' },
  { value: 'COMMISSION', label: 'Commission' },
  { value: 'USAGE_BASED', label: 'Basé sur usage' },
]

const MENU_TYPES = [
  { value: 'FOLDER', label: 'Dossier' },
  { value: 'PROGRAM', label: 'Programme' },
  { value: 'LINK', label: 'Lien externe' },
  { value: 'DATA_VIEW', label: 'Vue de données' },
]

export function ModulePublisher() {
  const [form, setForm] = useState<ModuleForm>(INITIAL_FORM)
  const [activeTab, setActiveTab] = useState('basic')
  const [showPreview, setShowPreview] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)

  // Generate unique IDs for form fields
  const fieldIds = useFormFieldIds([
    'moduleKey',
    'displayName',
    'shortDescription',
    'description',
    'version',
    'icon',
  ])

  const handleInputChange = (
    field: keyof ModuleForm,
    value: string | number | boolean | string[]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handlePricingChange = (field: string, value: string | number) => {
    setForm((prev) => ({
      ...prev,
      pricing: { ...prev.pricing, [field]: value },
    }))
  }

  const addDependency = () => {
    const dependency = prompt('Clé du module requis:')
    if (dependency && !form?.dependencies?.includes(dependency)) {
      setForm((prev) => ({
        ...prev,
        dependencies: [...prev.dependencies, dependency],
      }))
    }
  }

  const removeDependency = (index: number) => {
    setForm((prev) => ({
      ...prev,
      dependencies: prev?.dependencies?.filter((_, i) => i !== index),
    }))
  }

  const addPermission = () => {
    const permission = {
      moduleId: form?.moduleKey?.toUpperCase(),
      action: 'VIEW',
      name: '',
      description: '',
    }
    setForm((prev) => ({
      ...prev,
      permissions: [...prev.permissions, permission],
    }))
  }

  const updatePermission = (index: number, field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev?.permissions?.map((perm, i) =>
        i === index ? { ...perm, [field]: value } : perm
      ),
    }))
  }

  const removePermission = (index: number) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev?.permissions?.filter((_, i) => i !== index),
    }))
  }

  const addMenuItem = () => {
    const menuItem = {
      title: '',
      type: 'PROGRAM',
      icon: '',
      programId: '',
    }
    setForm((prev) => ({
      ...prev,
      menuConfiguration: [...prev.menuConfiguration, menuItem],
    }))
  }

  const updateMenuItem = (index: number, field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      menuConfiguration: prev?.menuConfiguration?.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }))
  }

  const removeMenuItem = (index: number) => {
    setForm((prev) => ({
      ...prev,
      menuConfiguration: prev?.menuConfiguration?.filter((_, i) => i !== index),
    }))
  }

  const handlePublish = async () => {
    if (!form.moduleKey || !form.displayName || !form.category) {
      toast({
        title: 'Erreur de validation',
        description: 'Veuillez remplir tous les champs obligatoires.',
        variant: 'destructive',
      })
      return
    }

    setIsPublishing(true)

    // Simulation de publication
    setTimeout(() => {
      setIsPublishing(false)
      toast({
        title: 'Module publié',
        description: `${form.displayName} a été publié avec succès sur la marketplace.`,
      })
      setForm(INITIAL_FORM)
      setActiveTab('basic')
    }, 2000)
  }

  const handleSaveDraft = () => {
    toast({
      title: 'Brouillon sauvegardé',
      description: 'Votre module a été sauvegardé en tant que brouillon.',
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Publier un Module</h2>
          <p className="text-muted-foreground">
            Créez et publiez votre module sur la marketplace TopSteel
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={() => setShowPreview(true)}>
            <Eye className="mr-2 h-4 w-4" />
            Prévisualiser
          </Button>
          <Button type="button" variant="outline" onClick={handleSaveDraft}>
            Sauvegarder brouillon
          </Button>
          <Button type="button" onClick={handlePublish} disabled={isPublishing}>
            {isPublishing ? 'Publication...' : 'Publier'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">Informations</TabsTrigger>
          <TabsTrigger value="pricing">Tarification</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="menu">Menu</TabsTrigger>
          <TabsTrigger value="advanced">Avancé</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations de Base</CardTitle>
              <CardDescription>Décrivez votre module et ses fonctionnalités</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={fieldIds.moduleKey}>Clé du module *</Label>
                  <Input
                    id={fieldIds.moduleKey}
                    placeholder="ex: hr-recruitment-tool"
                    value={form.moduleKey}
                    onChange={(e) => handleInputChange('moduleKey', e?.target?.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Identifiant unique (lettres, chiffres, tirets)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={fieldIds.displayName}>Nom d'affichage *</Label>
                  <Input
                    id={fieldIds.displayName}
                    placeholder="ex: Outil de Recrutement RH"
                    value={form.displayName}
                    onChange={(e) => handleInputChange('displayName', e?.target?.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={fieldIds.shortDescription}>Description courte</Label>
                <Input
                  id={fieldIds.shortDescription}
                  placeholder="Description en une ligne"
                  value={form.shortDescription}
                  onChange={(e) => handleInputChange('shortDescription', e?.target?.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={fieldIds.description}>Description complète *</Label>
                <Textarea
                  id={fieldIds.description}
                  placeholder="Décrivez en détail les fonctionnalités et avantages de votre module..."
                  value={form.description}
                  onChange={(e) => handleInputChange('description', e?.target?.value)}
                  rows={4}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="category">Catégorie *</Label>
                  <Select
                    value={form.category}
                    onValueChange={(value) => handleInputChange('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES?.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={fieldIds.version}>Version</Label>
                  <Input
                    id={fieldIds.version}
                    value={form.version}
                    onChange={(e) => handleInputChange('version', e?.target?.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={fieldIds.icon}>Icône</Label>
                  <Input
                    id={fieldIds.icon}
                    placeholder="ex: Users"
                    value={form.icon}
                    onChange={(e) => handleInputChange('icon', e?.target?.value)}
                  />
                  <p className="text-xs text-muted-foreground">Nom d'icône Lucide React</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Modèle Tarifaire</CardTitle>
              <CardDescription>Définissez comment votre module sera facturé</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Type de tarification</Label>
                <Select
                  value={form?.pricing?.type}
                  onValueChange={(value) => handlePricingChange('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRICING_TYPES?.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {form?.pricing?.type !== 'FREE' && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Montant</Label>
                    <Input
                      type="number"
                      value={form?.pricing?.amount}
                      onChange={(e) => handlePricingChange('amount', Number(e?.target?.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Devise</Label>
                    <Select
                      value={form?.pricing?.currency}
                      onValueChange={(value) => handlePricingChange('currency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {form?.pricing.type === 'SUBSCRIPTION' && (
                <div className="space-y-2">
                  <Label>Période</Label>
                  <Select
                    value={form?.pricing?.period}
                    onValueChange={(value) => handlePricingChange('period', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MONTH">Mensuel</SelectItem>
                      <SelectItem value="YEAR">Annuel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Description tarifaire</Label>
                <Textarea
                  placeholder="Détails sur la tarification, conditions particulières..."
                  value={form?.pricing?.description}
                  onChange={(e) => handlePricingChange('description', e?.target?.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Permissions</CardTitle>
              <CardDescription>
                Définissez les permissions nécessaires pour votre module
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Permissions requises ({form?.permissions?.length})
                </p>
                <Button type="button" size="sm" onClick={addPermission}>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter permission
                </Button>
              </div>

              <div className="space-y-3">
                {form?.permissions?.map((permission, index) => (
                  <Card key={`permission-${permission?.action}-${index}`}>
                    <CardContent className="pt-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Action</Label>
                          <Input
                            placeholder="ex: VIEW, CREATE, DELETE"
                            value={permission?.action}
                            onChange={(e) => updatePermission(index, 'action', e?.target?.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Nom</Label>
                          <Input
                            placeholder="ex: Voir les candidatures"
                            value={permission?.name}
                            onChange={(e) => updatePermission(index, 'name', e?.target?.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2 mt-4">
                        <Label>Description</Label>
                        <div className="flex gap-2">
                          <Textarea
                            placeholder="Description de la permission..."
                            value={permission?.description}
                            onChange={(e) =>
                              updatePermission(index, 'description', e?.target?.value)
                            }
                            rows={2}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removePermission(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {form?.permissions?.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune permission définie
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="menu" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration Menu</CardTitle>
              <CardDescription>Définissez les éléments de menu pour votre module</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Éléments de menu ({form?.menuConfiguration?.length})
                </p>
                <Button type="button" size="sm" onClick={addMenuItem}>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter élément
                </Button>
              </div>

              <div className="space-y-3">
                {form?.menuConfiguration?.map((item, index) => (
                  <Card key={`menu-item-${item.title}-${index}`}>
                    <CardContent className="pt-4">
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label>Titre</Label>
                          <Input
                            placeholder="ex: Gestion RH"
                            value={item.title}
                            onChange={(e) => updateMenuItem(index, 'title', e?.target?.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Type</Label>
                          <Select
                            value={item.type}
                            onValueChange={(value) => updateMenuItem(index, 'type', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {MENU_TYPES?.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Icône</Label>
                          <Input
                            placeholder="ex: Users"
                            value={item.icon}
                            onChange={(e) => updateMenuItem(index, 'icon', e?.target?.value)}
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <div className="flex-1 space-y-2">
                          <Label>URL/Programme ID</Label>
                          <Input
                            placeholder="ex: /hr/recruitment"
                            value={item.programId}
                            onChange={(e) => updateMenuItem(index, 'programId', e?.target?.value)}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeMenuItem(index)}
                          className="mt-7"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {form?.menuConfiguration?.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun élément de menu défini
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres Avancés</CardTitle>
              <CardDescription>Dépendances et configuration technique</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <Label>Dépendances</Label>
                  <Button type="button" size="sm" variant="outline" onClick={addDependency}>
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter dépendance
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {form?.dependencies?.map((dep, index) => (
                    <Badge
                      key={`dep-${dep}`}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {dep}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeDependency(index)}
                      />
                    </Badge>
                  ))}
                </div>

                {form?.dependencies?.length === 0 && (
                  <p className="text-sm text-muted-foreground">Aucune dépendance définie</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Éditeur</Label>
                <Input
                  value={form.publisher}
                  onChange={(e) => handleInputChange('publisher', e?.target?.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de prévisualisation */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Prévisualisation du Module</DialogTitle>
            <DialogDescription>
              Aperçu de votre module tel qu'il apparaîtra dans la marketplace
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{form.displayName || 'Nom du module'}</h3>
              <p className="text-sm text-muted-foreground">
                par {form.publisher} • v{form.version}
              </p>
            </div>

            <p className="text-sm">
              {form.shortDescription || form.description || 'Description du module...'}
            </p>

            <div className="flex items-center gap-4">
              {form.category && <Badge variant="outline">{form.category}</Badge>}
              <span className="text-sm font-medium">
                {form?.pricing.type === 'FREE'
                  ? 'Gratuit'
                  : form?.pricing.type === 'SUBSCRIPTION'
                    ? `${form?.pricing?.amount}€/${form?.pricing?.period === 'MONTH' ? 'mois' : 'an'}`
                    : 'Prix sur demande'}
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
