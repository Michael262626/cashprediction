"use client"

import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts"

interface ATMData {
  id: string
  location: string
  currentCash: number
  capacity: number
  dailyWithdrawals: number[]
  lastRefill: string
  predictedDepletion: string
  riskLevel: "low" | "medium" | "high"
  status: "online" | "offline" | "maintenance"
}

interface PredictionChartProps {
  atmData: ATMData[]
}

export function PredictionChart({ atmData }: PredictionChartProps) {
  // Generate prediction data for the next 7 days
  const generatePredictionData = () => {
    const days = []
    const today = new Date()

    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)

      const dayData: any = {
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        fullDate: date.toISOString().split("T")[0],
      }

      atmData.forEach((atm) => {
        const avgWithdrawal = atm.dailyWithdrawals.reduce((a, b) => a + b, 0) / atm.dailyWithdrawals.length
        // Add some randomness and seasonal factors for more realistic predictions
        const seasonalFactor = 1 + Math.sin((i / 7) * Math.PI) * 0.2
        const randomFactor = 0.9 + Math.random() * 0.2
        const adjustedWithdrawal = avgWithdrawal * seasonalFactor * randomFactor

        const predictedCash = Math.max(0, atm.currentCash - adjustedWithdrawal * (i + 1))
        dayData[atm.id] = Math.round(predictedCash)
      })

      days.push(dayData)
    }

    return days
  }

  const predictionData = generatePredictionData()
  const colors = [
    "#3B82F6", // Blue
    "#10B981", // Emerald
    "#F59E0B", // Amber
    "#EF4444", // Red
    "#8B5CF6", // Violet
    "#06B6D4", // Cyan
  ]

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-lg">
          <p className="font-semibold text-slate-900 mb-2">{`Date: ${label}`}</p>
          {payload.map((entry: any, index: number) => {
            const atm = atmData.find((a) => a.id === entry.dataKey)
            return (
              <div key={index} className="flex items-center justify-between space-x-4 mb-1">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-sm font-medium text-slate-700">
                    {entry.dataKey} - {atm?.location}
                  </span>
                </div>
                <span className="text-sm font-bold text-slate-900">${entry.value.toLocaleString()}</span>
              </div>
            )
          })}
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-96">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={predictionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <defs>
            {atmData.map((atm, index) => (
              <linearGradient key={atm.id} id={`gradient-${atm.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors[index % colors.length]} stopOpacity={0.3} />
                <stop offset="95%" stopColor={colors[index % colors.length]} stopOpacity={0.1} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="date" stroke="#64748B" fontSize={12} fontWeight={500} />
          <YAxis
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            stroke="#64748B"
            fontSize={12}
            fontWeight={500}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: "20px" }}
            formatter={(value) => {
              const atm = atmData.find((a) => a.id === value)
              return (
                <span className="text-sm font-medium">
                  {value} - {atm?.location}
                </span>
              )
            }}
          />
          {atmData.map((atm, index) => (
            <Area
              key={atm.id}
              type="monotone"
              dataKey={atm.id}
              stroke={colors[index % colors.length]}
              strokeWidth={3}
              fill={`url(#gradient-${atm.id})`}
              dot={{ r: 4, strokeWidth: 2, fill: colors[index % colors.length] }}
              activeDot={{ r: 6, strokeWidth: 2 }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
