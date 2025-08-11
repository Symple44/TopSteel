'use client'

import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@erp/ui'
import { AlertTriangle, ArrowLeft, Key, Shield, Smartphone, Timer } from 'lucide-react'
import type React from 'react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useTranslation } from '@/lib/i18n/hooks'
import { callClientApi } from '@/utils/backend-api'

interface MFAVerificationProps {
  userId: string
  email: string
  availableMethods: Array<{
    type: string
    isEnabled: boolean
    lastUsed?: string
  }>
  onSuccess: (sessionToken: string) => void
  onBack: () => void
}

interface MFASession {
  sessionToken: string
  challenge?: unknown
}

export default function MFAVerification({
  userId: _userId,
  email,
  availableMethods,
  onSuccess,
  onBack,
}: MFAVerificationProps) {
  const { t } = useTranslation('auth')
  const [selectedMethod, setSelectedMethod] = useState<string>(availableMethods[0]?.type || 'totp')
  const [mfaSession, setMFASession] = useState<MFASession | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes
  const [attempts, setAttempts] = useState(0)
  const maxAttempts = 3

  useEffect(() => {
    // Start timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          toast.error(t('mfaSessionExpired'))
          onBack()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [onBack, t])

  const initiateMFASession = useCallback(async () => {
    try {
      setLoading(true)
      const response = await callClientApi('auth/mfa/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mfaType: selectedMethod,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setMFASession(data.data)

        // WebAuthn challenge sera géré par l'interface utilisateur
      } else {
        toast.error(t('mfaSessionError'))
      }
    } catch {
      toast.error(t('mfaSessionError'))
    } finally {
      setLoading(false)
    }
  }, [selectedMethod, t])

  useEffect(() => {
    // Initiate MFA session when method changes
    initiateMFASession()
  }, [
    // Initiate MFA session when method changes
    initiateMFASession,
  ])

  const startWebAuthnAuthentication = async (options: unknown) => {
    try {
      // Check WebAuthn support
      if (!window.navigator.credentials || !window.PublicKeyCredential) {
        toast.error(t('webauthnNotSupported'))
        return
      }

      // Get credentials
      const credential = (await navigator.credentials.get({
        publicKey: options,
      })) as PublicKeyCredential

      if (!credential) {
        toast.error(t('webauthnError'))
        return
      }

      // Prepare response
      const response = {
        id: credential.id,
        rawId: credential.id,
        type: credential.type,
        response: {
          clientDataJSON: btoa(
            String.fromCharCode(
              ...new Uint8Array(
                (credential.response as AuthenticatorAssertionResponse).clientDataJSON
              )
            )
          ),
          authenticatorData: btoa(
            String.fromCharCode(
              ...new Uint8Array(
                (credential.response as AuthenticatorAssertionResponse).authenticatorData
              )
            )
          ),
          signature: btoa(
            String.fromCharCode(
              ...new Uint8Array((credential.response as AuthenticatorAssertionResponse).signature)
            )
          ),
          userHandle: (credential.response as AuthenticatorAssertionResponse).userHandle
            ? btoa(
                String.fromCharCode(
                  ...new Uint8Array(
                    (credential.response as AuthenticatorAssertionResponse).userHandle ??
                      new Uint8Array()
                  )
                )
              )
            : null,
        },
      }

      // Verify authentication
      await verifyMFA(undefined, response)
    } catch {
      toast.error(t('webauthnError'))
      setAttempts((prev) => prev + 1)
    }
  }

  const verifyMFA = async (code?: string, webauthnResponse?: unknown) => {
    if (!mfaSession) return

    if (attempts >= maxAttempts) {
      toast.error(t('tooManyAttempts'))
      onBack()
      return
    }

    try {
      setLoading(true)
      const response = await callClientApi('auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionToken: mfaSession.sessionToken,
          code,
          webauthnResponse,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(t('mfaVerificationSuccessful'))

        if (data.data.backupCodesUsed && data.data.backupCodesUsed > 0) {
          toast.info(t('backupCodesUsed', { count: data.data.backupCodesUsed }))
        }

        onSuccess(data.data.sessionToken)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || t('invalidMfaCode'))
        setAttempts((prev) => prev + 1)
        setVerificationCode('')
      }
    } catch {
      toast.error(t('mfaVerificationFailed'))
      setAttempts((prev) => prev + 1)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitTOTP = (e: React.FormEvent) => {
    e.preventDefault()
    if (verificationCode.length === 6 || verificationCode.includes('-')) {
      verifyMFA(verificationCode)
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'totp':
        return <Smartphone className="w-4 h-4" />
      case 'webauthn':
        return <Key className="w-4 h-4" />
      case 'sms':
        return <Smartphone className="w-4 h-4" />
      default:
        return <Shield className="w-4 h-4" />
    }
  }

  const getMethodName = (method: string) => {
    switch (method) {
      case 'totp':
        return t('totpMethod')
      case 'webauthn':
        return t('webauthnMethod')
      case 'sms':
        return t('smsMethod')
      default:
        return method.toUpperCase()
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-2">
          <div className="p-3 bg-primary/10 rounded-full">
            <Shield className="w-8 h-8 text-primary" />
          </div>
        </div>
        <CardTitle>{t('mfaTitle')}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {t('connectedAs')} <strong>{email}</strong>
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Timer className="w-4 h-4" />
          <span>
            {t('timeRemaining')} {formatTime(timeLeft)}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Method selection */}
        {availableMethods.length > 1 && (
          <div className="space-y-2">
            <Label>{t('authenticationMethod')}</Label>
            <Tabs value={selectedMethod} onValueChange={setSelectedMethod}>
              <TabsList className="grid w-full grid-cols-2">
                {availableMethods.map((method) => (
                  <TabsTrigger
                    key={method.type}
                    value={method.type}
                    className="flex items-center gap-2"
                  >
                    {getMethodIcon(method.type)}
                    <span className="hidden sm:inline">{getMethodName(method.type)}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        )}

        {/* Alert for attempts */}
        {attempts > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              {t('failedAttempts', { attempts, remaining: maxAttempts - attempts })}
            </AlertDescription>
          </Alert>
        )}

        {/* TOTP interface */}
        {selectedMethod === 'totp' && (
          <form onSubmit={handleSubmitTOTP} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">{t('verificationCode')}</Label>
              <Input
                id="code"
                type="text"
                placeholder={t('verificationCodePlaceholder')}
                value={verificationCode}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setVerificationCode(e.target.value.replace(/\s/g, ''))
                }
                maxLength={12}
                className="text-center text-lg tracking-widest"
                autoComplete="one-time-code"
                autoFocus
              />
              <p className="text-xs text-muted-foreground text-center">
                {t('verificationCodeHelp')}
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={
                loading ||
                !verificationCode ||
                (verificationCode.length !== 6 && !verificationCode.includes('-'))
              }
            >
              {loading ? t('verifying') : t('verify')}
            </Button>
          </form>
        )}

        {/* WebAuthn interface */}
        {selectedMethod === 'webauthn' && (
          <div className="space-y-4 text-center">
            <div className="p-6 border-2 border-dashed border-muted-foreground/50 rounded-lg">
              <Key className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t('webauthnUseDevice')}</p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="text-sm">{t('mfaSessionStarting')}</span>
              </div>
            ) : (
              <Button
                onClick={() => startWebAuthnAuthentication(mfaSession?.challenge)}
                className="w-full"
              >
                <Key className="w-4 h-4 mr-2" />
                {t('retryAuthentication')}
              </Button>
            )}
          </div>
        )}

        {/* SMS interface */}
        {selectedMethod === 'sms' && (
          <div className="space-y-4">
            <Alert>
              <Smartphone className="w-4 h-4" />
              <AlertDescription>{t('smsCodeSent')}</AlertDescription>
            </Alert>

            <form onSubmit={handleSubmitTOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sms-code">{t('smsCode')}</Label>
                <Input
                  id="sms-code"
                  type="text"
                  placeholder={t('smsCodePlaceholder')}
                  value={verificationCode}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setVerificationCode(e.target.value.replace(/\s/g, ''))
                  }
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                  autoComplete="one-time-code"
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading || verificationCode.length !== 6}
              >
                {loading ? t('verifying') : t('verifySmsCode')}
              </Button>
            </form>
          </div>
        )}

        {/* Back button */}
        <div className="pt-4 border-t">
          <Button variant="ghost" onClick={onBack} className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('backToLogin')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
