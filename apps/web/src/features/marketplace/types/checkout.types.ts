export type CheckoutStep = 'shipping' | 'billing' | 'payment' | 'review'

export interface CheckoutData {
  shipping: {
    firstName: string
    lastName: string
    email: string
    phone: string
    address: string
    address2?: string
    city: string
    state: string
    postalCode: string
    country: string
    saveAddress?: boolean
  }
  billing: {
    sameAsShipping: boolean
    firstName?: string
    lastName?: string
    address?: string
    address2?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
  }
  shippingMethod: {
    id: string
    name: string
    cost: number
    estimatedDays: number
  }
  payment: {
    method: 'card' | 'paypal' | 'bank_transfer'
    cardNumber?: string
    cardHolder?: string
    expiryDate?: string
    cvv?: string
    saveCard?: boolean
  }
  orderNotes?: string
  agreeToTerms: boolean
  subscribeNewsletter?: boolean
}
