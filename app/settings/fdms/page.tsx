"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Settings, Shield, Zap, FileText } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  useGetFDMSConfigQuery,
  useCreateFDMSConfigMutation,
  useToggleFDMSModeMutation,
  useGetFDMSStatusQuery
} from "@/lib/slices/fdmsApi"

interface BranchAddress {
  street: string
  city: string
  province: string
  country: string
}

export default function FDMSSettingsPage() {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    taxpayerTIN: '',
    vatRegistrationNo: '',
    businessName: '',
    businessType: '',
    branchName: '',
    branchAddress: {
      street: '',
      city: '',
      province: '',
      country: 'Zimbabwe'
    } as BranchAddress,
    testEnvironment: true,
    isFDMSEnabled: false
  })

  // RTK Query hooks
  const { data: configData, isLoading: configLoading, error: configError } = useGetFDMSConfigQuery()
  const { data: statusData, isLoading: statusLoading } = useGetFDMSStatusQuery()
  const [createConfig, { isLoading: isCreating }] = useCreateFDMSConfigMutation()
  const [toggleFDMS, { isLoading: isToggling }] = useToggleFDMSModeMutation()

  // Load existing configuration
  useEffect(() => {
    if (configData?.data) {
      const config = configData.data
      setFormData({
        taxpayerTIN: config.taxpayerTIN,
        vatRegistrationNo: config.vatRegistrationNo || '',
        businessName: config.businessName,
        businessType: config.businessType,
        branchName: config.branchName,
        branchAddress: config.branchAddress,
        testEnvironment: config.testEnvironment,
        isFDMSEnabled: config.isFDMSEnabled
      })
    }
  }, [configData])

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('branchAddress.')) {
      const addressField = field.replace('branchAddress.', '')
      setFormData(prev => ({
        ...prev,
        branchAddress: {
          ...prev.branchAddress,
          [addressField]: value
        }
      }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  const handleSaveConfiguration = async () => {
    try {
      const result = await createConfig(formData).unwrap()
      console.log('Configuration saved:', result)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to save configuration:', error)
    }
  }

  const handleToggleFDMS = async () => {
    try {
      const newStatus = !formData.isFDMSEnabled
      await toggleFDMS({ isFDMSEnabled: newStatus }).unwrap()
      setFormData(prev => ({ ...prev, isFDMSEnabled: newStatus }))
    } catch (error) {
      console.error('Failed to toggle FDMS:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'warning': return 'bg-yellow-500'
      case 'error': return 'bg-red-500'
      case 'offline': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />
      case 'error': return <AlertCircle className="h-4 w-4" />
      default: return <Settings className="h-4 w-4" />
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ZIMRA FDMS Settings</h1>
          <p className="text-gray-600">Configure ZIMRA Fiscalisation Data Management System</p>
        </div>

        {statusData?.data && (
          <div className="flex items-center space-x-2">
            <Badge
              variant="secondary"
              className={`${getStatusColor(statusData.data.status)} text-white`}
            >
              {getStatusIcon(statusData.data.status)}
              <span className="ml-2">{statusData.data.status.toUpperCase()}</span>
            </Badge>
          </div>
        )}
      </div>

      <Tabs defaultValue="configuration" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="status">Status & Monitoring</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="configuration" className="space-y-6">
          {/* FDMS Mode Toggle */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>FDMS Mode</span>
              </CardTitle>
              <CardDescription>
                Enable or disable ZIMRA FDMS integration for fiscal compliance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    FDMS Integration: {formData.isFDMSEnabled ? 'Enabled' : 'Disabled'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formData.isFDMSEnabled
                      ? 'All sales will be submitted to ZIMRA for fiscal compliance'
                      : 'Sales will generate simple receipts without ZIMRA submission'
                    }
                  </p>
                </div>
                <Switch
                  checked={formData.isFDMSEnabled}
                  onCheckedChange={handleToggleFDMS}
                  disabled={isToggling || !configData?.data}
                />
              </div>

              {!configData?.data && (
                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Configure ZIMRA settings below before enabling FDMS mode.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Configuration Form */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>ZIMRA Configuration</span>
                </CardTitle>
                <CardDescription>
                  Configure your business details for ZIMRA fiscal compliance
                </CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() => setIsEditing(!isEditing)}
                disabled={isCreating}
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="taxpayerTIN">Taxpayer TIN *</Label>
                  <Input
                    id="taxpayerTIN"
                    value={formData.taxpayerTIN}
                    onChange={(e) => handleInputChange('taxpayerTIN', e.target.value)}
                    disabled={!isEditing}
                    placeholder="1234567890"
                    maxLength={10}
                  />
                  <p className="text-xs text-gray-500">Must be exactly 10 digits</p>
                </div>

                <div>
                  <Label htmlFor="vatRegistrationNo">VAT Registration No.</Label>
                  <Input
                    id="vatRegistrationNo"
                    value={formData.vatRegistrationNo}
                    onChange={(e) => handleInputChange('vatRegistrationNo', e.target.value)}
                    disabled={!isEditing}
                    placeholder="123456789"
                    maxLength={9}
                  />
                </div>

                <div>
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    value={formData.businessName}
                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Your Business Name"
                  />
                </div>

                <div>
                  <Label htmlFor="businessType">Business Type *</Label>
                  <Input
                    id="businessType"
                    value={formData.businessType}
                    onChange={(e) => handleInputChange('businessType', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Retail, Wholesale, Services, etc."
                  />
                </div>

                <div>
                  <Label htmlFor="branchName">Branch Name *</Label>
                  <Input
                    id="branchName"
                    value={formData.branchName}
                    onChange={(e) => handleInputChange('branchName', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Main Branch"
                  />
                </div>

                <div>
                  <Label htmlFor="testEnvironment">Environment</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <Switch
                      id="testEnvironment"
                      checked={formData.testEnvironment}
                      onCheckedChange={(checked) => handleInputChange('testEnvironment', checked.toString())}
                      disabled={!isEditing}
                    />
                    <Label htmlFor="testEnvironment">
                      {formData.testEnvironment ? 'Test Environment' : 'Production Environment'}
                    </Label>
                  </div>
                </div>
              </div>

              {/* Branch Address */}
              <div>
                <Label>Branch Address *</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div>
                    <Input
                      value={formData.branchAddress.street}
                      onChange={(e) => handleInputChange('branchAddress.street', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Street Address"
                    />
                  </div>
                  <div>
                    <Input
                      value={formData.branchAddress.city}
                      onChange={(e) => handleInputChange('branchAddress.city', e.target.value)}
                      disabled={!isEditing}
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <Input
                      value={formData.branchAddress.province}
                      onChange={(e) => handleInputChange('branchAddress.province', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Province"
                    />
                  </div>
                  <div>
                    <Input
                      value={formData.branchAddress.country}
                      onChange={(e) => handleInputChange('branchAddress.country', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Country"
                    />
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveConfiguration}
                    disabled={isCreating}
                  >
                    {isCreating ? 'Saving...' : 'Save Configuration'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-6">
          {statusData?.data && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{statusData.data.statistics.totalTransactions}</div>
                  <p className="text-sm text-gray-600">Total Transactions</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{statusData.data.statistics.todayTransactions}</div>
                  <p className="text-sm text-gray-600">Today's Transactions</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-red-600">{statusData.data.statistics.failedTransactions}</div>
                  <p className="text-sm text-gray-600">Failed Transactions</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-orange-600">{statusData.data.statistics.offlineQueueSize}</div>
                  <p className="text-sm text-gray-600">Offline Queue</p>
                </CardContent>
              </Card>
            </div>
          )}

          {statusData?.data?.device && (
            <Card>
              <CardHeader>
                <CardTitle>Fiscal Device Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium">Device ID</p>
                    <p className="text-sm text-gray-600">{statusData.data.device.deviceId}</p>
                  </div>
                  <div>
                    <p className="font-medium">Serial Number</p>
                    <p className="text-sm text-gray-600">{statusData.data.device.deviceSerialNo}</p>
                  </div>
                  <div>
                    <p className="font-medium">Operating Mode</p>
                    <Badge variant="outline">{statusData.data.device.operatingMode}</Badge>
                  </div>
                  <div>
                    <p className="font-medium">Status</p>
                    <Badge variant="outline">{statusData.data.device.status}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Recent Fiscal Transactions</span>
              </CardTitle>
              <CardDescription>
                View and monitor fiscal transactions submitted to ZIMRA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Transaction history will be displayed here...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </DashboardLayout>
  )
}