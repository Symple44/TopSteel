'use client'

export const dynamic = 'force-dynamic'

import { Button, Card, CardContent, CardHeader, CardTitle, Input, PageHeader, useFormFieldIds } from '@erp/ui'
import { Building2, Save, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { ImageUploadWrapper as ImageUpload } from '../../../../components/wrappers'
import { useTranslation } from '../../../../lib/i18n'
import { callClientApi } from '../../../../utils/backend-api'

export default function CompanySettingsPage() {
  const { t } = useTranslation('admin')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)

  // Generate unique IDs for form fields
  const fieldIds = useFormFieldIds([
    'name',
    'siret',
    'vat',
    'phone',
    'email',
    'website',
    'address',
    'city',
    'postalCode',
    'country',
  ])

  const [companyData, setCompanyData] = useState({
    name: '',
    siret: '',
    vat: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    phone: '',
    email: '',
    website: '',
  })

  // Load company data on mount
  useEffect(() => {
    const loadCompanyData = async () => {
      try {
        const response = await callClientApi('admin/company')
        if (response.ok) {
          const result = await response.json()
          if (result?.data) {
            setCompanyData(result.data)
          }
        }
      } catch (error) {
        console.error('Error loading company data:', error)
        toast?.error(t('settingsLoadError') || 'Erreur lors du chargement')
      } finally {
        setIsLoadingData(false)
      }
    }
    loadCompanyData()
  }, [t])

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const response = await callClientApi('admin/company', {
        method: 'PUT',
        body: JSON.stringify(companyData),
      })
      if (response.ok) {
        toast?.success(t('saveSuccess'))
      } else {
        throw new Error('Failed to save')
      }
    } catch (_error) {
      toast?.error(t('saveError'))
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingData) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const handleLogoUpload = (_imageUrl: string) => {
    toast?.success(t('company.logoUpdated'))
  }

  const handleLogoError = (error: string) => {
    toast?.error(`${t('company.logoError')}: ${error}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t('company.title')}
        description={t('company.subtitle')}
        icon={Building2}
        iconBackground="bg-gradient-to-br from-indigo-500 to-purple-600"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Logo de l'entreprise */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="h-5 w-5 mr-2" />
                {t('company.logo')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUpload
                category="logo"
                entityType="company"
                entityId="main-company"
                variant="default"
                maxSize={5 * 1024 * 1024} // 5MB
                allowedTypes={['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp']}
                onUploadSuccess={handleLogoUpload}
                onUploadError={handleLogoError}
                className="h-48"
              />
              <p className="text-sm text-muted-foreground mt-2">{t('company.logoFormats')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Informations de l'entreprise */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('company.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Informations générales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor={fieldIds.name}
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    {t('company.name')}
                  </label>
                  <Input
                    id={fieldIds.name}
                    value={companyData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCompanyData((prev) => ({
                        ...prev,
                        name: e?.target?.value,
                      }))
                    }
                    placeholder={t('company.companyName')}
                  />
                </div>

                <div>
                  <label
                    htmlFor={fieldIds.siret}
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    {t('company.siret')}
                  </label>
                  <Input
                    id={fieldIds.siret}
                    value={companyData.siret}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCompanyData((prev) => ({
                        ...prev,
                        siret: e?.target?.value,
                      }))
                    }
                    placeholder="12345678901234"
                  />
                </div>

                <div>
                  <label
                    htmlFor={fieldIds.vat}
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    {t('company.vat')}
                  </label>
                  <Input
                    id={fieldIds.vat}
                    value={companyData.vat}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCompanyData((prev) => ({
                        ...prev,
                        vat: e?.target?.value,
                      }))
                    }
                    placeholder="FR12345678901"
                  />
                </div>

                <div>
                  <label
                    htmlFor={fieldIds.phone}
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    {t('company.phone')}
                  </label>
                  <Input
                    id={fieldIds.phone}
                    value={companyData.phone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCompanyData((prev) => ({
                        ...prev,
                        phone: e?.target?.value,
                      }))
                    }
                    placeholder="+33 1 23 45 67 89"
                  />
                </div>

                <div>
                  <label
                    htmlFor={fieldIds.email}
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    {t('company.email')}
                  </label>
                  <Input
                    id={fieldIds.email}
                    type="email"
                    value={companyData.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCompanyData((prev) => ({
                        ...prev,
                        email: e?.target?.value,
                      }))
                    }
                    placeholder="contact@entreprise.com"
                  />
                </div>

                <div>
                  <label
                    htmlFor={fieldIds.website}
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    {t('company.website')}
                  </label>
                  <Input
                    id={fieldIds.website}
                    type="url"
                    value={companyData.website}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCompanyData((prev) => ({
                        ...prev,
                        website: e?.target?.value,
                      }))
                    }
                    placeholder="https://entreprise.com"
                  />
                </div>
              </div>

              {/* Adresse */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t('company.address')}</h3>

                <div>
                  <label
                    htmlFor={fieldIds.address}
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    {t('company.address')}
                  </label>
                  <Input
                    id={fieldIds.address}
                    value={companyData.address}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCompanyData((prev) => ({
                        ...prev,
                        address: e?.target?.value,
                      }))
                    }
                    placeholder="123 Rue de l'Industrie"
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label
                      htmlFor={fieldIds.city}
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      {t('company.city')}
                    </label>
                    <Input
                      id={fieldIds.city}
                      value={companyData.city}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCompanyData((prev) => ({
                          ...prev,
                          city: e?.target?.value,
                        }))
                      }
                      placeholder="Paris"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={fieldIds.postalCode}
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      {t('company.postalCode')}
                    </label>
                    <Input
                      id={fieldIds.postalCode}
                      value={companyData.postalCode}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCompanyData((prev) => ({
                          ...prev,
                          postalCode: e?.target?.value,
                        }))
                      }
                      placeholder="75001"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={fieldIds.country}
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      {t('company.country')}
                    </label>
                    <Input
                      id={fieldIds.country}
                      value={companyData.country}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCompanyData((prev) => ({
                          ...prev,
                          country: e?.target?.value,
                        }))
                      }
                      placeholder="France"
                    />
                  </div>
                </div>
              </div>

              {/* Bouton de sauvegarde */}
              <div className="flex justify-end pt-4">
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={isLoading}
                  className="flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? t('company.saving') : t('company.save')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
