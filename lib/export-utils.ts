import type { ATMData } from "@/types/atm"

export interface ExportData {
  atmData: ATMData[]
  predictions?: any[]
  refillRequests?: any[]
  analytics?: any
}

export class ExportService {
  // Export to CSV
  static exportToCSV(data: any[], filename: string) {
    if (!data || data.length === 0) {
      throw new Error("No data to export")
    }

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header]
            // Handle nested objects and arrays
            if (typeof value === "object" && value !== null) {
              return `"${JSON.stringify(value).replace(/"/g, '""')}"`
            }
            // Escape commas and quotes in strings
            if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`
            }
            return value
          })
          .join(","),
      ),
    ].join("\n")

    this.downloadFile(csvContent, `${filename}.csv`, "text/csv")
  }

  // Export to JSON
  static exportToJSON(data: any, filename: string) {
    const jsonContent = JSON.stringify(data, null, 2)
    this.downloadFile(jsonContent, `${filename}.json`, "application/json")
  }

  // Export to Excel-compatible CSV
  static exportToExcel(data: any[], filename: string) {
    if (!data || data.length === 0) {
      throw new Error("No data to export")
    }

    // Add BOM for proper Excel UTF-8 handling
    const BOM = "\uFEFF"
    const headers = Object.keys(data[0])
    const csvContent =
      BOM +
      [
        headers.join(","),
        ...data.map((row) =>
          headers
            .map((header) => {
              const value = row[header]
              if (typeof value === "object" && value !== null) {
                return `"${JSON.stringify(value).replace(/"/g, '""')}"`
              }
              if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`
              }
              return value
            })
            .join(","),
        ),
      ].join("\n")

    this.downloadFile(csvContent, `${filename}.csv`, "text/csv")
  }

  // Export ATM data with analytics
  static exportATMReport(atmData: ATMData[], filename = "atm-report") {
    const reportData = atmData.map((atm) => ({
      ATM_ID: atm.id,
      Location: atm.location,
      Current_Cash: atm.currentCash,
      Capacity: atm.capacity,
      Cash_Percentage: ((atm.currentCash / atm.capacity) * 100).toFixed(2) + "%",
      Risk_Level: atm.riskLevel,
      Status: atm.status,
      Last_Refill: atm.lastRefill,
      Predicted_Depletion: atm.predictedDepletion,
      Weekly_Total_Withdrawals: atm.dailyWithdrawals.reduce((a, b) => a + b, 0),
      Daily_Average_Withdrawal: Math.round(atm.dailyWithdrawals.reduce((a, b) => a + b, 0) / 7),
      Peak_Day_Withdrawal: Math.max(...atm.dailyWithdrawals),
      Low_Day_Withdrawal: Math.min(...atm.dailyWithdrawals),
      Coordinates: atm.coordinates ? `${atm.coordinates.lat}, ${atm.coordinates.lng}` : "N/A",
      Export_Date: new Date().toISOString(),
    }))

    this.exportToExcel(reportData, filename)
  }

  // Export predictions data
  static exportPredictions(predictions: any[], filename = "predictions-report") {
    if (!predictions || predictions.length === 0) {
      throw new Error("No prediction data to export")
    }

    const reportData = predictions.map((pred, index) => ({
      Day_Number: pred.day || index + 1,
      Date: pred.date,
      Predicted_Cash: pred.predictedCash || pred.predicted_withdrawal,
      Cash_Percentage: pred.cashPercentage?.toFixed(2) + "%" || "N/A",
      Risk_Level: pred.riskLevel || "N/A",
      Daily_Withdrawal: pred.dailyWithdrawal || pred.predicted_withdrawal,
      Running_Total: pred.running_total || "N/A",
      Export_Date: new Date().toISOString(),
    }))

    this.exportToExcel(reportData, filename)
  }

  // Export refill requests
  static exportRefillRequests(requests: any[], filename = "refill-requests-report") {
    if (!requests || requests.length === 0) {
      throw new Error("No refill request data to export")
    }

    const reportData = requests.map((request) => ({
      Request_ID: request.request_id,
      ATM_ID: request.atm_id,
      Requested_Amount: request.requested_amount,
      Requestor: request.requestor,
      Status: request.status,
      Created_Date: new Date(request.created_at).toLocaleDateString(),
      Updated_Date: new Date(request.updated_at).toLocaleDateString(),
      Comment: request.comment || "N/A",
      Approval_Count: request.approval_history?.length || 0,
      Latest_Approver: request.approval_history?.[request.approval_history.length - 1]?.approver || "N/A",
      Latest_Action: request.approval_history?.[request.approval_history.length - 1]?.action || "N/A",
      Export_Date: new Date().toISOString(),
    }))

    this.exportToExcel(reportData, filename)
  }

  // Export comprehensive analytics report
  static exportAnalyticsReport(atmData: ATMData[], filename = "analytics-report") {
    const totalCash = atmData.reduce((sum, atm) => sum + atm.currentCash, 0)
    const totalCapacity = atmData.reduce((sum, atm) => sum + atm.capacity, 0)
    const highRiskCount = atmData.filter((atm) => atm.riskLevel === "high").length
    const mediumRiskCount = atmData.filter((atm) => atm.riskLevel === "medium").length
    const lowRiskCount = atmData.filter((atm) => atm.riskLevel === "low").length
    const onlineCount = atmData.filter((atm) => atm.status === "online").length
    const offlineCount = atmData.filter((atm) => atm.status === "offline").length
    const maintenanceCount = atmData.filter((atm) => atm.status === "maintenance").length

    const summaryData = [
      {
        Metric: "Total ATMs",
        Value: atmData.length,
        Category: "Network Overview",
      },
      {
        Metric: "Total Cash Available",
        Value: `$${totalCash.toLocaleString()}`,
        Category: "Financial",
      },
      {
        Metric: "Total Network Capacity",
        Value: `$${totalCapacity.toLocaleString()}`,
        Category: "Financial",
      },
      {
        Metric: "Network Utilization",
        Value: `${((totalCash / totalCapacity) * 100).toFixed(2)}%`,
        Category: "Financial",
      },
      {
        Metric: "High Risk ATMs",
        Value: highRiskCount,
        Category: "Risk Assessment",
      },
      {
        Metric: "Medium Risk ATMs",
        Value: mediumRiskCount,
        Category: "Risk Assessment",
      },
      {
        Metric: "Low Risk ATMs",
        Value: lowRiskCount,
        Category: "Risk Assessment",
      },
      {
        Metric: "Online ATMs",
        Value: onlineCount,
        Category: "Status",
      },
      {
        Metric: "Offline ATMs",
        Value: offlineCount,
        Category: "Status",
      },
      {
        Metric: "Maintenance ATMs",
        Value: maintenanceCount,
        Category: "Status",
      },
      {
        Metric: "Average Daily Withdrawal",
        Value: `$${Math.round(
          atmData.reduce((sum, atm) => {
            const atmAvg = atm.dailyWithdrawals.reduce((a, b) => a + b, 0) / 7
            return sum + atmAvg
          }, 0) / atmData.length,
        ).toLocaleString()}`,
        Category: "Performance",
      },
      {
        Metric: "Report Generated",
        Value: new Date().toLocaleString(),
        Category: "Metadata",
      },
    ]

    this.exportToExcel(summaryData, filename)
  }

  // Helper method to download file
  private static downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  // Generate filename with timestamp
  static generateFilename(prefix: string, extension = "csv"): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5)
    return `${prefix}_${timestamp}.${extension}`
  }
}
