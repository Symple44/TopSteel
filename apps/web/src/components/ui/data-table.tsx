import * as React from "react"

interface DataTableProps {
  children?: React.ReactNode;
  className?: string;
  data?: any[];
  columns?: any[];
  searchPlaceholder?: string;
  onRowClick?: (row: any) => void;
}

export const DataTable: React.FC<DataTableProps> = ({ 
  children, 
  className, 
  data, 
  columns, 
  searchPlaceholder, 
  onRowClick, 
  ...props 
}) => {
  return (
    <div className={className} {...props}>
      {data && columns ? (
        <table>
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th key={i}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} onClick={() => onRowClick?.(row)}>
                {columns.map((col, j) => (
                  <td key={j}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : children}
    </div>
  )
}
