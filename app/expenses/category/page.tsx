"use client"

import DashboardLayout from "../../../components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Edit, Eye, Trash2, Plus, FileDown, Loader2 } from "lucide-react"
import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"
import { useGetExpenseCategoriesQuery, useCreateExpenseCategoryMutation, useUpdateExpenseCategoryMutation, useDeleteExpenseCategoryMutation, ExpenseCategory } from "@/lib/slices/expensesApi"

export default function ExpenseCategoryPage() {
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  // Form states
  const [createForm, setCreateForm] = useState({ name: "", description: "" })
  const [editForm, setEditForm] = useState({ id: "", name: "", description: "" })

  const { data: categories, isLoading, isError, refetch } = useGetExpenseCategoriesQuery()
  const [createCategory, { isLoading: isCreating }] = useCreateExpenseCategoryMutation()
  const [updateCategory, { isLoading: isUpdating }] = useUpdateExpenseCategoryMutation()
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteExpenseCategoryMutation()

  const filteredCategories = useMemo(() => {
    if (!categories?.data) return []
    return categories.data.filter(
      (cat) =>
        cat.name?.toLowerCase().includes(search.toLowerCase()) ||
        (cat.description && cat.description.toLowerCase().includes(search.toLowerCase()))
    )
  }, [categories, search])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createCategory(createForm).unwrap()
      toast.success("Category created successfully")
      setIsCreateDialogOpen(false)
      setCreateForm({ name: "", description: "" })
    } catch (error) {
      toast.error("Failed to create category")
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateCategory({ id: editForm.id, data: { name: editForm.name, description: editForm.description } }).unwrap()
      toast.success("Category updated successfully")
      setIsEditDialogOpen(false)
    } catch (error) {
      toast.error("Failed to update category")
    }
  }

  const handleDelete = async () => {
    if (!selectedCategory) return
    try {
      await deleteCategory(selectedCategory.id).unwrap()
      toast.success("Category deleted successfully")
      setIsDeleteDialogOpen(false)
    } catch (error) {
      toast.error("Failed to delete category")
    }
  }

  const openEditDialog = (category: ExpenseCategory) => {
    setSelectedCategory(category)
    setEditForm({
      id: category.id,
      name: category.name,
      description: category.description || "",
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (category: ExpenseCategory) => {
    setSelectedCategory(category)
    setIsDeleteDialogOpen(true)
  }

  const handleExportPDF = () => {
    const doc = new jsPDF()
    doc.text("Expense Categories List", 14, 16)
    const tableData = filteredCategories.map((cat) => [cat.name, cat.description || "-", cat.status])
    autoTable(doc, {
      head: [["Name", "Description", "Status"]],
      body: tableData,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [26, 35, 126] },
    })
    doc.save("expense-categories.pdf")
  }

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredCategories.map((cat) => ({
        Name: cat.name,
        Description: cat.description || "-",
        Status: cat.status,
      }))
    )
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expense Categories")
    XLSX.writeFile(workbook, "expense-categories.xlsx")
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Expense Category</h1>
        </div>

        <div className="bg-white rounded-lg">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <Input placeholder="Search categories..." className="w-64" value={search} onChange={(e) => setSearch(e.target.value)} />
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExportPDF}>
                <FileDown className="h-4 w-4 mr-2" /> PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportExcel}>
                <FileDown className="h-4 w-4 mr-2" /> EXCEL
              </Button>
              <Button className="bg-[#1a237e] hover:bg-purple-700" onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Create
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Category Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-red-500">
                      Error loading categories.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCategories.map((category) => (
                    <TableRow key={category.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>{category.description || "-"}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {category.status || "Active"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedCategory(category); setIsViewDialogOpen(true) }}>
                            <Eye className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(category)}>
                            <Edit className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(category)}>
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
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Expense Category</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <Input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} placeholder="Category Name" required />
            <Input value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} placeholder="Description" />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-[#1a237e] hover:bg-purple-700" disabled={isCreating}>
                {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="Category Name" required />
            <Input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} placeholder="Description" />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-[#1a237e] hover:bg-purple-700" disabled={isUpdating}>
                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>Are you sure you want to delete category "{selectedCategory?.name}"? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {selectedCategory && isViewDialogOpen && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Category Details</DialogTitle>
                </DialogHeader>
                <p>Name: {selectedCategory.name}</p>
                <p>Description: {selectedCategory.description}</p>
            </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  )
}
