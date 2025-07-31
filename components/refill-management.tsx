"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  User,
  Calendar,
  DollarSign,
  MessageSquare,
  Download,
} from "lucide-react"
import { LoadingSpinner } from "@/components/loading-spinner"
import { useToast } from "@/hooks/use-toast"
import { atmApi } from "@/lib/api"
import { ExportService } from "@/lib/export-utils"

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

interface RefillManagementProps {
  atmData: any[]
  currentUser: any
}

export function RefillManagement({ atmData, currentUser }: RefillManagementProps) {
  const [refillRequests, setRefillRequests] = useState<RefillRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedATM, setSelectedATM] = useState("")
  const [requestAmount, setRequestAmount] = useState("")
  const [requestComment, setRequestComment] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const { toast } = useToast()

  useEffect(() => {
    fetchRefillRequests()
  }, [statusFilter])

  const fetchRefillRequests = async () => {
    setLoading(true)
    try {
      const filter = statusFilter === "all" ? undefined : statusFilter
      const requests = await atmApi.getRefillRequests(filter)
      setRefillRequests(requests)
    } catch (error) {
      console.error("Failed to fetch refill requests:", error)
      toast({
        title: "Error",
        description: "Failed to fetch refill requests",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRequest = async () => {
    if (!selectedATM || !requestAmount) {
      toast({
        title: "Missing Information",
        description: "Please select an ATM and enter the requested amount",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      await atmApi.createRefillRequest(selectedATM, Number.parseFloat(requestAmount), requestComment)

      toast({
        title: "Request Created",
        description: "Refill request has been submitted for approval",
      })

      setIsCreateDialogOpen(false)
      setSelectedATM("")
      setRequestAmount("")
      setRequestComment("")
      fetchRefillRequests()
    } catch (error) {
      console.error("Failed to create refill request:", error)
      toast({
        title: "Error",
        description: "Failed to create refill request",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApprovalAction = async (requestId: string, action: "approve" | "reject", comment?: string) => {
    setLoading(true)
    try {
      await atmApi.approveRefillRequest(requestId, action, comment)

      toast({
        title: `Request ${action === "approve" ? "Approved" : "Rejected"}`,
        description: `Refill request has been ${action}d`,
      })

      fetchRefillRequests()
    } catch (error) {
      console.error(`Failed to ${action} request:`, error)
      toast({
        title: "Error",
        description: `Failed to ${action} request`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "approved":
        return "bg-emerald-100 text-emerald-800 border-emerald-200"
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200"
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />
      case "approved":
        return <CheckCircle className="h-4 w-4" />
      case "rejected":
        return <XCircle className="h-4 w-4" />
      case "completed":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const canApprove = (request: RefillRequest) => {
    // Role-based approval logic based on your backend structure
    const userRole = currentUser?.role
    const requestStatus = request.status

    if (requestStatus !== "pending") return false

    // Define approval hierarchy
    const approvalRoles = ["Branch Operations Manager", "Vault Manager", "Head Office Authorization Officer"]

    return approvalRoles.includes(userRole)
  }

  const canCreateRequest = () => {
    return currentUser?.role === "ATM Operations Staff" || currentUser?.role === "Branch Operations Manager"
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Refill Request Management
          </h2>
          <p className="text-slate-600 mt-1">Manage ATM cash refill requests with approval workflows</p>
        </div>
        {canCreateRequest() && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold">
                <Plus className="h-4 w-4 mr-2" />
                New Refill Request
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-slate-900">Create Refill Request</DialogTitle>
                <DialogDescription className="text-slate-600">
                  Submit a new cash refill request for approval
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="atm-select" className="text-sm font-semibold text-slate-700">
                    Select ATM
                  </Label>
                  <Select value={selectedATM} onValueChange={setSelectedATM}>
                    <SelectTrigger className="border-slate-300 focus:border-blue-500">
                      <SelectValue placeholder="Choose an ATM" />
                    </SelectTrigger>
                    <SelectContent>
                      {atmData.map((atm) => (
                        <SelectItem key={atm.id} value={atm.id}>
                          <div className="flex items-center space-x-2">
                            <span>
                              {atm.id} - {atm.location}
                            </span>
                            <Badge
                              className={`text-xs ${
                                atm.riskLevel === "high"
                                  ? "bg-red-100 text-red-800"
                                  : atm.riskLevel === "medium"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {atm.riskLevel}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-sm font-semibold text-slate-700">
                    Requested Amount ($)
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    value={requestAmount}
                    onChange={(e) => setRequestAmount(e.target.value)}
                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter amount"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="comment" className="text-sm font-semibold text-slate-700">
                    Comment (Optional)
                  </Label>
                  <Textarea
                    id="comment"
                    value={requestComment}
                    onChange={(e) => setRequestComment(e.target.value)}
                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 resize-none"
                    placeholder="Add any additional notes..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="border-slate-300">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateRequest}
                    disabled={loading}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Creating...
                      </>
                    ) : (
                      "Create Request"
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
        <Button
          variant="outline"
          className="border-slate-300 hover:bg-slate-50 bg-transparent"
          onClick={() => {
            try {
              ExportService.exportRefillRequests(refillRequests, ExportService.generateFilename("refill-requests"))

              toast({
                title: "Export Successful",
                description: "Refill requests have been exported successfully",
              })
            } catch (error) {
              console.error("Export failed:", error)
              toast({
                title: "Export Failed",
                description: "Failed to export refill requests. Please try again.",
                variant: "destructive",
              })
            }
          }}
        >
          <Download className="h-4 w-4 mr-2" />
          Export Requests
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg bg-white">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <Label className="text-sm font-semibold text-slate-700">Filter by Status:</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 border-slate-300 focus:border-blue-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Requests</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card className="border-0 shadow-lg bg-white">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
          <CardTitle className="text-xl font-bold text-slate-900 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-slate-700" />
            Refill Requests
          </CardTitle>
          <CardDescription className="text-slate-600">
            Track and manage all cash refill requests with approval workflows
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold text-slate-700">Request ID</TableHead>
                    <TableHead className="font-semibold text-slate-700">ATM</TableHead>
                    <TableHead className="font-semibold text-slate-700">Amount</TableHead>
                    <TableHead className="font-semibold text-slate-700">Requestor</TableHead>
                    <TableHead className="font-semibold text-slate-700">Status</TableHead>
                    <TableHead className="font-semibold text-slate-700">Created</TableHead>
                    <TableHead className="font-semibold text-slate-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {refillRequests.map((request) => (
                    <TableRow key={request.request_id} className="hover:bg-slate-50 transition-colors">
                      <TableCell className="font-mono text-sm text-slate-900">
                        {request.request_id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-slate-900">{request.atm_id}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <DollarSign className="h-4 w-4 text-slate-500" />
                          <span className="font-semibold text-slate-900">
                            {request.requested_amount.toLocaleString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-slate-500" />
                          <span className="text-slate-700">{request.requestor}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${getStatusColor(request.status)} border font-medium flex items-center space-x-1 w-fit`}
                        >
                          {getStatusIcon(request.status)}
                          <span>{request.status.toUpperCase()}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-slate-500" />
                          <span className="text-slate-700">{new Date(request.created_at).toLocaleDateString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {canApprove(request) && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApprovalAction(request.request_id, "approve")}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                disabled={loading}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleApprovalAction(request.request_id, "reject")}
                                className="border-red-300 text-red-700 hover:bg-red-50"
                                disabled={loading}
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          {request.approval_history.length > 0 && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline" className="border-slate-300 bg-transparent">
                                  <MessageSquare className="h-3 w-3 mr-1" />
                                  History
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Approval History</DialogTitle>
                                  <DialogDescription>
                                    Complete approval workflow for request {request.request_id}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  {request.approval_history.map((record, index) => (
                                    <div key={index} className="p-4 border border-slate-200 rounded-lg">
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center space-x-2">
                                          <Badge className={`${getStatusColor(record.action)} border`}>
                                            {record.action.toUpperCase()}
                                          </Badge>
                                          <span className="font-semibold text-slate-900">{record.approver}</span>
                                          <span className="text-sm text-slate-500">({record.role})</span>
                                        </div>
                                        <span className="text-sm text-slate-500">
                                          {new Date(record.timestamp).toLocaleString()}
                                        </span>
                                      </div>
                                      {record.comment && (
                                        <p className="text-sm text-slate-700 bg-slate-50 p-2 rounded">
                                          {record.comment}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
