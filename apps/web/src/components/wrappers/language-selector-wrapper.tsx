'use client'

import { LanguageSelector } from '@erp/ui/navigation'
import { useLanguage } from '@/lib/i18n'

interface LanguageSelectorWrapperProps {
  className: string
}

export function LanguageSelectorWrapper(props: LanguageSelectorWrapperProps) {
  const {
    current: currentLanguage,
    supported: supportedLanguages,
    change: changeLanguage,
  } = useLanguage()

  return (
    <LanguageSelector
      className={props.className}
      currentLanguage={currentLanguage}
      supportedLanguages={supportedLanguages}
      onLanguageChange={changeLanguage}
    />
  )
}

export default LanguageSelectorWrapper
