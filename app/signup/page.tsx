"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSignupMutation } from "@/lib/slices/authSlice"
import Ballpit from '@/components/ui/ballpit'

export default function SignupPage() {
  const router = useRouter()
  const [signup, { isLoading, error }] = useSignupMutation()

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const [showSuccess, setShowSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSignup = async () => {
    if (formData.password !== formData.confirmPassword) {
      // Validation handled in UI
      return
    }

    try {
      await signup({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      }).unwrap()
      
      // Show success message
      setShowSuccess(true)
      
      // Redirect to login after a brief delay
      setTimeout(() => {
        router.push("/")
      }, 2000)
      
    } catch (error) {
      console.error("Signup error:", error)
      // Error is automatically handled by RTK Query and available in the error state
    }
  }

  return (
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

      <Card className="w-full max-w-md z-10 relative backdrop-blur-sm bg-white/80 border border-gray-300">
        <CardHeader className="text-center">
          <div className="w-16 h-16  rounded-lg flex items-center justify-center mx-auto mb-4">
            <img src="/PosyLogo.png" alt="POSy Logo" width={64} height={64} className="w-full h-full object-cover" />
          </div>
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <p className="text-gray-600">Sign up for POSy</p>
        </CardHeader>
        <CardContent>
          {showSuccess ? (
            <div className="text-center space-y-4">
              <Alert>
                <AlertDescription className="text-green-700">
                  Account created successfully! Redirecting to login...
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
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
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    required
                    className="mt-1"
                  />
                </div>

                {formData.password !== formData.confirmPassword && formData.confirmPassword && (
                  <Alert variant="destructive">
                    <AlertDescription>Passwords do not match</AlertDescription>
                  </Alert>
                )}

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {/* RTK Query error handling */}
                      {'data' in error && error.data 
                        ? (error.data as any).error || (error.data as any).message || 'Signup failed'
                        : 'message' in error 
                        ? error.message 
                        : 'Signup failed'}
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  type="button"
                  className="w-full bg-[#1a237e] hover:bg-purple-700"
                  disabled={isLoading || formData.password !== formData.confirmPassword || !formData.name || !formData.email || !formData.password}
                  onClick={handleSignup}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
                </Button>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{" "}
                  <Link href="/" className="text-purple-600 hover:text-purple-700 font-medium">
                    Sign in
                  </Link>
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

    </div>
  )
}