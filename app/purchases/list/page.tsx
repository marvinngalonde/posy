"use client"

import DashboardLayout from "../../../components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, Edit, Trash2, FileDown, ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import type React from "react"
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import AuthGuard from "@/components/AuthGuard"
import { ViewPurchaseDialog } from "./view-purchase/page"
import { useGetPurchasesQuery, useDeletePurchaseMutation } from "@/lib/slices/purchasesApi"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pagination as UIPagination, PaginationContent, PaginationItem } from "@/components/ui/pagination"

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface Purchase {
  id: string
  date: string
  reference: string
  suppliers: { name: string }
  warehouses: { name: string }
  status: string
  total: number
  paid: number
  due: number
  payment_status: string
  purchase_items?: Array<{
    id: number
    quantity: number
    unit_cost: number
    subtotal: number
    products: { name: string, code: string }
  }>
  subtotal?: number
  tax_rate?: number
  tax_amount?: number
  discount?: number
  shipping?: number
  notes?: string
}

export default function PurchaseList() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [searchTerm, setSearchTerm] = useState("")
  const [viewPurchase, setViewPurchase] = useState<Purchase | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [purchaseToDelete, setPurchaseToDelete] = useState<string | null>(null)

  const { data, isLoading, isError } = useGetPurchasesQuery({ page, limit, search: searchTerm })
  const [deletePurchase, { isLoading: isDeleting }] = useDeletePurchaseMutation()

  const purchases = data?.data || [];
  const pagination = data?.pagination;

  const handleDeleteClick = (id: string) => {
    setPurchaseToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDeletePurchase = async () => {
    if (!purchaseToDelete) return
    
    try {
      await deletePurchase(purchaseToDelete).unwrap()
      toast.success("Purchase deleted successfully")
    } catch (error) {
      console.error("Error deleting purchase:", error)
      toast.error("Failed to delete purchase")
    } finally {
      setDeleteDialogOpen(false)
      setPurchaseToDelete(null)
    }
  }

  const exportToPDF = () => {
    const doc = new jsPDF()
    doc.text('Purchase List', 14, 16)
    
    const tableData = purchases.map(purchase => [
      formatDate(purchase.date),
      purchase.reference,
      purchase.suppliers?.name || 'N/A',
      purchase.warehouses?.name || 'N/A',
      purchase.status,
      Number(purchase.total),
      Number(purchase.paid),
      Number(purchase.due),
      purchase.payment_status
    ])
    
    autoTable(doc, {
      head: [['Date', 'Reference', 'Supplier', 'Warehouse', 'Status', 'Total', 'Paid', 'Due', 'Payment Status']],
      body: tableData,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [26, 35, 126] }
    })
    
    doc.save('purchases.pdf')
  }

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      purchases.map(purchase => ({
        Date: formatDate(purchase.date),
        Reference: purchase.reference,
        Supplier: purchase.suppliers?.name || 'N/A',
        Warehouse: purchase.warehouses?.name || 'N/A',
        Status: purchase.status,
        Total: Number(purchase.total),
        Paid: Number(purchase.paid),
        Due: Number(purchase.due),
        'Payment Status': purchase.payment_status
      }))
    )
    
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Purchases")
    XLSX.writeFile(workbook, "purchases.xlsx")
  }

  const handleRowClick = (id: string) => {
    router.push(`/purchases/edit/${id}`)
  }

  const handleCreate = () => {
    router.push('/purchases/create')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'received':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Received</span>
      case 'pending':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Pending</span>
      case 'ordered':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">Ordered</span>
      default:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">{status}</span>
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Paid</span>
      case 'pending':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Pending</span>
      case 'partial':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">Partial</span>
      default:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">{status}</span>
    }
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
              <span>Purchases</span>
              <span>|</span>
              <span>Purchase List</span>
            </div>
            <h1 className="text-2xl font-bold">Purchase List</h1>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Input
                    placeholder="Search purchases..."
                    className="w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToPDF}
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToExcel}
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Excel
                </Button>
                <Button
                  className="bg-[#1a237e] hover:bg-purple-700"
                  onClick={handleCreate}
                >
                  Create Purchase
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3">Date</th>
                    <th className="text-left p-3">Reference</th>
                    <th className="text-left p-3">Supplier</th>
                    <th className="text-left p-3">Warehouse</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Total</th>
                    <th className="text-left p-3">Paid</th>
                    <th className="text-left p-3">Due</th>
                    <th className="text-left p-3">Payment Status</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={10} className="text-center p-6">Loading...</td>
                    </tr>
                  ) : isError ? (
                    <tr>
                      <td colSpan={10} className="text-center p-6 text-red-600">Failed to load purchases</td>
                    </tr>
                  ) : purchases.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center p-6 text-gray-500">No purchases found</td>
                    </tr>
                  ) : (
                    purchases.map((purchase) => (
                      <tr key={purchase.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => handleRowClick(purchase.id)}>
                        <td className="p-3">{formatDate(purchase.date)}</td>
                        <td className="p-3 font-medium">{purchase.reference}</td>
                        <td className="p-3">{purchase.suppliers?.name || 'N/A'}</td>
                        <td className="p-3">{purchase.warehouses?.name || 'N/A'}</td>
                        <td className="p-3">{getStatusBadge(purchase.status)}</td>
                        <td className="p-3 font-medium">${Number(purchase.total) }</td>
                        <td className="p-3">${Number(purchase.paid) }</td>
                        <td className="p-3">${Number(purchase.due) }</td>
                        <td className="p-3">{getPaymentStatusBadge(purchase.payment_status)}</td>
                        <td className="p-3">
                          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setViewPurchase(purchase)
                                setIsViewDialogOpen(true)
                              }}
                            >
                              <Eye className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/purchases/edit/${purchase.id}`)}
                            >
                              <Edit className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(purchase.id)}
                              disabled={isDeleting}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {pagination && (
                <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-4 p-4">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">Rows per page</p>
                    <Select
                      value={limit.toString()}
                      onValueChange={(value) => setLimit(Number(value))}
                    >
                      <SelectTrigger className="h-8 w-[70px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[10, 25, 50, 100].map((size) => (
                          <SelectItem key={size} value={size.toString()}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <UIPagination>
                    <PaginationContent>
                      <PaginationItem>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPage((old) => Math.max(old - 1, 1))}
                          disabled={page === 1}
                        >
                          <ChevronLeft className="h-4 w-4 mr-2" />
                          Previous
                        </Button>
                      </PaginationItem>
                      
                      <span className="text-sm text-muted-foreground mx-4">
                        Page {page} of {pagination.totalPages}
                      </span>

                      <PaginationItem>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPage((old) => old + 1)}
                          disabled={page >= (pagination.totalPages || 1)}
                        >
                          Next
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      </PaginationItem>
                    </PaginationContent>
                  </UIPagination>
                </div>
              )}
          </div>

          {viewPurchase && (
            <ViewPurchaseDialog
              purchase={viewPurchase}
              open={isViewDialogOpen}
              onOpenChange={setIsViewDialogOpen}
            />
          )}

          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the purchase
                  and remove its data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeletePurchase}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete Purchase"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
