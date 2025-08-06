'use client'

import { TranslationField } from '@erp/ui/forms'
import { useTranslation } from '@/lib/i18n/hooks'
import { translator } from '@/lib/i18n/translator'

interface TranslationFieldWrapperProps {
  value: any
  onChange: (value: any) => void
  onTranslationsChange: (translations: any) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  label?: string
}

export function TranslationFieldWrapper(props: TranslationFieldWrapperProps) {
  const { t } = useTranslation('translation')

  const currentLanguage = translator.getCurrentLanguage()

  const fieldTranslations = {
    translateField: t('translateField'),
    fieldTranslations: t('fieldTranslations'),
    translateDescription: t('translateDescription'),
    current: t('current'),
    translateTo: t('translateTo'),
    cancel: t('cancel'),
    save: t('save'),
  }

  return (
    <TranslationField
      value={props.value}
      onChange={props.onChange}
      onTranslationsChange={props.onTranslationsChange}
      placeholder={props.placeholder}
      className={props.className}
      disabled={props.disabled}
      label={props.label}
      currentLanguage={currentLanguage}
      fieldTranslations={fieldTranslations}
    />
  )
}

export default TranslationFieldWrapper
