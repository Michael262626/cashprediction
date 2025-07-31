"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Lock, User, Building } from "lucide-react"
import { LoadingSpinner } from "@/components/loading-spinner"
import { useToast } from "@/hooks/use-toast"
import { atmApi } from "@/lib/api"

interface LoginFormProps {
  onLogin: (user: any) => void
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const userRoles = [
    { value: "atm_ops", label: "ATM Operations Staff", description: "Manage daily ATM operations" },
    { value: "branch_mgr", label: "Branch Operations Manager", description: "Oversee branch operations" },
    { value: "vault_mgr", label: "Vault Manager", description: "Manage cash vault operations" },
    { value: "hoao", label: "Head Office Authorization Officer", description: "Authorize high-value transactions" },
  ]

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter both username and password",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const user = await atmApi.login(username, password)

      toast({
        title: "Login Successful",
        description: `Welcome back, ${user.role}`,
      })

      onLogin(user)
    } catch (error) {
      console.error("Login failed:", error)
      toast({
        title: "Login Failed",
        description: "Invalid credentials. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = (role: string) => {
    setUsername(role)
    setPassword("demo123") // Demo password
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mx-auto">
            <Building className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            ATM Cash Prediction
          </h1>
          <p className="text-slate-600">Secure access to your banking operations</p>
        </div>

        {/* Login Form */}
        <Card className="border-0 shadow-xl bg-white">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center text-slate-900">Sign In</CardTitle>
            <CardDescription className="text-center text-slate-600">
              Enter your credentials to access the system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-semibold text-slate-700">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter your username"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter your password"
                    disabled={loading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            {/* Demo Accounts */}
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-500">Demo Accounts</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {userRoles.map((role) => (
                  <Button
                    key={role.value}
                    variant="outline"
                    size="sm"
                    onClick={() => handleDemoLogin(role.value)}
                    className="justify-start text-left border-slate-200 hover:bg-slate-50"
                    disabled={loading}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-medium text-slate-900">{role.label}</span>
                      <span className="text-xs text-slate-500">{role.description}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Security Notice */}
            <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-700">
                <p className="font-medium">Security Notice</p>
                <p>
                  This system uses role-based access control. Your permissions are determined by your assigned role.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
