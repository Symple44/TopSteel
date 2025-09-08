'use client'

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@erp/ui'
import { Building2, Check, Eye, Layout, Search, Users, Zap } from 'lucide-react'
import React, { useState } from 'react'
import { useAppearanceSettings } from '@/hooks/use-appearance-settings'
import { useTemplates } from '@/hooks/use-templates'
import {
  predefinedTemplates,
  searchTemplates,
  type Template,
  templateCategories,
} from '@/lib/templates/predefined-templates'
import { cn } from '@/lib/utils'

interface TemplateSelectorProps {
  className?: string
}

export function TemplateSelector({ className }: TemplateSelectorProps) {
  const { settings: _settings } = useAppearanceSettings()
  const { currentTemplate: _currentTemplate, isTemplateApplied, applyTemplate } = useTemplates()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [_previewTemplate, setPreviewTemplate] = useState<Template | null>(null)

  const filteredTemplates = searchTemplates(
    searchQuery,
    selectedCategory === 'all' ? undefined : selectedCategory
  )

  const handleApplyTemplate = async (template: Template) => {
    try {
      await applyTemplate(template)
    } catch (_error) {}
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'business':
        return Building2
      case 'role':
        return Users
      case 'productivity':
        return Zap
      case 'accessibility':
        return Eye
      default:
        return Layout
    }
  }

  const _getThemeIcon = (theme: string) => {
    switch (theme) {
      case 'light':
        return '☀️'
      case 'dark':
        return '🌙'
      case 'vibrant':
        return '🎨'
      default:
        return '💻'
    }
  }

  const _getAccentColorPreview = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
      orange: 'bg-orange-500',
      pink: 'bg-pink-500',
      red: 'bg-red-500',
    }
    return colorMap[color as keyof typeof colorMap] || 'bg-blue-500'
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* En-tête avec recherche */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Templates d'Interface</h2>
          <p className="text-muted-foreground mt-1">
            Choisissez un template prédéfini pour personnaliser rapidement votre interface
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un template..."
            value={searchQuery}
            onChange={(e: unknown) => setSearchQuery(e?.target?.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Navigation par catégories */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            Tous
          </TabsTrigger>
          {Object.entries(templateCategories).map(([key, category]) => {
            const Icon = getCategoryIcon(key)
            return (
              <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {category.name}
              </TabsTrigger>
            )
          })}
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {Object.entries(templateCategories).map(([categoryKey, category]) => {
            const categoryTemplates = predefinedTemplates?.filter((t) => t.category === categoryKey)
            if (searchQuery && !categoryTemplates?.some((t) => filteredTemplates?.includes(t))) {
              return null
            }

            return (
              <div key={categoryKey} className="space-y-4">
                <div className="flex items-center gap-2">
                  {React?.createElement(getCategoryIcon(categoryKey), { className: 'h-5 w-5' })}
                  <h3 className="text-lg font-semibold">{category.name}</h3>
                  <span className="text-sm text-muted-foreground">— {category.description}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {categoryTemplates
                    .filter((template) => !searchQuery || filteredTemplates?.includes(template))
                    .map((template) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        isApplied={isTemplateApplied(template.id)}
                        onApply={() => handleApplyTemplate(template)}
                        onPreview={() => setPreviewTemplate(template)}
                      />
                    ))}
                </div>
              </div>
            )
          })}
        </TabsContent>

        {Object.entries(templateCategories).map(([categoryKey, category]) => (
          <TabsContent key={categoryKey} value={categoryKey} className="space-y-4">
            <div className="text-center py-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                {React?.createElement(getCategoryIcon(categoryKey), { className: 'h-6 w-6' })}
                <h3 className="text-xl font-semibold">{category.name}</h3>
              </div>
              <p className="text-muted-foreground">{category.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates
                .filter((template) => template.category === categoryKey)
                .map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    isApplied={isTemplateApplied(template.id)}
                    onApply={() => applyTemplate(template)}
                    onPreview={() => setPreviewTemplate(template)}
                    showFullDescription
                  />
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Message si aucun résultat */}
      {filteredTemplates?.length === 0 && searchQuery && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Aucun template trouvé</h3>
          <p className="text-muted-foreground">
            Essayez de modifier votre recherche ou explorez nos catégories
          </p>
        </div>
      )}
    </div>
  )
}

interface TemplateCardProps {
  template: Template
  isApplied: boolean
  onApply: () => void
  onPreview: () => void
  showFullDescription?: boolean
}

function TemplateCard({
  template,
  isApplied,
  onApply,
  onPreview,
  showFullDescription = false,
}: TemplateCardProps) {
  const getThemeIcon = (theme: string) => {
    switch (theme) {
      case 'light':
        return '☀️'
      case 'dark':
        return '🌙'
      case 'vibrant':
        return '🎨'
      default:
        return '💻'
    }
  }

  const getAccentColorPreview = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
      orange: 'bg-orange-500',
      pink: 'bg-pink-500',
      red: 'bg-red-500',
    }
    return colorMap[color as keyof typeof colorMap] || 'bg-blue-500'
  }

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all duration-200 hover:shadow-lg group cursor-pointer',
        isApplied && 'ring-2 ring-primary'
      )}
    >
      {/* Preview image placeholder */}
      <div className="h-32 bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center">
        <div className="text-6xl opacity-20">{getThemeIcon(template?.settings?.theme)}</div>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base">{template.name}</CardTitle>
            <CardDescription
              className={cn(
                'text-sm mt-1',
                showFullDescription ? 'line-clamp-none' : 'line-clamp-2'
              )}
            >
              {template.description}
            </CardDescription>
          </div>

          {isApplied && <Check className="h-4 w-4 text-primary shrink-0 ml-2" />}
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Paramètres en aperçu */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1 text-xs bg-muted/50 rounded px-2 py-1">
            <span>{getThemeIcon(template?.settings?.theme)}</span>
            <span className="capitalize">{template?.settings?.theme}</span>
          </div>

          <div className="flex items-center gap-1 text-xs bg-muted/50 rounded px-2 py-1">
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                getAccentColorPreview(template?.settings?.accentColor)
              )}
            />
            <span className="capitalize">{template?.settings?.accentColor}</span>
          </div>

          <div className="text-xs bg-muted/50 rounded px-2 py-1">
            <span className="capitalize">{template?.settings?.density}</span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {template?.tags?.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {template?.tags?.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{template?.tags?.length - 3}
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={(e: unknown) => {
              e?.stopPropagation()
              onPreview()
            }}
            className="flex-1"
          >
            Aperçu
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={(e: unknown) => {
              e?.stopPropagation()
              onApply()
            }}
            className="flex-1"
            disabled={isApplied}
          >
            {isApplied ? 'Appliqué' : 'Appliquer'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default TemplateSelector
