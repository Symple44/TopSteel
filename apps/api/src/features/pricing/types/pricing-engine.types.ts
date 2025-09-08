/**
 * Type definitions for pricing engine
 */

import type { AdjustmentType, PriceRuleChannel } from '@erp/entities'

// Core pricing types that replace any usage
export interface CalculationState {
  warnings: string[]
  breakdownSteps: BreakdownStep[]
  stepNumber: number
}

export interface BreakdownStep {
  stepNumber: number
  ruleName: string
  ruleId: string
  priceBefore: number
  priceAfter: number
  adjustment: number
  adjustmentType: string
  description: string
}

export interface SkippedRule {
  ruleId: string
  ruleName: string
  reason: string
  priority: number
}

export interface AppliedRuleInfo {
  ruleId: string
  ruleName: string
  ruleType: AdjustmentType
  adjustment: number
  adjustmentUnit?: string
  discountAmount: number
  discountPercentage: number
}

export interface PriceRuleApplication {
  success: boolean
  newPrice: number
  priceChanged: boolean
}

export interface BreakdownContext {
  article: {
    id: string
    reference: string
    designation: string
    famille?: string
    dimensions?: {
      poids?: number
      longueur?: number
      largeur?: number
      hauteur?: number
      surface?: number
      volume?: number
    }
    units?: {
      stock?: string
      vente?: string
      achat?: string
    }
  }
  customer?: {
    id?: string
    group?: string
    email?: string
  }
  quantity: number
  channel: string
}

export interface BreakdownMargins {
  costPrice?: number
  sellingPrice: number
  margin: number
  marginPercentage: number
  markupPercentage: number
}

export interface BreakdownMetadata {
  calculationTime: number
  rulesEvaluated: number
  rulesApplied: number
  cacheHit: boolean
}

export interface DetailedBreakdown {
  steps: BreakdownStep[]
  skippedRules?: SkippedRule[]
  context: BreakdownContext
  metadata: BreakdownMetadata
  margins?: BreakdownMargins
}

export interface EnrichedPricingContext extends Record<string, unknown> {
  // Base context
  articleId?: string
  articleReference?: string
  customerId?: string
  societeId: string
  quantity?: number
  customerGroup?: string
  customerEmail?: string
  channel?: PriceRuleChannel
  promotionCode?: string
  isFirstOrder?: boolean
  orderTotal?: number

  // Enriched fields for rule evaluation
  article_reference?: string
  article_family?: string
}

// Calculation method result interfaces
export interface WeightPriceResult {
  newPrice: number
}

export interface LengthPriceResult {
  newPrice: number
}

export interface SurfacePriceResult {
  newPrice: number
}

export interface VolumePriceResult {
  newPrice: number
}

export interface FormulaPriceResult {
  newPrice: number
}

// Build result parameters interface
export interface BuildFinalResultParams {
  article: NonNullable<any>
  context: any
  options?: {
    detailed?: boolean
    includeMargins?: boolean
    includeSkippedRules?: boolean
  }
  basePrice: number
  finalPrice: number
  appliedRules: AppliedRuleInfo[]
  skippedRules: SkippedRule[]
  calculationTime: number
  calculationState: CalculationState
}

// Build detailed breakdown parameters interface
export interface BuildDetailedBreakdownParams {
  article: NonNullable<any>
  context: any
  options?: {
    includeMargins?: boolean
    includeSkippedRules?: boolean
  }
  finalPrice: number
  skippedRules: SkippedRule[]
  appliedRules: AppliedRuleInfo[]
  calculationTime: number
  calculationState: CalculationState
}
