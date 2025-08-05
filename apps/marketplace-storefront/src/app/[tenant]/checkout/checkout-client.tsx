'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, User, Mail, Phone, MapPin, CreditCard, ShoppingBag, Lock } from 'lucide-react'
import { useCart } from '@/stores/cart-store'
import { formatPrice, cn } from '@/lib/utils'
import { toast } from 'sonner'

interface CheckoutClientProps {
  tenant: string
}

export default function CheckoutClient({ tenant }: CheckoutClientProps) {
  const router = useRouter()
  const { items, totalItems, totalPrice, clearCart, setTenant } = useCart()
  const [isProcessing, setIsProcessing] = useState(false)
  const [checkoutStep, setCheckoutStep] = useState<'info' | 'payment' | 'confirmation'>('info')

  // Customer information
  const [customerInfo, setCustomerInfo] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    company: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'France',
    createAccount: false,
    password: '',
    acceptTerms: false,
    newsletter: false,
  })

  // Payment information
  const [paymentInfo, setPaymentInfo] = useState({
    method: 'card', // card, bank_transfer, check
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
  })

  useEffect(() => {
    setTenant(tenant)
    if (items.length === 0) {
      router.push(`/${tenant}/cart`)
    }
  }, [tenant, setTenant, items.length, router])

  const handleSubmitInfo = (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    const requiredFields = [
      'email',
      'firstName',
      'lastName',
      'phone',
      'address',
      'city',
      'postalCode',
    ]
    const missingFields = requiredFields.filter(
      (field) => !customerInfo[field as keyof typeof customerInfo]
    )

    if (missingFields.length > 0) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    if (!customerInfo.acceptTerms) {
      toast.error('Veuillez accepter les conditions générales de vente')
      return
    }

    setCheckoutStep('payment')
  }

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Clear cart and redirect to success
      clearCart()
      setCheckoutStep('confirmation')

      toast.success('Commande confirmée !', {
        description: 'Vous recevrez un email de confirmation sous peu.',
      })
    } catch (error) {
      toast.error('Erreur lors du paiement')
    } finally {
      setIsProcessing(false)
    }
  }

  if (items.length === 0 && checkoutStep !== 'confirmation') {
    return null // Will redirect to cart
  }

  if (checkoutStep === 'confirmation') {
    return (
      <div className="container-marketplace py-12">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-green-600">Commande confirmée !</h1>
            <p className="text-muted-foreground">
              Votre commande a été prise en compte. Vous recevrez un email de confirmation avec les
              détails de votre commande.
            </p>
          </div>

          <div className="space-y-3">
            <Link href={`/${tenant}`} className="btn-primary inline-flex items-center gap-2">
              Retour à l'accueil
            </Link>
            <div>
              <Link href={`/${tenant}/products`} className="text-primary hover:underline">
                Continuer mes achats
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container-marketplace py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold">Finaliser ma commande</h1>
            <p className="text-muted-foreground">
              {totalItems} article{totalItems > 1 ? 's' : ''} - {formatPrice(totalPrice)}
            </p>
          </div>

          <Link href={`/${tenant}/cart`} className="btn-outline flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Retour au panier
          </Link>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center space-x-4">
          <div
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium',
              checkoutStep === 'info'
                ? 'bg-primary text-primary-foreground'
                : 'bg-green-100 text-green-700'
            )}
          >
            <User className="w-4 h-4" />
            Informations
          </div>
          <div className={cn('w-8 h-px', checkoutStep !== 'info' ? 'bg-green-500' : 'bg-muted')} />
          <div
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium',
              checkoutStep === 'payment'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            )}
          >
            <CreditCard className="w-4 h-4" />
            Paiement
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {checkoutStep === 'info' && (
              <form onSubmit={handleSubmitInfo} className="space-y-6">
                <div className="bg-background border rounded-lg p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Informations personnelles
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Email <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={customerInfo.email}
                        onChange={(e) =>
                          setCustomerInfo({ ...customerInfo, email: e.target.value })
                        }
                        className="input-marketplace w-full"
                        placeholder="votre@email.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Téléphone <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={customerInfo.phone}
                        onChange={(e) =>
                          setCustomerInfo({ ...customerInfo, phone: e.target.value })
                        }
                        className="input-marketplace w-full"
                        placeholder="+33 1 23 45 67 89"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Prénom <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={customerInfo.firstName}
                        onChange={(e) =>
                          setCustomerInfo({ ...customerInfo, firstName: e.target.value })
                        }
                        className="input-marketplace w-full"
                        placeholder="Jean"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Nom <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={customerInfo.lastName}
                        onChange={(e) =>
                          setCustomerInfo({ ...customerInfo, lastName: e.target.value })
                        }
                        className="input-marketplace w-full"
                        placeholder="Dupont"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">
                        Entreprise (optionnel)
                      </label>
                      <input
                        type="text"
                        value={customerInfo.company}
                        onChange={(e) =>
                          setCustomerInfo({ ...customerInfo, company: e.target.value })
                        }
                        className="input-marketplace w-full"
                        placeholder="Nom de l'entreprise"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-background border rounded-lg p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Adresse de livraison
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Adresse <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={customerInfo.address}
                        onChange={(e) =>
                          setCustomerInfo({ ...customerInfo, address: e.target.value })
                        }
                        className="input-marketplace w-full"
                        placeholder="123 Rue de la Paix"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Code postal <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={customerInfo.postalCode}
                          onChange={(e) =>
                            setCustomerInfo({ ...customerInfo, postalCode: e.target.value })
                          }
                          className="input-marketplace w-full"
                          placeholder="75001"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Ville <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={customerInfo.city}
                          onChange={(e) =>
                            setCustomerInfo({ ...customerInfo, city: e.target.value })
                          }
                          className="input-marketplace w-full"
                          placeholder="Paris"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Pays <span className="text-destructive">*</span>
                        </label>
                        <select
                          required
                          value={customerInfo.country}
                          onChange={(e) =>
                            setCustomerInfo({ ...customerInfo, country: e.target.value })
                          }
                          className="input-marketplace w-full"
                        >
                          <option value="France">France</option>
                          <option value="Belgique">Belgique</option>
                          <option value="Suisse">Suisse</option>
                          <option value="Luxembourg">Luxembourg</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-background border rounded-lg p-6">
                  <h2 className="text-lg font-semibold mb-4">Options</h2>

                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={customerInfo.createAccount}
                        onChange={(e) =>
                          setCustomerInfo({ ...customerInfo, createAccount: e.target.checked })
                        }
                        className="rounded border-input"
                      />
                      <span className="text-sm">Créer un compte pour suivre mes commandes</span>
                    </label>

                    {customerInfo.createAccount && (
                      <div className="ml-6">
                        <label className="block text-sm font-medium mb-1">Mot de passe</label>
                        <input
                          type="password"
                          value={customerInfo.password}
                          onChange={(e) =>
                            setCustomerInfo({ ...customerInfo, password: e.target.value })
                          }
                          className="input-marketplace w-full max-w-xs"
                          placeholder="Mot de passe"
                        />
                      </div>
                    )}

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={customerInfo.newsletter}
                        onChange={(e) =>
                          setCustomerInfo({ ...customerInfo, newsletter: e.target.checked })
                        }
                        className="rounded border-input"
                      />
                      <span className="text-sm">Recevoir les offres et nouveautés par email</span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        required
                        checked={customerInfo.acceptTerms}
                        onChange={(e) =>
                          setCustomerInfo({ ...customerInfo, acceptTerms: e.target.checked })
                        }
                        className="rounded border-input mt-0.5"
                      />
                      <span className="text-sm">
                        J'accepte les{' '}
                        <Link href={`/${tenant}/terms`} className="text-primary hover:underline">
                          conditions générales de vente
                        </Link>{' '}
                        et la{' '}
                        <Link href={`/${tenant}/privacy`} className="text-primary hover:underline">
                          politique de confidentialité
                        </Link>
                        <span className="text-destructive ml-1">*</span>
                      </span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full btn-primary py-3 flex items-center justify-center gap-2"
                >
                  Continuer vers le paiement
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </button>
              </form>
            )}

            {checkoutStep === 'payment' && (
              <form onSubmit={handleSubmitPayment} className="space-y-6">
                <div className="bg-background border rounded-lg p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Méthode de paiement
                  </h2>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3">
                      <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="card"
                          checked={paymentInfo.method === 'card'}
                          onChange={(e) =>
                            setPaymentInfo({ ...paymentInfo, method: e.target.value })
                          }
                        />
                        <CreditCard className="w-5 h-5" />
                        <span className="font-medium">Carte bancaire</span>
                      </label>

                      <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="bank_transfer"
                          checked={paymentInfo.method === 'bank_transfer'}
                          onChange={(e) =>
                            setPaymentInfo({ ...paymentInfo, method: e.target.value })
                          }
                        />
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                          />
                        </svg>
                        <span className="font-medium">Virement bancaire</span>
                      </label>
                    </div>

                    {paymentInfo.method === 'card' && (
                      <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                        <div>
                          <label className="block text-sm font-medium mb-1">Numéro de carte</label>
                          <input
                            type="text"
                            required
                            value={paymentInfo.cardNumber}
                            onChange={(e) =>
                              setPaymentInfo({ ...paymentInfo, cardNumber: e.target.value })
                            }
                            className="input-marketplace w-full"
                            placeholder="1234 5678 9012 3456"
                            maxLength={19}
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">MM/AA</label>
                            <input
                              type="text"
                              required
                              value={paymentInfo.expiryDate}
                              onChange={(e) =>
                                setPaymentInfo({ ...paymentInfo, expiryDate: e.target.value })
                              }
                              className="input-marketplace w-full"
                              placeholder="12/25"
                              maxLength={5}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-1">CVV</label>
                            <input
                              type="text"
                              required
                              value={paymentInfo.cvv}
                              onChange={(e) =>
                                setPaymentInfo({ ...paymentInfo, cvv: e.target.value })
                              }
                              className="input-marketplace w-full"
                              placeholder="123"
                              maxLength={4}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">Nom du porteur</label>
                          <input
                            type="text"
                            required
                            value={paymentInfo.cardholderName}
                            onChange={(e) =>
                              setPaymentInfo({ ...paymentInfo, cardholderName: e.target.value })
                            }
                            className="input-marketplace w-full"
                            placeholder="Jean Dupont"
                          />
                        </div>
                      </div>
                    )}

                    {paymentInfo.method === 'bank_transfer' && (
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          Vous recevrez les coordonnées bancaires par email après validation de
                          votre commande. La commande sera expédiée après réception du paiement.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 p-4 bg-muted/30 rounded-lg">
                  <Lock className="w-5 h-5 text-green-600" />
                  <p className="text-sm text-muted-foreground">
                    Vos informations de paiement sont sécurisées et chiffrées
                  </p>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setCheckoutStep('info')}
                    className="btn-outline flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Retour
                  </button>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="flex-1 btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Traitement en cours...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        Finaliser la commande ({formatPrice(totalPrice)})
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-muted/30 rounded-lg p-6 sticky top-24">
              <h2 className="text-lg font-semibold mb-4">Récapitulatif</h2>

              {/* Items */}
              <div className="space-y-3 mb-6">
                {items.map((item) => {
                  const mainImage =
                    item.product.images.find((img: any) => img.isMain) || item.product.images[0]
                  return (
                    <div key={item.id} className="flex gap-3">
                      <div className="relative w-12 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                        {mainImage ? (
                          <Image
                            src={mainImage.url}
                            alt={item.product.designation}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2">
                          {item.product.designation}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Qté: {item.quantity} × {formatPrice(item.unitPrice)}
                        </p>
                      </div>
                      <div className="text-sm font-semibold">{formatPrice(item.totalPrice)}</div>
                    </div>
                  )
                })}
              </div>

              {/* Totals */}
              <div className="space-y-3 mb-6 border-t pt-4">
                <div className="flex justify-between">
                  <span>Sous-total</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>

                <div className="flex justify-between text-muted-foreground">
                  <span>Frais de livraison</span>
                  <span>Gratuit</span>
                </div>

                <div className="border-t pt-3">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
