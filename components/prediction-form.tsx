"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Calculator, AlertCircle, Brain, Zap, AlertTriangle, Download } from "lucide-react"
import { LoadingSpinner } from "@/components/loading-spinner"
import { useToast } from "@/hooks/use-toast"
import { atmApi } from "@/lib/api"
import { ExportService } from "@/lib/export-utils"

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

interface PredictionFormProps {
  atmData: ATMData[]
  setAtmData: (data: ATMData[]) => void
}

export function PredictionForm({ atmData, setAtmData }: PredictionFormProps) {
  const [selectedATM, setSelectedATM] = useState("")
  const [predictionDays, setPredictionDays] = useState("7")
  const [seasonalFactor, setSeasonalFactor] = useState("1.0")
  const [eventFactor, setEventFactor] = useState("1.0")
  const [eventDescription, setEventDescription] = useState("")
  const [predictions, setPredictions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const calculatePrediction = async () => {
    if (!selectedATM) {
      toast({
        title: "Selection Required",
        description: "Please select an ATM to generate predictions",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const response = await atmApi.generatePrediction({
        atmId: selectedATM,
        days: Number.parseInt(predictionDays),
        seasonalFactor: Number.parseFloat(seasonalFactor),
        eventFactor: Number.parseFloat(eventFactor),
        eventDescription: eventDescription || undefined,
      })

      setPredictions(response.predictions)

      toast({
        title: "Prediction Generated",
        description: `AI prediction completed for ${selectedATM}`,
      })
    } catch (error) {
      console.error("Prediction failed:", error)

      // Fallback to local calculation
      const atm = atmData.find((a) => a.id === selectedATM)
      if (!atm) return

      const days = Number.parseInt(predictionDays)
      const seasonal = Number.parseFloat(seasonalFactor)
      const event = Number.parseFloat(eventFactor)

      const avgDailyWithdrawal = atm.dailyWithdrawals.reduce((a, b) => a + b, 0) / atm.dailyWithdrawals.length
      const adjustedWithdrawal = avgDailyWithdrawal * seasonal * event

      const predictionResults = []
      let currentCash = atm.currentCash

      for (let i = 1; i <= days; i++) {
        currentCash = Math.max(0, currentCash - adjustedWithdrawal)
        const date = new Date()
        date.setDate(date.getDate() + i)

        let riskLevel: "low" | "medium" | "high" = "low"
        const cashPercentage = (currentCash / atm.capacity) * 100

        if (cashPercentage < 20) riskLevel = "high"
        else if (cashPercentage < 40) riskLevel = "medium"

        predictionResults.push({
          day: i,
          date: date.toLocaleDateString(),
          predictedCash: currentCash,
          cashPercentage,
          riskLevel,
          dailyWithdrawal: adjustedWithdrawal,
        })
      }

      setPredictions(predictionResults)

      toast({
        title: "Offline Prediction",
        description: "Generated prediction using local algorithms",
        variant: "default",
      })
    } finally {
      setLoading(false)
    }
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* AI Prediction Form */}
      <Card className="border-0 shadow-lg bg-white">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200">
          <CardTitle className="flex items-center text-xl font-bold text-slate-900">
            <Brain className="h-6 w-6 mr-3 text-blue-600" />
            AI Prediction Engine
          </CardTitle>
          <CardDescription className="text-slate-600">
            Generate intelligent cash flow predictions with machine learning algorithms
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="atm-select" className="text-sm font-semibold text-slate-700">
              Select ATM Location
            </Label>
            <Select value={selectedATM} onValueChange={setSelectedATM}>
              <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Choose an ATM to analyze" />
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prediction-days" className="text-sm font-semibold text-slate-700">
                Forecast Period
              </Label>
              <Select value={predictionDays} onValueChange={setPredictionDays}>
                <SelectTrigger className="border-slate-300 focus:border-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 Days</SelectItem>
                  <SelectItem value="7">1 Week</SelectItem>
                  <SelectItem value="14">2 Weeks</SelectItem>
                  <SelectItem value="30">1 Month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seasonal-factor" className="text-sm font-semibold text-slate-700">
                Seasonal Factor
              </Label>
              <Input
                id="seasonal-factor"
                type="number"
                step="0.1"
                value={seasonalFactor}
                onChange={(e) => setSeasonalFactor(e.target.value)}
                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                placeholder="1.0 = normal"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-factor" className="text-sm font-semibold text-slate-700">
              Event Impact Factor
            </Label>
            <Input
              id="event-factor"
              type="number"
              step="0.1"
              value={eventFactor}
              onChange={(e) => setEventFactor(e.target.value)}
              className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              placeholder="1.0 = normal, 1.5 = 50% increase"
            />
            <p className="text-xs text-slate-500">Adjust for special events, holidays, or unusual circumstances</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-description" className="text-sm font-semibold text-slate-700">
              Event Description
            </Label>
            <Textarea
              id="event-description"
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 resize-none"
              placeholder="e.g., Black Friday shopping, University graduation, Local festival"
              rows={3}
            />
          </div>

          <Button
            onClick={calculatePrediction}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3"
            disabled={!selectedATM || loading}
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Generating AI Prediction...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Generate AI Prediction
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Prediction Results */}
      <Card className="border-0 shadow-lg bg-white">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50 border-b border-slate-200">
          <CardTitle className="text-xl font-bold text-slate-900">Prediction Results</CardTitle>
          <CardDescription className="text-slate-600">
            {selectedATM && predictions.length > 0
              ? `AI-powered cash flow forecast for ${selectedATM}`
              : "Select an ATM and generate predictions to see intelligent forecasts"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {predictions.length > 0 ? (
            <div className="space-y-4">
              {eventDescription && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-blue-900">Event Consideration</p>
                      <p className="text-sm text-blue-700 mt-1">{eventDescription}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="max-h-96 overflow-y-auto space-y-3">
                {predictions.map((pred, index) => (
                  <div key={index} className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-slate-600 to-slate-700 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-xs">{pred.day}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900">Day {pred.day}</span>
                          <p className="text-sm text-slate-500">{pred.date}</p>
                        </div>
                      </div>
                      <Badge className={`${getRiskColor(pred.riskLevel)} border font-medium`}>
                        {pred.riskLevel.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500 font-medium">Predicted Cash</p>
                        <p className="text-lg font-bold text-slate-900">${pred.predictedCash.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 font-medium">Capacity</p>
                        <p className="text-lg font-bold text-slate-900">{pred.cashPercentage.toFixed(1)}%</p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className="text-xs text-slate-500 mb-1">
                        Expected daily withdrawal: ${pred.dailyWithdrawal.toLocaleString()}
                      </p>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            pred.cashPercentage < 20
                              ? "bg-red-500"
                              : pred.cashPercentage < 40
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.max(pred.cashPercentage, 5)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {predictions.some((p) => p.riskLevel === "high") && (
                <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-red-900">Critical Alert</p>
                      <p className="text-sm text-red-700 mt-1">
                        This ATM is predicted to reach critically low cash levels. Schedule an emergency refill
                        immediately to prevent service disruption.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calculator className="h-8 w-8 text-blue-600" />
              </div>
              <p className="text-lg font-medium text-slate-700 mb-2">No predictions generated yet</p>
              <p className="text-sm">Select an ATM and click "Generate AI Prediction" to see intelligent forecasts</p>
            </div>
          )}
          {predictions.length > 0 && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                className="border-slate-300 hover:bg-slate-50 bg-transparent"
                onClick={() => {
                  try {
                    ExportService.exportPredictions(
                      predictions,
                      ExportService.generateFilename(`predictions-${selectedATM}`),
                    )

                    toast({
                      title: "Export Successful",
                      description: "Predictions have been exported successfully",
                    })
                  } catch (error) {
                    console.error("Export failed:", error)
                    toast({
                      title: "Export Failed",
                      description: "Failed to export predictions. Please try again.",
                      variant: "destructive",
                    })
                  }
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Predictions
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
