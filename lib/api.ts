"use client"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"

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

interface RefillRequest {
  request_id: string
  atm_id: string
  requested_amount: number
  requestor: string
  status: "pending" | "approved" | "rejected" | "completed"
  created_at: string
  updated_at: string
  comment?: string
  approval_history: ApprovalRecord[]
}

interface ApprovalRecord {
  approver: string
  role: string
  action: string
  timestamp: string
  comment?: string
}

interface PredictionRequest {
  current_date: string
  days: number
}

interface PredictionResponse {
  total_predicted_amount: number
  message: string
  daily_predictions: Array<{
    day_number: number
    date: string
    predicted_withdrawal: number
    running_total: number
  }>
  prediction_date: string
  days_requested: number
}

interface User {
  username: string
  role: string
  token: string
}

class ATMApi {
  private token: string | null = null

  constructor() {
    // Get token from localStorage on initialization
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("auth_token")
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        if (response.status === 401) {
          this.logout()
          throw new Error("Authentication required")
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error)
      throw error
    }
  }

  // Authentication
  async login(username: string, password: string): Promise<User> {
    try {
      // For demo purposes, we'll use the username as token since your backend uses simple token auth
      const response = await fetch(`${API_BASE_URL}/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `username=${username}&password=${password}`,
      })

      if (!response.ok) {
        throw new Error("Invalid credentials")
      }

      const data = await response.json()
      this.token = data.access_token || username // Fallback to username for demo

      if (typeof window !== "undefined") {
        localStorage.setItem("auth_token", this.token!)
      }

      // Get user role from your users_db structure
      const roleMap: { [key: string]: string } = {
        atm_ops: "ATM Operations Staff",
        branch_mgr: "Branch Operations Manager",
        vault_mgr: "Vault Manager",
        hoao: "Head Office Authorization Officer",
      }

      return {
        username,
        role: roleMap[username] || "Unknown",
        token: this.token!,
      }
    } catch (error) {
      console.error("Login failed:", error)
      throw error
    }
  }

  logout() {
    this.token = null
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token")
    }
  }

  getCurrentUser(): User | null {
    if (!this.token) return null

    const roleMap: { [key: string]: string } = {
      atm_ops: "ATM Operations Staff",
      branch_mgr: "Branch Operations Manager",
      vault_mgr: "Vault Manager",
      hoao: "Head Office Authorization Officer",
    }

    return {
      username: this.token,
      role: roleMap[this.token] || "Unknown",
      token: this.token,
    }
  }

  // Refill Requests
  async createRefillRequest(atmId: string, requestedAmount: number, comment?: string): Promise<RefillRequest> {
    return this.request<RefillRequest>("/refill-requests", {
      method: "POST",
      body: JSON.stringify({
        atm_id: atmId,
        requested_amount: requestedAmount,
        comment: comment || "",
      }),
    })
  }

  async getRefillRequests(statusFilter?: string): Promise<RefillRequest[]> {
    const params = statusFilter ? `?status_filter=${statusFilter}` : ""
    return this.request<RefillRequest[]>(`/refill-requests${params}`)
  }

  async approveRefillRequest(
    requestId: string,
    action: "approve" | "reject",
    comment?: string,
  ): Promise<RefillRequest> {
    return this.request<RefillRequest>(`/refill-requests/${requestId}/action`, {
      method: "POST",
      body: JSON.stringify({
        action,
        comment: comment || "",
      }),
    })
  }

  // ML Predictions
  async trainModel(csvFile: File): Promise<any> {
    const formData = new FormData()
    formData.append("file", csvFile)

    const response = await fetch(`${API_BASE_URL}/model/train`, {
      method: "POST",
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error("Model training failed")
    }

    return await response.json()
  }

  async generatePrediction(currentDate: string, days: number): Promise<PredictionResponse> {
    return this.request<PredictionResponse>("/model/predict", {
      method: "POST",
      body: JSON.stringify({
        current_date: currentDate,
        days,
      }),
    })
  }

  // ATM Management (Mock endpoints - you can implement these in your backend)
  async getAllATMs(): Promise<ATMData[]> {
    try {
      return this.request<ATMData[]>("/atms")
    } catch (error) {
      // Fallback to mock data if endpoint doesn't exist
      return [
        {
          id: "ATM001",
          location: "Downtown Financial District",
          currentCash: 45000,
          capacity: 100000,
          dailyWithdrawals: [12000, 15000, 18000, 14000, 16000, 22000, 19000],
          lastRefill: "2024-01-28",
          predictedDepletion: "2024-02-02",
          riskLevel: "medium",
          status: "online",
          coordinates: { lat: 40.7128, lng: -74.006 },
        },
        {
          id: "ATM002",
          location: "Westfield Shopping Center",
          currentCash: 15000,
          capacity: 80000,
          dailyWithdrawals: [25000, 28000, 32000, 29000, 31000, 35000, 33000],
          lastRefill: "2024-01-26",
          predictedDepletion: "2024-01-31",
          riskLevel: "high",
          status: "online",
          coordinates: { lat: 40.7589, lng: -73.9851 },
        },
        {
          id: "ATM003",
          location: "State University Campus",
          currentCash: 72000,
          capacity: 100000,
          dailyWithdrawals: [8000, 9000, 12000, 11000, 10000, 15000, 13000],
          lastRefill: "2024-01-29",
          predictedDepletion: "2024-02-05",
          riskLevel: "low",
          status: "online",
          coordinates: { lat: 40.6892, lng: -74.0445 },
        },
        {
          id: "ATM004",
          location: "International Airport Terminal",
          currentCash: 8000,
          capacity: 120000,
          dailyWithdrawals: [35000, 38000, 42000, 39000, 41000, 45000, 43000],
          lastRefill: "2024-01-25",
          predictedDepletion: "2024-01-30",
          riskLevel: "high",
          status: "online",
          coordinates: { lat: 40.6413, lng: -73.7781 },
        },
      ]
    }
  }

  async getATMById(id: string): Promise<ATMData> {
    return this.request<ATMData>(`/atms/${id}`)
  }

  async createATM(atmData: Omit<ATMData, "id">): Promise<ATMData> {
    return this.request<ATMData>("/atms", {
      method: "POST",
      body: JSON.stringify(atmData),
    })
  }

  async updateATM(id: string, atmData: Partial<ATMData>): Promise<ATMData> {
    return this.request<ATMData>(`/atms/${id}`, {
      method: "PUT",
      body: JSON.stringify(atmData),
    })
  }

  async deleteATM(id: string): Promise<void> {
    return this.request<void>(`/atms/${id}`, {
      method: "DELETE",
    })
  }

  // Analytics
  async getATMAnalytics(id: string, startDate: string, endDate: string): Promise<any> {
    return this.request<any>(`/analytics/atm/${id}?start_date=${startDate}&end_date=${endDate}`)
  }

  async getNetworkAnalytics(startDate: string, endDate: string): Promise<any> {
    return this.request<any>(`/analytics/network?start_date=${startDate}&end_date=${endDate}`)
  }
}

export const atmApi = new ATMApi()

// WebSocket connection for real-time updates
export class ATMWebSocket {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  connect(onMessage: (data: any) => void, onError?: (error: Event) => void) {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws"

    try {
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        console.log("WebSocket connected")
        this.reconnectAttempts = 0
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          onMessage(data)
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error)
        }
      }

      this.ws.onclose = () => {
        console.log("WebSocket disconnected")
        this.reconnect(onMessage, onError)
      }

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error)
        if (onError) onError(error)
      }
    } catch (error) {
      console.error("Failed to connect WebSocket:", error)
      if (onError) onError(error as Event)
    }
  }

  private reconnect(onMessage: (data: any) => void, onError?: (error: Event) => void) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`Attempting to reconnect WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

      setTimeout(() => {
        this.connect(onMessage, onError)
      }, this.reconnectDelay * this.reconnectAttempts)
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }
}

export const atmWebSocket = new ATMWebSocket()
