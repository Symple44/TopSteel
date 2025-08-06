'use client'

import { CodeViewerDialog } from '@erp/ui/primitives'
import { useTranslation } from '@/lib/i18n/hooks'

interface CodeViewerDialogWrapperProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  fileDetails?: {
    name: string
    content: string
    size: number
    lastModified: string
    path: string
  }
  loadingMessage?: string
  onLoadDetails?: () => Promise<{
    name: string
    content: string
    size: number
    lastModified: string
    path: string
  }>
}

export function CodeViewerDialogWrapper(props: CodeViewerDialogWrapperProps) {
  const { t } = useTranslation('codeViewer')

  const translations = {
    title: t('title'),
    loading: t('loading'),
    loadError: t('loadError'),
    error: t('error'),
    retry: t('retry'),
    linesSelected: t('linesSelected'),
    copied: t('copied'),
    copySelection: t('copySelection'),
    clear: t('clear'),
    copyAll: t('copyAll'),
    code: t('code'),
    clickLineNumbers: t('clickLineNumbers'),
    lines: t('lines'),
    lineTooltip: t('lineTooltip'),
  }

  return (
    <CodeViewerDialog
      isOpen={props.isOpen}
      onClose={props.onClose}
      title={props.title}
      subtitle={props.subtitle}
      fileDetails={props.fileDetails}
      loadingMessage={props.loadingMessage}
      onLoadDetails={props.onLoadDetails}
      translations={translations}
    />
  )
}

export default CodeViewerDialogWrapper
