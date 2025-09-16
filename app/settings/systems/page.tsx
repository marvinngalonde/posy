"use client"

import React, { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import {
  Building2,
  CreditCard,
  Globe,
  MapPin,
  Phone,
  Mail,
  DollarSign,
  Settings,
  Upload
} from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"

// Import organization API
import {
  useGetOrganizationQuery,
  useUpdateOrganizationMutation,
  useUpdateOrganizationPartialMutation
} from "@/lib/slices/organizationApi"

// Import system settings API
import {
  useGetSystemSettingsQuery,
  useUpdateSystemSettingsMutation
} from "@/lib/slices/settingsApi"

import { Organization } from "@/lib/types/prisma"

/**
 * Systems Settings Page
 * Combined system and organization settings management
 */
export default function SystemsSettingsPage() {
  const [isLoading, setIsLoading] = useState(false)

  // Organization data
  const { data: organization, isLoading: orgLoading, error: orgError } = useGetOrganizationQuery()
  const [updateOrganization] = useUpdateOrganizationMutation()
  const [updateOrganizationPartial] = useUpdateOrganizationPartialMutation()

  // System settings data
  const { data: systemSettings, isLoading: systemLoading, refetch: refetchSystem } = useGetSystemSettingsQuery()
  const [updateSystemSettings, { isLoading: isUpdatingSystem }] = useUpdateSystemSettingsMutation()

  // Organization form
  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<Organization>({
    defaultValues: organization || {}
  })

  // System settings state
  const [systemTitle, setSystemTitle] = useState("")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [orgLogoFile, setOrgLogoFile] = useState<File | null>(null)
  const [orgPreviewUrl, setOrgPreviewUrl] = useState<string | null>(null)

  // Reset organization form when data loads
  React.useEffect(() => {
    if (organization) {
      reset(organization)
      if (organization.logo) {
        setOrgPreviewUrl(organization.logo)
      }
    }
  }, [organization, reset])

  // Load system settings
  useEffect(() => {
    if (systemSettings) {
      setSystemTitle(systemSettings.system_title || "")
      if (systemSettings.system_logo) {
        setPreviewUrl(systemSettings.system_logo)
      }
    }
  }, [systemSettings])

  /**
   * Handle organization form submission
   */
  const onSubmitOrganization = async (data: Organization) => {
    try {
      setIsLoading(true)

      // Handle logo upload if file is selected
      let logoUrl = data.logo
      if (orgLogoFile) {
        const formData = new FormData()
        formData.append('logo', orgLogoFile)

        // Upload logo to server (we'll need to create this endpoint)
        const uploadResponse = await fetch('/api/v2/upload/logo', {
          method: 'POST',
          body: formData,
        })

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json()
          logoUrl = uploadResult.url
        }
      }

      const updateData = { ...data, logo: logoUrl, updated_at: new Date() }

      if (data.id) {
        await updateOrganizationPartial({
          data: updateData
        }).unwrap()
      } else {
        await updateOrganization(updateData).unwrap()
      }

      toast.success("Organization settings updated successfully!")
    } catch (error: any) {
      console.error("Organization update error:", error)
      toast.error(error?.data?.message || "Failed to update organization settings")
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Handle system settings submission
   */
  const handleSystemSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData()
    formData.append('system_title', systemTitle)
    if (logoFile) {
      formData.append('logo', logoFile)
    }

    try {
      await updateSystemSettings(formData).unwrap()
      toast.success("System settings updated successfully!")
      refetchSystem()
    } catch (error) {
      toast.error("Failed to update system settings.")
    }
  }

  /**
   * Handle logo file selection for system
   */
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0]
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  /**
   * Handle organization logo file selection
   */
  const handleOrgLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0]
      setOrgLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setOrgPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  if (orgLoading || systemLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    )
  }

  if (orgError) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-red-500">
                Error loading settings. Please try again later.
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Systems Settings</h1>
          <p className="text-muted-foreground">
            Manage system configuration and organization details
          </p>
        </div>

        <Tabs defaultValue="system" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              System Settings
            </TabsTrigger>
            <TabsTrigger value="organization" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Organization Settings
            </TabsTrigger>
          </TabsList>

          {/* System Settings Tab */}
          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  System Configuration
                </CardTitle>
                <CardDescription>
                  Configure system-wide settings like title and logo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSystemSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="system_title">System Title *</Label>
                    <Input
                      id="system_title"
                      value={systemTitle}
                      onChange={e => setSystemTitle(e.target.value)}
                      placeholder="Enter system title"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="logo">System Logo</Label>
                    <Input
                      id="logo"
                      type="file"
                      onChange={handleLogoChange}
                      accept="image/*"
                      className="cursor-pointer"
                    />
                    <p className="text-sm text-muted-foreground">
                      Upload a logo for your system (PNG, JPG, or GIF)
                    </p>
                  </div>

                  {previewUrl && (
                    <div className="space-y-2">
                      <Label>Logo Preview</Label>
                      <div className="border rounded-lg p-4 bg-muted/50">
                        <img
                          src={previewUrl}
                          alt="Logo Preview"
                          className="h-20 w-auto object-contain"
                        />
                      </div>
                    </div>
                  )}

                  <Button type="submit" disabled={isUpdatingSystem} className="w-full sm:w-auto">
                    {isUpdatingSystem && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Upload className="mr-2 h-4 w-4" />
                    Update System Settings
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Organization Settings Tab */}
          <TabsContent value="organization" className="space-y-6">
            <form onSubmit={handleSubmit(onSubmitOrganization)}>
              <Tabs defaultValue="general" className="space-y-6">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="contact">Contact</TabsTrigger>
                  <TabsTrigger value="banking">Banking</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                  <TabsTrigger value="preferences">Preferences</TabsTrigger>
                </TabsList>

                {/* General Information */}
                <TabsContent value="general" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Company Information
                      </CardTitle>
                      <CardDescription>
                        Basic information about your organization
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Company Name *</Label>
                          <Input
                            id="name"
                            {...register("name", { required: "Company name is required" })}
                            placeholder="Your Company Name"
                          />
                          {errors.name && (
                            <p className="text-sm text-red-500">{errors.name.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="tax_number">Tax Number</Label>
                          <Input
                            id="tax_number"
                            {...register("tax_number")}
                            placeholder="Tax identification number"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="website">Website</Label>
                          <Input
                            id="website"
                            {...register("website")}
                            placeholder="https://www.example.com"
                            type="url"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="org_logo">Organization Logo</Label>
                          <Input
                            id="org_logo"
                            type="file"
                            onChange={handleOrgLogoChange}
                            accept="image/*"
                            className="cursor-pointer"
                          />
                          <p className="text-sm text-muted-foreground">
                            Upload a logo for your organization (PNG, JPG, or GIF)
                          </p>
                          {orgPreviewUrl && (
                            <div className="mt-2">
                              <div className="border rounded-lg p-2 bg-muted/50 inline-block">
                                <img
                                  src={orgPreviewUrl}
                                  alt="Organization Logo Preview"
                                  className="h-16 w-auto object-contain"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="fax">Fax Number</Label>
                          <Input
                            id="fax"
                            {...register("fax")}
                            placeholder="+1 (555) 123-4568"
                            type="tel"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="registration_number">Registration Number</Label>
                          <Input
                            id="registration_number"
                            {...register("registration_number")}
                            placeholder="Company registration number"
                          />
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Address Information
                        </h4>

                        <div className="space-y-2">
                          <Label htmlFor="address">Street Address</Label>
                          <Textarea
                            id="address"
                            {...register("address")}
                            placeholder="Street address"
                            rows={2}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input
                              id="city"
                              {...register("city")}
                              placeholder="City"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="state">State/Province</Label>
                            <Input
                              id="state"
                              {...register("state")}
                              placeholder="State or Province"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="country">Country</Label>
                            <Input
                              id="country"
                              {...register("country")}
                              placeholder="Country"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="postal_code">Postal Code</Label>
                          <Input
                            id="postal_code"
                            {...register("postal_code")}
                            placeholder="Postal/ZIP code"
                            className="max-w-xs"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Contact Details */}
                <TabsContent value="contact" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Phone className="h-5 w-5" />
                        Contact Information
                      </CardTitle>
                      <CardDescription>
                        How customers and partners can reach you
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <Input
                            id="email"
                            {...register("email")}
                            placeholder="contact@company.com"
                            type="email"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            {...register("phone")}
                            placeholder="+1 (555) 123-4567"
                            type="tel"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Banking Information */}
                <TabsContent value="banking" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Banking Details
                      </CardTitle>
                      <CardDescription>
                        Banking information for invoices and payments
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="bank_name">Bank Name</Label>
                          <Input
                            id="bank_name"
                            {...register("bank_name")}
                            placeholder="Bank name"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="bank_account">Account Number</Label>
                          <Input
                            id="bank_account"
                            {...register("bank_account")}
                            placeholder="Account number"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="bank_branch">Branch/Routing</Label>
                          <Input
                            id="bank_branch"
                            {...register("bank_branch")}
                            placeholder="Branch or routing number"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="swift_code">SWIFT Code</Label>
                          <Input
                            id="swift_code"
                            {...register("swift_code")}
                            placeholder="SWIFT/BIC code"
                          />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="iban">IBAN</Label>
                          <Input
                            id="iban"
                            {...register("iban")}
                            placeholder="International Bank Account Number"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Documents/PDF Settings */}
                <TabsContent value="documents" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Document Settings
                      </CardTitle>
                      <CardDescription>
                        Configure document prefixes, footers, and terms for invoices and quotations
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="invoice_prefix">Invoice Prefix</Label>
                          <Input
                            id="invoice_prefix"
                            {...register("invoice_prefix")}
                            placeholder="INV"
                            defaultValue="INV"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="quotation_prefix">Quotation Prefix</Label>
                          <Input
                            id="quotation_prefix"
                            {...register("quotation_prefix")}
                            placeholder="QUO"
                            defaultValue="QUO"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="currency_symbol">Currency Symbol</Label>
                          <Input
                            id="currency_symbol"
                            {...register("currency_symbol")}
                            placeholder="$"
                            defaultValue="$"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="date_format">Date Format</Label>
                          <Input
                            id="date_format"
                            {...register("date_format")}
                            placeholder="MM/DD/YYYY"
                            defaultValue="MM/DD/YYYY"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="invoice_footer">Invoice Footer</Label>
                        <Textarea
                          id="invoice_footer"
                          {...register("invoice_footer")}
                          placeholder="Thank you for your business!"
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="quotation_footer">Quotation Footer</Label>
                        <Textarea
                          id="quotation_footer"
                          {...register("quotation_footer")}
                          placeholder="We look forward to working with you!"
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="terms_conditions">Terms & Conditions</Label>
                        <Textarea
                          id="terms_conditions"
                          {...register("terms_conditions")}
                          placeholder="Payment due within 30 days..."
                          rows={4}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="payment_terms">Payment Terms</Label>
                        <Textarea
                          id="payment_terms"
                          {...register("payment_terms")}
                          placeholder="Net 30 days from invoice date..."
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Preferences */}
                <TabsContent value="preferences" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        System Preferences
                      </CardTitle>
                      <CardDescription>
                        Regional and system preferences
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="currency">Default Currency</Label>
                          <Input
                            id="currency"
                            {...register("currency")}
                            placeholder="USD"
                            defaultValue="USD"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="timezone">Timezone</Label>
                          <Input
                            id="timezone"
                            {...register("timezone")}
                            placeholder="UTC"
                            defaultValue="UTC"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isLoading || !isDirty}
                    className="w-full sm:w-auto"
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Building2 className="mr-2 h-4 w-4" />
                    Update Organization Settings
                  </Button>
                </div>
              </Tabs>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}