"use client"

import DashboardLayout from "../../../components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { Search, FileDown, Edit, Trash2, ChevronLeft, ChevronRight, MoreHorizontal, Eye, FileText } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import * as XLSX from 'xlsx'
// Old jsPDF imports removed - now using server-side Handlebars templates
// PDF generation moved to server-side API routes
import { useGetOrganizationQuery } from '@/lib/slices/organizationApi'
import type React from "react"
import { ViewQuotationDialog } from "./view-quotation/page"
import { useGetQuotationsQuery, useDeleteQuotationMutation, useGetQuotationItemsQuery, useGetQuotationByIdQuery } from "@/lib/slices/quotationsApi"
import { Quotation, QuotationItem } from "@/lib/types/quotation"
import { toast } from "sonner"
import { useCreateInvoiceMutation } from "@/lib/slices/invoicesApi"
import { Invoice, InvoiceItem as InvoiceItemType } from "@/lib/types/invoice"
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

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface FullQuotation extends Quotation {
  customer_name?: string;
  warehouse_name?: string;
}

interface QuotationListItem {
  id: string
  date: string
  reference: string
  customer_name?: string
  warehouse_name?: string
  status: string
  total: number
  created_by?: string
  valid_until?: string | null
}

export default function QuotationList() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()
  const [viewQuotation, setViewQuotation] = useState<QuotationListItem | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [quotationToDelete, setQuotationToDelete] = useState<string | null>(null)
  const [quotationIdForActions, setQuotationIdForActions] = useState<string | null>(null);

  const { data, isLoading, isError } = useGetQuotationsQuery({ page, limit, search: searchTerm })
  const [deleteQuotation, { isLoading: isDeleting }] = useDeleteQuotationMutation()
  const [createInvoice, { isLoading: isCreatingInvoice }] = useCreateInvoiceMutation()
  const { data: fullQuotationData } = useGetQuotationByIdQuery(quotationIdForActions || "", { skip: !quotationIdForActions });
  const { data: quotationItemsData } = useGetQuotationItemsQuery(quotationIdForActions || "", { skip: !quotationIdForActions });
  const { data: organization } = useGetOrganizationQuery();
  
  const quotations = (data?.data || []) as unknown as QuotationListItem[];
  const pagination = data?.pagination;

  const handleDeleteClick = (id: string) => {
    setQuotationToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDeleteQuotation = async () => {
    if (!quotationToDelete) return
    
    try {
      await deleteQuotation(quotationToDelete).unwrap()
      toast.success("Quotation deleted successfully")
    } catch (error) {
      console.error("Error deleting quotation:", error)
      toast.error("Failed to delete quotation")
    } finally {
      setDeleteDialogOpen(false)
      setQuotationToDelete(null)
    }
  }

  const exportToPDF = () => {
    toast.info("To export a quotation PDF, use the PDF button next to each individual quotation in the table below. This will generate a professional quotation using your organization's branding.")
  }

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      quotations.map(quotation => ({
        Date: quotation.date,
        Reference: quotation.reference,
        Customer: quotation.customers?.name || quotation.customer_name || '',
        Warehouse: quotation.warehouses?.name || quotation.warehouse_name || '',
        Status: quotation.status,
        Total: Number(quotation.total)
      }))
    )
    
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Quotations")
    XLSX.writeFile(workbook, "quotations.xlsx")
  }

  const exportSingleQuotationToPDF = async (quotationId: string) => {
    try {
      const quotationResponse = await fetch(`/api/v2/quotations?id=${quotationId}`);
      const quotationResult = await quotationResponse.json();
      const quotationData = quotationResult;

      const itemsResponse = await fetch(`/api/v2/quotations/items?quotation_id=${quotationId}`);
      const itemsResult = await itemsResponse.json();
      const itemsData = itemsResult.data || [];

      // Debug: Uncomment to troubleshoot item data issues
      // console.log('Quotation data:', quotationData);
      // console.log('Items response:', itemsResult);
      // console.log('Items data:', itemsData);

      // Prepare data for PDF generation
      const pdfData = {
        organization: organization!,
        quotationNumber: quotationData.reference || 'QUO-001',
        quotationDate: quotationData.date,
        validUntil: quotationData.valid_until || null,
        status: quotationData.status || 'Pending',
        customer: {
          name: quotationData.customers?.name || quotationData.customer_name || 'Customer Name',
          email: quotationData.customers?.email || '',
          phone: quotationData.customers?.phone || '',
          address: quotationData.customers?.address || '',
          city: quotationData.customers?.city || '',
          country: quotationData.customers?.country || ''
        },
        items: itemsData.length > 0 ? itemsData.map((item: any) => ({
          product: {
            name: item.products?.name || item.product_name || 'Product',
            description: item.products?.description || '',
            sku: item.products?.sku || ''
          },
          quantity: Number(item.quantity || 0),
          price: Number(item.price || item.unit_price || 0),
          total: Number(item.subtotal || (item.quantity * item.price) || 0)
        })) : [
          {
            product: {
              name: 'Sample Item',
              description: 'No items found for this quotation',
              sku: 'N/A'
            },
            quantity: 1,
            price: Number(quotationData.total || 0),
            total: Number(quotationData.total || 0)
          }
        ],
        subtotal: Number(quotationData.subtotal || 0),
        taxAmount: Number(quotationData.tax_amount || 0),
        discountAmount: Number(quotationData.discount || 0),
        totalAmount: Number(quotationData.total || 0),
        notes: quotationData.notes || (organization?.quotation_footer || 'Thank you for your business!')
      };

      // Call server-side PDF generation API
      const pdfResponse = await fetch('/api/pdf/quotation', {
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
      a.download = `quotation-${pdfData.quotationNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Quotation PDF generated successfully!");
    } catch (error) {
      console.error("Error generating quotation PDF:", error);
      toast.error("Failed to generate quotation PDF.");
    }
  };

  const handleMakeInvoice = async (quotation: QuotationListItem) => {
    try {
      setQuotationIdForActions(quotation.id);
      if (!fullQuotationData || !quotationItemsData) {
        const quotationDetailsResponse = await fetch(`/api/quotations/${quotation.id}`);
        const fetchedFullQuotation: FullQuotation = await quotationDetailsResponse.json();

        const quotationItemsResponse = await fetch(`/api/quotations/items?quotation_id=${quotation.id}`);
        const quotationItemsResult = await quotationItemsResponse.json();
        const fetchedQuotationItems: QuotationItem[] = quotationItemsResult.data || [];

        if (!fetchedFullQuotation || !fetchedQuotationItems) {
          throw new Error("Failed to fetch full quotation details or items for invoice conversion.");
        }

        const user_id = localStorage.getItem('UserId');

        const invoicePayload: Omit<Invoice, 'id' | 'created_at' | 'updated_at'> & {
          items: InvoiceItemType[];
          customer_id: string | null;
          warehouse_id: string | null;
          notes: string | null;
          created_by: string | null;
        } = {
          reference: `INV-${Date.now().toString().slice(-6)}`,
          date: new Date(fetchedFullQuotation.date).toISOString().split('T')[0],
          customer_id: fetchedFullQuotation.customer_id || '',
          warehouse_id: fetchedFullQuotation.warehouse_id || '',
          subtotal: Number(Number(fetchedFullQuotation.subtotal || 0).toFixed(2)),
          tax_rate: Number(Number(fetchedFullQuotation.tax_rate || 0).toFixed(2)),
          tax_amount: Number(Number(fetchedFullQuotation.tax_amount || 0).toFixed(2)),
          discount: Number(Number(fetchedFullQuotation.discount || 0).toFixed(2)),
          shipping: Number(Number(fetchedFullQuotation.shipping || 0).toFixed(2)),
          total: Number(Number(fetchedFullQuotation.total || 0).toFixed(2)),
          paid: 0, 
          due: Number(Number(fetchedFullQuotation.total || 0).toFixed(2)),
          status: "pending",
          payment_status: "unpaid", 
          notes: fetchedFullQuotation.notes || null,
          created_by: fetchedFullQuotation.created_by || user_id || null,
          items: fetchedQuotationItems.map(item => ({
            product_id: item.product_id,
            name: item.product_name || item.name || 'N/A',
            code: item.product_code || item.code || 'N/A',
            quantity: Number(Number(item.quantity || 0).toFixed(2)),
            unit_price: Number(Number(item.price || item.unit_price || 0).toFixed(2)),
            discount: Number(Number(item.discount || 0).toFixed(2)),
            tax: Number(Number(item.tax || 0).toFixed(2)),
            subtotal: Number(((Number(item.price || item.unit_price || 0) * Number(item.quantity || 0)) - Number(item.discount || 0) + Number(item.tax || 0)).toFixed(2)),

            
          })),
        };

        const newInvoice = await createInvoice(invoicePayload).unwrap();
        toast.success(`Invoice ${newInvoice.reference} created from quotation!`);

        // Small delay to ensure cache is updated
        setTimeout(() => {
          router.push(`/invoice/edit/${newInvoice.id}`);
        }, 100);
      } else {
        const user_id = localStorage.getItem('UserId');

        const invoicePayload: Omit<Invoice, 'id' | 'created_at' | 'updated_at'> & {
          items: InvoiceItemType[];
          customer_id: string | null;
          warehouse_id: string | null;
          notes: string | null;
          created_by: string | null;
        } = {
          reference: `INV-${Date.now().toString().slice(-6)}`,
          date: new Date(fullQuotationData.date).toISOString().split('T')[0],
          customer_id: fullQuotationData.customer_id || '',
          warehouse_id: fullQuotationData.warehouse_id || '',
          subtotal: Number(Number(fullQuotationData.subtotal || 0).toFixed(2)),
          tax_rate: Number(Number(fullQuotationData.tax_rate || 0).toFixed(2)),
          tax_amount: Number(Number(fullQuotationData.tax_amount || 0).toFixed(2)),
          discount: Number(Number(fullQuotationData.discount || 0).toFixed(2)),
          shipping: Number(Number(fullQuotationData.shipping || 0).toFixed(2)),
          total: Number(Number(fullQuotationData.total || 0).toFixed(2)),
          paid: 0, 
          due: Number(Number(fullQuotationData.total || 0).toFixed(2)), 
          status: "pending",
          payment_status: "unpaid",
          notes: fullQuotationData.notes || null,
          created_by: fullQuotationData.created_by || user_id || null,
          items: quotationItemsData.map(item => ({
            product_id: item.product_id,
            name: item.product_name || item.name || 'N/A',
            code: item.product_code || item.code || 'N/A',
            quantity: Number(Number(item.quantity || 0).toFixed(2)),
            unit_price: Number(Number(item.price || item.unit_price || 0).toFixed(2)),
            discount: Number(Number(item.discount || 0).toFixed(2)),
            tax: Number(Number(item.tax || 0).toFixed(2)),
            subtotal: Number(((Number(item.price || item.unit_price || 0) * Number(item.quantity || 0)) - Number(item.discount || 0) + Number(item.tax || 0)).toFixed(2)),
          })),
        };

        const newInvoice = await createInvoice(invoicePayload).unwrap();
        toast.success(`Invoice ${newInvoice.reference} created from quotation!`);

        // Small delay to ensure cache is updated
        setTimeout(() => {
          router.push(`/invoice/edit/${newInvoice.id}`);
        }, 100);
      }
    } catch (error: any) {
      console.error("Error creating invoice from quotation:", error);
      toast.error(error.data?.message || "Failed to create invoice from quotation.");
    } finally {
      setQuotationIdForActions(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <span>Sales</span>
            <span>|</span>
            <span>Quotations</span>
          </div>
          <h1 className="text-2xl font-bold">Quotations</h1>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search quotations..."
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
                onClick={() => router.push('/quotations/create')}
              >
                Create Quotation
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
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center p-6">Loading...</td>
                  </tr>
                ) : isError ? (
                    <tr>
                      <td colSpan={7} className="text-center p-6 text-red-600">Failed to load quotations</td>
                    </tr>
                  ) : quotations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center p-6 text-gray-500">No quotations found</td>
                    </tr>
                  ) : (
                    quotations.map((quotation) => (
                      <tr key={quotation.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">{quotation.date}</td>
                        <td className="p-3 font-medium">{quotation.reference}</td>
                        <td className="p-3">{quotation.customers?.name || quotation.customer_name || ''}</td>
                        <td className="p-3">{quotation.warehouses?.name || quotation.warehouse_name || ''}</td>
                        <td className="p-3">
                          <Badge 
                            variant={quotation.status === 'sent' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {quotation.status}
                          </Badge>
                        </td>
                        <td className="p-3 font-medium">${Number(quotation.total).toFixed(2)}</td>
                        <td className="p-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                onClick={() => {
                                  setViewQuotation(quotation)
                                  setIsViewDialogOpen(true)
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => router.push(`/quotations/edit/${quotation.id}`)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setQuotationIdForActions(quotation.id);
                                  exportSingleQuotationToPDF(quotation.id);
                                }}
                                disabled={isLoading}
                              >
                                <FileDown className="h-4 w-4 mr-2" />
                                Download PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setQuotationIdForActions(quotation.id);
                                  handleMakeInvoice(quotation);
                                }}
                                disabled={isCreatingInvoice || isLoading}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                Make Invoice
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteClick(quotation.id)}
                                disabled={isDeleting}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
  
          {viewQuotation && (
            <ViewQuotationDialog
              quotation={viewQuotation}
              open={isViewDialogOpen}
              onOpenChange={setIsViewDialogOpen}
            />
          )}
  
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the quotation
                  and remove its data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteQuotation}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete Quotation"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DashboardLayout>
    )
  }
