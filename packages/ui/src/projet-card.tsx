import * as React from "react"

export const ProjetCard: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div className="border rounded-lg p-4">{children}</div>
)
