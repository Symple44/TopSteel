/**
 * Tracking status for shipments
 */
export enum TrackingStatus {
  LABEL_CREATED = 'LABEL_CREATED',
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  DELIVERY_FAILED = 'DELIVERY_FAILED',
  RETURNED = 'RETURNED',
  EXCEPTION = 'EXCEPTION',
}

/**
 * Shipping methods
 */
export enum ShippingMethod {
  STANDARD = 'STANDARD',
  EXPRESS = 'EXPRESS',
  OVERNIGHT = 'OVERNIGHT',
  PICKUP = 'PICKUP',
}
