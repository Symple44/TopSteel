'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import { Languages, Globe } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/hooks'
import { translator } from '@/lib/i18n/translator'

interface TranslationFieldProps {
  value: string
  onChange: (value: string) => void
  translations?: Record<string, string>
  onTranslationsChange?: (translations: Record<string, string>) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  label?: string
}

const SUPPORTED_LANGUAGES = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' }
]

export function TranslationField({
  value,
  onChange,
  translations = {},
  onTranslationsChange,
  placeholder,
  className,
  disabled,
  label
}: TranslationFieldProps) {
  const { t } = useTranslation('translation')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [tempTranslations, setTempTranslations] = useState<Record<string, string>>(translations)
  
  const currentLanguage = translator.getCurrentLanguage()
  const hasTranslations = Object.keys(translations).length > 0

  const handleSave = () => {
    if (onTranslationsChange) {
      onTranslationsChange(tempTranslations)
    }
    setIsDialogOpen(false)
  }

  const handleCancel = () => {
    setTempTranslations(translations)
    setIsDialogOpen(false)
  }

  const handleTranslationChange = (langCode: string, translationValue: string) => {
    setTempTranslations(prev => ({
      ...prev,
      [langCode]: translationValue
    }))
  }

  return (
    <div className={`relative ${className || ''}`}>
      {label && (
        <Label className="text-sm font-medium mb-2 block">
          {label}
        </Label>
      )}
      
      <div className="flex items-center gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1"
        />
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 px-2"
              disabled={disabled}
              title={t('translateField')}
            >
              <Languages className="h-4 w-4" />
              {hasTranslations && (
                <Globe className="h-3 w-3 ml-1 text-green-600" />
              )}
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Languages className="h-5 w-5" />
                {t('fieldTranslations')}
              </DialogTitle>
              <DialogDescription>
                {t('translateDescription')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <div key={lang.code} className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm">
                    <span className="text-lg">{lang.flag}</span>
                    {lang.name}
                    {lang.code === currentLanguage && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {t('current')}
                      </span>
                    )}
                  </Label>
                  <Input
                    placeholder={
                      lang.code === currentLanguage 
                        ? value || placeholder 
                        : `${t('translateTo')} ${lang.name}...`
                    }
                    value={
                      lang.code === currentLanguage 
                        ? value 
                        : tempTranslations[lang.code] || ''
                    }
                    onChange={(e) => {
                      if (lang.code === currentLanguage) {
                        onChange(e.target.value)
                      } else {
                        handleTranslationChange(lang.code, e.target.value)
                      }
                    }}
                    className="text-sm"
                  />
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCancel}>
                {t('cancel')}
              </Button>
              <Button onClick={handleSave}>
                {t('save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}