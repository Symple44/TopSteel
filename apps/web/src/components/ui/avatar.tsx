import React from "react"

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  value?: any
  onValueChange?: any
  asChild?: boolean
  variant?: string
  size?: string
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className = "", children, asChild, ...props }, ref) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as any, { ...props, ref })
    }
    
    return (
      <div className={className} ref={ref} {...props}>
        {children}
      </div>
    )
  }
)

Avatar.displayName = "Avatar"

// Export des sous-composants courants si nécessaire
export const AvatarContent = Avatar
export const AvatarTrigger = Avatar  
export const AvatarItem = Avatar
export const AvatarValue = Avatar
export const AvatarHeader = Avatar
export const AvatarTitle = Avatar
export const AvatarDescription = Avatar
export const AvatarFooter = Avatar
export const AvatarSeparator = Avatar
export const AvatarList = Avatar
