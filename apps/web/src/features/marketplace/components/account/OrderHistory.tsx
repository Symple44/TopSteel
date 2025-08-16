'use client';

import React, { useState } from 'react';
import { 
  Package, 
  Search, 
  Filter, 
  Calendar,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  Eye,
  Download,
  RotateCcw,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Order {
  id: string;
  date: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  total: number;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
  shippingAddress: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
}

interface OrderHistoryProps {
  className?: string;
}

const mockOrders: Order[] = [
  {
    id: 'ORD-2024-001',
    date: '2024-01-15T10:30:00Z',
    status: 'delivered',
    total: 299.99,
    items: [
      { id: '1', name: 'Steel Beam 10m', quantity: 2, price: 149.99 },
      { id: '2', name: 'Welding Rod Set', quantity: 1, price: 49.99 }
    ],
    shippingAddress: '123 Main St, Paris, France',
    trackingNumber: 'TRK123456789',
    estimatedDelivery: '2024-01-18'
  },
  {
    id: 'ORD-2024-002',
    date: '2024-01-10T14:22:00Z',
    status: 'shipped',
    total: 149.50,
    items: [
      { id: '3', name: 'Metal Sheets Pack', quantity: 1, price: 129.50 },
      { id: '4', name: 'Safety Gloves', quantity: 1, price: 20.00 }
    ],
    shippingAddress: '456 Business Ave, Lyon, France',
    trackingNumber: 'TRK987654321',
    estimatedDelivery: '2024-01-16'
  },
  {
    id: 'ORD-2024-003',
    date: '2024-01-05T09:15:00Z',
    status: 'processing',
    total: 89.99,
    items: [
      { id: '5', name: 'Cutting Tool Set', quantity: 1, price: 89.99 }
    ],
    shippingAddress: '789 Industrial Rd, Marseille, France'
  },
  {
    id: 'ORD-2023-089',
    date: '2023-12-20T16:45:00Z',
    status: 'cancelled',
    total: 199.99,
    items: [
      { id: '6', name: 'Heavy Duty Drill', quantity: 1, price: 199.99 }
    ],
    shippingAddress: '123 Main St, Paris, France'
  }
];

const statusConfig = {
  pending: {
    label: 'Pending',
    icon: Clock,
    color: 'text-yellow-700 bg-yellow-50 border-yellow-200'
  },
  processing: {
    label: 'Processing',
    icon: RefreshCw,
    color: 'text-blue-700 bg-blue-50 border-blue-200'
  },
  shipped: {
    label: 'Shipped',
    icon: Truck,
    color: 'text-purple-700 bg-purple-50 border-purple-200'
  },
  delivered: {
    label: 'Delivered',
    icon: CheckCircle,
    color: 'text-green-700 bg-green-50 border-green-200'
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    color: 'text-red-700 bg-red-50 border-red-200'
  },
  refunded: {
    label: 'Refunded',
    icon: RotateCcw,
    color: 'text-gray-700 bg-gray-50 border-gray-200'
  }
};

export const OrderHistory: React.FC<OrderHistoryProps> = ({ className }) => {
  const [orders] = useState<Order[]>(mockOrders);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const orderDate = new Date(order.date);
      const now = new Date();
      switch (dateFilter) {
        case 'week':
          matchesDate = (now.getTime() - orderDate.getTime()) <= 7 * 24 * 60 * 60 * 1000;
          break;
        case 'month':
          matchesDate = (now.getTime() - orderDate.getTime()) <= 30 * 24 * 60 * 60 * 1000;
          break;
        case 'year':
          matchesDate = orderDate.getFullYear() === now.getFullYear();
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
  };

  const handleTrackOrder = (trackingNumber: string) => {
    // Implement tracking logic
    console.log('Track order:', trackingNumber);
  };

  const handleDownloadInvoice = (orderId: string) => {
    // Implement invoice download
    console.log('Download invoice:', orderId);
  };

  const handleReorder = (order: Order) => {
    // Implement reorder logic
    console.log('Reorder:', order.id);
  };

  const handleContactSupport = (orderId: string) => {
    // Implement support contact
    console.log('Contact support for:', orderId);
  };

  return (
    <div className={cn("p-6", className)}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Order History</h2>
        <p className="text-gray-600">
          View and manage all your past orders
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search orders by ID or product name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Time</option>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Showing {filteredOrders.length} of {orders.length} orders
        </p>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                ? 'Try adjusting your filters to see more results.'
                : 'You haven\'t placed any orders yet.'}
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const statusInfo = statusConfig[order.status];
            const StatusIcon = statusInfo.icon;

            return (
              <div
                key={order.id}
                className="border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Package className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{order.id}</h3>
                      <p className="text-sm text-gray-600">{formatDate(order.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium border",
                      statusInfo.color
                    )}>
                      <StatusIcon className="w-3 h-3 inline mr-1" />
                      {statusInfo.label}
                    </span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="mb-4">
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">
                          {item.name} × {item.quantity}
                        </span>
                        <span className="font-medium">{formatPrice(item.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Details */}
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-gray-600">
                    <p>Ship to: {order.shippingAddress}</p>
                    {order.trackingNumber && (
                      <p>Tracking: {order.trackingNumber}</p>
                    )}
                    {order.estimatedDelivery && order.status === 'shipped' && (
                      <p>Expected: {formatDate(order.estimatedDelivery)}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {formatPrice(order.total)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {order.items.length} item{order.items.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleOrderClick(order)}
                    className="flex items-center gap-1 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>

                  {order.trackingNumber && (
                    <button
                      onClick={() => handleTrackOrder(order.trackingNumber!)}
                      className="flex items-center gap-1 px-3 py-2 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                    >
                      <Truck className="w-4 h-4" />
                      Track Order
                    </button>
                  )}

                  {order.status === 'delivered' && (
                    <button
                      onClick={() => handleDownloadInvoice(order.id)}
                      className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Invoice
                    </button>
                  )}

                  {(order.status === 'delivered' || order.status === 'cancelled') && (
                    <button
                      onClick={() => handleReorder(order)}
                      className="flex items-center gap-1 px-3 py-2 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Reorder
                    </button>
                  )}

                  <button
                    onClick={() => handleContactSupport(order.id)}
                    className="flex items-center gap-1 px-3 py-2 text-sm text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Support
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Load More */}
      {filteredOrders.length > 0 && (
        <div className="mt-8 text-center">
          <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            Load More Orders
          </button>
        </div>
      )}
    </div>
  );
};