'use client'

import { useTranslation } from '@/lib/i18n'
import { Input, Label, Button, Avatar } from '@erp/ui'
import { Upload } from 'lucide-react'
import { useSystemParameters } from '@/hooks/use-system-parameters'

export function CompanySettings() {
  const { t } = useTranslation('admin')
  const { parameters, updateParameter } = useSystemParameters()

  const handleInputChange = (key: string, value: string) => {
    updateParameter(key, value)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">{t('company.title')}</h2>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="company-name">{t('company.name')}</Label>
          <Input
            id="company-name"
            value={parameters?.COMPANY_NAME || ''}
            onChange={(e) => handleInputChange('COMPANY_NAME', e.target.value)}
            placeholder="TopSteel Métallerie"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="company-siret">{t('company.siret')}</Label>
          <Input
            id="company-siret"
            value={parameters?.COMPANY_SIRET || ''}
            onChange={(e) => handleInputChange('COMPANY_SIRET', e.target.value)}
            placeholder="12345678901234"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="company-vat">{t('company.vat')}</Label>
          <Input
            id="company-vat"
            value={parameters?.COMPANY_TVA || ''}
            onChange={(e) => handleInputChange('COMPANY_TVA', e.target.value)}
            placeholder="FR12345678901"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="company-email">{t('company.email')}</Label>
          <Input
            id="company-email"
            type="email"
            value={parameters?.COMPANY_EMAIL || ''}
            onChange={(e) => handleInputChange('COMPANY_EMAIL', e.target.value)}
            placeholder="contact@topsteel.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="company-phone">{t('company.phone')}</Label>
          <Input
            id="company-phone"
            type="tel"
            value={parameters?.COMPANY_PHONE || ''}
            onChange={(e) => handleInputChange('COMPANY_PHONE', e.target.value)}
            placeholder="+33 1 23 45 67 89"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="company-address">{t('company.address')}</Label>
          <Input
            id="company-address"
            value={parameters?.COMPANY_ADDRESS || ''}
            onChange={(e) => handleInputChange('COMPANY_ADDRESS', e.target.value)}
            placeholder="123 Rue de l'Industrie, 69001 Lyon, France"
          />
        </div>
      </div>

      <div className="space-y-4 border-t pt-6">
        <Label>{t('company.logo')}</Label>
        <div className="flex items-center gap-6">
          <Avatar className="h-24 w-24">
            <img src="/logo.png" alt="Company Logo" />
          </Avatar>
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            {t('company.uploadLogo')}
          </Button>
        </div>
      </div>
    </div>
  )
}