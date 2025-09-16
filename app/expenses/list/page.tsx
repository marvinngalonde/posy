"use client"

import DashboardLayout from "../../../components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Edit, Eye, Trash2, Plus, FileDown, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"
import { useGetExpensesQuery, useUpdateExpenseMutation, useDeleteExpenseMutation, Expense } from "@/lib/slices/expensesApi"
import { useGetWarehousesQuery } from "@/lib/slices/settingsApi"
import { useGetExpenseCategoriesQuery } from "@/lib/slices/expensesApi"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { Pagination as UIPagination, PaginationContent, PaginationItem } from "@/components/ui/pagination"

interface EditExpenseForm {
  id: string
  date: string
  category_id: string
  amount: string
  description: string
}

export default function ExpenseListPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [search, setSearch] = useState("")
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const { data, isLoading, isError } = useGetExpensesQuery({ page, limit, search })
  const expenses = data?.data || []
  const pagination = data?.pagination
  const { data: categories, isLoading: categoriesLoading } = useGetExpenseCategoriesQuery()
  const [updateExpense, { isLoading: isUpdating }] = useUpdateExpenseMutation()
  const [deleteExpense, { isLoading: isDeleting }] = useDeleteExpenseMutation()

  // Edit form state
  const [editForm, setEditForm] = useState<EditExpenseForm>({
    id: "",
    date: "",
    category_id: "",
    amount: "",
    description: "",
  })

  const handleDelete = async () => {
    if (!selectedExpense) return
    try {
      await deleteExpense(selectedExpense.id).unwrap()
      toast.success("Expense deleted successfully")
      setIsDeleteDialogOpen(false)
    } catch (error) {
      toast.error("Failed to delete expense")
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateExpense({
        id: parseInt(editForm.id),
        data: {
          date: editForm.date,
          category_id: parseInt(editForm.category_id),
          amount: parseFloat(editForm.amount),
          description: editForm.description,
        },
      }).unwrap()
      toast.success("Expense updated successfully")
      setIsEditDialogOpen(false)
    } catch (error) {
      toast.error("Failed to update expense")
    }
  }

  const openEditDialog = (expense: Expense) => {
    setSelectedExpense(expense)
    setEditForm({
      id: expense.id.toString(),
      date: expense.date,
      category_id: expense.category_id.toString(),
      amount: expense.amount.toString(),
      description: expense.description || "",
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (expense: Expense) => {
    setSelectedExpense(expense)
    setIsDeleteDialogOpen(true)
  }

  const handleExportPDF = () => {
    const doc = new jsPDF()
    doc.text("Expense List", 14, 16)
    const tableData = expenses.map((exp) => [exp.date, exp.reference, exp.description, exp.amount, exp.category_name, exp.status])
    autoTable(doc, {
      head: [["Date", "Reference", "Details", "Amount", "Category", "Status"]],
      body: tableData,
      startY: 20,
    })
    doc.save("expenses.pdf")
  }

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      expenses.map((exp) => ({
        Date: exp.date,
        Reference: exp.reference,
        Details: exp.description,
        Amount: exp.amount,
        Category: exp.category_name,
        Status: exp.status,
      }))
    )
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses")
    XLSX.writeFile(workbook, "expenses.xlsx")
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Expense List</h1>

        <div className="bg-white rounded-lg">
          <div className="p-4 border-b flex items-center justify-between">
            <Input placeholder="Search expenses..." className="w-64" value={search} onChange={(e) => setSearch(e.target.value)} />
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExportPDF}>
                <FileDown className="h-4 w-4 mr-2" /> PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportExcel}>
                <FileDown className="h-4 w-4 mr-2" /> EXCEL
              </Button>
              <Button className="bg-[#1a237e] hover:bg-purple-700" onClick={() => router.push("/expenses/create")}>
                <Plus className="h-4 w-4 mr-2" /> Create
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Date</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-red-500">
                      Error loading expenses.
                    </TableCell>
                  </TableRow>
                ) : (
                  expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{expense.date}</TableCell>
                      <TableCell>{expense.reference}</TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>${expense.amount}</TableCell>
                      <TableCell>{expense.category_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedExpense(expense); setIsViewDialogOpen(true); }}>
                            <Eye className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(expense)}>
                            <Edit className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(expense)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
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

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <Input type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} required />
            <Select value={editForm.category_id} onValueChange={(value) => setEditForm({ ...editForm, category_id: value })} disabled={categoriesLoading}>
              <SelectTrigger>
                <SelectValue placeholder={categoriesLoading ? "Loading..." : "Choose Category"} />
              </SelectTrigger>
              <SelectContent>
                {categories?.data?.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="number" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} required />
            <Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isUpdating}>{isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Expense</DialogTitle>
            <DialogDescription>Are you sure you want to delete expense "{selectedExpense?.reference}"? This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedExpense && isViewDialogOpen && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Expense Details</DialogTitle>
                </DialogHeader>
                <p>Date: {selectedExpense.date}</p>
                <p>Reference: {selectedExpense.reference}</p>
                <p>Category: {selectedExpense.category_name}</p>
                <p>Amount: ${selectedExpense.amount}</p>
                <p>Description: {selectedExpense.description}</p>
            </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  )
}
