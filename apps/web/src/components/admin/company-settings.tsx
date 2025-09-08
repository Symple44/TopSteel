'use client'

import { Avatar, Button, Input, Label, useFormFieldIds } from '@erp/ui'
import { RotateCcw, Save, Upload } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import { useSystemParameters } from '@/hooks/use-system-parameters'
import { useTranslation } from '@/lib/i18n'

export function CompanySettings() {
  const ids = useFormFieldIds([
    'company-name',
    'company-siret',
    'company-vat',
    'company-email',
    'company-phone',
    'company-address',
  ])
  const { t } = useTranslation('admin')
  const { parameters, updateParameter, resetToDefaults, saveParameters } = useSystemParameters()

  const handleInputChange = (key: string, value: string) => {
    updateParameter(key, value)
  }

  const handleSave = async () => {
    try {
      await saveParameters()
      toast?.success(t('saveSuccess'))
    } catch (_error) {
      toast?.error(t('saveError'))
    }
  }

  const handleReset = async () => {
    if (confirm(t('resetConfirm'))) {
      try {
        await resetToDefaults()
        toast?.success(t('resetSuccess'))
      } catch (_error) {
        toast?.error(t('resetError'))
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">{t('company.title')}</h2>
        <div className="flex items-center space-x-2">
          <Button type="button" variant="outline" onClick={handleReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            {t('common.reset')}
          </Button>
          <Button type="button" onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            {t('common.save')}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={ids['company-name']}>{t('company.name')}</Label>
          <Input
            id={ids['company-name']}
            value={parameters?.COMPANY_NAME || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleInputChange('COMPANY_NAME', e?.target?.value)
            }
            placeholder="TopSteel Métallerie"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={ids['company-siret']}>{t('company.siret')}</Label>
          <Input
            id={ids['company-siret']}
            value={parameters?.COMPANY_SIRET || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleInputChange('COMPANY_SIRET', e?.target?.value)
            }
            placeholder="12345678901234"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={ids['company-vat']}>{t('company.vat')}</Label>
          <Input
            id={ids['company-vat']}
            value={parameters?.COMPANY_TVA || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleInputChange('COMPANY_TVA', e?.target?.value)
            }
            placeholder="FR12345678901"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={ids['company-email']}>{t('company.email')}</Label>
          <Input
            id={ids['company-email']}
            type="email"
            value={parameters?.COMPANY_EMAIL || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleInputChange('COMPANY_EMAIL', e?.target?.value)
            }
            placeholder="contact@topsteel.tech"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={ids['company-phone']}>{t('company.phone')}</Label>
          <Input
            id={ids['company-phone']}
            type="tel"
            value={parameters?.COMPANY_PHONE || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleInputChange('COMPANY_PHONE', e?.target?.value)
            }
            placeholder="+33 1 23 45 67 89"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor={ids['company-address']}>{t('company.address')}</Label>
          <Input
            id={ids['company-address']}
            value={parameters?.COMPANY_ADDRESS || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleInputChange('COMPANY_ADDRESS', e?.target?.value)
            }
            placeholder="123 Rue de l'Industrie, 69001 Lyon, France"
          />
        </div>
      </div>

      <div className="space-y-4 border-t pt-6">
        <Label>{t('company.logo')}</Label>
        <div className="flex items-center gap-6">
          <Avatar className="h-24 w-24">
            <Image src="/logo.png" alt="Company Logo" width={96} height={96} />
          </Avatar>
          <Button type="button" variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            {t('company.uploadLogo')}
          </Button>
        </div>
      </div>
    </div>
  )
}
