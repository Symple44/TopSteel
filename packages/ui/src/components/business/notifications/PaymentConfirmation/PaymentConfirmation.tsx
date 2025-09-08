'use client'
import { Building, Calendar, CreditCard, Euro, Shield } from 'lucide-react'
import { useId, useState } from 'react'
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../primitives'
export type PaymentMethod = 'bank_transfer' | 'credit_card' | 'check' | 'cash' | 'direct_debit'
export interface PaymentDetails {
  id: string
  amount: number
  currency: string
  beneficiary: string
  beneficiaryAccount?: string
  reference: string
  dueDate: string
  description: string
  fees?: number
  exchangeRate?: number
  originalAmount?: number
  originalCurrency?: string
}
export interface PaymentConfirmationProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  payment: PaymentDetails
  availableMethods: PaymentMethod[]
  onConfirm: (data: {
    paymentId: string
    method: PaymentMethod
    scheduledDate?: string
    confirmationCode?: string
  }) => Promise<void>
}
const paymentMethodConfig = {
  bank_transfer: {
    label: 'Virement bancaire',
    icon: Building,
    processingTime: '1-2 jours ouvrés',
    fees: 'Gratuit',
    security: 'Élevée',
  },
  credit_card: {
    label: 'Carte de crédit',
    icon: CreditCard,
    processingTime: 'Immédiat',
    fees: '2.9% + 0.30€',
    security: 'Élevée',
  },
  check: {
    label: 'Chèque',
    icon: Calendar,
    processingTime: '3-5 jours ouvrés',
    fees: 'Gratuit',
    security: 'Moyenne',
  },
  cash: {
    label: 'Espèces',
    icon: Euro,
    processingTime: 'Immédiat',
    fees: 'Gratuit',
    security: 'Faible',
  },
  direct_debit: {
    label: 'Prélèvement automatique',
    icon: Shield,
    processingTime: '1-3 jours ouvrés',
    fees: 'Gratuit',
    security: 'Élevée',
  },
}
export function PaymentConfirmation({
  open,
  onOpenChange,
  payment,
  availableMethods,
  onConfirm,
}: PaymentConfirmationProps) {
  const scheduledDateId = useId()
  const confirmationCodeId = useId()
  const termsId = useId()
  const [loading, setLoading] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(
    availableMethods[0] || 'bank_transfer'
  )
  const [scheduledDate, setScheduledDate] = useState('')
  const [confirmationCode, setConfirmationCode] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const selectedMethodConfig = paymentMethodConfig[selectedMethod]
  const _IconComponent = selectedMethodConfig.icon
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onConfirm({
        paymentId: payment.id,
        method: selectedMethod,
        scheduledDate: scheduledDate || undefined,
        confirmationCode: confirmationCode || undefined,
      })
      onOpenChange(false)
    } catch (_error) {
    } finally {
      setLoading(false)
    }
  }
  const formatCurrency = (amount: number, currency = payment.currency) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
    }).format(amount)
  }
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
  }
  const getTotalAmount = () => {
    let total = payment.amount
    if (payment.fees) total += payment.fees
    return total
  }
  const isSchedulable = ['bank_transfer', 'direct_debit'].includes(selectedMethod)
  const requiresConfirmationCode = ['credit_card', 'direct_debit'].includes(selectedMethod)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-500" />
            Confirmer le paiement
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Payment Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Détails du paiement</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Bénéficiaire:</span>
                <span className="ml-2 font-medium">{payment.beneficiary}</span>
              </div>
              <div>
                <span className="text-gray-500">Montant:</span>
                <span className="ml-2 font-medium">{formatCurrency(payment.amount)}</span>
              </div>
              <div>
                <span className="text-gray-500">Référence:</span>
                <span className="ml-2 font-mono text-xs">{payment.reference}</span>
              </div>
              <div>
                <span className="text-gray-500">Échéance:</span>
                <span className="ml-2">{formatDate(payment.dueDate)}</span>
              </div>
              {payment.beneficiaryAccount && (
                <div className="col-span-2">
                  <span className="text-gray-500">Compte bénéficiaire:</span>
                  <span className="ml-2 font-mono text-xs">{payment.beneficiaryAccount}</span>
                </div>
              )}
              <div className="col-span-2">
                <span className="text-gray-500">Description:</span>
                <span className="ml-2">{payment.description}</span>
              </div>
            </div>
            {payment.originalAmount && payment.originalCurrency && payment.exchangeRate && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Conversion de devise</h4>
                <div className="grid grid-cols-3 gap-2 text-sm text-blue-700">
                  <div>
                    <span>Montant original:</span>
                    <span className="ml-1 font-medium">
                      {formatCurrency(payment.originalAmount, payment.originalCurrency)}
                    </span>
                  </div>
                  <div>
                    <span>Taux de change:</span>
                    <span className="ml-1 font-medium">{payment.exchangeRate}</span>
                  </div>
                  <div>
                    <span>Montant converti:</span>
                    <span className="ml-1 font-medium">{formatCurrency(payment.amount)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Payment Method Selection */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Méthode de paiement</h3>
            <div className="grid gap-3">
              {availableMethods.map((method) => {
                const config = paymentMethodConfig[method]
                const MethodIcon = config.icon
                return (
                  <label
                    key={method}
                    className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedMethod === method
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method}
                      checked={selectedMethod === method}
                      onChange={(e) => setSelectedMethod(e.target.value as PaymentMethod)}
                      className="mt-1"
                    />
                    <MethodIcon className="h-5 w-5 mt-0.5 text-gray-600" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{config.label}</div>
                      <div className="grid grid-cols-3 gap-4 mt-1 text-xs text-gray-600">
                        <div>
                          <span className="font-medium">Délai:</span>
                          <span className="ml-1">{config.processingTime}</span>
                        </div>
                        <div>
                          <span className="font-medium">Frais:</span>
                          <span className="ml-1">{config.fees}</span>
                        </div>
                        <div>
                          <span className="font-medium">Sécurité:</span>
                          <span className="ml-1">{config.security}</span>
                        </div>
                      </div>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>
          {/* Additional Options */}
          {isSchedulable && (
            <div className="space-y-2">
              <label htmlFor={scheduledDateId} className="text-sm font-medium text-gray-900">
                Date d'exécution (optionnel)
              </label>
              <input
                type="date"
                id={scheduledDateId}
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500">
                Si non spécifié, le paiement sera exécuté immédiatement
              </p>
            </div>
          )}
          {requiresConfirmationCode && (
            <div className="space-y-2">
              <label htmlFor={confirmationCodeId} className="text-sm font-medium text-gray-900">
                Code de confirmation
              </label>
              <input
                type="text"
                id={confirmationCodeId}
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
                placeholder="Entrez le code reçu par SMS/email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}
          {/* Payment Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-3">Récapitulatif</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">Montant principal:</span>
                <span className="font-medium text-blue-900">{formatCurrency(payment.amount)}</span>
              </div>
              {payment.fees && payment.fees > 0 && (
                <div className="flex justify-between">
                  <span className="text-blue-700">Frais:</span>
                  <span className="font-medium text-blue-900">{formatCurrency(payment.fees)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-blue-200">
                <span className="font-medium text-blue-800">Total à débiter:</span>
                <span className="font-bold text-blue-900">{formatCurrency(getTotalAmount())}</span>
              </div>
            </div>
          </div>
          {/* Terms and Conditions */}
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id={termsId}
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-1 rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              required
            />
            <label htmlFor={termsId} className="text-sm text-gray-700">
              J'accepte les conditions générales et confirme que les informations de paiement sont
              correctes. Ce paiement sera traité selon la méthode sélectionnée.
            </label>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={
                loading || !agreedToTerms || (requiresConfirmationCode && !confirmationCode.trim())
              }
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Traitement...' : 'Confirmer le paiement'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
