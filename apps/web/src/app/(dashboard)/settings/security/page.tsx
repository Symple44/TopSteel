'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Alert, AlertDescription, Tabs, TabsContent, TabsList, TabsTrigger, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@erp/ui'
import { Shield, Smartphone, Key, AlertTriangle, CheckCircle, QrCode, Download, Trash2, Plus, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from '@/lib/i18n/hooks'

interface MFAMethod {
  id: string
  type: 'totp' | 'webauthn' | 'sms'
  isEnabled: boolean
  isVerified: boolean
  lastUsedAt?: string
  createdAt: string
  deviceInfo?: {
    credentialsCount: number
    credentials: Array<{
      id: string
      deviceName: string
      createdAt: string
    }>
  }
  metadata: {
    usageCount: number
    lastUsed?: string
  }
}

interface MFAStats {
  hasActiveMFA: boolean
  methods: {
    totp: { enabled: boolean; verified: boolean; lastUsed?: string }
    webauthn: { enabled: boolean; verified: boolean; credentialsCount: number; lastUsed?: string }
    sms: { enabled: boolean; verified: boolean; lastUsed?: string }
  }
  totalUsage: number
  securityLevel: 'none' | 'basic' | 'enhanced'
}

export default function SecuritySettingsPage() {
  const { t } = useTranslation('common')
  const { t: ts } = useTranslation('settings')
  const [mfaStats, setMFAStats] = useState<MFAStats | null>(null)
  const [mfaMethods, setMFAMethods] = useState<MFAMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [setupDialog, setSetupDialog] = useState<{ open: boolean; type: 'totp' | 'webauthn' | null }>({ open: false, type: null })
  const [totpSetup, setTotpSetup] = useState<{
    mfaId: string
    secret: string
    qrCode: string
    backupCodes: string[]
    manualEntryKey: string
  } | null>(null)
  const [webauthnSetup, setWebauthnSetup] = useState<{
    mfaId: string
    options: any
  } | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [deviceName, setDeviceName] = useState('')
  const [showBackupCodes, setShowBackupCodes] = useState(false)
  const [backupCodes, setBackupCodes] = useState<string[]>([])

  useEffect(() => {
    loadMFAData()
  }, [])

  const loadMFAData = async () => {
    try {
      setLoading(true)
      const [statsResponse, methodsResponse] = await Promise.all([
        fetch('/api/auth/mfa/status'),
        fetch('/api/auth/mfa/methods')
      ])

      if (statsResponse.ok && methodsResponse.ok) {
        const stats = await statsResponse.json()
        const methods = await methodsResponse.json()
        setMFAStats(stats.data)
        setMFAMethods(methods.data)
      }
    } catch (error) {
      toast.error(t('security.mfa.loadError'))
    } finally {
      setLoading(false)
    }
  }

  const handleSetupTOTP = async () => {
    try {
      const response = await fetch('/api/auth/mfa/setup/totp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      if (response.ok) {
        const data = await response.json()
        setTotpSetup(data.data)
        setSetupDialog({ open: true, type: 'totp' })
      } else {
        toast.error(t('security.mfa.totp.configError'))
      }
    } catch (error) {
      toast.error(t('security.mfa.configError'))
    }
  }

  const handleVerifyTOTP = async () => {
    if (!totpSetup || !verificationCode) return

    try {
      const response = await fetch('/api/auth/mfa/verify/totp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mfaId: totpSetup.mfaId,
          token: verificationCode
        })
      })

      if (response.ok) {
        toast.success(t('security.mfa.totp.success'))
        setSetupDialog({ open: false, type: null })
        setTotpSetup(null)
        setVerificationCode('')
        loadMFAData()
      } else {
        toast.error(t('security.mfa.totp.invalidCode'))
      }
    } catch (error) {
      toast.error(t('security.mfa.verificationError'))
    }
  }

  const handleSetupWebAuthn = async () => {
    try {
      const response = await fetch('/api/auth/mfa/setup/webauthn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: t('defaultUserName') || 'TopSteel User'
        })
      })

      if (response.ok) {
        const data = await response.json()
        setWebauthnSetup(data.data)
        setSetupDialog({ open: true, type: 'webauthn' })
        
        // Déclencher l'enregistrement WebAuthn
        await startWebAuthnRegistration(data.data.options)
      } else {
        toast.error(t('security.mfa.webauthn.configError'))
      }
    } catch (error) {
      toast.error(t('security.mfa.webauthn.notSupportedError'))
    }
  }

  const startWebAuthnRegistration = async (options: any) => {
    try {
      // Vérifier le support WebAuthn
      if (!window.navigator.credentials || !window.PublicKeyCredential) {
        toast.error(t('security.mfa.webauthn.notSupported'))
        return
      }

      // Créer les credentials
      const credential = await navigator.credentials.create({
        publicKey: options
      }) as PublicKeyCredential

      if (!credential) {
        toast.error(t('security.mfa.webauthn.registrationFailed'))
        return
      }

      // Préparer la réponse
      const response = {
        id: credential.id,
        rawId: credential.id,
        type: credential.type,
        response: {
          clientDataJSON: btoa(String.fromCharCode(...new Uint8Array((credential.response as AuthenticatorAttestationResponse).clientDataJSON))),
          attestationObject: btoa(String.fromCharCode(...new Uint8Array((credential.response as AuthenticatorAttestationResponse).attestationObject)))
        }
      }

      // Vérifier l'enregistrement
      await verifyWebAuthnRegistration(response)
    } catch (error) {
      console.error('Erreur WebAuthn:', error)
      toast.error(t('security.mfa.webauthn.registrationError'))
    }
  }

  const verifyWebAuthnRegistration = async (response: any) => {
    if (!webauthnSetup) return

    try {
      const verifyResponse = await fetch('/api/auth/mfa/verify/webauthn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mfaId: webauthnSetup.mfaId,
          response,
          deviceName: deviceName || 'Appareil WebAuthn'
        })
      })

      if (verifyResponse.ok) {
        toast.success(t('security.mfa.webauthn.success'))
        setSetupDialog({ open: false, type: null })
        setWebauthnSetup(null)
        setDeviceName('')
        loadMFAData()
      } else {
        toast.error(t('security.mfa.webauthn.verificationError'))
      }
    } catch (error) {
      toast.error(t('security.mfa.verificationError'))
    }
  }

  const handleDisableMFA = async (type: 'totp' | 'webauthn') => {
    try {
      const response = await fetch('/api/auth/mfa/disable', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mfaType: type })
      })

      if (response.ok) {
        toast.success(`${type.toUpperCase()} désactivé`)
        loadMFAData()
      } else {
        toast.error(t('security.mfa.disableError'))
      }
    } catch (error) {
      toast.error(t('security.mfa.configError'))
    }
  }

  const handleGetBackupCodes = async () => {
    try {
      const response = await fetch('/api/auth/mfa/totp/backup-codes')
      
      if (response.ok) {
        const data = await response.json()
        setBackupCodes(data.data.codes)
        setShowBackupCodes(true)
      } else {
        toast.error(t('security.mfa.codesNotAvailable'))
      }
    } catch (error) {
      toast.error(t('security.mfa.codesError'))
    }
  }

  const getSecurityLevelColor = (level: string) => {
    switch (level) {
      case 'none': return 'destructive'
      case 'basic': return 'default'
      case 'enhanced': return 'default'
      default: return 'secondary'
    }
  }

  const getSecurityLevelText = (level: string) => {
    switch (level) {
      case 'none': return ts('security.noMfaProtection')
      case 'basic': return ts('security.basicProtection')
      case 'enhanced': return ts('security.enhancedProtection')
      default: return 'Inconnu'
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{ts('security.title')}</h1>
          <p className="text-muted-foreground">{ts('security.subtitle')}</p>
        </div>
        {mfaStats && (
          <Badge variant={getSecurityLevelColor(mfaStats.securityLevel)} className="text-sm">
            <Shield className="w-4 h-4 mr-1" />
            {getSecurityLevelText(mfaStats.securityLevel)}
          </Badge>
        )}
      </div>

      {/* Aperçu de la sécurité */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
{ts('security.overview')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mfaStats ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{mfaStats.totalUsage}</div>
                <div className="text-sm text-muted-foreground">{ts('security.mfaUsage')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Object.values(mfaStats.methods).filter(m => m.enabled && m.verified).length}
                </div>
                <div className="text-sm text-muted-foreground">{ts('security.activeMethods')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {mfaStats.methods.webauthn.credentialsCount}
                </div>
                <div className="text-sm text-muted-foreground">{ts('security.securityKeys')}</div>
              </div>
            </div>
          ) : (
            <Alert>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
{ts('security.recommendMfa')}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Configuration MFA */}
      <Tabs defaultValue="totp" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="totp" className="flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            Authenticator (TOTP)
          </TabsTrigger>
          <TabsTrigger value="webauthn" className="flex items-center gap-2">
            <Key className="w-4 h-4" />
            WebAuthn / Biométrie
          </TabsTrigger>
        </TabsList>

        <TabsContent value="totp">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  Google Authenticator / TOTP
                </span>
                {mfaStats?.methods.totp.enabled && (
                  <Badge variant="outline" className="text-green-600">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Activé
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Utilisez une application d'authentification comme Google Authenticator, Authy, ou 1Password pour générer des codes de vérification.
              </p>

              {mfaStats?.methods.totp.enabled ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">TOTP configuré</p>
                      <p className="text-sm text-muted-foreground">
                        Dernière utilisation: {mfaStats.methods.totp.lastUsed ? 
                          new Date(mfaStats.methods.totp.lastUsed).toLocaleString() : 
                          'Jamais utilisé'
                        }
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleGetBackupCodes}>
                        <Eye className="w-4 h-4 mr-2" />
                        Codes de récupération
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDisableMFA('totp')}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Désactiver
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert>
                    <Shield className="w-4 h-4" />
                    <AlertDescription>
                      TOTP non configuré. Activez cette méthode pour améliorer la sécurité de votre compte.
                    </AlertDescription>
                  </Alert>
                  <Button onClick={handleSetupTOTP} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Configurer TOTP
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webauthn">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  WebAuthn / Clés de sécurité
                </span>
                {mfaStats?.methods.webauthn.enabled && (
                  <Badge variant="outline" className="text-green-600">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {mfaStats.methods.webauthn.credentialsCount} clé(s)
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Utilisez la biométrie (empreinte, reconnaissance faciale) ou des clés de sécurité physiques (YubiKey, etc.).
              </p>

              {mfaStats?.methods.webauthn.enabled ? (
                <div className="space-y-4">
                  {mfaMethods
                    .filter(method => method.type === 'webauthn')
                    .map(method => (
                      method.deviceInfo?.credentials.map(credential => (
                        <div key={credential.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">{credential.deviceName}</p>
                            <p className="text-sm text-muted-foreground">
                              Ajouté le {new Date(credential.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Supprimer
                          </Button>
                        </div>
                      ))
                    ))}
                  
                  <Button variant="outline" onClick={handleSetupWebAuthn} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter une nouvelle clé
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert>
                    <Key className="w-4 h-4" />
                    <AlertDescription>
                      WebAuthn non configuré. Cette méthode offre la meilleure sécurité possible.
                    </AlertDescription>
                  </Alert>
                  <Button onClick={handleSetupWebAuthn} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Configurer WebAuthn
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de configuration TOTP */}
      <Dialog open={setupDialog.open && setupDialog.type === 'totp'} onOpenChange={(open: boolean) => setSetupDialog({ open, type: null })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configuration TOTP</DialogTitle>
            <DialogDescription>
              Scannez le QR code avec votre application d'authentification
            </DialogDescription>
          </DialogHeader>
          
          {totpSetup && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <img src={totpSetup.qrCode} alt="QR Code TOTP" className="border rounded-lg" />
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Clé manuelle :</p>
                <code className="block p-2 bg-muted rounded text-sm break-all">
                  {totpSetup.manualEntryKey}
                </code>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Code de vérification :</label>
                <input
                  type="text"
                  placeholder="123456"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="w-full p-2 border rounded"
                  maxLength={6}
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Codes de récupération :</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {totpSetup.backupCodes.map((code, index) => (
                    <code key={index} className="block p-1 bg-muted rounded text-center">
                      {code}
                    </code>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Conservez ces codes en lieu sûr. Ils ne s'afficheront qu'une seule fois.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSetupDialog({ open: false, type: null })}>
              Annuler
            </Button>
            <Button onClick={handleVerifyTOTP} disabled={!verificationCode || verificationCode.length !== 6}>
              Vérifier et Activer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de configuration WebAuthn */}
      <Dialog open={setupDialog.open && setupDialog.type === 'webauthn'} onOpenChange={(open: boolean) => setSetupDialog({ open, type: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configuration WebAuthn</DialogTitle>
            <DialogDescription>
              Configurez une clé de sécurité ou utilisez la biométrie de votre appareil
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nom de l'appareil (optionnel) :</label>
              <input
                type="text"
                placeholder="Mon iPhone, Ma YubiKey..."
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>

            <Alert>
              <Key className="w-4 h-4" />
              <AlertDescription>
                Suivez les instructions de votre navigateur pour enregistrer votre clé de sécurité ou utiliser la biométrie.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSetupDialog({ open: false, type: null })}>
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog des codes de récupération */}
      <Dialog open={showBackupCodes} onOpenChange={setShowBackupCodes}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Codes de récupération</DialogTitle>
            <DialogDescription>
              Utilisez ces codes si vous perdez l'accès à votre authentificateur
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code, index) => (
                <code key={index} className="block p-2 bg-muted rounded text-center font-mono">
                  {code}
                </code>
              ))}
            </div>
            
            <Alert>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                Conservez ces codes en lieu sûr. Chaque code ne peut être utilisé qu'une seule fois.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBackupCodes(false)}>
              Fermer
            </Button>
            <Button onClick={() => {
              const codesText = backupCodes.join('\n')
              navigator.clipboard.writeText(codesText)
              toast.success(t('security.mfa.codesCopied'))
            }}>
              <Download className="w-4 h-4 mr-2" />
              Copier les codes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}