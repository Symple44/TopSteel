'use client';

import React, { useEffect, useState } from 'react';
import { X, ShoppingBag, Plus, Minus, Trash2, AlertCircle, ArrowRight, Tag } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectCartItems,
  selectCartItemCount,
  selectCartSubtotal,
  selectCartDiscount,
  selectShippingCost,
  selectCartTotal,
  selectIsCartOpen,
  selectAppliedCoupon,
  updateQuantity,
  removeFromCart,
  clearCart,
  setCartOpen,
  applyCoupon,
  removeCoupon
} from '../../store/cartSlice';
import { cn } from '@/lib/utils';
import { validateCart } from '../../store/cartPersistence';

interface ShoppingCartProps {
  className?: string;
}

export const ShoppingCart: React.FC<ShoppingCartProps> = ({ className }) => {
  const dispatch = useDispatch();
  const items = useSelector(selectCartItems);
  const itemCount = useSelector(selectCartItemCount);
  const subtotal = useSelector(selectCartSubtotal);
  const discount = useSelector(selectCartDiscount);
  const shipping = useSelector(selectShippingCost);
  const total = useSelector(selectCartTotal);
  const isOpen = useSelector(selectIsCartOpen);
  const appliedCoupon = useSelector(selectAppliedCoupon);
  
  const [couponCode, setCouponCode] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [validationIssues, setValidationIssues] = useState<any[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    // Validate cart when it opens or items change
    if (isOpen && items.length > 0) {
      validateCartItems();
    }
  }, [isOpen, items]);

  const validateCartItems = async () => {
    setIsValidating(true);
    try {
      const validation = await validateCart({ 
        items, 
        isOpen, 
        lastUpdated: new Date(), 
        appliedCoupon, 
        shippingMethod: null 
      });
      setValidationIssues(validation.issues);
    } catch (error) {
      console.error('Cart validation error:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const handleQuantityChange = (productId: string, newQuantity: number, options?: any) => {
    if (newQuantity >= 0) {
      dispatch(updateQuantity({ productId, quantity: newQuantity, options }));
    }
  };

  const handleRemoveItem = (productId: string, options?: any) => {
    dispatch(removeFromCart({ productId, options }));
  };

  const handleClearCart = () => {
    if (confirm('Are you sure you want to clear your cart?')) {
      dispatch(clearCart());
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    
    setIsApplyingCoupon(true);
    try {
      // Call API to validate coupon
      const response = await fetch('/api/marketplace/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, cartTotal: subtotal })
      });
      
      if (response.ok) {
        const data = await response.json();
        dispatch(applyCoupon({
          code: couponCode,
          discount: data.discount,
          type: data.type
        }));
        setCouponCode('');
      } else {
        alert('Invalid coupon code');
      }
    } catch (error) {
      console.error('Error applying coupon:', error);
      alert('Failed to apply coupon');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const getValidationIssue = (productId: string) => {
    return validationIssues.find(issue => issue.productId === productId);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={() => dispatch(setCartOpen(false))}
      />
      
      {/* Cart Drawer */}
      <div className={cn(
        "fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col",
        className
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Shopping Cart</h2>
            <span className="px-2 py-0.5 text-sm bg-gray-100 rounded-full">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </span>
          </div>
          <button
            onClick={() => dispatch(setCartOpen(false))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8">
              <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-gray-500 text-center">Your cart is empty</p>
              <Link
                href="/marketplace"
                onClick={() => dispatch(setCartOpen(false))}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* Clear Cart Button */}
              {items.length > 0 && (
                <button
                  onClick={handleClearCart}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Clear all items
                </button>
              )}

              {/* Cart Items List */}
              {items.map((item) => {
                const issue = getValidationIssue(item.product.id);
                
                return (
                  <div 
                    key={`${item.product.id}-${JSON.stringify(item.selectedOptions)}`}
                    className="flex gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    {/* Product Image */}
                    <Link 
                      href={`/marketplace/products/${item.product.slug}`}
                      onClick={() => dispatch(setCartOpen(false))}
                      className="relative w-20 h-20 flex-shrink-0"
                    >
                      <Image
                        src={item.product.images[0] || '/placeholder-product.jpg'}
                        alt={item.product.name}
                        fill
                        className="object-cover rounded-lg"
                      />
                    </Link>

                    {/* Product Details */}
                    <div className="flex-1">
                      <Link 
                        href={`/marketplace/products/${item.product.slug}`}
                        onClick={() => dispatch(setCartOpen(false))}
                        className="font-medium text-gray-900 hover:text-blue-600 line-clamp-2"
                      >
                        {item.product.name}
                      </Link>
                      
                      {/* Selected Options */}
                      {item.selectedOptions && Object.entries(item.selectedOptions).length > 0 && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          {Object.entries(item.selectedOptions).map(([key, value]) => (
                            <span key={key} className="mr-2">
                              {key}: {value}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Validation Issue */}
                      {issue && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-orange-600">
                          <AlertCircle className="w-3 h-3" />
                          <span>{issue.message}</span>
                        </div>
                      )}

                      {/* Price and Quantity */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleQuantityChange(
                              item.product.id,
                              item.quantity - 1,
                              item.selectedOptions
                            )}
                            disabled={item.quantity <= 1}
                            className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <button
                            onClick={() => handleQuantityChange(
                              item.product.id,
                              item.quantity + 1,
                              item.selectedOptions
                            )}
                            disabled={item.quantity >= item.product.stockQuantity}
                            className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {formatPrice(item.product.price * item.quantity)}
                          </span>
                          <button
                            onClick={() => handleRemoveItem(item.product.id, item.selectedOptions)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Coupon Section */}
              <div className="pt-4 border-t">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Enter coupon code"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!!appliedCoupon || isApplyingCoupon}
                    />
                  </div>
                  {appliedCoupon ? (
                    <button
                      onClick={() => dispatch(removeCoupon())}
                      className="px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      onClick={handleApplyCoupon}
                      disabled={!couponCode.trim() || isApplyingCoupon}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isApplyingCoupon ? 'Applying...' : 'Apply'}
                    </button>
                  )}
                </div>
                {appliedCoupon && (
                  <div className="mt-2 p-2 bg-green-50 text-green-700 rounded-lg text-sm">
                    Coupon "{appliedCoupon.code}" applied! You saved {formatPrice(discount)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer with Summary */}
        {items.length > 0 && (
          <div className="border-t p-4 space-y-3">
            {/* Price Breakdown */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              {shipping > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">{formatPrice(shipping)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <Link
              href="/marketplace/checkout"
              onClick={() => dispatch(setCartOpen(false))}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
            >
              Proceed to Checkout
              <ArrowRight className="w-4 h-4" />
            </Link>

            {/* Continue Shopping */}
            <button
              onClick={() => dispatch(setCartOpen(false))}
              className="w-full px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Continue Shopping
            </button>

            {/* Security Badge */}
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Secure Checkout
            </div>
          </div>
        )}
      </div>
    </>
  );
};