'use client'
import { useState } from 'react'
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, Textarea } from '../../../primitives'
import { AlertTriangle, Package, Calendar, Euro, Truck, User } from 'lucide-react'
export type OrderStatus = 'pending' | 'confirmed' | 'in_production' | 'ready' | 'shipped' | 'delivered'
export interface OrderImpact {
  financialLoss: number
  affectedSuppliers: string[]
  productionDelay: number // in days
  customerNotificationRequired: boolean
  refundRequired: boolean
  restockingFee: number
}
export interface OrderDetails {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  totalAmount: number
  status: OrderStatus
  orderDate: string
  expectedDeliveryDate: string
  items: Array<{
    id: string
    name: string
    quantity: number
    unitPrice: number
    steelGrade?: string
  }>
  impact: OrderImpact
}
export interface CancelOrderConfirmationProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: OrderDetails
  onConfirm: (data: { orderId: string; reason: string; notifyCustomer: boolean; processRefund: boolean }) => Promise<void>
}
const statusLabels: Record<OrderStatus, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  in_production: 'En production',
  ready: 'Prête',
  shipped: 'Expédiée',
  delivered: 'Livrée'
}
const statusColors: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  in_production: 'bg-orange-100 text-orange-800',
  ready: 'bg-green-100 text-green-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-gray-100 text-gray-800'
}
export function CancelOrderConfirmation({
  open,
  onOpenChange,
  order,
  onConfirm,
}: CancelOrderConfirmationProps) {
  const [loading, setLoading] = useState(false)
  const [reason, setReason] = useState('')
  const [notifyCustomer, setNotifyCustomer] = useState(true)
  const [processRefund, setProcessRefund] = useState(order.impact.refundRequired)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onConfirm({ 
        orderId: order.id, 
        reason, 
        notifyCustomer, 
        processRefund 
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Order cancellation failed:', error)
    } finally {
      setLoading(false)
    }
  }
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Annuler la commande {order.orderNumber}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Details Section */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{order.customerName}</p>
                  <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Euro className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{formatCurrency(order.totalAmount)}</p>
                  <p className="text-xs text-muted-foreground">Montant total</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{formatDate(order.orderDate)}</p>
                  <p className="text-xs text-muted-foreground">Date de commande</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{formatDate(order.expectedDeliveryDate)}</p>
                  <p className="text-xs text-muted-foreground">Livraison prévue</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Statut:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                {statusLabels[order.status]}
              </span>
            </div>
          </div>
          {/* Items Section */}
          <div className="border rounded-lg p-4">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Articles commandés ({order.items.length})
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <div>
                    <span className="font-medium">{item.name}</span>
                    {item.steelGrade && (
                      <span className="text-muted-foreground ml-2">({item.steelGrade})</span>
                    )}
                  </div>
                  <div className="text-right">
                    <span>{item.quantity} × {formatCurrency(item.unitPrice)}</span>
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(item.quantity * item.unitPrice)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Impact Assessment */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-red-800 mb-3">Impact de l'annulation</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-red-700 font-medium">Perte financière:</span>
                <span className="ml-2">{formatCurrency(order.impact.financialLoss)}</span>
              </div>
              <div>
                <span className="text-red-700 font-medium">Frais de restockage:</span>
                <span className="ml-2">{formatCurrency(order.impact.restockingFee)}</span>
              </div>
              <div>
                <span className="text-red-700 font-medium">Retard de production:</span>
                <span className="ml-2">{order.impact.productionDelay} jours</span>
              </div>
              <div>
                <span className="text-red-700 font-medium">Fournisseurs affectés:</span>
                <span className="ml-2">{order.impact.affectedSuppliers.length}</span>
              </div>
            </div>
            {order.impact.affectedSuppliers.length > 0 && (
              <div className="mt-2">
                <span className="text-red-700 font-medium text-sm">Fournisseurs:</span>
                <div className="text-sm text-red-600 mt-1">
                  {order.impact.affectedSuppliers.join(', ')}
                </div>
              </div>
            )}
          </div>
          {/* Cancellation Reason */}
          <div className="space-y-2">
            <label htmlFor="reason" className="text-sm font-medium">
              Motif d'annulation <span className="text-red-500">*</span>
            </label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Décrivez la raison de l'annulation..."
              required
              rows={3}
            />
          </div>
          {/* Options */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="notifyCustomer"
                checked={notifyCustomer}
                onChange={(e) => setNotifyCustomer(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <label htmlFor="notifyCustomer" className="text-sm">
                Notifier le client par email
              </label>
            </div>
            {order.impact.refundRequired && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="processRefund"
                  checked={processRefund}
                  onChange={(e) => setProcessRefund(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <label htmlFor="processRefund" className="text-sm">
                  Traiter le remboursement ({formatCurrency(order.totalAmount - order.impact.restockingFee)})
                </label>
              </div>
            )}
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
              disabled={loading || !reason.trim()}
              variant="destructive"
            >
              {loading ? 'Annulation en cours...' : 'Confirmer l\'annulation'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
