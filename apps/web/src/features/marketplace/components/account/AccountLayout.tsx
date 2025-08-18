'use client'

import {
  Bell,
  CreditCard,
  Heart,
  LogOut,
  MapPin,
  Package,
  Settings,
  Shield,
  User,
} from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import type React from 'react'
import { cn } from '@/lib/utils'

interface AccountLayoutProps {
  children: React.ReactNode
  className?: string
}

const navigation = [
  {
    name: 'Overview',
    href: '/marketplace/account',
    icon: User,
    description: 'Account summary and recent activity',
  },
  {
    name: 'Orders',
    href: '/marketplace/account/orders',
    icon: Package,
    description: 'Order history and tracking',
  },
  {
    name: 'Addresses',
    href: '/marketplace/account/addresses',
    icon: MapPin,
    description: 'Shipping and billing addresses',
  },
  {
    name: 'Payment Methods',
    href: '/marketplace/account/payment-methods',
    icon: CreditCard,
    description: 'Saved payment methods',
  },
  {
    name: 'Wishlist',
    href: '/marketplace/account/wishlist',
    icon: Heart,
    description: 'Saved items and favorites',
  },
  {
    name: 'Notifications',
    href: '/marketplace/account/notifications',
    icon: Bell,
    description: 'Email and SMS preferences',
  },
  {
    name: 'Security',
    href: '/marketplace/account/security',
    icon: Shield,
    description: 'Password and security settings',
  },
  {
    name: 'Settings',
    href: '/marketplace/account/settings',
    icon: Settings,
    description: 'Account preferences',
  },
]

export const AccountLayout: React.FC<AccountLayoutProps> = ({ children, className }) => {
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = () => {
    // Implement logout logic
    router.push('/auth/login')
  }

  return (
    <div className={cn('min-h-screen bg-gray-50', className)}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
          <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* User Info */}
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">John Doe</h3>
                    <p className="text-sm text-gray-600">john.doe@example.com</p>
                  </div>
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="p-2">
                {navigation.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href

                  return (
                    <button
                      key={item.name}
                      onClick={() => router.push(item.href)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors',
                        isActive
                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      )}
                    >
                      <Icon
                        className={cn('w-5 h-5', isActive ? 'text-blue-600' : 'text-gray-400')}
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            'font-medium',
                            isActive ? 'text-blue-700' : 'text-gray-900'
                          )}
                        >
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-500 hidden lg:block">{item.description}</p>
                      </div>
                    </button>
                  )
                })}

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors text-red-600 hover:bg-red-50 mt-4 border-t border-gray-200"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </nav>
            </div>

            {/* Quick Stats */}
            <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Orders</span>
                  <span className="font-medium">24</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Wishlist Items</span>
                  <span className="font-medium">8</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Saved Addresses</span>
                  <span className="font-medium">3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Member Since</span>
                  <span className="font-medium">2023</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">{children}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
