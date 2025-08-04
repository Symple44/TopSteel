'use client'

import { CodeViewerDialog, type CodeViewerDialogProps } from '@erp/ui/primitives'
import { useTranslation } from '@/lib/i18n/hooks'

interface CodeViewerDialogWrapperProps extends Omit<CodeViewerDialogProps, 'translations'> {
  // Override props that we'll handle internally
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

  return <CodeViewerDialog {...props} translations={translations} />
}

export default CodeViewerDialogWrapper
