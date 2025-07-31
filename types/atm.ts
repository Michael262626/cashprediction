export interface ATMData {
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

export interface RefillRequest {
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

export interface ApprovalRecord {
  approver: string
  role: string
  action: string
  timestamp: string
  comment?: string
}
