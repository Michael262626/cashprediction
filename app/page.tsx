"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, TrendingUp, DollarSign, MapPin, Clock, Wifi, WifiOff, LogOut, Download } from "lucide-react"
import { PredictionChart } from "@/components/prediction-chart"
import { ATMManagement } from "@/components/atm-management"
import { HistoricalData } from "@/components/historical-data"
import { PredictionForm } from "@/components/prediction-form"
import { RefillManagement } from "@/components/refill-management"
import { MLPrediction } from "@/components/ml-prediction"
import { LoadingSpinner } from "@/components/loading-spinner"
import { useToast } from "@/hooks/use-toast"
import { atmApi } from "@/lib/api"
import { ExportService } from "@/lib/export-utils"
import { AuthForm } from "@/components/auth/login-form"

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
  coordinates?: { lat: number; lng: number }
}

export default function ATMCashPredictionSystem() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [atmData, setAtmData] = useState<ATMData[]>([])
  const [loading, setLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected">("connected")
  const [totalCash, setTotalCash] = useState(0)
  const [highRiskATMs, setHighRiskATMs] = useState(0)
  const [avgDailyWithdrawal, setAvgDailyWithdrawal] = useState(0)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const { toast } = useToast()

  // Check for existing authentication on mount
  useEffect(() => {
    const user = atmApi.getCurrentUser()
    if (user) {
      setCurrentUser(user)
      fetchATMData()
    } else {
      setLoading(false)
    }
  }, [])

  // Fetch ATM data from FastAPI backend
  const fetchATMData = async () => {
    try {
      setLoading(true)
      const data = await atmApi.getAllATMs()
      setAtmData(data)
      setConnectionStatus("connected")
      setLastUpdate(new Date())

      toast({
        title: "Data Updated",
        description: "ATM data refreshed successfully",
        duration: 2000,
      })
    } catch (error) {
      console.error("Failed to fetch ATM data:", error)
      setConnectionStatus("disconnected")
      toast({
        title: "Connection Error",
        description: "Failed to fetch ATM data. Using cached data.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (currentUser && atmData.length > 0) {
      // Set up auto-refresh every 30 seconds
      const interval = setInterval(fetchATMData, 30000)
      return () => clearInterval(interval)
    }
  }, [currentUser, atmData.length])

  useEffect(() => {
    const total = atmData.reduce((sum, atm) => sum + atm.currentCash, 0)
    const highRisk = atmData.filter((atm) => atm.riskLevel === "high").length
    const avgWithdrawal =
      atmData.reduce((sum, atm) => {
        const atmAvg = atm.dailyWithdrawals.reduce((a, b) => a + b, 0) / atm.dailyWithdrawals.length
        return sum + atmAvg
      }, 0) / (atmData.length || 1)

    setTotalCash(total)
    setHighRiskATMs(highRisk)
    setAvgDailyWithdrawal(avgWithdrawal)
  }, [atmData])

  const handleLogin = (user: any) => {
    setCurrentUser(user)
    fetchATMData()
  }

  const handleLogout = () => {
    atmApi.logout()
    setCurrentUser(null)
    setAtmData([])
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
    })
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "low":
        return "bg-emerald-100 text-emerald-800 border-emerald-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-emerald-100 text-emerald-800 border-emerald-200"
      case "offline":
        return "bg-red-100 text-red-800 border-red-200"
      case "maintenance":
        return "bg-amber-100 text-amber-800 border-amber-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getCashPercentage = (current: number, capacity: number) => {
    return (current / capacity) * 100
  }

  const getCashLevelColor = (percentage: number) => {
    if (percentage < 20) return "bg-red-500"
    if (percentage < 40) return "bg-amber-500"
    return "bg-emerald-500"
  }

  // Show login form if not authenticated
  if (!currentUser) {
    return <AuthForm onLogin={handleLogin} />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-slate-700">Loading ATM Network</h2>
            <p className="text-slate-500">Connecting to prediction system...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                CASHVIEW
                </h1>
                <p className="text-slate-600">AI-Powered Cash Management & Forecasting</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Badge className="bg-blue-100 text-blue-800 border-blue-200">{currentUser.role}</Badge>
                <span className="text-sm font-medium text-slate-700">{currentUser.username}</span>
              </div>
              <div className="flex items-center space-x-2">
                {connectionStatus === "connected" ? (
                  <Wifi className="h-4 w-4 text-emerald-600" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-600" />
                )}
                <span
                  className={`text-sm font-medium ${
                    connectionStatus === "connected" ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {connectionStatus === "connected" ? "Connected" : "Disconnected"}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-slate-500">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Updated: {lastUpdate.toLocaleTimeString()}</span>
              </div>
              <Button
                onClick={fetchATMData}
                variant="outline"
                size="sm"
                className="border-slate-300 hover:bg-slate-50 bg-transparent"
              >
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-slate-300 hover:bg-slate-50 bg-transparent"
                onClick={() => {
                  try {
                    ExportService.exportAnalyticsReport(atmData, ExportService.generateFilename("comprehensive-report"))

                    toast({
                      title: "Export Successful",
                      description: "Comprehensive analytics report has been exported successfully",
                    })
                  } catch (error) {
                    console.error("Export failed:", error)
                    toast({
                      title: "Export Failed",
                      description: "Failed to export comprehensive report. Please try again.",
                      variant: "destructive",
                    })
                  }
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="border-slate-300 hover:bg-slate-50 bg-transparent"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-100">Total Cash Available</CardTitle>
              <DollarSign className="h-5 w-5 text-blue-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${totalCash.toLocaleString()}</div>
              <p className="text-xs text-blue-200 mt-1">Across {atmData.length} ATMs</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-red-500 to-red-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-100">Critical Alerts</CardTitle>
              <AlertTriangle className="h-5 w-5 text-red-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{highRiskATMs}</div>
              <p className="text-xs text-red-200 mt-1">Require immediate attention</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-100">Daily Average</CardTitle>
              <TrendingUp className="h-5 w-5 text-emerald-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${Math.round(avgDailyWithdrawal).toLocaleString()}</div>
              <p className="text-xs text-emerald-200 mt-1">Per ATM withdrawal</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-indigo-100">Network Status</CardTitle>
              <MapPin className="h-5 w-5 text-indigo-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{atmData.filter((atm) => atm.status === "online").length}</div>
              <p className="text-xs text-indigo-200 mt-1">Online ATMs</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="dashboard" className="space-y-8">
          <TabsList className="grid w-full grid-cols-6 bg-white border border-slate-200 shadow-sm">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="predictions" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              AI Predictions
            </TabsTrigger>
            <TabsTrigger value="refill" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Refill Requests
            </TabsTrigger>
            <TabsTrigger value="ml" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              ML Training
            </TabsTrigger>
            <TabsTrigger value="management" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Management
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-8">
            {/* ATM Status Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {atmData.map((atm) => {
                const cashPercentage = getCashPercentage(atm.currentCash, atm.capacity)
                return (
                  <Card
                    key={atm.id}
                    className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-slate-600 to-slate-700 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">{atm.id.slice(-2)}</span>
                          </div>
                          <div>
                            <CardTitle className="text-lg font-bold text-slate-900">{atm.id}</CardTitle>
                            <CardDescription className="flex items-center text-slate-600">
                              <MapPin className="h-3 w-3 mr-1" />
                              {atm.location}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          <Badge className={`${getRiskColor(atm.riskLevel)} border font-medium`}>
                            {atm.riskLevel.toUpperCase()}
                          </Badge>
                          <Badge className={`${getStatusColor(atm.status)} border text-xs`}>
                            {atm.status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-medium text-slate-700">Cash Level</span>
                          <span className="font-bold text-slate-900">
                            ${atm.currentCash.toLocaleString()} / ${atm.capacity.toLocaleString()}
                          </span>
                        </div>
                        <div className="relative">
                          <Progress value={cashPercentage} className="h-3 bg-slate-200" />
                          <div
                            className={`absolute top-0 left-0 h-3 rounded-full transition-all duration-500 ${getCashLevelColor(cashPercentage)}`}
                            style={{ width: `${cashPercentage}%` }}
                          />
                        </div>
                        <div className="text-xs text-slate-500 mt-1">{cashPercentage.toFixed(1)}% capacity</div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-slate-50 p-3 rounded-lg">
                          <p className="text-slate-500 text-xs font-medium">Last Refill</p>
                          <p className="font-bold text-slate-900">{new Date(atm.lastRefill).toLocaleDateString()}</p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg">
                          <p className="text-slate-500 text-xs font-medium">Predicted Empty</p>
                          <p className="font-bold text-slate-900">
                            {new Date(atm.predictedDepletion).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-2">7-Day Withdrawal Trend</p>
                        <div className="flex items-end space-x-1 h-12 bg-slate-50 p-2 rounded-lg">
                          {atm.dailyWithdrawals.map((amount, index) => (
                            <div
                              key={index}
                              className="bg-gradient-to-t from-blue-500 to-blue-400 rounded-sm flex-1 transition-all duration-300 hover:from-blue-600 hover:to-blue-500"
                              style={{
                                height: `${(amount / Math.max(...atm.dailyWithdrawals)) * 100}%`,
                                minHeight: "8px",
                              }}
                              title={`Day ${index + 1}: $${amount.toLocaleString()}`}
                            />
                          ))}
                        </div>
                      </div>

                      {atm.riskLevel === "high" && (
                        <Button
                          size="sm"
                          className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium"
                          onClick={() =>
                            toast({
                              title: "Refill Scheduled",
                              description: `Emergency refill scheduled for ${atm.id}`,
                            })
                          }
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Schedule Emergency Refill
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Prediction Chart */}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
                <CardTitle className="text-xl font-bold text-slate-900">AI Cash Flow Predictions</CardTitle>
                <CardDescription className="text-slate-600">
                  Machine learning powered forecasts for the next 7 days across your ATM network
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <PredictionChart atmData={atmData} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="predictions">
            <PredictionForm atmData={atmData} setAtmData={setAtmData} />
          </TabsContent>

          <TabsContent value="refill">
            <RefillManagement atmData={atmData} currentUser={currentUser} />
          </TabsContent>

          <TabsContent value="ml">
            <MLPrediction currentUser={currentUser} />
          </TabsContent>

          <TabsContent value="management">
            <ATMManagement atmData={atmData} setAtmData={setAtmData} />
          </TabsContent>

          <TabsContent value="analytics">
            <HistoricalData atmData={atmData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
