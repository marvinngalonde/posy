"use client"

import DashboardLayout from "../../../components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, FileDown, Edit, Trash2, ChevronLeft, ChevronRight, Eye } from "lucide-react"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import * as XLSX from 'xlsx'
// Old jsPDF imports removed - now using server-side Handlebars templates
// PDF generation moved to server-side API routes
import { useGetOrganizationQuery } from '@/lib/slices/organizationApi'
import type React from "react"
import { useGetInvoicesQuery, useDeleteInvoiceMutation, useGetInvoiceByIdQuery, useGetInvoiceItemsQuery } from "@/lib/slices/invoicesApi"
import { Invoice, InvoiceItem } from "@/lib/types/invoice"
import { toast } from "sonner"
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
import { Pagination as UIPagination, PaginationContent, PaginationItem } from "@/components/ui/pagination"
import { ViewInvoiceDialog } from "./view-invoice/page"

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface InvoiceListItem {
  id: string
  date: string
  reference: string
  customer_name?: string
  warehouse_name?: string
  status: string
  total: number
  paid: number
  due: number
  payment_status: string
  created_by?: string
}

export default function InvoiceList() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()
  const [viewInvoice, setViewInvoice] = useState<InvoiceListItem | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null)
  const [invoiceIdForActions, setInvoiceIdForActions] = useState<string | null>(null);

  const { data, isLoading, isError } = useGetInvoicesQuery({ page, limit, search: searchTerm })
  const [deleteInvoice, { isLoading: isDeleting }] = useDeleteInvoiceMutation()
  const { data: fullInvoiceData } = useGetInvoiceByIdQuery(invoiceIdForActions || "", { skip: !invoiceIdForActions });
  const { data: invoiceItemsData } = useGetInvoiceItemsQuery(invoiceIdForActions || "", { skip: !invoiceIdForActions });
  const { data: organization } = useGetOrganizationQuery();
  
  const invoices = (data?.data || []) as unknown as InvoiceListItem[];
  const pagination = data?.pagination;

  const handleDeleteClick = (id: string) => {
    setInvoiceToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDeleteInvoice = async () => {
    if (!invoiceToDelete) return
    
    try {
      await deleteInvoice(invoiceToDelete).unwrap()
      toast.success("Invoice deleted successfully")
    } catch (error) {
      console.error("Error deleting invoice:", error)
      toast.error("Failed to delete invoice")
    } finally {
      setDeleteDialogOpen(false)
      setInvoiceToDelete(null)
    }
  }

  const exportToPDF = () => {
    toast.info("To export an invoice PDF, use the PDF button next to each individual invoice in the table below. This will generate a professional invoice using your organization's branding.")
  }

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      invoices.map(invoice => ({
        Date: invoice.date,
        Reference: invoice.reference,
        Customer: invoice.customer_name || 'Unknown',
        Warehouse: invoice.warehouse_name || 'Unknown',
        Status: invoice.status,
        Total: Number(invoice.total),
        Paid: Number(invoice.paid),
        Due: Number(invoice.due),
        'Payment Status': invoice.payment_status
      }))
    )
    
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Invoices")
    XLSX.writeFile(workbook, "invoices.xlsx")
  }

 const exportSingleInvoiceToPDF = async (invoiceId: string) => {
  try {
    const invoiceResponse = await fetch(`/api/v2/invoices/${invoiceId}`);
    const invoiceData = await invoiceResponse.json();

    const itemsResponse = await fetch(`/api/v2/invoices/items?invoice_id=${invoiceId}`);
    const itemsResult = await itemsResponse.json();
    const itemsData = itemsResult.data || [];

    // Debug: Uncomment to troubleshoot item data issues
    // console.log('Invoice data:', invoiceData);
    // console.log('Items response:', itemsResult);
    // console.log('Items data:', itemsData);

    // Prepare data for PDF generation
    const pdfData = {
      organization: organization!,
      invoiceNumber: invoiceData.reference || 'INV-001',
      invoiceDate: invoiceData.date,
      dueDate: invoiceData.due_date || null,
      status: invoiceData.status || 'Pending',
      customer: {
        name: invoiceData.customer?.name || invoiceData.customer_name || 'Customer Name',
        email: invoiceData.customer?.email || '',
        phone: invoiceData.customer?.phone || '',
        address: invoiceData.customer?.address || '',
        city: invoiceData.customer?.city || '',
        country: invoiceData.customer?.country || ''
      },
      items: itemsData.length > 0 ? itemsData.map((item: any) => ({
        product: {
          name: item.name || 'Product',
          description: item.description || '',
          sku: item.code || ''
        },
        quantity: Number(item.quantity || 0),
        price: Number(item.unit_price || 0),
        total: Number(item.subtotal || (item.quantity * item.unit_price) || 0)
      })) : [
        {
          product: {
            name: 'Sample Item',
            description: 'No items found for this invoice',
            sku: 'N/A'
          },
          quantity: 1,
          price: Number(invoiceData.total || 0),
          total: Number(invoiceData.total || 0)
        }
      ],
      subtotal: Number(invoiceData.subtotal || 0),
      taxAmount: Number(invoiceData.tax_amount || 0),
      discountAmount: Number(invoiceData.discount || 0),
      totalAmount: Number(invoiceData.total || 0),
      notes: invoiceData.notes || (organization?.invoice_footer || 'Thank you for your business!')
    };

    // Call server-side PDF generation API
    const pdfResponse = await fetch('/api/pdf/invoice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pdfData)
    });

    if (!pdfResponse.ok) {
      throw new Error(`PDF generation failed: ${pdfResponse.statusText}`);
    }

    // Create download from response
    const pdfBlob = await pdfResponse.blob();
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${pdfData.invoiceNumber}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Invoice PDF generated successfully!");
  } catch (error) {
    console.error("Error generating invoice PDF:", error);
    toast.error("Failed to generate invoice PDF.");
  }
};

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <span>Sales</span>
            <span>|</span>
            <span>Invoices</span>
          </div>
          <h1 className="text-2xl font-bold">Invoices</h1>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search invoices..."
                  className="w-64 pl-10"
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
                onClick={() => router.push('/invoice/create')}
              >
                Create Invoice
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Reference</th>
                  <th className="text-left p-3">Customer</th>
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
                    <td colSpan={10} className="text-center p-6 text-red-600">Failed to load invoices</td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center p-6 text-gray-500">No invoices found</td>
                  </tr>
                ) : (
                  invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">{invoice.date}</td>
                      <td className="p-3 font-medium">{invoice.reference}</td>
                      <td className="p-3">{invoice.customer_name || 'Unknown'}</td>
                      <td className="p-3">{invoice.warehouse_name || 'Unknown'}</td>
                      <td className="p-3">
                        <Badge 
                          variant={invoice.status === 'paid' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {invoice.status}
                        </Badge>
                      </td>
                      <td className="p-3 font-medium">${Number(invoice.total).toFixed(2)}</td>
                      <td className="p-3">${Number(invoice.paid).toFixed(2)}</td>
                      <td className="p-3">${Number(invoice.due).toFixed(2)}</td>
                      <td className="p-3">{invoice.payment_status}</td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setViewInvoice(invoice)
                              setIsViewDialogOpen(true)
                            }}
                          >
                            <Eye className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/invoice/edit/${invoice.id}`)}
                          >
                            <Edit className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(invoice.id)}
                            disabled={isDeleting}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setInvoiceIdForActions(invoice.id);
                              exportSingleInvoiceToPDF(invoice.id);
                            }}
                            disabled={isLoading} 
                          >
                            <FileDown className="h-4 w-4 text-purple-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {pagination && (pagination.totalPages > 1) && (
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

        {viewInvoice && (
          <ViewInvoiceDialog
            invoice={viewInvoice}
            open={isViewDialogOpen}
            onOpenChange={setIsViewDialogOpen}
          />
        )}

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the invoice
                and remove its data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteInvoice}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Invoice"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  )
}
