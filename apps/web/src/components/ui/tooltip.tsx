import * as React from "react"

interface UltraProps { 
  [key: string]: any 
}

export const Tooltip: React.FC<UltraProps> = (props) => <div {...props} />
export const TooltipTrigger: React.FC<UltraProps> = (props) => <div {...props} />
export const TooltipContent: React.FC<UltraProps> = (props) => <div {...props} />
export const TooltipProvider: React.FC<UltraProps> = (props) => <div {...props} />