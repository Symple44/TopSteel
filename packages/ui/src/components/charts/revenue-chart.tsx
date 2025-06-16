// packages/ui/src/components/charts/revenue-chart.tsx
'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../base/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@erp/utils'

interface RevenueData {
  month: string
  revenue: number
  target?: number
}

interface RevenueChartProps {
  data: RevenueData[]
  title?: string
  description?: string
  height?: number
  className?: string
}

export function RevenueChart({
  data,
  title = "Chiffre d'affaires",
  description = "Évolution mensuelle",
  height = 350,
  className
}: RevenueChartProps) {
  const formatTooltip = (value: number, name: string) => {
    return [formatCurrency(value), name === 'revenue' ? 'Réalisé' : 'Objectif']
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(value) => formatCurrency(value, 'EUR').replace(',00 €', 'k €')} />
            <Tooltip formatter={formatTooltip} />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={{ fill: '#3b82f6' }}
            />
            {data.some(d => d.target !== undefined) && (
              <Line 
                type="monotone" 
                dataKey="target" 
                stroke="#10b981" 
                strokeDasharray="5 5"
                dot={{ fill: '#10b981' }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
