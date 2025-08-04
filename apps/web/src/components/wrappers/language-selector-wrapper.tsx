'use client'

import { LanguageSelector, type LanguageSelectorProps } from '@erp/ui/navigation'
import { useLanguage } from '@/lib/i18n'

interface LanguageSelectorWrapperProps
  extends Omit<
    LanguageSelectorProps,
    'currentLanguage' | 'supportedLanguages' | 'onLanguageChange'
  > {
  // Override props that we'll handle internally
}

export function LanguageSelectorWrapper(props: LanguageSelectorWrapperProps) {
  const {
    current: currentLanguage,
    supported: supportedLanguages,
    change: changeLanguage,
  } = useLanguage()

  return (
    <LanguageSelector
      {...props}
      currentLanguage={currentLanguage}
      supportedLanguages={supportedLanguages}
      onLanguageChange={changeLanguage}
    />
  )
}

export default LanguageSelectorWrapper
