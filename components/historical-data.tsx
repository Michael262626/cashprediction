"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Calendar, TrendingUp, BarChart3, Activity, Download, Filter } from "lucide-react"
import { ExportService } from "@/lib/export-utils"
import { toast } from "@/components/ui/use-toast"

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

interface HistoricalDataProps {
  atmData: ATMData[]
}

export function HistoricalData({ atmData }: HistoricalDataProps) {
  const [selectedATM, setSelectedATM] = useState(atmData[0]?.id || "")
  const [viewType, setViewType] = useState("withdrawals")
  const [timeRange, setTimeRange] = useState("7days")

  const selectedATMData = atmData.find((atm) => atm.id === selectedATM)

  // Generate historical withdrawal data
  const generateWithdrawalData = () => {
    if (!selectedATMData) return []

    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    return selectedATMData.dailyWithdrawals.map((amount, index) => ({
      day: days[index],
      withdrawals: amount,
      transactions: Math.floor(amount / 150), // Assuming avg $150 per transaction
      efficiency: Math.min(100, (amount / (selectedATMData.capacity * 0.3)) * 100), // Efficiency metric
    }))
  }

  // Generate cash level trend data
  const generateCashLevelData = () => {
    if (!selectedATMData) return []

    const data = []
    let currentCash = selectedATMData.capacity

    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)

      const withdrawal = selectedATMData.dailyWithdrawals[6 - i] || 15000
      currentCash = Math.max(0, currentCash - withdrawal)

      data.push({
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        cashLevel: currentCash,
        percentage: (currentCash / selectedATMData.capacity) * 100,
        refillNeeded: currentCash < selectedATMData.capacity * 0.2,
      })
    }

    return data
  }

  // Generate network performance data
  const generateNetworkData = () => {
    return atmData.map((atm) => {
      const totalWithdrawals = atm.dailyWithdrawals.reduce((a, b) => a + b, 0)
      const avgDaily = totalWithdrawals / 7
      const utilization = (avgDaily / (atm.capacity * 0.3)) * 100

      return {
        id: atm.id,
        location: atm.location.split(" ").slice(0, 2).join(" "), // Shortened name
        totalWithdrawals,
        avgDaily,
        utilization: Math.min(100, utilization),
        riskLevel: atm.riskLevel,
        status: atm.status,
      }
    })
  }

  const withdrawalData = generateWithdrawalData()
  const cashLevelData = generateCashLevelData()
  const networkData = generateNetworkData()

  // Calculate statistics
  const totalWithdrawals = selectedATMData?.dailyWithdrawals.reduce((a, b) => a + b, 0) || 0
  const avgDailyWithdrawal = totalWithdrawals / 7
  const maxWithdrawal = Math.max(...(selectedATMData?.dailyWithdrawals || [0]))
  const minWithdrawal = Math.min(...(selectedATMData?.dailyWithdrawals || [0]))

  // Pie chart data for risk distribution
  const riskDistribution = [
    { name: "Low Risk", value: atmData.filter((atm) => atm.riskLevel === "low").length, color: "#10B981" },
    { name: "Medium Risk", value: atmData.filter((atm) => atm.riskLevel === "medium").length, color: "#F59E0B" },
    { name: "High Risk", value: atmData.filter((atm) => atm.riskLevel === "high").length, color: "#EF4444" },
  ]

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-lg">
          <p className="font-semibold text-slate-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between space-x-4 mb-1">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-sm font-medium text-slate-700">{entry.name}</span>
              </div>
              <span className="text-sm font-bold text-slate-900">
                {typeof entry.value === "number" && entry.name.includes("$")
                  ? `$${entry.value.toLocaleString()}`
                  : entry.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Analytics & Historical Data
          </h2>
          <p className="text-slate-600 mt-1">Deep insights and performance analysis for data-driven decisions</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedATM} onValueChange={setSelectedATM}>
            <SelectTrigger className="w-56 border-slate-300 focus:border-blue-500">
              <SelectValue placeholder="Select ATM" />
            </SelectTrigger>
            <SelectContent>
              {atmData.map((atm) => (
                <SelectItem key={atm.id} value={atm.id}>
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        atm.status === "online"
                          ? "bg-emerald-500"
                          : atm.status === "offline"
                            ? "bg-red-500"
                            : "bg-amber-500"
                      }`}
                    />
                    <span>
                      {atm.id} - {atm.location}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={viewType} onValueChange={setViewType}>
            <SelectTrigger className="w-40 border-slate-300 focus:border-blue-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="withdrawals">Withdrawals</SelectItem>
              <SelectItem value="cashLevel">Cash Levels</SelectItem>
              <SelectItem value="network">Network View</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            className="border-slate-300 hover:bg-slate-50 bg-transparent"
            onClick={() => {
              try {
                if (viewType === "withdrawals") {
                  ExportService.exportPredictions(
                    withdrawalData.map((item, index) => ({
                      day: item.day,
                      date: new Date().toLocaleDateString(),
                      predicted_withdrawal: item.withdrawals,
                      transactions: item.transactions,
                      efficiency: item.efficiency,
                    })),
                    ExportService.generateFilename("withdrawal-analysis"),
                  )
                } else if (viewType === "cashLevel") {
                  ExportService.exportPredictions(
                    cashLevelData.map((item, index) => ({
                      date: item.date,
                      predicted_cash: item.cashLevel,
                      cashPercentage: item.percentage,
                      refill_needed: item.refillNeeded,
                    })),
                    ExportService.generateFilename("cash-level-trend"),
                  )
                } else {
                  ExportService.exportATMReport(
                    networkData.map((item) => ({
                      id: item.id,
                      location: item.location,
                      currentCash: item.totalWithdrawals,
                      capacity: 100000, // Default capacity
                      dailyWithdrawals: [item.avgDaily * 7], // Approximate
                      lastRefill: new Date().toISOString().split("T")[0],
                      predictedDepletion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                      riskLevel: item.riskLevel as "low" | "medium" | "high",
                      status: item.status as "online" | "offline" | "maintenance",
                    })),
                    ExportService.generateFilename("network-performance"),
                  )
                }

                toast({
                  title: "Export Successful",
                  description: "Data has been exported successfully",
                })
              } catch (error) {
                console.error("Export failed:", error)
                toast({
                  title: "Export Failed",
                  description: "Failed to export data. Please try again.",
                  variant: "destructive",
                })
              }
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-blue-800">Weekly Total</CardTitle>
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">${totalWithdrawals.toLocaleString()}</div>
            <p className="text-xs text-blue-700 mt-1">Last 7 days</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-emerald-800">Daily Average</CardTitle>
            <BarChart3 className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900">
              ${Math.round(avgDailyWithdrawal).toLocaleString()}
            </div>
            <p className="text-xs text-emerald-700 mt-1">Per day</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-amber-800">Peak Day</CardTitle>
            <Activity className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-900">${maxWithdrawal.toLocaleString()}</div>
            <p className="text-xs text-amber-700 mt-1">Highest withdrawal</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-800">Low Day</CardTitle>
            <Calendar className="h-5 w-5 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">${minWithdrawal.toLocaleString()}</div>
            <p className="text-xs text-slate-700 mt-1">Lowest withdrawal</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <Card className="lg:col-span-2 border-0 shadow-lg bg-white">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
            <CardTitle className="text-xl font-bold text-slate-900">
              {viewType === "withdrawals"
                ? "Daily Withdrawals Analysis"
                : viewType === "cashLevel"
                  ? "Cash Level Trend"
                  : "Network Performance"}
            </CardTitle>
            <CardDescription className="text-slate-600">
              {viewType === "withdrawals"
                ? "Withdrawal patterns and transaction efficiency metrics"
                : viewType === "cashLevel"
                  ? "Cash level changes and refill requirements over time"
                  : "Comparative performance across all ATM locations"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                {viewType === "withdrawals" ? (
                  <BarChart data={withdrawalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="day" stroke="#64748B" fontSize={12} fontWeight={500} />
                    <YAxis
                      yAxisId="left"
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                      stroke="#64748B"
                      fontSize={12}
                    />
                    <YAxis yAxisId="right" orientation="right" stroke="#64748B" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="withdrawals"
                      fill="#3B82F6"
                      name="Withdrawals ($)"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="transactions"
                      fill="#10B981"
                      name="Transactions"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                ) : viewType === "cashLevel" ? (
                  <AreaChart data={cashLevelData}>
                    <defs>
                      <linearGradient id="cashGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="date" stroke="#64748B" fontSize={12} fontWeight={500} />
                    <YAxis
                      yAxisId="left"
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                      stroke="#64748B"
                      fontSize={12}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tickFormatter={(value) => `${value.toFixed(0)}%`}
                      stroke="#64748B"
                      fontSize={12}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="cashLevel"
                      stroke="#3B82F6"
                      strokeWidth={3}
                      fill="url(#cashGradient)"
                      name="Cash Level ($)"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="percentage"
                      stroke="#10B981"
                      strokeWidth={2}
                      name="Capacity %"
                    />
                  </AreaChart>
                ) : (
                  <BarChart data={networkData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis
                      type="number"
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                      stroke="#64748B"
                      fontSize={12}
                    />
                    <YAxis type="category" dataKey="location" stroke="#64748B" fontSize={12} width={100} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="totalWithdrawals" fill="#3B82F6" name="Total Withdrawals ($)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Risk Distribution */}
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
            <CardTitle className="text-xl font-bold text-slate-900">Risk Distribution</CardTitle>
            <CardDescription className="text-slate-600">Network-wide risk assessment</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {riskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} ATMs`, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {riskDistribution.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm font-medium text-slate-700">{item.name}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {item.value} ATMs
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <Card className="border-0 shadow-lg bg-white">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
          <CardTitle className="text-xl font-bold text-slate-900">AI-Powered Insights</CardTitle>
          <CardDescription className="text-slate-600">
            Machine learning analysis of patterns and optimization recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                Usage Patterns
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm font-medium text-slate-700">Peak Usage Day</span>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                    {withdrawalData.reduce(
                      (max, day) => (day.withdrawals > max.withdrawals ? day : max),
                      withdrawalData[0],
                    )?.day || "N/A"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm font-medium text-slate-700">Optimal Refill Window</span>
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Sunday Evening</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm font-medium text-slate-700">Avg Transaction Size</span>
                  <Badge className="bg-amber-100 text-amber-800 border-amber-200">$147</Badge>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-slate-900 flex items-center">
                <Activity className="h-5 w-5 mr-2 text-emerald-600" />
                Performance Metrics
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm font-medium text-slate-700">Network Uptime</span>
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">99.2%</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm font-medium text-slate-700">Avg Response Time</span>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">2.3s</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm font-medium text-slate-700">Success Rate</span>
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">98.7%</Badge>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-slate-900 flex items-center">
                <Filter className="h-5 w-5 mr-2 text-amber-600" />
                Recommendations
              </h4>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-900">Increase weekend capacity</p>
                  <p className="text-xs text-blue-700 mt-1">25% higher demand on weekends</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-sm font-medium text-amber-900">Schedule maintenance</p>
                  <p className="text-xs text-amber-700 mt-1">ATM002 showing efficiency decline</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <p className="text-sm font-medium text-emerald-900">Optimize refill schedule</p>
                  <p className="text-xs text-emerald-700 mt-1">Reduce costs by 15% with smart timing</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
