'use client'

export const dynamic = 'force-dynamic'

import '../../../../styles/datatable-demo.css'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataTableExample,
  HierarchicalDataTableExample,
  SimpleDataTableExample,
} from '@erp/ui'
import {
  ArrowUpRight,
  CheckCircle,
  Copy,
  Database,
  Edit3,
  FileSpreadsheet,
  Settings,
  Sparkles,
  Table,
  TreePine,
  TrendingUp,
  Type,
  Users,
  Zap,
} from 'lucide-react'
// import { DropdownTest } from '../../../../components/ui/dropdown-test'
export default function DataTableTestPage() {
  const features = [
    {
      icon: <Edit3 className="h-5 w-5" />,
      title: 'Édition Inline',
      description: 'Modification directe des cellules avec validation en temps réel',
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      icon: <Copy className="h-5 w-5" />,
      title: 'Copier-Coller Excel',
      description: 'Import/export de données depuis/vers Excel avec validation',
      gradient: 'from-blue-500 to-indigo-600',
    },
    {
      icon: <Settings className="h-5 w-5" />,
      title: 'Colonnes Configurables',
      description: 'Réorganisation par drag & drop et sauvegarde des préférences',
      gradient: 'from-purple-500 to-pink-600',
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: 'Formules Excel',
      description: 'Calculs automatiques avec références de cellules',
      gradient: 'from-orange-500 to-red-500',
    },
    {
      icon: <Database className="h-5 w-5" />,
      title: 'Tri & Filtrage',
      description: 'Recherche avancée et tri multi-colonnes',
      gradient: 'from-cyan-500 to-blue-600',
    },
    {
      icon: <FileSpreadsheet className="h-5 w-5" />,
      title: 'Validation Avancée',
      description: 'Contrôles de saisie personnalisés par type de données',
      gradient: 'from-violet-500 to-purple-600',
    },
    {
      icon: <Type className="h-5 w-5" />,
      title: 'Éditeur Rich Text',
      description: 'Formatage de texte avancé avec HTML pour les commentaires',
      gradient: 'from-pink-500 to-rose-600',
    },
  ]

  const stats = [
    {
      label: 'Types de colonnes',
      value: '10',
      description: 'Text, Number, Date, Boolean, Select, RichText...',
      icon: <Table className="h-6 w-6" />,
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      label: 'Fonctions Excel',
      value: '12+',
      description: 'SUM, IF, MAX, MIN, AVERAGE...',
      icon: <Sparkles className="h-6 w-6" />,
      gradient: 'from-blue-500 to-indigo-600',
    },
    {
      label: 'Validations',
      value: '8',
      description: 'Pattern, Min/Max, Custom...',
      icon: <CheckCircle className="h-6 w-6" />,
      gradient: 'from-purple-500 to-pink-600',
    },
    {
      label: 'Performance',
      value: '1000+',
      description: 'Lignes traitées efficacement',
      icon: <TrendingUp className="h-6 w-6" />,
      gradient: 'from-orange-500 to-red-500',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 particles-bg">
      <div className="space-y-8 p-2">
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 p-8 text-white glass-card fade-in-up animate-float">
          <div className="absolute inset-0 bg-grid-pattern opacity-10" />
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm hover:scale-110 transition-transform duration-300">
                  <Table className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                    DataTable Avancée
                  </h1>
                  <p className="text-blue-100 mt-2 text-lg">
                    Composant de tableau professionnel pour les applications ERP
                  </p>
                </div>
              </div>
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm px-4 py-2 badge-glow">
                <Sparkles className="h-4 w-4 mr-2" />
                Version 2.0
              </Badge>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats?.map((stat) => (
            <Card
              key={stat.label}
              className={`group border-0 bg-gradient-to-br ${stat.gradient} text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 fade-in-up`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/90">{stat.label}</CardTitle>
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">{stat.icon}</div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-1 stat-counter">{stat.value}</div>
                <p className="text-xs text-white/80">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Section */}
        <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-slate-800 flex items-center">
              <Zap className="h-6 w-6 mr-3 text-blue-600" />
              Fonctionnalités Principales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features?.map((feature) => (
                <div
                  key={feature.title}
                  className="group p-6 rounded-2xl bg-gradient-to-br from-white to-slate-50 border border-slate-100 hover:shadow-lg transition-all duration-300 hover:scale-105 feature-card fade-in-up"
                >
                  <div
                    className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.gradient} text-white mb-4 group-hover:scale-110 transition-transform`}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold text-slate-800 mb-2 group-hover:text-slate-900">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-600 group-hover:text-slate-700">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Dropdown Test */}
        <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-2xl fade-in-up">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-slate-800 flex items-center">
                  <Settings className="h-6 w-6 mr-3 text-purple-600" />
                  Test Dropdowns
                </CardTitle>
                <p className="text-slate-600 mt-2">Test des composants DropdownPortal</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* <DropdownTest /> */}
            <p>DropdownTest component is not available</p>
          </CardContent>
        </Card>

        {/* Simple Example */}
        <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-2xl fade-in-up">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-slate-800 flex items-center">
                  <Zap className="h-6 w-6 mr-3 text-emerald-600" />
                  Exemple Simplifié
                </CardTitle>
                <p className="text-slate-600 mt-2">
                  Implémentation rapide avec le hook useDataTable
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <SimpleDataTableExample />
          </CardContent>
        </Card>

        {/* Main DataTable Demo */}
        <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-2xl fade-in-up">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-slate-800 flex items-center">
                  <Users className="h-6 w-6 mr-3 text-purple-600" />
                  Démonstration Complète
                </CardTitle>
                <p className="text-slate-600 mt-2">
                  Explorez toutes les fonctionnalités avancées du composant DataTable
                </p>
              </div>
              <Button
                type="button"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shimmer-btn"
              >
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Documentation
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="rounded-b-2xl overflow-hidden">
              <DataTableExample />
            </div>
          </CardContent>
        </Card>

        {/* Hierarchical DataTable Demo */}
        <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-2xl fade-in-up">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-slate-800 flex items-center">
                  <TreePine className="h-6 w-6 mr-3 text-green-600" />
                  DataTable Hiérarchique
                </CardTitle>
                <p className="text-slate-600 mt-2">
                  Affichage et gestion de données hiérarchiques avec drag & drop
                </p>
              </div>
              <Button
                type="button"
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg shimmer-btn"
              >
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Voir Structure
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="rounded-b-2xl overflow-hidden">
              <HierarchicalDataTableExample />
            </div>
          </CardContent>
        </Card>

        {/* Instructions Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-0 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-xl fade-in-up">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-emerald-800 flex items-center">
                <Edit3 className="h-5 w-5 mr-2" />
                Instructions d'Utilisation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-emerald-700">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                  <span>
                    <strong>Édition :</strong> Cliquez sur une cellule pour la modifier inline
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                  <span>
                    <strong>Sélection :</strong> Cochez les lignes et utilisez Ctrl+C pour copier
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                  <span>
                    <strong>Collage :</strong> Ctrl+V pour coller des données depuis Excel
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                  <span>
                    <strong>Colonnes :</strong> Glissez-déposez les en-têtes pour réorganiser
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                  <span>
                    <strong>Paramètres :</strong> Utilisez le menu "Colonnes" pour personnaliser
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                  <span>
                    <strong>Rich Text :</strong> Cliquez sur la colonne Commentaires pour éditer
                    avec formatage
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-xl fade-in-up">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-blue-800 flex items-center">
                <Sparkles className="h-5 w-5 mr-2" />
                Exemples de Validation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-blue-700">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                  <span>
                    <strong>Nom :</strong> 2-50 caractères, lettres uniquement (avec regex)
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                  <span>
                    <strong>Âge :</strong> Nombre entre 18 et 65 ans
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                  <span>
                    <strong>Email :</strong> Format email valide avec validation custom
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                  <span>
                    <strong>Date :</strong> Ne peut pas être dans le futur
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                  <span>
                    <strong>Total :</strong> Calculé automatiquement (formule : âge × 12)
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
