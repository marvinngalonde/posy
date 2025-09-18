"use client"

import DashboardLayout from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, Trash2, FileDown, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import * as XLSX from "xlsx"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useGetSalesReturnsQuery, useDeleteSalesReturnMutation } from "@/lib/slices/returnsApi"
import { SalesReturn } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pagination as UIPagination, PaginationContent, PaginationItem } from "@/components/ui/pagination"

export default function SalesReturnList() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedReturn, setSelectedReturn] = useState<SalesReturn | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const { data, isLoading, isError } = useGetSalesReturnsQuery({ page, limit, search: searchTerm })
  const salesReturns = data?.data || []
  const pagination = data?.pagination
  const [deleteSalesReturn, { isLoading: isDeleting }] = useDeleteSalesReturnMutation()

  const handleDelete = async () => {
    if (!selectedReturn) return
    try {
      await deleteSalesReturn(selectedReturn.id).unwrap()
      toast.success("Sales return deleted successfully")
      setIsDeleteDialogOpen(false)
    } catch (error) {
      toast.error("Failed to delete sales return")
    }
  }

  const openDeleteDialog = (ret: SalesReturn) => {
    setSelectedReturn(ret)
    setIsDeleteDialogOpen(true)
  }

  const handleExportPDF = () => {
    const doc = new jsPDF()
    doc.text("Sales Returns List", 14, 16)
    const tableData = salesReturns.map((ret: SalesReturn) => [ret.date, ret.reference, ret.status, `$${ret.total}`])
    autoTable(doc, {
      head: [["Date", "Reference", "Status", "Total"]],
      body: tableData,
      startY: 20,
    })
    doc.save("sales-returns.pdf")
  }

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      salesReturns.map((ret: SalesReturn) => ({
        Date: ret.date,
        Reference: ret.reference,
        Status: ret.status,
        Total: ret.total,
      }))
    )
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Returns")
    XLSX.writeFile(workbook, "sales-returns.xlsx")
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Sales Return List</h1>

        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex items-center justify-between">
            <Input placeholder="Search..." className="w-64" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExportPDF}><FileDown className="h-4 w-4 mr-2" />PDF</Button>
              <Button variant="outline" size="sm" onClick={handleExportExcel}><FileDown className="h-4 w-4 mr-2" />EXCEL</Button>
              <Button className="bg-[#1a237e] hover:bg-purple-700" onClick={() => router.push("/sales-return/create")}>Create</Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></TableCell></TableRow>
                ) : isError ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-red-500">Error loading data.</TableCell></TableRow>
                ) : (
                  salesReturns.map((ret: SalesReturn) => (
                    <TableRow key={ret.id}>
                      <TableCell>{ret.date}</TableCell>
                      <TableCell>{ret.reference}</TableCell>
                      <TableCell>{ret.status}</TableCell>
                      <TableCell>${ret.total}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedReturn(ret); setIsViewDialogOpen(true); }}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(ret)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
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
      </div>
      
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Delete Sales Return</DialogTitle>
                  <DialogDescription>
                      Are you sure you want to delete this sales return? This action cannot be undone.
                  </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                  <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                  <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                      {isDeleting ? <Loader2 className="h-4 w-4 animate-spin"/> : "Delete"}
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

      {selectedReturn && isViewDialogOpen && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Sales Return Details</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 overflow-y-auto flex-1">
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium">{selectedReturn.date}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Reference</p>
                    <p className="font-medium">{selectedReturn.reference}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className="font-medium">{selectedReturn.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="font-medium">${Number(selectedReturn.total).toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex justify-end pt-4 border-t bg-white">
                  <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                    Close
                  </Button>
                </div>
            </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  )
}
