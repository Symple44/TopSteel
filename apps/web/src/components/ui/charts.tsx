'use client'

import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts'

interface ChartData {
  name: string
  value: number
  [key: string]: any
}

interface LineChartProps {
  data: ChartData[]
  dataKey?: string
  color?: string
  height?: number
}

export function SimpleLineChart({ 
  data, 
  dataKey = 'value', 
  color = '#3b82f6',
  height = 300 
}: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Line 
          type="monotone" 
          dataKey={dataKey} 
          stroke={color} 
          strokeWidth={2}
          dot={{ fill: color }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

interface BarChartProps {
  data: ChartData[]
  dataKey?: string
  color?: string
  height?: number
}

export function SimpleBarChart({ 
  data, 
  dataKey = 'value', 
  color = '#3b82f6',
  height = 300 
}: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey={dataKey} fill={color} />
      </BarChart>
    </ResponsiveContainer>
  )
}

interface PieChartProps {
  data: ChartData[]
  colors?: string[]
  height?: number
}

export function SimplePieChart({ 
  data, 
  colors = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6'],
  height = 300 
}: PieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  )
}

interface AreaChartProps {
  data: ChartData[]
  dataKey?: string
  color?: string
  height?: number
}

export function SimpleAreaChart({ 
  data, 
  dataKey = 'value', 
  color = '#3b82f6',
  height = 300 
}: AreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Area 
          type="monotone" 
          dataKey={dataKey} 
          stroke={color} 
          fill={color}
          fillOpacity={0.3}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}