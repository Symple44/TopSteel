import * as React from "react"

interface FlexibleProps {
  [key: string]: any; // Accepte absolument toutes les props
}

export const Card: React.FC<FlexibleProps> = ({ children, ...props }) => {
  return <div {...props}>{children}</div>
}

export const CardHeader: React.FC<FlexibleProps> = ({ children, ...props }) => {
  return <div {...props}>{children}</div>
}

export const CardContent: React.FC<FlexibleProps> = ({ children, ...props }) => {
  return <div {...props}>{children}</div>
}

export const CardTitle: React.FC<FlexibleProps> = ({ children, ...props }) => {
  return <h3 {...props}>{children}</h3>
}

export const CardDescription: React.FC<FlexibleProps> = ({ children, ...props }) => {
  return <p {...props}>{children}</p>
}

export const CardFooter: React.FC<FlexibleProps> = ({ children, ...props }) => {
  return <div {...props}>{children}</div>
}
