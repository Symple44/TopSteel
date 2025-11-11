'use client'

import {
  Button,
  Card,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Switch,
  useFormFieldIds,
} from '@erp/ui'
import { Globe, Key, RotateCcw, Save, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { useSystemParameters } from '../../hooks/use-system-parameters'
import { useTranslation } from '../../lib/i18n'

export function AuthenticationSettings() {
  const ids = useFormFieldIds([
    'local-auth',
    'google-oauth',
    'google-client-id',
    'google-client-secret',
    'microsoft-oauth',
    'microsoft-client-id',
    'microsoft-client-secret',
    '2fa-enabled',
    '2fa-enforce',
    'session-timeout',
    'max-login-attempts',
    'password-min-length',
    'jwt-expires-in',
    'jwt-refresh-expires-in',
    'require-uppercase',
    'require-lowercase',
    'require-numbers',
    'require-special',
  ])
  const { t } = useTranslation('admin')
  const { parameters, updateParameter, resetToDefaults, saveParameters } = useSystemParameters()

  const handleSwitchChange = (key: string, value: boolean) => {
    updateParameter(key, value?.toString())
  }

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
        <h2 className="text-2xl font-semibold">{t('authentication.title')}</h2>
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

      {/* Authentication Methods */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-medium flex items-center gap-2">
          <Key className="h-5 w-5" />
          {t('authentication.methods')}
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor={ids['local-auth']}>{t('authentication.localAuth')}</Label>
            <Switch id={ids['local-auth']} checked={true} disabled />
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor={ids['google-oauth']}>{t('authentication.googleOAuth')}</Label>
              <Switch
                id={ids['google-oauth']}
                checked={parameters?.GOOGLE_OAUTH_ENABLED === 'true'}
                onCheckedChange={(checked: boolean) =>
                  handleSwitchChange('GOOGLE_OAUTH_ENABLED', checked)
                }
              />
            </div>

            {parameters?.GOOGLE_OAUTH_ENABLED === 'true' && (
              <div className="ml-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={ids['google-client-id']}>
                    {t('authentication.googleClientId')}
                  </Label>
                  <Input
                    id={ids['google-client-id']}
                    type="text"
                    value={parameters?.GOOGLE_OAUTH_CLIENT_ID || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleInputChange('GOOGLE_OAUTH_CLIENT_ID', e?.target?.value)
                    }
                    placeholder="xxxx?.apps?.googleusercontent.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={ids['google-client-secret']}>
                    {t('authentication.googleClientSecret')}
                  </Label>
                  <Input
                    id={ids['google-client-secret']}
                    type="password"
                    value={parameters?.GOOGLE_OAUTH_CLIENT_SECRET || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleInputChange('GOOGLE_OAUTH_CLIENT_SECRET', e?.target?.value)
                    }
                    placeholder="GOCSPX-xxxx"
                  />
                </div>
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor={ids['microsoft-oauth']}>{t('authentication.microsoftOAuth')}</Label>
              <Switch
                id={ids['microsoft-oauth']}
                checked={parameters?.MICROSOFT_OAUTH_ENABLED === 'true'}
                onCheckedChange={(checked: boolean) =>
                  handleSwitchChange('MICROSOFT_OAUTH_ENABLED', checked)
                }
              />
            </div>

            {parameters?.MICROSOFT_OAUTH_ENABLED === 'true' && (
              <div className="ml-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={ids['microsoft-client-id']}>
                    {t('authentication.microsoftClientId')}
                  </Label>
                  <Input
                    id={ids['microsoft-client-id']}
                    type="text"
                    value={parameters?.MICROSOFT_OAUTH_CLIENT_ID || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleInputChange('MICROSOFT_OAUTH_CLIENT_ID', e?.target?.value)
                    }
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={ids['microsoft-client-secret']}>
                    {t('authentication.microsoftClientSecret')}
                  </Label>
                  <Input
                    id={ids['microsoft-client-secret']}
                    type="password"
                    value={parameters?.MICROSOFT_OAUTH_CLIENT_SECRET || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleInputChange('MICROSOFT_OAUTH_CLIENT_SECRET', e?.target?.value)
                    }
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
            <Label htmlFor={ids['2fa-enabled']}>{t('authentication.twoFactor')}</Label>
            <Switch
              id={ids['2fa-enabled']}
              checked={parameters?.TWO_FACTOR_ENABLED === 'true'}
              onCheckedChange={(checked: boolean) =>
                handleSwitchChange('TWO_FACTOR_ENABLED', checked)
              }
            />
          </div>

          {parameters?.TWO_FACTOR_ENABLED === 'true' && (
            <div className="space-y-2">
              <Label htmlFor={ids['2fa-enforce']}>{t('authentication.enforceFor')}</Label>
              <Select
                value={parameters?.TWO_FACTOR_ENFORCE || 'OPTIONAL'}
                onValueChange={(value: string) => handleInputChange('TWO_FACTOR_ENFORCE', value)}
              >
                <SelectTrigger id={ids['2fa-enforce']}>
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
              <Label htmlFor={ids['session-timeout']}>{t('authentication.sessionTimeout')}</Label>
              <Input
                id={ids['session-timeout']}
                type="number"
                value={parameters?.SESSION_TIMEOUT_MINUTES || '480'}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleInputChange('SESSION_TIMEOUT_MINUTES', e?.target?.value)
                }
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={ids['max-login-attempts']}>
                {t('authentication.maxLoginAttempts')}
              </Label>
              <Input
                id={ids['max-login-attempts']}
                type="number"
                value={parameters?.MAX_LOGIN_ATTEMPTS || '5'}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleInputChange('MAX_LOGIN_ATTEMPTS', e?.target?.value)
                }
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={ids['password-min-length']}>{t('authentication.minLength')}</Label>
              <Input
                id={ids['password-min-length']}
                type="number"
                value={parameters?.PASSWORD_MIN_LENGTH || '8'}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleInputChange('PASSWORD_MIN_LENGTH', e?.target?.value)
                }
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={ids['jwt-expires-in']}>{t('authentication.jwtExpiresIn')}</Label>
              <Select
                value={parameters?.JWT_EXPIRES_IN || '24h'}
                onValueChange={(value: string) => handleInputChange('JWT_EXPIRES_IN', value)}
              >
                <SelectTrigger id={ids['jwt-expires-in']}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">1 heure</SelectItem>
                  <SelectItem value="2h">2 heures</SelectItem>
                  <SelectItem value="4h">4 heures</SelectItem>
                  <SelectItem value="8h">8 heures</SelectItem>
                  <SelectItem value="12h">12 heures</SelectItem>
                  <SelectItem value="24h">24 heures</SelectItem>
                  <SelectItem value="48h">48 heures</SelectItem>
                  <SelectItem value="7d">7 jours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={ids['jwt-refresh-expires-in']}>
                {t('authentication.jwtRefreshExpiresIn')}
              </Label>
              <Select
                value={parameters?.JWT_REFRESH_EXPIRES_IN || '7d'}
                onValueChange={(value: string) =>
                  handleInputChange('JWT_REFRESH_EXPIRES_IN', value)
                }
              >
                <SelectTrigger id={ids['jwt-refresh-expires-in']}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">1 jour</SelectItem>
                  <SelectItem value="3d">3 jours</SelectItem>
                  <SelectItem value="7d">7 jours</SelectItem>
                  <SelectItem value="14d">14 jours</SelectItem>
                  <SelectItem value="30d">30 jours</SelectItem>
                  <SelectItem value="90d">90 jours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor={ids['require-uppercase']}>
                {t('authentication.requireUppercase')}
              </Label>
              <Switch
                id={ids['require-uppercase']}
                checked={parameters?.PASSWORD_REQUIRE_UPPERCASE === 'true'}
                onCheckedChange={(checked: boolean) =>
                  handleSwitchChange('PASSWORD_REQUIRE_UPPERCASE', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor={ids['require-lowercase']}>
                {t('authentication.requireLowercase')}
              </Label>
              <Switch
                id={ids['require-lowercase']}
                checked={parameters?.PASSWORD_REQUIRE_LOWERCASE === 'true'}
                onCheckedChange={(checked: boolean) =>
                  handleSwitchChange('PASSWORD_REQUIRE_LOWERCASE', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor={ids['require-numbers']}>{t('authentication.requireNumbers')}</Label>
              <Switch
                id={ids['require-numbers']}
                checked={parameters?.PASSWORD_REQUIRE_NUMBERS === 'true'}
                onCheckedChange={(checked: boolean) =>
                  handleSwitchChange('PASSWORD_REQUIRE_NUMBERS', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor={ids['require-special']}>{t('authentication.requireSpecial')}</Label>
              <Switch
                id={ids['require-special']}
                checked={parameters?.PASSWORD_REQUIRE_SPECIAL === 'true'}
                onCheckedChange={(checked: boolean) =>
                  handleSwitchChange('PASSWORD_REQUIRE_SPECIAL', checked)
                }
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
