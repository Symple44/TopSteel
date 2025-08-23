'use client'
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Code,
  Database,
  Globe,
  Server,
  Users,
  X,
  XCircle,
} from 'lucide-react'
import { createPortal } from 'react-dom'
import { cn } from '../../../lib/utils'
import { Button } from '../../primitives'
export interface BackendHealthInfo {
  status: 'online' | 'offline' | 'error' | 'checking'
  responseTime?: number
  version?: string
  environment?: string
  database?: 'connected' | 'disconnected'
  activeUsers?: number | null
  uptime?: string
  lastCheck?: Date
  error?: string
}
export interface ErpInfoModalProps {
  isOpen: boolean
  onClose: () => void
  health: BackendHealthInfo
  onCheckHealth: () => void
  isChecking: boolean
  // Translation props with fallbacks
  translations?: {
    title?: string
    systemInfo?: string
    serverStatus?: string
    refresh?: string
    checking?: string
    online?: string
    offline?: string
    error?: string
    unknown?: string
    detailedInfo?: string
    version?: string
    environment?: string
    database?: string
    connected?: string
    disconnected?: string
    unknown_db?: string
    connectedUsers?: string
    uptime?: string
    lastCheck?: string
    errorLabel?: string
    trademark?: string
    tagline?: string
  }
}
export function ErpInfoModal({
  isOpen,
  onClose,
  health,
  onCheckHealth,
  isChecking,
  translations = {},
}: ErpInfoModalProps) {
  // Default translations with fallbacks
  const t = (key: string) => {
    const defaultTranslations = {
      title: 'TopSteel ERP',
      systemInfo: 'System Information',
      serverStatus: 'Server Status',
      refresh: 'Refresh',
      checking: 'Checking...',
      online: 'Online',
      offline: 'Offline',
      error: 'Error',
      unknown: 'Unknown',
      detailedInfo: 'Detailed Information',
      version: 'Version',
      environment: 'Environment',
      database: 'Database',
      connected: 'Connected',
      disconnected: 'Disconnected',
      unknown_db: 'Unknown',
      connectedUsers: 'Connected Users',
      uptime: 'Uptime',
      lastCheck: 'Last check',
      errorLabel: 'Error:',
      trademark: 'TopSteel© ERP',
      tagline: 'Solid as your expertise',
    }
    return (
      translations[key as keyof typeof translations] ||
      defaultTranslations[key as keyof typeof defaultTranslations] ||
      key
    )
  }
  // Définir les fonctions utilitaires en premier
  const getStatusIcon = (status: BackendHealthInfo['status']) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-5 w-5 text-emerald-500" />
      case 'offline':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-orange-500" />
      case 'checking':
        return <Clock className="h-5 w-5 text-gray-500 animate-spin" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }
  const getStatusText = (status: BackendHealthInfo['status']) => {
    switch (status) {
      case 'online':
        return t('online')
      case 'offline':
        return t('offline')
      case 'error':
        return t('error')
      case 'checking':
        return t('checking')
      default:
        return t('unknown')
    }
  }
  const getStatusColor = (status: BackendHealthInfo['status']) => {
    switch (status) {
      case 'online':
        return 'text-emerald-600 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/50'
      case 'offline':
        return 'text-red-600 bg-red-50 dark:text-red-300 dark:bg-red-950/50'
      case 'error':
        return 'text-orange-600 bg-orange-50 dark:text-orange-300 dark:bg-orange-950/50'
      case 'checking':
        return 'text-muted-foreground bg-muted/50'
      default:
        return 'text-muted-foreground bg-muted/50'
    }
  }
  if (!isOpen) return null
  // Utiliser un portal pour rendre le modal au niveau racine du DOM
  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center"
      style={{ zIndex: 99999 }}
    >
      {/* Overlay */}
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
        aria-label="Close modal"
      />
      {/* Modal */}
      <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
              <Server className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{t('title')}</h2>
              <p className="text-sm text-muted-foreground">{t('systemInfo')}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status général */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{t('serverStatus')}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={onCheckHealth}
                disabled={isChecking}
                className="h-7 px-3 text-xs"
              >
                {isChecking ? (
                  <>
                    <Clock className="h-3 w-3 mr-1 animate-spin" />
                    {t('checking')}
                  </>
                ) : (
                  t('refresh')
                )}
              </Button>
            </div>
            <div
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border',
                getStatusColor(health.status)
              )}
            >
              {getStatusIcon(health.status)}
              <div className="flex-1">
                <p className="text-sm font-medium">{getStatusText(health.status)}</p>
                {health.responseTime && (
                  <p className="text-xs opacity-75">Response time: {health.responseTime}ms</p>
                )}
              </div>
            </div>
          </div>
          {/* Informations détaillées */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">{t('detailedInfo')}</h3>
            <div className="grid gap-3">
              {/* Version */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{t('version')}</span>
                </div>
                <span className="text-sm font-mono text-muted-foreground">
                  {health.version || 'N/A'}
                </span>
              </div>
              {/* Environnement */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{t('environment')}</span>
                </div>
                <span
                  className={cn(
                    'text-sm font-medium px-2 py-1 rounded-md',
                    health.environment === 'production'
                      ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300'
                      : health.environment === 'development'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                        : 'bg-muted text-muted-foreground'
                  )}
                >
                  {health.environment || 'N/A'}
                </span>
              </div>
              {/* Database */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{t('database')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'h-2 w-2 rounded-full',
                      health.database === 'connected'
                        ? 'bg-emerald-500'
                        : health.database === 'disconnected'
                          ? 'bg-red-500'
                          : 'bg-gray-500'
                    )}
                  />
                  <span className="text-sm text-muted-foreground">
                    {health.database === 'connected'
                      ? t('connected')
                      : health.database === 'disconnected'
                        ? t('disconnected')
                        : t('unknown_db')}
                  </span>
                </div>
              </div>
              {/* Utilisateurs connectés */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{t('connectedUsers')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm font-mono text-muted-foreground">
                    {health.activeUsers !== null ? health.activeUsers : 'N/A'}
                  </span>
                </div>
              </div>
              {/* Uptime */}
              {health.uptime && (
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{t('uptime')}</span>
                  </div>
                  <span className="text-sm font-mono text-muted-foreground">{health.uptime}</span>
                </div>
              )}
            </div>
          </div>
          {/* Dernière vérification */}
          {health.lastCheck && (
            <div className="text-center text-xs text-muted-foreground">
              {t('lastCheck')}: {health.lastCheck.toLocaleTimeString('fr-FR')}
            </div>
          )}
          {/* Message d'erreur */}
          {health.error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                {t('errorLabel')}
              </p>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{health.error}</p>
            </div>
          )}
        </div>
        {/* Footer */}
        <div className="px-6 py-4 bg-muted/30 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{t('trademark')}</span>
            <span>{t('tagline')}</span>
          </div>
        </div>
      </div>
    </div>
  )
  // Rendre le modal dans un portal pour qu'il soit au centre de l'écran
  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null
}
