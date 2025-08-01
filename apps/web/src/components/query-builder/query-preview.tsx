'use client'

import { Code } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@erp/ui'
import { ScrollArea } from '@erp/ui'

interface QueryPreviewProps {
  queryBuilder: any
}

export function QueryPreview({ queryBuilder }: QueryPreviewProps) {
  const generateSQL = () => {
    if (!queryBuilder.mainTable) {
      return '-- No main table selected'
    }

    const visibleColumns = queryBuilder.columns.filter((col: any) => col.isVisible)

    if (visibleColumns.length === 0) {
      return '-- No columns selected'
    }

    // Build SELECT clause
    const selectClauses = visibleColumns.map((col: any) => {
      const tableAlias = getTableAlias(col.tableName)
      return `${tableAlias}.${col.columnName} AS "${col.alias}"`
    })

    // Add calculated fields
    queryBuilder.calculatedFields
      .filter((field: any) => field.isVisible)
      .forEach((field: any) => {
        let expression = field.expression
        // Replace column references with actual SQL
        visibleColumns.forEach((col: any) => {
          const regex = new RegExp(`\\[${col.alias}\\]`, 'g')
          const tableAlias = getTableAlias(col.tableName)
          expression = expression.replace(regex, `${tableAlias}.${col.columnName}`)
        })
        selectClauses.push(`(${expression}) AS "${field.name}"`)
      })

    // Build FROM clause
    let fromClause = `${queryBuilder.mainTable} AS t0`

    // Add JOINs
    queryBuilder.joins.forEach((join: any, index: number) => {
      const fromAlias = getTableAlias(join.fromTable)
      const toAlias = join.alias || `t${index + 1}`
      fromClause += `\n  ${join.joinType} JOIN ${join.toTable} AS ${toAlias}`
      fromClause += ` ON ${fromAlias}.${join.fromColumn} = ${toAlias}.${join.toColumn}`
    })

    // Build final query
    let sql = `SELECT\n  ${selectClauses.join(',\n  ')}\nFROM\n  ${fromClause}`

    // Add LIMIT if maxRows is set
    if (queryBuilder.maxRows) {
      sql += `\nLIMIT ${queryBuilder.maxRows}`
    }

    return sql
  }

  const getTableAlias = (tableName: string) => {
    if (tableName === queryBuilder.mainTable) {
      return 't0'
    }
    const joinIndex = queryBuilder.joins.findIndex((j: any) => j.toTable === tableName)
    if (joinIndex !== -1) {
      return queryBuilder.joins[joinIndex].alias || `t${joinIndex + 1}`
    }
    return 't0'
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="h-5 w-5" />
          SQL Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <ScrollArea className="h-full">
          <pre className="text-sm font-mono bg-muted p-4 rounded-lg">{generateSQL()}</pre>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
