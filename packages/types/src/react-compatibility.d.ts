/**
 * React 18/19 Compatibility Types
 * This file provides type definitions to ensure compatibility between React 18 and 19
 * It can be removed once fully migrated to React 19
 */

import 'react'

declare module 'react' {
  // React 19 removes implicit children from component props
  // This adds them back for compatibility
  interface DOMAttributes<_T> {
    children?: React.ReactNode
  }

  // Ensure HTML elements have children property
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    children?: React.ReactNode
  }

  // Fix for form elements
  interface FormHTMLAttributes<T> extends HTMLAttributes<T> {
    children?: React.ReactNode
  }

  // Fix for button elements
  interface ButtonHTMLAttributes<T> extends HTMLAttributes<T> {
    children?: React.ReactNode
  }

  // Fix for anchor elements
  interface AnchorHTMLAttributes<T> extends HTMLAttributes<T> {
    children?: React.ReactNode
  }

  // Fix for input elements (shouldn't have children but for consistency)
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    // Input elements don't have children in React
  }

  // Fix for label elements
  interface LabelHTMLAttributes<T> extends HTMLAttributes<T> {
    children?: React.ReactNode
  }

  // Fix for select elements
  interface SelectHTMLAttributes<T> extends HTMLAttributes<T> {
    children?: React.ReactNode
  }

  // Fix for textarea elements
  interface TextareaHTMLAttributes<T> extends HTMLAttributes<T> {
    // Textarea elements don't have children in React
  }

  // Fix for option elements
  interface OptionHTMLAttributes<T> extends HTMLAttributes<T> {
    children?: React.ReactNode
  }

  // Fix for table elements
  interface TableHTMLAttributes<T> extends HTMLAttributes<T> {
    children?: React.ReactNode
  }

  // Fix for td/th elements
  interface TdHTMLAttributes<T> extends HTMLAttributes<T> {
    children?: React.ReactNode
  }

  interface ThHTMLAttributes<T> extends HTMLAttributes<T> {
    children?: React.ReactNode
  }

  // Fix for list elements
  interface LiHTMLAttributes<T> extends HTMLAttributes<T> {
    children?: React.ReactNode
  }

  interface OlHTMLAttributes<T> extends HTMLAttributes<T> {
    children?: React.ReactNode
  }

  interface UlHTMLAttributes<T> extends HTMLAttributes<T> {
    children?: React.ReactNode
  }

  // Component type fixes for better inference
  interface FunctionComponent<P = {}> {
    (props: P & { children?: React.ReactNode }, context?: any): React.ReactElement<any, any> | null
    propTypes?: WeakValidationMap<P> | undefined
    contextTypes?: ValidationMap<unknown> | undefined
    defaultProps?: Partial<P> | undefined
    displayName?: string | undefined
  }
}

// Export type utilities for migration
export type WithChildren<P = {}> = P & { children?: React.ReactNode }
export type PropsWithOptionalChildren<P = {}> = P & { children?: React.ReactNode }
export type FCWithChildren<P = {}> = React.FC<PropsWithOptionalChildren<P>>
