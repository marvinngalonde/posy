"use client"

import { useState } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  FileText,
  Search,
  Filter,
  Download,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle
} from "lucide-react"
import {
  useGetFiscalTransactionsQuery,
  useGetFDMSStatusQuery
} from "@/lib/slices/fdmsApi"

export default function FiscalTransactionsPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [limit, setLimit] = useState(50)

  // RTK Query hooks
  const { data: transactionsData, isLoading, error, refetch } = useGetFiscalTransactionsQuery({
    limit,
    status: statusFilter === "all" ? undefined : statusFilter
  })

  const { data: fdmsStatus } = useGetFDMSStatusQuery()

  const transactions = transactionsData?.data?.transactions || []
  const summary = transactionsData?.data?.summary

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Confirmed</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>
      case 'submitted':
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1" />Submitted</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getReceiptTypeBadge = (type: string) => {
    switch (type) {
      case 'FiscalInvoice':
        return <Badge variant="outline" className="text-blue-600">Invoice</Badge>
      case 'CreditNote':
        return <Badge variant="outline" className="text-green-600">Credit Note</Badge>
      case 'DebitNote':
        return <Badge variant="outline" className="text-red-600">Debit Note</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  const filteredTransactions = transactions.filter(tx =>
    tx.invoice_no.toLowerCase().includes(search.toLowerCase()) ||
    (tx.buyer_name && tx.buyer_name.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fiscal Transactions</h1>
          <p className="text-gray-600">ZIMRA FDMS transaction history and monitoring</p>
        </div>

        {fdmsStatus?.data && (
          <Badge
            variant="secondary"
            className={`${
              fdmsStatus.data.fdmsEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}
          >
            {fdmsStatus.data.fdmsEnabled ? 'FDMS Active' : 'Non-FDMS Mode'}
          </Badge>
        )}
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{summary.totalTransactions}</div>
              <p className="text-sm text-gray-600">Total Transactions</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{transactions.filter(t => t.zimra_status === 'confirmed').length}</div>
              <p className="text-sm text-gray-600">Confirmed</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{transactions.filter(t => t.zimra_status === 'failed').length}</div>
              <p className="text-sm text-gray-600">Failed</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Transaction History</span>
          </CardTitle>
          <CardDescription>
            View and monitor all fiscal transactions submitted to ZIMRA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by invoice number or customer name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={limit.toString()} onValueChange={(value) => setLimit(parseInt(value))}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25 rows</SelectItem>
                <SelectItem value="50">50 rows</SelectItem>
                <SelectItem value="100">100 rows</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          {/* Transactions Table */}
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Loading transactions...</span>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center py-8 text-red-600">
              <AlertCircle className="h-6 w-6 mr-2" />
              <span>Failed to load transactions</span>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No fiscal transactions found</p>
              <p className="text-sm">Transactions will appear here after sales are fiscalized</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt No.</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Invoice No.</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Tax</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Device ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-mono text-sm">
                        {transaction.receipt_global_no}
                      </TableCell>
                      <TableCell>
                        {getReceiptTypeBadge(transaction.receipt_type)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {transaction.invoice_no}
                      </TableCell>
                      <TableCell>
                        {transaction.buyer_name || '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${transaction.receipt_total.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        ${transaction.tax_amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {new Date(transaction.receipt_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(transaction.zimra_status)}
                        {transaction.retry_count > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            Retries: {transaction.retry_count}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {transaction.device_id}
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
    </DashboardLayout>
  )
}