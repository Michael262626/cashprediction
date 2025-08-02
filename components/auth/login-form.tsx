"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Lock, User, Building, Mail } from "lucide-react"
import { LoadingSpinner } from "@/components/loading-spinner"
import { useToast } from "@/hooks/use-toast"
import { atmApi } from "@/lib/api"

interface AuthFormProps {
  onLogin: (user: any) => void
}

export function AuthForm({ onLogin }: AuthFormProps) {
  const [isRegister, setIsRegister] = useState(false)
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const userRoles = [
    { value: "ATM Operations Staff", label: "ATM Operations Staff" },
    { value: "Branch Operations Manager", label: "Branch Operations Manager" },
    { value: "Vault Manager", label: "Vault Manager" },
    { value: "Head Office Authorization Officer", label: "Head Office Authorization Officer" },
  ]
  const [role, setRole] = useState(userRoles[0].value)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Missing fields:", email, password, username, role)


    if ((isRegister && (!username || !email || !password)) || (!isRegister && (!email || !password))) {
      toast({
        title: "Missing Information",
        description: "Please fill all required fields",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      if (isRegister) {
        await atmApi.register(username, email, password, role)
        toast({
          title: "Registration Successful",
          description: "You can now log in with your credentials",
        })
        setIsRegister(false)
      } else {
        const user = await atmApi.login(email, password)
        console.log(user.email)
        toast({
          title: "Login Successful",
          description: `Welcome back, ${user.role}`,
        })
        onLogin(user)
      }
    } catch (error) {
      toast({
        title: isRegister ? "Registration Failed" : "Login Failed",
        description: "Please check your credentials and try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mx-auto">
            <Building className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            CASHVIEW
          </h1>
          <p className="text-slate-600">Secure access to your banking operations</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">{isRegister ? "Register" : "Sign In"}</CardTitle>
            <CardDescription className="text-center">
              {isRegister ? "Fill in your details to create an account" : "Enter your email to log in"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              {isRegister && (
                <div>
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter username"
                      className="pl-10"
                      disabled={loading}
                    />
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email"
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>

              {isRegister && (
                <div>
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full border rounded-lg p-2"
                    disabled={loading}
                  >
                    {userRoles.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
              )}

              <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white" disabled={loading}>
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    {isRegister ? "Registering..." : "Signing In..."}
                  </>
                ) : (
                  isRegister ? "Register" : "Sign In"
                )}
              </Button>
            </form>

            <p className="text-center text-sm mt-4">
              {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                type="button"
                onClick={() => setIsRegister(!isRegister)}
                className="text-blue-600 hover:underline"
              >
                {isRegister ? "Sign In" : "Register"}
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
