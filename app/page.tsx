"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader} from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {  useAppSelector } from "@/lib/hooks"
import { useLoginMutation } from "@/lib/slices/authSlice"
// import { setDatabaseConfig } from "@/lib/slices/databaseSlice"
// import { DatabaseSetup } from "@/components/database-setup"
import Ballpit from '@/components/ui/ballpit'

export default function LoginPage() {
  const router = useRouter()
  // const dispatch = useAppDispatch()
  const { isAuthenticated } = useAppSelector((state) => state.auth)
  // const { isConfigured } = useAppSelector((state) => state.database)
  const [login, { isLoading, error }] = useLoginMutation()
  // const [isCheckingConfig, setIsCheckingConfig] = useState(true) // New loading state

  // useEffect(() => {
  //   // Check if database is already configured
  //   const savedConfig = localStorage.getItem("dbConfig")
  //   if (savedConfig) {
  //     try {
  //       const config = JSON.parse(savedConfig)
  //       dispatch(setDatabaseConfig(config))
  //     } catch (error) {
  //       console.error("Failed to parse saved database config:", error)
  //     }
  //   }
  //   setIsCheckingConfig(false) // Mark check as complete
  // }, [dispatch])

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard")
    }
  }, [isAuthenticated, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login(formData).unwrap()
      router.push("/dashboard")
    } catch (error) {
      console.log("Login error:", error)
      // Error is automatically handled by RTK Query and available in the error state
    }
  }

  // // Show loading state while checking configuration
  // if (isCheckingConfig) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center bg-gray-100">
  //       <Loader2 className="h-8 w-8 animate-spin" />
  //     </div>
  //   )
  // }

//   return !isConfigured ? (
//   <DatabaseSetup />
// ) : (

return(
  <div className="min-h-screen relative flex items-center justify-center bg-gray-100 overflow-hidden">

    {/* Ballpit Background */}
    <div className="absolute inset-0 z-0">
      <Ballpit
        count={70}
        gravity={0.5}
        friction={0.9975}
        wallBounce={0.95}
        followCursor={false}
        minSize={0.5}
        maxSize={1}
        colors={[0x7c3aed, 0x1e3a8a, 0x9ca3af, 0xffffff]}

        ambientColor={0xffffff}
        ambientIntensity={0.8}
        lightIntensity={180}
        maxVelocity={0.18}
        maxX={5}
        maxY={5}
        maxZ={2}
      />
    </div>

    {/* Login Card */}
    <Card className="w-full max-w-md z-10 relative backdrop-blur-sm bg-white/80 border border-gray-300">
      <CardHeader className="text-center">
        <div className="w-16 h-16  rounded-lg flex items-center justify-center mx-auto mb-4">
          <img src="/PosyLogo.png" alt="POSy Logo" width={64} height={64} className="w-full h-full object-cover" />
        </div>
        {/* <CardTitle className="text-2xl">Posy</CardTitle> */}
        <p className="text-gray-600">Sign in to your account</p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Email</label>
            <Input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Password</label>
            <Input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              className="mt-1"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                {/* RTK Query error can be a string or an object */}
                {'data' in error && error.data 
                  ? (error.data as any).error || (error.data as any).message || 'Login failed'
                  : 'message' in error 
                  ? error.message 
                  : 'Login failed'}
              </AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full bg-[#1a237e] hover:bg-[#23308c]" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign In
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-purple-600 hover:text-purple-700 font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>

  </div>
)

}