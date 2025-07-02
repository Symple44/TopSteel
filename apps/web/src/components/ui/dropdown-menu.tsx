import * as React from "react"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

const DropdownMenu = ({ children, ...props }: any) => (
  <div {...props}>{children}</div>
)

const DropdownMenuTrigger = ({ children, ...props }: any) => (
  <button {...props}>{children}</button>
)

const DropdownMenuContent = ({ children, className, ...props }: any) => (
  <div
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
      className
    )}
    {...props}
  >
    {children}
  </div>
)

const DropdownMenuItem = ({ children, className, ...props }: any) => (
  <div
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
      className
    )}
    {...props}
  >
    {children}
  </div>
)

const DropdownMenuCheckboxItem = React.forwardRef<
  HTMLDivElement,
  {
    children?: React.ReactNode
    className?: string
    checked?: boolean
    onCheckedChange?: (checked: boolean) => void
    onClick?: (e: React.MouseEvent) => void
  }
>(({ children, className, checked, onCheckedChange, onClick, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    onClick={(e) => {
      onCheckedChange?.(!checked)
      onClick?.(e)
    }}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      {checked && <Check className="h-4 w-4" />}
    </span>
    {children}
  </div>
))
DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem"

const DropdownMenuLabel = ({ children, className, ...props }: any) => (
  <div
    className={cn("px-2 py-1.5 text-sm font-semibold", className)}
    {...props}
  >
    {children}
  </div>
)

const DropdownMenuSeparator = ({ className, ...props }: any) => (
  <div
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
)

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
}
