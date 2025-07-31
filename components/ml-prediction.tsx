"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Brain, TrendingUp, BarChart3, AlertCircle, CheckCircle, FileSpreadsheet, Zap } from "lucide-react"
import { LoadingSpinner } from "@/components/loading-spinner"
import { useToast } from "@/hooks/use-toast"
import { atmApi } from "@/lib/api"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { ExportService } from "@/lib/export-utils"
import { Download } from "lucide-react"

interface MLPredictionProps {
  currentUser: any
}

export function MLPrediction({ currentUser }: MLPredictionProps) {
  const [modelTrained, setModelTrained] = useState(false)
  const [modelMetadata, setModelMetadata] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [predictionLoading, setPredictionLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [predictionDays, setPredictionDays] = useState("7")
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split("T")[0])
  const [predictionResults, setPredictionResults] = useState<any>(null)
  const { toast } = useToast()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (!file.name.toLowerCase().endsWith(".csv")) {
        toast({
          title: "Invalid File Type",
          description: "Please select a CSV file",
          variant: "destructive",
        })
        return
      }
      setSelectedFile(file)
    }
  }

  const handleModelTraining = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a CSV file to train the model",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const result = await atmApi.trainModel(selectedFile)

      setModelTrained(true)
      setModelMetadata(result)

      toast({
        title: "Model Training Complete",
        description: "Machine learning model has been successfully trained",
      })
    } catch (error) {
      console.error("Model training failed:", error)
      toast({
        title: "Training Failed",
        description: "Failed to train the model. Please check your data format.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePrediction = async () => {
    if (!modelTrained) {
      toast({
        title: "Model Not Trained",
        description: "Please train the model first before generating predictions",
        variant: "destructive",
      })
      return
    }

    setPredictionLoading(true)
    try {
      const result = await atmApi.generatePrediction(currentDate, Number.parseInt(predictionDays))
      setPredictionResults(result)

      toast({
        title: "Prediction Generated",
        description: `Successfully generated ${predictionDays}-day prediction`,
      })
    } catch (error) {
      console.error("Prediction failed:", error)
      toast({
        title: "Prediction Failed",
        description: "Failed to generate prediction. Please try again.",
        variant: "destructive",
      })
    } finally {
      setPredictionLoading(false)
    }
  }

  const canTrainModel = () => {
    return currentUser?.role === "Vault Manager" || currentUser?.role === "Head Office Authorization Officer"
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Machine Learning Predictions
          </h2>
          <p className="text-slate-600 mt-1">Advanced AI-powered cash flow forecasting and analysis</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge
            className={`${modelTrained ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-amber-100 text-amber-800 border-amber-200"} border font-medium`}
          >
            {modelTrained ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Model Ready
              </>
            ) : (
              <>
                <AlertCircle className="h-3 w-3 mr-1" />
                Model Not Trained
              </>
            )}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="training" className="space-y-8">
        <TabsList className="grid w-full grid-cols-2 bg-white border border-slate-200 shadow-sm">
          <TabsTrigger value="training" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            Model Training
          </TabsTrigger>
          <TabsTrigger value="prediction" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            Generate Predictions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="training" className="space-y-6">
          {/* Model Training */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200">
                <CardTitle className="text-xl font-bold text-slate-900 flex items-center">
                  <Brain className="h-6 w-6 mr-3 text-blue-600" />
                  Train ML Model
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Upload historical data to train the machine learning model
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {!canTrainModel() && (
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-amber-900">Access Restricted</p>
                        <p className="text-sm text-amber-700 mt-1">
                          Only Vault Managers and Head Office Authorization Officers can train the model.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">Upload Historical Data (CSV)</Label>
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="csv-upload"
                        disabled={!canTrainModel()}
                      />
                      <label htmlFor="csv-upload" className="cursor-pointer">
                        <FileSpreadsheet className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                        <p className="text-sm font-medium text-slate-700">
                          {selectedFile ? selectedFile.name : "Click to upload CSV file"}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          CSV should contain date, amount, and balance columns
                        </p>
                      </label>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2">Data Format Requirements:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• First column: Date (YYYY-MM-DD format)</li>
                      <li>• Second column: Transaction Amount</li>
                      <li>• Third column: Account Balance</li>
                      <li>• Minimum 3 columns required</li>
                    </ul>
                  </div>

                  <Button
                    onClick={handleModelTraining}
                    disabled={!selectedFile || loading || !canTrainModel()}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3"
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Training Model...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4 mr-2" />
                        Train Model
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Model Status */}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50 border-b border-slate-200">
                <CardTitle className="text-xl font-bold text-slate-900">Model Status</CardTitle>
                <CardDescription className="text-slate-600">Current machine learning model information</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {modelTrained && modelMetadata ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                      <span className="font-semibold text-emerald-900">Model Successfully Trained</span>
                    </div>

                    <div className="space-y-3">
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm font-medium text-slate-700">Max Refill Amount</p>
                        <p className="text-lg font-bold text-slate-900">
                          ${modelMetadata.max_refill_amount?.toLocaleString() || "N/A"}
                        </p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm font-medium text-slate-700">Data Columns Used</p>
                        <div className="mt-2 space-y-1">
                          {modelMetadata.columns_used &&
                            Object.entries(modelMetadata.columns_used).map(([key, value]) => (
                              <div key={key} className="flex justify-between text-sm">
                                <span className="text-slate-600 capitalize">{key}:</span>
                                <span className="font-medium text-slate-900">{value as string}</span>
                              </div>
                            ))}
                        </div>
                      </div>

                      <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                        <p className="text-sm font-semibold text-emerald-900">Model Features</p>
                        <ul className="text-sm text-emerald-700 mt-1 space-y-1">
                          <li>• XGBoost + Random Forest + Ridge Regression</li>
                          <li>• Stacking Ensemble Method</li>
                          <li>• Holiday and Weekend Detection</li>
                          <li>• Month-end Pattern Recognition</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Brain className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-lg font-medium text-slate-700 mb-2">No Model Trained</p>
                    <p className="text-sm text-slate-500">Upload historical data to train the ML model</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="prediction" className="space-y-6">
          {/* Prediction Generation */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b border-slate-200">
                <CardTitle className="text-xl font-bold text-slate-900 flex items-center">
                  <Zap className="h-6 w-6 mr-3 text-purple-600" />
                  Generate Prediction
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Use the trained model to forecast cash requirements
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-date" className="text-sm font-semibold text-slate-700">
                      Start Date
                    </Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={currentDate}
                      onChange={(e) => setCurrentDate(e.target.value)}
                      className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="days" className="text-sm font-semibold text-slate-700">
                      Prediction Period (Days)
                    </Label>
                    <Input
                      id="days"
                      type="number"
                      min="1"
                      max="365"
                      value={predictionDays}
                      onChange={(e) => setPredictionDays(e.target.value)}
                      className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <Button
                    onClick={handlePrediction}
                    disabled={!modelTrained || predictionLoading}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3"
                  >
                    {predictionLoading ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Generate Prediction
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Prediction Summary */}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50 border-b border-slate-200">
                <CardTitle className="text-xl font-bold text-slate-900">Prediction Summary</CardTitle>
                <CardDescription className="text-slate-600">AI-generated cash flow forecast results</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {predictionResults ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-700">Total Predicted Amount</span>
                        <BarChart3 className="h-4 w-4 text-blue-600" />
                      </div>
                      <p className="text-2xl font-bold text-blue-900">
                        ${predictionResults.total_predicted_amount.toLocaleString()}
                      </p>
                      <p className="text-sm text-blue-700 mt-1">{predictionResults.message}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm font-medium text-slate-700">Prediction Date</p>
                        <p className="font-bold text-slate-900">{predictionResults.prediction_date}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm font-medium text-slate-700">Days Forecast</p>
                        <p className="font-bold text-slate-900">{predictionResults.days_requested} days</p>
                      </div>
                    </div>

                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <p className="text-sm font-semibold text-emerald-900">Recommendation</p>
                      <p className="text-sm text-emerald-700 mt-1">
                        Based on ML analysis, ensure sufficient cash reserves to meet predicted demand.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <TrendingUp className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-lg font-medium text-slate-700 mb-2">No Predictions Generated</p>
                    <p className="text-sm text-slate-500">Generate a prediction to see detailed forecasts</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Prediction Chart */}
          {predictionResults && (
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
                <CardTitle className="text-xl font-bold text-slate-900">Daily Prediction Breakdown</CardTitle>
                <CardDescription className="text-slate-600">Detailed daily cash withdrawal predictions</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-80 mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={predictionResults.daily_predictions}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis
                        dataKey="day_number"
                        stroke="#64748B"
                        fontSize={12}
                        tickFormatter={(value) => `Day ${value}`}
                      />
                      <YAxis
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                        stroke="#64748B"
                        fontSize={12}
                      />
                      <Tooltip
                        formatter={(value: number, name) => [
                          `$${value.toLocaleString()}`,
                          name === "predicted_withdrawal" ? "Predicted Withdrawal" : "Running Total",
                        ]}
                        labelFormatter={(label) => `Day ${label}`}
                      />
                      <Bar
                        dataKey="predicted_withdrawal"
                        fill="#3B82F6"
                        name="predicted_withdrawal"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="max-h-64 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {predictionResults.daily_predictions.map((day: any, index: number) => (
                      <div
                        key={index}
                        className="p-3 border border-slate-200 rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-slate-900">Day {day.day_number}</span>
                          <span className="text-xs text-slate-500">{day.date}</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Predicted:</span>
                            <span className="font-medium text-slate-900">
                              ${day.predicted_withdrawal.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Running Total:</span>
                            <span className="font-medium text-slate-900">${day.running_total.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {predictionResults && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                className="border-slate-300 hover:bg-slate-50 bg-transparent"
                onClick={() => {
                  try {
                    ExportService.exportPredictions(
                      predictionResults.daily_predictions,
                      ExportService.generateFilename("ml-predictions"),
                    )

                    toast({
                      title: "Export Successful",
                      description: "ML predictions have been exported successfully",
                    })
                  } catch (error) {
                    console.error("Export failed:", error)
                    toast({
                      title: "Export Failed",
                      description: "Failed to export ML predictions. Please try again.",
                      variant: "destructive",
                    })
                  }
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Export ML Data
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
