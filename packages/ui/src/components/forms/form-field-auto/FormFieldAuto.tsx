'use client'

import React, { forwardRef, useId } from 'react'
import { cn } from '../../../lib/utils'
import { FormMessage } from '../form/form'
import { Label } from '../label/Label'

interface FormFieldAutoProps {
  /** Label text for the field */
  label?: string
  /** Field name for error messages and accessibility */
  name?: string
  /** Error message to display */
  error?: string
  /** Whether the field is required */
  required?: boolean
  /** Additional className for the wrapper */
  className?: string
  /** Additional className for the label */
  labelClassName?: string
  /** Content to render as the input field */
  children: React.ReactElement
  /** Additional description text */
  description?: string
  /** Whether to show the required indicator */
  showRequired?: boolean
}

/**
 * FormFieldAuto - Wrapper component that automatically manages IDs for form fields
 *
 * This component:
 * - Generates unique IDs automatically using useId()
 * - Links labels to inputs via htmlFor/id
 * - Provides consistent spacing and styling
 * - Handles error message display
 * - Maintains accessibility standards
 *
 * @example
 * <FormFieldAuto label="Email Address" name="email" required>
 *   <Input type="email" placeholder="Enter your email" />
 * </FormFieldAuto>
 */
export const FormFieldAuto = forwardRef<HTMLDivElement, FormFieldAutoProps>(
  (
    {
      label,
      name,
      error,
      required,
      className,
      labelClassName,
      children,
      description,
      showRequired = true,
      ...props
    },
    ref
  ) => {
    const id = useId()
    const fieldId = `field-${id}`
    const errorId = error ? `${fieldId}-error` : undefined
    const descriptionId = description ? `${fieldId}-description` : undefined

    // Clone the children element to add the necessary props for accessibility
    const childWithProps = children
      ? React.cloneElement(children, {
          id: fieldId,
          'aria-invalid': !!error,
          'aria-required': required ? true : undefined,
          'aria-describedby': [errorId, descriptionId].filter(Boolean).join(' ') || undefined,
          ...children.props,
        })
      : children

    return (
      <div ref={ref} className={cn('space-y-2', className)} {...props}>
        {label && (
          <Label
            htmlFor={fieldId}
            className={cn(
              'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
              labelClassName
            )}
          >
            {label}
            {required && showRequired && (
              <>
                <span className="sr-only"> (obligatoire)</span>
                <span className="text-destructive ml-1" aria-hidden="true" title="Champ obligatoire">
                  *
                </span>
              </>
            )}
          </Label>
        )}

        {description && (
          <p id={descriptionId} className="text-sm text-muted-foreground">
            {description}
          </p>
        )}

        {childWithProps}

        {error && (
          <FormMessage id={errorId} className="text-sm text-destructive">
            {error}
          </FormMessage>
        )}
      </div>
    )
  }
)

FormFieldAuto.displayName = 'FormFieldAuto'

export default FormFieldAuto
