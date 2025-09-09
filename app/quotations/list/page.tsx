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
import { Search, Filter, FileDown, Edit, Trash2, ChevronLeft, ChevronRight, MoreHorizontal, Eye, FileText } from "lucide-react"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type React from "react"
import { ViewQuotationDialog } from "./view-quotation/page"
import { useGetQuotationsQuery, useDeleteQuotationMutation, useGetQuotationItemsQuery, useGetQuotationByIdQuery } from "@/lib/slices/quotationsApi"
import { Quotation, QuotationItem } from "@/lib/types/quotation"
import { toast } from "sonner"
import { useCreateInvoiceMutation } from "@/lib/slices/invoicesApi"
import { Invoice, InvoiceItem as InvoiceItemType } from "@/lib/types/invoice"
import { v4 as uuidv4 } from "uuid"
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
    const doc = new jsPDF()
    doc.text('Quotation List', 14, 16)
    
    const tableData = quotations.map(quotation => [
      quotation.date,
      quotation.reference,
      quotation.customer_name || '',
      quotation.warehouse_name || '',
      quotation.status,
      `$${Number(quotation.total).toFixed(2)}`
    ])
    
    autoTable(doc, {
      head: [['Date', 'Reference', 'Customer', 'Warehouse', 'Status', 'Total']],
      body: tableData,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [26, 35, 126] }
    })
    
    doc.save('quotations.pdf')
  }

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      quotations.map(quotation => ({
        Date: quotation.date,
        Reference: quotation.reference,
        Customer: quotation.customer_name || '',
        Warehouse: quotation.warehouse_name || '',
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
      const quotationResponse = await fetch(`/api/quotations/${quotationId}`);
      const quotationData: FullQuotation = await quotationResponse.json();
  
      const itemsResponse = await fetch(`/api/quotations/items?quotation_id=${quotationId}`);
      const itemsData: QuotationItem[] = await itemsResponse.json();
  
      const doc = new jsPDF();
      
      // Brand colors
      const brandOrange = [255, 150, 0];
      const darkGray = [45, 45, 45];
      const lightGray = [240, 240, 240];
  
      // Header section with curved design
      doc.setFillColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.rect(0, 0, 210, 45, 'F');
      
      // Orange curved accent
      doc.setFillColor(brandOrange[0], brandOrange[1], brandOrange[2]);
      // Create curved shape using multiple rectangles and circles
      doc.ellipse(170, 45, 60, 25, 'F');
      doc.rect(140, 20, 70, 25, 'F');
      
      // Brand logo placeholder (you can replace with actual logo)
      doc.setFillColor(255, 255, 255);
      doc.rect(15, 8, 8, 8, 'F');
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text("BRANDNAME", 28, 15);
      doc.setFontSize(6);
      doc.text("YOUR TAGLINE HERE", 28, 18);
  
      // INVOICE title
      doc.setFontSize(32);
      doc.setTextColor(255, 255, 255);
      doc.text("QUOTATION", 130, 30);
  
      let yPos = 65;
  
      // Client and Invoice details section
      doc.setFontSize(10);
      doc.setTextColor(brandOrange[0], brandOrange[1], brandOrange[2]);
      
      // Left column - INVOICE TO
      doc.text("QUOTATION TO", 15, yPos);
      yPos += 5;
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text(quotationData.customer_name || "Customer Name", 15, yPos);
      yPos += 4;
      doc.text("Business Address", 15, yPos);
      yPos += 4;
      doc.text("City, State ZIP", 15, yPos);
      yPos += 4;
      doc.text("Phone Number", 15, yPos);
      yPos += 4;
      doc.text("Email Address", 15, yPos);
  
      // Right column - Invoice details
      let rightColY = 65;
      doc.setFontSize(10);
      doc.setTextColor(brandOrange[0], brandOrange[1], brandOrange[2]);
      doc.text("QUOTATION DATE", 140, rightColY);
      rightColY += 5;
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text(new Date(quotationData.date).toLocaleDateString(), 140, rightColY);
      
      rightColY += 10;
      doc.setFontSize(10);
      doc.setTextColor(brandOrange[0], brandOrange[1], brandOrange[2]);
      doc.text("QUOTATION NO.", 15, rightColY + 25);
      doc.text("DUE DATE", 140, rightColY);
      rightColY += 5;
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text(quotationData.reference || "QUO-001", 15, rightColY + 25);
      doc.text(quotationData.valid_until ? new Date(quotationData.valid_until).toLocaleDateString() : "30 DAYS", 140, rightColY);
      
      rightColY += 10;
      doc.setFontSize(10);
      doc.setTextColor(brandOrange[0], brandOrange[1], brandOrange[2]);
      doc.text("AMOUNT DUE", 140, rightColY);
      rightColY += 5;
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(`$${Number(quotationData.total).toFixed(2)}`, 140, rightColY);
  
      yPos = 120;
  
      // Items table with orange header
      if (itemsData.length > 0) {
        autoTable(doc, {
          startY: yPos,
          head: [['#', 'Product Description', 'QTY', 'RATE', 'AMOUNT']],
          body: itemsData.map((item, index) => [
            (index + 1).toString().padStart(2, '0'),
            item.product_name || item.name || 'Product Description',
            item.quantity.toString(),
            Number(item.price).toFixed(2),
            Number(item.subtotal).toFixed(2),
          ]),
          styles: { 
            fontSize: 9, 
            cellPadding: 4,
            lineColor: [200, 200, 200],
            lineWidth: 0.1
          },
          headStyles: { 
            fillColor: brandOrange, 
            textColor: [255, 255, 255], 
            fontStyle: 'bold',
            fontSize: 10
          },
          alternateRowStyles: { fillColor: lightGray },
          columnStyles: {
            0: { halign: 'center', cellWidth: 15 },
            1: { cellWidth: 90 },
            2: { halign: 'center', cellWidth: 20 },
            3: { halign: 'right', cellWidth: 25 },
            4: { halign: 'right', cellWidth: 25 }
          }
        });
  
        yPos = (doc as any).lastAutoTable.finalY + 10;
      }
  
      // Summary section with orange background
      const summaryStartY = yPos;
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.rect(120, summaryStartY, 75, 45, 'F');
  
      yPos += 8;
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      // Subtotal
      doc.text("Subtotal", 125, yPos);
      doc.text(`$${Number(quotationData.subtotal).toFixed(2)}`, 185, yPos, { align: 'right' });
      yPos += 6;
      
      // Tax
      doc.text("Tax Rate", 125, yPos);
      doc.text(`$${Number(quotationData.tax_amount).toFixed(2)}`, 185, yPos, { align: 'right' });
      yPos += 6;
      
      // Discount (if any)
      if (quotationData.discount > 0) {
        doc.text("Discount", 125, yPos);
        doc.text(`-$${Number(quotationData.discount).toFixed(2)}`, 185, yPos, { align: 'right' });
        yPos += 6;
      }
      
      // Total with orange background
      doc.setFillColor(brandOrange[0], brandOrange[1], brandOrange[2]);
      doc.rect(120, yPos, 75, 10, 'F');
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      doc.text("TOTAL", 125, yPos + 6);
      doc.text(`$${Number(quotationData.total).toFixed(2)}`, 185, yPos + 6, { align: 'right' });
  
      yPos += 20;
  
      // Thank you note and terms
      doc.setFontSize(12);
      doc.setTextColor(brandOrange[0], brandOrange[1], brandOrange[2]);
      doc.text("Thank you for Business", 15, yPos);
      yPos += 8;
      
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text("Bank Account Details", 15, yPos);
      yPos += 4;
      doc.text("Bank :", 15, yPos);
      yPos += 4;
      doc.text("A/c No :", 15, yPos);
      yPos += 4;
      doc.text("IBAN :", 15, yPos);
      yPos += 4;
      doc.text("Swift Code :", 15, yPos);
      yPos += 8;
  
      doc.setFontSize(10);
      doc.setTextColor(brandOrange[0], brandOrange[1], brandOrange[2]);
      doc.text("Terms & Conditions", 15, yPos);
      yPos += 5;
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      doc.text("Please send payment within 30 days of receiving this quotation.", 15, yPos);
      yPos += 3;
      doc.text("There will be 10% interest charge per month on late quotations.", 15, yPos);
  
      // Signature section
      doc.setFontSize(10);
      doc.setTextColor(brandOrange[0], brandOrange[1], brandOrange[2]);
      doc.text("Signature", 140, yPos - 20);
      
      // Signature line
      doc.setDrawColor(0, 0, 0);
      doc.line(140, yPos - 5, 180, yPos - 5);
  
      // Bottom curved orange accent
      yPos = doc.internal.pageSize.height - 30;
      doc.setFillColor(brandOrange[0], brandOrange[1], brandOrange[2]);
      doc.ellipse(20, yPos + 15, 40, 15, 'F');
      doc.rect(0, yPos + 10, 50, 20, 'F');
  
      // Notes if any
      if (quotationData.notes) {
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Notes: ${quotationData.notes}`, 15, yPos - 10);
      }
  
      doc.save(`quotation-${quotationData.reference}.pdf`);
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
        const fetchedQuotationItems: QuotationItem[] = await quotationItemsResponse.json();

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
            id: uuidv4(),
            invoice_id: "",
            product_id: item.product_id,
            name: item.product_name || item.name || 'N/A',
            code: item.product_code || item.code || 'N/A',
            quantity: Number(Number(item.quantity || 0).toFixed(2)),
            unit_price: Number(item.price.toFixed(2)),
            discount: Number(item.discount.toFixed(2)),
            tax: Number(item.tax.toFixed(2)),
            subtotal: Number((item.price * item.quantity - item.discount + item.tax).toFixed(2)),

            
          })),
        };

        const newInvoice = await createInvoice(invoicePayload).unwrap();
        toast.success(`Invoice ${newInvoice.reference} created from quotation!`);
        router.push(`/invoice/edit/${newInvoice.id}`);
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
          subtotal: Number(Number(fetchedFullQuotation.subtotal || 0).toFixed(2)),
tax_rate: Number(Number(fetchedFullQuotation.tax_rate || 0).toFixed(2)),
tax_amount: Number(Number(fetchedFullQuotation.tax_amount || 0).toFixed(2)),
discount: Number(Number(fetchedFullQuotation.discount || 0).toFixed(2)),
shipping: Number(Number(fetchedFullQuotation.shipping || 0).toFixed(2)),
total: Number(Number(fetchedFullQuotation.total || 0).toFixed(2)),
          paid: 0, 
          due: Number(fullQuotationData.total.toFixed(2)), 
          status: "pending", 
          payment_status: "unpaid", 
          notes: fullQuotationData.notes || null,
          created_by: fullQuotationData.created_by || user_id || null,
          items: quotationItemsData.map(item => ({
            id: uuidv4(),
            invoice_id: "",
            product_id: item.product_id,
            name: item.product_name || item.name || 'N/A',
            code: item.product_code || item.code || 'N/A',
            quantity: Number(item.quantity.toFixed(2)),
            unit_price: Number(item.price.toFixed(2)),
            discount: Number(item.discount.toFixed(2)),
            tax: Number(item.tax.toFixed(2)),
            subtotal: Number((item.price * item.quantity - item.discount + item.tax).toFixed(2)),
          })),
        };

        const newInvoice = await createInvoice(invoicePayload).unwrap();
        toast.success(`Invoice ${newInvoice.reference} created from quotation!`);
        router.push(`/invoice/edit/${newInvoice.id}`);
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
                        <td className="p-3">{quotation.customer_name || ''}</td>
                        <td className="p-3">{quotation.warehouse_name || ''}</td>
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
