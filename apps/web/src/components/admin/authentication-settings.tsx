'use client'

import { useTranslation } from '@/lib/i18n'
import { Card, Input, Label, Switch, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Separator } from '@erp/ui'
import { Shield, Key, Globe } from 'lucide-react'
import { useSystemParameters } from '@/hooks/use-system-parameters'

export function AuthenticationSettings() {
  const { t } = useTranslation('admin')
  const { parameters, updateParameter } = useSystemParameters()

  const handleSwitchChange = (key: string, value: boolean) => {
    updateParameter(key, value.toString())
  }

  const handleInputChange = (key: string, value: string) => {
    updateParameter(key, value)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">{t('authentication.title')}</h2>

      {/* Authentication Methods */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-medium flex items-center gap-2">
          <Key className="h-5 w-5" />
          {t('authentication.methods')}
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="local-auth">{t('authentication.localAuth')}</Label>
            <Switch
              id="local-auth"
              checked={true}
              disabled
            />
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="google-oauth">{t('authentication.googleOAuth')}</Label>
              <Switch
                id="google-oauth"
                checked={parameters?.GOOGLE_OAUTH_ENABLED === 'true'}
                onCheckedChange={(checked) => handleSwitchChange('GOOGLE_OAUTH_ENABLED', checked)}
              />
            </div>
            
            {parameters?.GOOGLE_OAUTH_ENABLED === 'true' && (
              <div className="ml-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="google-client-id">{t('authentication.googleClientId')}</Label>
                  <Input
                    id="google-client-id"
                    type="text"
                    value={parameters?.GOOGLE_OAUTH_CLIENT_ID || ''}
                    onChange={(e) => handleInputChange('GOOGLE_OAUTH_CLIENT_ID', e.target.value)}
                    placeholder="xxxx.apps.googleusercontent.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="google-client-secret">{t('authentication.googleClientSecret')}</Label>
                  <Input
                    id="google-client-secret"
                    type="password"
                    value={parameters?.GOOGLE_OAUTH_CLIENT_SECRET || ''}
                    onChange={(e) => handleInputChange('GOOGLE_OAUTH_CLIENT_SECRET', e.target.value)}
                    placeholder="GOCSPX-xxxx"
                  />
                </div>
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="microsoft-oauth">{t('authentication.microsoftOAuth')}</Label>
              <Switch
                id="microsoft-oauth"
                checked={parameters?.MICROSOFT_OAUTH_ENABLED === 'true'}
                onCheckedChange={(checked) => handleSwitchChange('MICROSOFT_OAUTH_ENABLED', checked)}
              />
            </div>
            
            {parameters?.MICROSOFT_OAUTH_ENABLED === 'true' && (
              <div className="ml-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="microsoft-client-id">{t('authentication.microsoftClientId')}</Label>
                  <Input
                    id="microsoft-client-id"
                    type="text"
                    value={parameters?.MICROSOFT_OAUTH_CLIENT_ID || ''}
                    onChange={(e) => handleInputChange('MICROSOFT_OAUTH_CLIENT_ID', e.target.value)}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="microsoft-client-secret">{t('authentication.microsoftClientSecret')}</Label>
                  <Input
                    id="microsoft-client-secret"
                    type="password"
                    value={parameters?.MICROSOFT_OAUTH_CLIENT_SECRET || ''}
                    onChange={(e) => handleInputChange('MICROSOFT_OAUTH_CLIENT_SECRET', e.target.value)}
                    placeholder="xxxxxxxxxxxx"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Two-Factor Authentication */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-medium flex items-center gap-2">
          <Shield className="h-5 w-5" />
          {t('authentication.twoFactor')}
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="2fa-enabled">{t('authentication.twoFactor')}</Label>
            <Switch
              id="2fa-enabled"
              checked={parameters?.TWO_FACTOR_ENABLED === 'true'}
              onCheckedChange={(checked) => handleSwitchChange('TWO_FACTOR_ENABLED', checked)}
            />
          </div>

          {parameters?.TWO_FACTOR_ENABLED === 'true' && (
            <div className="space-y-2">
              <Label htmlFor="2fa-enforce">{t('authentication.enforceFor')}</Label>
              <Select
                value={parameters?.TWO_FACTOR_ENFORCE || 'OPTIONAL'}
                onValueChange={(value) => handleInputChange('TWO_FACTOR_ENFORCE', value)}
              >
                <SelectTrigger id="2fa-enforce">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPTIONAL">{t('authentication.optional')}</SelectItem>
                  <SelectItem value="ALL_USERS">{t('authentication.allUsers')}</SelectItem>
                  <SelectItem value="ADMINS_ONLY">{t('authentication.adminsOnly')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </Card>

      {/* Security Settings */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-medium flex items-center gap-2">
          <Globe className="h-5 w-5" />
          {t('authentication.passwordPolicy')}
        </h3>
        
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="session-timeout">{t('authentication.sessionTimeout')}</Label>
              <Input
                id="session-timeout"
                type="number"
                value={parameters?.SESSION_TIMEOUT_MINUTES || '480'}
                onChange={(e) => handleInputChange('SESSION_TIMEOUT_MINUTES', e.target.value)}
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-login-attempts">{t('authentication.maxLoginAttempts')}</Label>
              <Input
                id="max-login-attempts"
                type="number"
                value={parameters?.MAX_LOGIN_ATTEMPTS || '5'}
                onChange={(e) => handleInputChange('MAX_LOGIN_ATTEMPTS', e.target.value)}
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password-min-length">{t('authentication.minLength')}</Label>
              <Input
                id="password-min-length"
                type="number"
                value={parameters?.PASSWORD_MIN_LENGTH || '8'}
                onChange={(e) => handleInputChange('PASSWORD_MIN_LENGTH', e.target.value)}
                min="1"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="require-uppercase">{t('authentication.requireUppercase')}</Label>
              <Switch
                id="require-uppercase"
                checked={parameters?.PASSWORD_REQUIRE_UPPERCASE === 'true'}
                onCheckedChange={(checked) => handleSwitchChange('PASSWORD_REQUIRE_UPPERCASE', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="require-lowercase">{t('authentication.requireLowercase')}</Label>
              <Switch
                id="require-lowercase"
                checked={parameters?.PASSWORD_REQUIRE_LOWERCASE === 'true'}
                onCheckedChange={(checked) => handleSwitchChange('PASSWORD_REQUIRE_LOWERCASE', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="require-numbers">{t('authentication.requireNumbers')}</Label>
              <Switch
                id="require-numbers"
                checked={parameters?.PASSWORD_REQUIRE_NUMBERS === 'true'}
                onCheckedChange={(checked) => handleSwitchChange('PASSWORD_REQUIRE_NUMBERS', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="require-special">{t('authentication.requireSpecial')}</Label>
              <Switch
                id="require-special"
                checked={parameters?.PASSWORD_REQUIRE_SPECIAL === 'true'}
                onCheckedChange={(checked) => handleSwitchChange('PASSWORD_REQUIRE_SPECIAL', checked)}
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}