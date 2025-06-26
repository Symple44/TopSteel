import * as React from "react"

export const PageHeader: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div className="mb-6">{children}</div>
)
