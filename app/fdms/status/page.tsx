"use client"

import { useState } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Wifi,
  WifiOff,
  Server,
  RefreshCw,
  Settings,
  Database,
  Shield,
  Activity,
  TrendingUp
} from "lucide-react"
import {
  useGetFDMSStatusQuery,
  usePerformFDMSActionMutation
} from "@/lib/slices/fdmsApi"

export default function FDMSStatusPage() {
  const [isPerformingAction, setIsPerformingAction] = useState(false)

  // RTK Query hooks
  const { data: statusData, isLoading, error, refetch } = useGetFDMSStatusQuery()
  const [performAction] = usePerformFDMSActionMutation()

  const status = statusData?.data

  const handleAction = async (action: string) => {
    setIsPerformingAction(true)
    try {
      await performAction({ action }).unwrap()
      refetch()
    } catch (error) {
      console.error(`Failed to perform action ${action}:`, error)
    } finally {
      setIsPerformingAction(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'warning': return 'bg-yellow-500'
      case 'error': return 'bg-red-500'
      case 'offline': return 'bg-orange-500'
      case 'configured': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />
      case 'error': return <AlertCircle className="h-4 w-4" />
      case 'warning': return <AlertCircle className="h-4 w-4" />
      case 'offline': return <WifiOff className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin mr-3" />
            <span className="text-lg">Loading FDMS status...</span>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !status) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load FDMS status. Please check your configuration.
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">FDMS Status & Monitoring</h1>
          <p className="text-gray-600">Monitor ZIMRA FDMS system health and performance</p>
        </div>

        <div className="flex items-center space-x-2">
          <Badge
            variant="secondary"
            className={`${getStatusColor(status.status)} text-white`}
          >
            {getStatusIcon(status.status)}
            <span className="ml-2">{status.status.toUpperCase()}</span>
          </Badge>
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Status Message */}
      {status.message && (
        <Alert className={
          status.status === 'error' ? 'border-red-200 bg-red-50' :
          status.status === 'warning' ? 'border-yellow-200 bg-yellow-50' :
          'border-blue-200 bg-blue-50'
        }>
          {getStatusIcon(status.status)}
          <AlertDescription>{status.message}</AlertDescription>
        </Alert>
      )}

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className={`h-6 w-6 ${status.fdmsEnabled ? 'text-green-500' : 'text-gray-400'}`} />
              <div>
                <div className="text-sm font-medium">FDMS Mode</div>
                <div className="text-lg font-bold">
                  {status.fdmsEnabled ? 'Enabled' : 'Disabled'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Settings className={`h-6 w-6 ${status.configured ? 'text-green-500' : 'text-red-500'}`} />
              <div>
                <div className="text-sm font-medium">Configuration</div>
                <div className="text-lg font-bold">
                  {status.configured ? 'Complete' : 'Incomplete'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              {status.device ? (
                <Wifi className="h-6 w-6 text-green-500" />
              ) : (
                <WifiOff className="h-6 w-6 text-red-500" />
              )}
              <div>
                <div className="text-sm font-medium">Fiscal Device</div>
                <div className="text-lg font-bold">
                  {status.device ? 'Active' : 'Inactive'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-6 w-6 text-blue-500" />
              <div>
                <div className="text-sm font-medium">Today's Transactions</div>
                <div className="text-lg font-bold">
                  {status.statistics.todayTransactions}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Details */}
      {status.config && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>ZIMRA Configuration</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-medium">Taxpayer TIN</p>
                <p className="text-sm text-gray-600">{status.config.taxpayerTIN}</p>
              </div>
              <div>
                <p className="font-medium">Business Name</p>
                <p className="text-sm text-gray-600">{status.config.businessName}</p>
              </div>
              <div>
                <p className="font-medium">Business Type</p>
                <p className="text-sm text-gray-600">{status.config.businessType}</p>
              </div>
              <div>
                <p className="font-medium">Environment</p>
                <Badge variant="outline">
                  {status.config.testEnvironment ? 'Test' : 'Production'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fiscal Device Information */}
      {status.device && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Server className="h-5 w-5" />
              <span>Fiscal Device</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="font-medium">Device ID</p>
                <p className="text-sm text-gray-600 font-mono">{status.device.deviceId}</p>
              </div>
              <div>
                <p className="font-medium">Serial Number</p>
                <p className="text-sm text-gray-600">{status.device.deviceSerialNo}</p>
              </div>
              <div>
                <p className="font-medium">Operating Mode</p>
                <Badge variant="outline" className={
                  status.device.operatingMode === 'Online' ? 'text-green-600' : 'text-orange-600'
                }>
                  {status.device.operatingMode}
                </Badge>
              </div>
              <div>
                <p className="font-medium">Global Receipt Counter</p>
                <p className="text-sm text-gray-600">{status.device.globalReceiptCounter}</p>
              </div>
              <div>
                <p className="font-medium">Daily Counter</p>
                <p className="text-sm text-gray-600">{status.device.dailyReceiptCounter}</p>
              </div>
              <div>
                <p className="font-medium">Status</p>
                <Badge variant="outline" className={
                  status.device.status === 'Active' ? 'text-green-600' : 'text-red-600'
                }>
                  {status.device.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Transaction Statistics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{status.statistics.totalTransactions}</div>
              <p className="text-sm text-gray-600">Total</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{status.statistics.todayTransactions}</div>
              <p className="text-sm text-gray-600">Today</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{status.statistics.pendingTransactions}</div>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{status.statistics.failedTransactions}</div>
              <p className="text-sm text-gray-600">Failed</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{status.statistics.offlineQueueSize}</div>
              <p className="text-sm text-gray-600">Offline Queue</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Management Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Management Actions</span>
          </CardTitle>
          <CardDescription>
            Perform maintenance and recovery actions on the FDMS system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => handleAction('sync_offline_queue')}
              disabled={isPerformingAction || status.statistics.offlineQueueSize === 0}
              className="flex flex-col h-auto p-4"
            >
              <Database className="h-6 w-6 mb-2" />
              <span className="font-medium">Sync Offline Queue</span>
              <span className="text-xs text-gray-500 mt-1">
                {status.statistics.offlineQueueSize} pending
              </span>
            </Button>

            <Button
              variant="outline"
              onClick={() => handleAction('retry_failed')}
              disabled={isPerformingAction || status.statistics.failedTransactions === 0}
              className="flex flex-col h-auto p-4"
            >
              <RefreshCw className="h-6 w-6 mb-2" />
              <span className="font-medium">Retry Failed</span>
              <span className="text-xs text-gray-500 mt-1">
                {status.statistics.failedTransactions} failed
              </span>
            </Button>

            <Button
              variant="outline"
              onClick={() => handleAction('reset_daily_counter')}
              disabled={isPerformingAction}
              className="flex flex-col h-auto p-4"
            >
              <Clock className="h-6 w-6 mb-2" />
              <span className="font-medium">Reset Daily Counter</span>
              <span className="text-xs text-gray-500 mt-1">
                Current: {status.device?.dailyReceiptCounter || 0}
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
    </DashboardLayout>
  )
}