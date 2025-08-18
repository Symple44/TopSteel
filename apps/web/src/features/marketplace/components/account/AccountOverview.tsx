'use client'

import {
  ArrowRight,
  CheckCircle,
  Clock,
  CreditCard,
  Heart,
  MapPin,
  Package,
  Star,
  TrendingUp,
  Truck,
} from 'lucide-react'
import type React from 'react'
import { cn } from '@/lib/utils'

interface AccountOverviewProps {
  className?: string
}

const recentOrders = [
  {
    id: 'ORD-2024-001',
    date: '2024-01-15',
    status: 'delivered',
    total: 299.99,
    items: 3,
    trackingNumber: 'TRK123456789',
  },
  {
    id: 'ORD-2024-002',
    date: '2024-01-10',
    status: 'shipping',
    total: 149.5,
    items: 2,
    trackingNumber: 'TRK987654321',
  },
  {
    id: 'ORD-2024-003',
    date: '2024-01-05',
    status: 'processing',
    total: 89.99,
    items: 1,
    trackingNumber: null,
  },
]

const quickActions = [
  {
    title: 'Track Orders',
    description: 'Check the status of your recent orders',
    icon: Package,
    href: '/marketplace/account/orders',
    color: 'blue',
  },
  {
    title: 'Manage Addresses',
    description: 'Add or edit shipping addresses',
    icon: MapPin,
    href: '/marketplace/account/addresses',
    color: 'green',
  },
  {
    title: 'Payment Methods',
    description: 'Update your payment information',
    icon: CreditCard,
    href: '/marketplace/account/payment-methods',
    color: 'purple',
  },
  {
    title: 'View Wishlist',
    description: 'See your saved items',
    icon: Heart,
    href: '/marketplace/account/wishlist',
    color: 'red',
  },
]

const accountStats = [
  {
    label: 'Total Orders',
    value: '24',
    change: '+3 this month',
    trend: 'up',
    icon: Package,
  },
  {
    label: 'Total Spent',
    value: '€2,449',
    change: '+€299 this month',
    trend: 'up',
    icon: TrendingUp,
  },
  {
    label: 'Avg. Order Value',
    value: '€102',
    change: '+€12 vs last month',
    trend: 'up',
    icon: Star,
  },
  {
    label: 'Member Since',
    value: 'Jan 2023',
    change: '1 year loyalty',
    trend: 'neutral',
    icon: Clock,
  },
]

export const AccountOverview: React.FC<AccountOverviewProps> = ({ className }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'shipping':
        return <Truck className="w-4 h-4 text-blue-600" />
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-600" />
      default:
        return <Package className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'text-green-700 bg-green-50'
      case 'shipping':
        return 'text-blue-700 bg-blue-50'
      case 'processing':
        return 'text-yellow-700 bg-yellow-50'
      default:
        return 'text-gray-700 bg-gray-50'
    }
  }

  return (
    <div className={cn('p-6', className)}>
      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back, John!</h2>
        <p className="text-gray-600">
          Here's an overview of your account activity and quick access to manage your preferences.
        </p>
      </div>

      {/* Account Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {accountStats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Icon className="w-5 h-5 text-gray-600" />
                </div>
                {stat.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-600" />}
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                <p
                  className={cn(
                    'text-xs',
                    stat.trend === 'up' ? 'text-green-600' : 'text-gray-500'
                  )}
                >
                  {stat.change}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.title}
                className="p-4 text-left border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={cn(
                      'p-2 rounded-lg',
                      action.color === 'blue' && 'bg-blue-100',
                      action.color === 'green' && 'bg-green-100',
                      action.color === 'purple' && 'bg-purple-100',
                      action.color === 'red' && 'bg-red-100'
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-5 h-5',
                        action.color === 'blue' && 'text-blue-600',
                        action.color === 'green' && 'text-green-600',
                        action.color === 'purple' && 'text-purple-600',
                        action.color === 'red' && 'text-red-600'
                      )}
                    />
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
                <h4 className="font-medium text-gray-900 mb-1">{action.title}</h4>
                <p className="text-sm text-gray-600">{action.description}</p>
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(order.status)}
                    <span className="font-medium text-gray-900">{order.id}</span>
                  </div>
                  <span
                    className={cn(
                      'px-2 py-1 rounded-full text-xs font-medium capitalize',
                      getStatusColor(order.status)
                    )}
                  >
                    {order.status}
                  </span>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-sm text-gray-600">
                      {new Date(order.date).toLocaleDateString('fr-FR')}
                    </p>
                    <p className="text-sm text-gray-600">
                      {order.items} item{order.items > 1 ? 's' : ''}
                    </p>
                    {order.trackingNumber && (
                      <p className="text-xs text-blue-600 mt-1">Tracking: {order.trackingNumber}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatPrice(order.total)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Account Health */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Health</h3>
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Profile Completion</span>
                <span className="text-sm text-gray-600">85%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Add a phone number to complete your profile
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Email Verified</p>
                  <p className="text-xs text-gray-600">john.doe@example.com</p>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">2 Payment Methods</p>
                  <p className="text-xs text-gray-600">Visa ending in 4242, PayPal</p>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">3 Saved Addresses</p>
                  <p className="text-xs text-gray-600">Home, Office, Parents</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
