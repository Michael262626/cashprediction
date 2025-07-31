"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash2, MapPin, DollarSign, Calendar, Settings, RefreshCw, Download } from "lucide-react"
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
  coordinates?: { lat: number; lng: number }
}

interface ATMManagementProps {
  atmData: ATMData[]
  setAtmData: (data: ATMData[]) => void
}

export function ATMManagement({ atmData, setAtmData }: ATMManagementProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingATM, setEditingATM] = useState<ATMData | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    id: "",
    location: "",
    currentCash: "",
    capacity: "",
    coordinates: { lat: "", lng: "" },
  })
  const { toast } = useToast()

  const resetForm = () => {
    setFormData({
      id: "",
      location: "",
      currentCash: "",
      capacity: "",
      coordinates: { lat: "", lng: "" },
    })
  }

  const handleAddATM = async () => {
    setLoading(true)
    try {
      const newATMData = {
        location: formData.location,
        currentCash: Number.parseInt(formData.currentCash),
        capacity: Number.parseInt(formData.capacity),
        dailyWithdrawals: [10000, 12000, 11000, 13000, 14000, 16000, 15000],
        lastRefill: new Date().toISOString().split("T")[0],
        predictedDepletion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        riskLevel: "low" as const,
        status: "online" as const,
        coordinates:
          formData.coordinates.lat && formData.coordinates.lng
            ? {
                lat: Number.parseFloat(formData.coordinates.lat),
                lng: Number.parseFloat(formData.coordinates.lng),
              }
            : undefined,
      }

      const createdATM = await atmApi.createATM(newATMData)
      setAtmData([...atmData, createdATM])

      toast({
        title: "ATM Added Successfully",
        description: `${createdATM.id} has been added to the network`,
      })

      resetForm()
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error("Failed to add ATM:", error)
      toast({
        title: "Failed to Add ATM",
        description: "There was an error adding the ATM. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditATM = async () => {
    if (!editingATM) return

    setLoading(true)
    try {
      const updatedData = {
        location: formData.location,
        currentCash: Number.parseInt(formData.currentCash),
        capacity: Number.parseInt(formData.capacity),
        coordinates:
          formData.coordinates.lat && formData.coordinates.lng
            ? {
                lat: Number.parseFloat(formData.coordinates.lat),
                lng: Number.parseFloat(formData.coordinates.lng),
              }
            : undefined,
      }

      const updatedATM = await atmApi.updateATM(editingATM.id, updatedData)
      const updatedAtmData = atmData.map((atm) => (atm.id === editingATM.id ? updatedATM : atm))

      setAtmData(updatedAtmData)

      toast({
        title: "ATM Updated Successfully",
        description: `${updatedATM.id} has been updated`,
      })

      resetForm()
      setIsEditDialogOpen(false)
      setEditingATM(null)
    } catch (error) {
      console.error("Failed to update ATM:", error)
      toast({
        title: "Failed to Update ATM",
        description: "There was an error updating the ATM. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteATM = async (id: string) => {
    setLoading(true)
    try {
      await atmApi.deleteATM(id)
      const updatedData = atmData.filter((atm) => atm.id !== id)
      setAtmData(updatedData)

      toast({
        title: "ATM Removed",
        description: `${id} has been removed from the network`,
      })
    } catch (error) {
      console.error("Failed to delete ATM:", error)
      toast({
        title: "Failed to Remove ATM",
        description: "There was an error removing the ATM. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const openEditDialog = (atm: ATMData) => {
    setEditingATM(atm)
    setFormData({
      id: atm.id,
      location: atm.location,
      currentCash: atm.currentCash.toString(),
      capacity: atm.capacity.toString(),
      coordinates: {
        lat: atm.coordinates?.lat.toString() || "",
        lng: atm.coordinates?.lng.toString() || "",
      },
    })
    setIsEditDialogOpen(true)
  }

  const handleRefill = async (id: string) => {
    setLoading(true)
    try {
      const atm = atmData.find((a) => a.id === id)
      if (!atm) return

      const refillAmount = atm.capacity - atm.currentCash
      const updatedATM = await atmApi.refillATM(id, refillAmount)

      const updatedData = atmData.map((atm) => (atm.id === id ? updatedATM : atm))
      setAtmData(updatedData)

      toast({
        title: "Refill Completed",
        description: `${id} has been refilled to capacity`,
      })
    } catch (error) {
      console.error("Failed to refill ATM:", error)
      toast({
        title: "Refill Failed",
        description: "There was an error processing the refill. Please try again.",
        variant: "destructive",
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            ATM Network Management
          </h2>
          <p className="text-slate-600 mt-1">Manage your ATM network and perform maintenance operations</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold">
              <Plus className="h-4 w-4 mr-2" />
              Add New ATM
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-900">Add New ATM</DialogTitle>
              <DialogDescription className="text-slate-600">
                Enter the details for the new ATM location
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="add-location" className="text-sm font-semibold text-slate-700">
                  Location Name
                </Label>
                <Input
                  id="add-location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="e.g., Downtown Financial District"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="add-cash" className="text-sm font-semibold text-slate-700">
                    Current Cash
                  </Label>
                  <Input
                    id="add-cash"
                    type="number"
                    value={formData.currentCash}
                    onChange={(e) => setFormData({ ...formData, currentCash: e.target.value })}
                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="50000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-capacity" className="text-sm font-semibold text-slate-700">
                    Capacity
                  </Label>
                  <Input
                    id="add-capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="100000"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="add-lat" className="text-sm font-semibold text-slate-700">
                    Latitude
                  </Label>
                  <Input
                    id="add-lat"
                    type="number"
                    step="any"
                    value={formData.coordinates.lat}
                    onChange={(e) =>
                      setFormData({ ...formData, coordinates: { ...formData.coordinates, lat: e.target.value } })
                    }
                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="40.7128"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-lng" className="text-sm font-semibold text-slate-700">
                    Longitude
                  </Label>
                  <Input
                    id="add-lng"
                    type="number"
                    step="any"
                    value={formData.coordinates.lng}
                    onChange={(e) =>
                      setFormData({ ...formData, coordinates: { ...formData.coordinates, lng: e.target.value } })
                    }
                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="-74.0060"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="border-slate-300">
                  Cancel
                </Button>
                <Button
                  onClick={handleAddATM}
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Adding...
                    </>
                  ) : (
                    "Add ATM"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <Button
          variant="outline"
          className="border-slate-300 hover:bg-slate-50 bg-transparent ml-2"
          onClick={() => {
            try {
              ExportService.exportATMReport(atmData, ExportService.generateFilename("atm-network-report"))

              toast({
                title: "Export Successful",
                description: "ATM network report has been exported successfully",
              })
            } catch (error) {
              console.error("Export failed:", error)
              toast({
                title: "Export Failed",
                description: "Failed to export ATM data. Please try again.",
                variant: "destructive",
              })
            }
          }}
        >
          <Download className="h-4 w-4 mr-2" />
          Export ATMs
        </Button>
      </div>

      {/* ATM Table */}
      <Card className="border-0 shadow-lg bg-white">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
          <CardTitle className="text-xl font-bold text-slate-900 flex items-center">
            <Settings className="h-5 w-5 mr-2 text-slate-700" />
            Network Overview
          </CardTitle>
          <CardDescription className="text-slate-600">
            Complete management interface for all ATMs with real-time status and controls
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold text-slate-700">ATM ID</TableHead>
                  <TableHead className="font-semibold text-slate-700">Location</TableHead>
                  <TableHead className="font-semibold text-slate-700">Cash Level</TableHead>
                  <TableHead className="font-semibold text-slate-700">Risk Status</TableHead>
                  <TableHead className="font-semibold text-slate-700">System Status</TableHead>
                  <TableHead className="font-semibold text-slate-700">Last Refill</TableHead>
                  <TableHead className="font-semibold text-slate-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {atmData.map((atm) => (
                  <TableRow key={atm.id} className="hover:bg-slate-50 transition-colors">
                    <TableCell className="font-bold text-slate-900">{atm.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-slate-500" />
                        <span className="text-slate-700">{atm.location}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4 text-slate-500" />
                          <span className="font-semibold text-slate-900">${atm.currentCash.toLocaleString()}</span>
                          <span className="text-slate-500 text-sm">/ ${atm.capacity.toLocaleString()}</span>
                        </div>
                        <div className="w-24 bg-slate-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              ((atm.currentCash / atm.capacity) * 100) < 20
                                ? "bg-red-500"
                                : (atm.currentCash / atm.capacity) * 100 < 40
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                            }`}
                            style={{ width: `${(atm.currentCash / atm.capacity) * 100}%` }}
                          />
                        </div>
                        <div className="text-xs text-slate-500">
                          {((atm.currentCash / atm.capacity) * 100).toFixed(1)}% capacity
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getRiskColor(atm.riskLevel)} border font-medium`}>
                        {atm.riskLevel.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(atm.status)} border font-medium`}>
                        {atm.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-slate-500" />
                        <span className="text-slate-700">{new Date(atm.lastRefill).toLocaleDateString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRefill(atm.id)}
                          disabled={loading}
                          className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Refill
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(atm)}
                          className="border-blue-300 text-blue-700 hover:bg-blue-50"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteATM(atm.id)}
                          disabled={loading}
                          className="border-red-300 text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">Edit ATM</DialogTitle>
            <DialogDescription className="text-slate-600">Update the ATM information and settings</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-location" className="text-sm font-semibold text-slate-700">
                Location Name
              </Label>
              <Input
                id="edit-location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-cash" className="text-sm font-semibold text-slate-700">
                  Current Cash
                </Label>
                <Input
                  id="edit-cash"
                  type="number"
                  value={formData.currentCash}
                  onChange={(e) => setFormData({ ...formData, currentCash: e.target.value })}
                  className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-capacity" className="text-sm font-semibold text-slate-700">
                  Capacity
                </Label>
                <Input
                  id="edit-capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-lat" className="text-sm font-semibold text-slate-700">
                  Latitude
                </Label>
                <Input
                  id="edit-lat"
                  type="number"
                  step="any"
                  value={formData.coordinates.lat}
                  onChange={(e) =>
                    setFormData({ ...formData, coordinates: { ...formData.coordinates, lat: e.target.value } })
                  }
                  className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lng" className="text-sm font-semibold text-slate-700">
                  Longitude
                </Label>
                <Input
                  id="edit-lng"
                  type="number"
                  step="any"
                  value={formData.coordinates.lng}
                  onChange={(e) =>
                    setFormData({ ...formData, coordinates: { ...formData.coordinates, lng: e.target.value } })
                  }
                  className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-slate-300">
                Cancel
              </Button>
              <Button
                onClick={handleEditATM}
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
