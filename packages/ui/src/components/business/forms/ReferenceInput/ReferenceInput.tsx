'use client'
import { AlertCircle, Check, Copy, Eye, EyeOff, Hash, RefreshCw, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useFormFieldIds } from '../../../../hooks/useFormFieldIds'
import { cn } from '../../../../lib/utils'
import { Badge } from '../../../data-display/badge'
import { Label } from '../../../forms/label/Label'
import { Button } from '../../../primitives/button/Button'
import { Input } from '../../../primitives/input/Input'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../primitives/tooltip'
export type ReferenceFormat = 'auto' | 'numeric' | 'alphanumeric' | 'custom'
export type ReferenceType =
  | 'order'
  | 'invoice'
  | 'quote'
  | 'material'
  | 'project'
  | 'client'
  | 'supplier'
  | 'generic'
export interface ReferenceConfig {
  prefix?: string
  suffix?: string
  length?: number
  format: ReferenceFormat
  pattern?: string
  separator?: string
  yearFormat?: 'YY' | 'YYYY' | 'none'
  counter?: number
  padWithZeros?: boolean
}
export interface ReferenceValidation {
  isValid: boolean
  error?: string
  suggestions?: string[]
}
interface ReferenceInputProps {
  value?: string
  onChange?: (value: string) => void
  onValidate?: (reference: string) => Promise<ReferenceValidation>
  onGenerate?: (config: ReferenceConfig) => Promise<string>
  onCheckUniqueness?: (reference: string) => Promise<boolean>
  referenceType?: ReferenceType
  config?: ReferenceConfig
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  placeholder?: string
  label?: string
  helperText?: string
  error?: string
  showGenerator?: boolean
  showValidator?: boolean
  showPreview?: boolean
  validateOnBlur?: boolean
  validateOnChange?: boolean
  checkUniqueness?: boolean
  showSuggestions?: boolean
  loading?: boolean
  className?: string
}
export function ReferenceInput({
  value = '',
  onChange,
  onValidate,
  onGenerate,
  onCheckUniqueness,
  referenceType = 'generic',
  config = { format: 'alphanumeric', length: 10, padWithZeros: true },
  required = false,
  disabled = false,
  readOnly = false,
  placeholder,
  label,
  helperText,
  error,
  showGenerator = true,
  showValidator = true,
  showPreview = false,
  validateOnBlur = true,
  validateOnChange = false,
  checkUniqueness = false,
  showSuggestions = true,
  loading = false,
  className,
}: ReferenceInputProps) {
  const ids = useFormFieldIds(['referenceInput'])
  const [internalValue, setInternalValue] = useState(value)
  const [validation, setValidation] = useState<ReferenceValidation>({ isValid: true })
  const [isValidating, setIsValidating] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCheckingUniqueness, setIsCheckingUniqueness] = useState(false)
  const [showPreviewMode, setShowPreviewMode] = useState(false)
  const [previewValue, setPreviewValue] = useState('')
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  useEffect(() => {
    setInternalValue(value)
  }, [value])

  const generateReference = useCallback(
    async (refConfig: ReferenceConfig): Promise<string> => {
      if (onGenerate) {
        return await onGenerate(refConfig)
      }
      // Default generation logic
      let reference = ''
      const now = new Date()
      // Add prefix
      if (refConfig.prefix) {
        reference += refConfig.prefix
      }
      // Add year
      if (refConfig.yearFormat !== 'none') {
        const year =
          refConfig.yearFormat === 'YY'
            ? now.getFullYear().toString().slice(-2)
            : now.getFullYear().toString()
        reference += year
      }
      // Add separator
      if (refConfig.separator && reference) {
        reference += refConfig.separator
      }
      // Add counter/number part
      const counter = refConfig.counter || Math.floor(Math.random() * 10000) + 1
      if (refConfig.format === 'numeric') {
        const numberPart = refConfig.padWithZeros
          ? counter.toString().padStart(refConfig.length || 6, '0')
          : counter.toString()
        reference += numberPart
      } else if (refConfig.format === 'alphanumeric') {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
        const randomPart = Array.from({ length: refConfig.length || 6 }, () =>
          chars.charAt(Math.floor(Math.random() * chars.length))
        ).join('')
        reference += randomPart
      } else if (refConfig.format === 'custom' && refConfig.pattern) {
        // Simple pattern replacement
        reference += refConfig.pattern
          .replace(/N/g, () => Math.floor(Math.random() * 10).toString())
          .replace(/A/g, () => String.fromCharCode(65 + Math.floor(Math.random() * 26)))
      }
      // Add suffix
      if (refConfig.suffix) {
        reference += refConfig.suffix
      }
      return reference
    },
    [onGenerate]
  )

  const generatePreview = useCallback(async () => {
    if (!config) return
    const preview = await generateReference(config)
    setPreviewValue(preview)
  }, [config, generateReference])

  // Auto-generate preview when config changes
  useEffect(() => {
    if (showPreview && !internalValue) {
      generatePreview()
    }
  }, [showPreview, generatePreview, internalValue])

  const validateReference = useCallback(
    async (ref: string): Promise<ReferenceValidation> => {
      if (onValidate) {
        return await onValidate(ref)
      }
      // Default validation logic
      if (!ref) {
        return { isValid: !required, error: required ? 'Référence requise' : undefined }
      }
      if (config.pattern) {
        const regex = new RegExp(config.pattern)
        if (!regex.test(ref)) {
          return {
            isValid: false,
            error: 'Format de référence invalide',
            suggestions: ['Utilisez le générateur pour créer une référence valide'],
          }
        }
      }
      if (config.length && ref.length !== config.length) {
        return {
          isValid: false,
          error: `La référence doit faire ${config.length} caractères`,
        }
      }
      return { isValid: true }
    },
    [onValidate, config, required]
  )
  const checkReferenceUniqueness = useCallback(
    async (ref: string): Promise<boolean> => {
      if (onCheckUniqueness) {
        return await onCheckUniqueness(ref)
      }
      // Default: assume unique (in real implementation, this would check database)
      return true
    },
    [onCheckUniqueness]
  )
  const handleValueChange = useCallback(
    (newValue: string) => {
      setInternalValue(newValue)
      onChange?.(newValue)
      if (validateOnChange) {
        // Debounce validation
        if (debounceRef.current) {
          clearTimeout(debounceRef.current)
        }
        debounceRef.current = setTimeout(() => {
          validateReference(newValue).then(setValidation)
        }, 300)
      }
      if (checkUniqueness && newValue) {
        // Debounce uniqueness check
        if (debounceRef.current) {
          clearTimeout(debounceRef.current)
        }
        debounceRef.current = setTimeout(async () => {
          setIsCheckingUniqueness(true)
          const isUnique = await checkReferenceUniqueness(newValue)
          if (!isUnique) {
            setValidation({
              isValid: false,
              error: 'Cette référence existe déjà',
            })
          }
          setIsCheckingUniqueness(false)
        }, 500)
      }
    },
    [onChange, validateOnChange, checkUniqueness, validateReference, checkReferenceUniqueness]
  )
  const handleBlur = useCallback(async () => {
    if (validateOnBlur) {
      setIsValidating(true)
      const result = await validateReference(internalValue)
      setValidation(result)
      setIsValidating(false)
    }
  }, [validateOnBlur, validateReference, internalValue])
  const handleGenerate = useCallback(async () => {
    if (!config) return
    setIsGenerating(true)
    try {
      const generated = await generateReference(config)
      setInternalValue(generated)
      onChange?.(generated)
      // Validate generated reference
      const result = await validateReference(generated)
      setValidation(result)
    } catch (_error) {
    } finally {
      setIsGenerating(false)
    }
  }, [config, generateReference, onChange, validateReference])
  const handleCopyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(internalValue)
    } catch (_error) {}
  }, [internalValue])
  const handleUsePreview = useCallback(() => {
    if (previewValue) {
      setInternalValue(previewValue)
      onChange?.(previewValue)
      setShowPreviewMode(false)
    }
  }, [previewValue, onChange])
  const getTypePrefix = (type: ReferenceType): string => {
    const prefixes = {
      order: 'CMD',
      invoice: 'FACT',
      quote: 'DEVIS',
      material: 'MAT',
      project: 'PROJ',
      client: 'CLI',
      supplier: 'FOUR',
      generic: 'REF',
    }
    return prefixes[type]
  }
  const defaultPlaceholder = placeholder || `Saisir une référence ${referenceType}...`
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <Label htmlFor={ids.referenceInput}>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {showPreview && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowPreviewMode(!showPreviewMode)}
            >
              {showPreviewMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              Aperçu
            </Button>
          )}
        </div>
      )}
      {/* Preview mode */}
      {showPreview && showPreviewMode && (
        <div className="p-3 bg-muted rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Aperçu de génération:</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="font-mono">
                  {previewValue || 'Génération...'}
                </Badge>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={generatePreview}
                  disabled={isGenerating}
                >
                  <RefreshCw className={cn('h-3 w-3', isGenerating && 'animate-spin')} />
                </Button>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUsePreview}
              disabled={!previewValue}
            >
              Utiliser
            </Button>
          </div>
        </div>
      )}
      <div className="relative">
        <Input
          id={ids.referenceInput}
          type="text"
          value={internalValue}
          onChange={(e) => handleValueChange(e.target.value)}
          onBlur={handleBlur}
          placeholder={defaultPlaceholder}
          disabled={disabled || loading}
          readOnly={readOnly}
          className={cn(
            'pr-20',
            validation.error && 'border-red-500',
            validation.isValid && internalValue && 'border-green-500'
          )}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {/* Loading indicator */}
          {(isValidating || isGenerating || isCheckingUniqueness) && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
          )}
          {/* Validation status */}
          {!isValidating && !isCheckingUniqueness && internalValue && (
            <div>
              {validation.isValid ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <X className="h-4 w-4 text-red-500" />
              )}
            </div>
          )}
          {/* Copy button */}
          {internalValue && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={handleCopyToClipboard}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copier</TooltipContent>
            </Tooltip>
          )}
          {/* Generate button */}
          {showGenerator && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={handleGenerate}
                  disabled={isGenerating || disabled || readOnly}
                >
                  {isGenerating ? (
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                  ) : (
                    <Hash className="h-3 w-3" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Générer automatiquement</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
      {/* Reference type badge */}
      {referenceType !== 'generic' && (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Type: {getTypePrefix(referenceType)}
          </Badge>
          {config.format && (
            <Badge variant="outline" className="text-xs">
              Format: {config.format}
            </Badge>
          )}
        </div>
      )}
      {/* Helper text */}
      {helperText && !validation.error && (
        <p className="text-sm text-muted-foreground">{helperText}</p>
      )}
      {/* Error message */}
      {validation.error && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {validation.error}
        </p>
      )}
      {/* External error */}
      {error && !validation.error && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
      {/* Suggestions */}
      {showSuggestions && validation.suggestions && validation.suggestions.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Suggestions:</p>
          {validation.suggestions.map((suggestion, index) => (
            <Badge key={index} variant="outline" className="text-xs mr-1">
              {suggestion}
            </Badge>
          ))}
        </div>
      )}
      {/* Configuration info */}
      {config && (
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer">Configuration</summary>
          <div className="mt-1 space-y-1">
            {config.prefix && <p>Préfixe: {config.prefix}</p>}
            {config.suffix && <p>Suffixe: {config.suffix}</p>}
            {config.length && <p>Longueur: {config.length} caractères</p>}
            {config.pattern && <p>Motif: {config.pattern}</p>}
            {config.yearFormat && <p>Format année: {config.yearFormat}</p>}
          </div>
        </details>
      )}
    </div>
  )
}
