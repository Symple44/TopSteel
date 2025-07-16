'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@erp/ui'
import { Button, Input } from '@erp/ui'
import { Building2, Save, Upload } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import { toast } from 'sonner'
import ImageUpload from '@/components/ui/image-upload'

export default function CompanySettingsPage() {
  const { t } = useTranslation('admin')
  const [isLoading, setIsLoading] = useState(false)
  
  const [companyData, setCompanyData] = useState({
    name: 'TopSteel',
    siret: '12345678901234',
    vat: 'FR12345678901',
    address: '123 Rue de l\'Industrie',
    city: 'Paris',
    postalCode: '75001',
    country: 'France',
    phone: '+33 1 23 45 67 89',
    email: 'contact@topsteel.com',
    website: 'https://topsteel.com'
  })

  const handleSave = async () => {
    setIsLoading(true)
    try {
      // Simulation d'un appel API
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success(t('saveSuccess'))
    } catch (error) {
      toast.error(t('saveError'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogoUpload = (result: any) => {
    toast.success('Logo d\'entreprise mis à jour avec succès')
    // Ici vous pourriez mettre à jour le logo dans les données de l'entreprise
  }

  const handleLogoError = (error: string) => {
    toast.error(`Erreur lors de l'upload du logo: ${error}`)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('company.title')}</h1>
          <p className="text-muted-foreground mt-1">
            Configurez les informations de votre entreprise
          </p>
        </div>
      </div>

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
              <p className="text-sm text-muted-foreground mt-2">
                PNG, JPG, SVG, WebP jusqu'à 5MB
              </p>
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
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t('company.name')}
                  </label>
                  <Input
                    value={companyData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompanyData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nom de l'entreprise"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t('company.siret')}
                  </label>
                  <Input
                    value={companyData.siret}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompanyData(prev => ({ ...prev, siret: e.target.value }))}
                    placeholder="12345678901234"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t('company.vat')}
                  </label>
                  <Input
                    value={companyData.vat}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompanyData(prev => ({ ...prev, vat: e.target.value }))}
                    placeholder="FR12345678901"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t('company.phone')}
                  </label>
                  <Input
                    value={companyData.phone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompanyData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+33 1 23 45 67 89"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t('company.email')}
                  </label>
                  <Input
                    type="email"
                    value={companyData.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompanyData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="contact@entreprise.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Site web
                  </label>
                  <Input
                    type="url"
                    value={companyData.website}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompanyData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://entreprise.com"
                  />
                </div>
              </div>

              {/* Adresse */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t('company.address')}</h3>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Adresse
                  </label>
                  <Input
                    value={companyData.address}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompanyData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="123 Rue de l'Industrie"
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Ville
                    </label>
                    <Input
                      value={companyData.city}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompanyData(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="Paris"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Code postal
                    </label>
                    <Input
                      value={companyData.postalCode}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompanyData(prev => ({ ...prev, postalCode: e.target.value }))}
                      placeholder="75001"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Pays
                    </label>
                    <Input
                      value={companyData.country}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompanyData(prev => ({ ...prev, country: e.target.value }))}
                      placeholder="France"
                    />
                  </div>
                </div>
              </div>

              {/* Bouton de sauvegarde */}
              <div className="flex justify-end pt-4">
                <Button 
                  onClick={handleSave}
                  disabled={isLoading}
                  className="flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}