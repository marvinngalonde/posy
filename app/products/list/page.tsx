"use client"
import {  useState } from "react"
import { useRouter } from "next/navigation"
import DashboardLayout from "../../../components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, Edit, FileDown, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { ViewProductDialog } from "@/components/view-product-dialog"
import { useToast } from "@/components/ui/use-toast"
import { Product } from "@/lib/types/index"
import AuthGuard from "@/components/AuthGuard"
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Pagination as UIPagination, PaginationContent, PaginationItem } from "@/components/ui/pagination"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
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
import { useGetProductsQuery, useDeleteProductMutation } from '@/lib/slices/productsApi'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type React from "react"

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

type ProductWithMeta = Product & {
  category_name?: string;
  brand_name?: string;
  unit_name?: string;
};

export default function ProductList() {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const router = useRouter()
  const [viewProduct, setViewProduct] = useState<Product | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<string | null>(null)
  const { toast } = useToast()

  const { data, isLoading, isError } = useGetProductsQuery({ page, limit, search });
  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation()
  
  const products = data?.data || [];
  const pagination = data?.pagination;

  const handleDeleteClick = (id: string) => {
    setProductToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!productToDelete) return
    try {
      await deleteProduct(productToDelete).unwrap()
      toast({
        title: "Success",
        description: "Product deleted successfully",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      })
      console.error("Delete error:", err)
    } finally {
      setDeleteDialogOpen(false)
      setProductToDelete(null)
    }
  }

  const exportToPDF = () => {
    const doc = new jsPDF()
    doc.text('Product List', 14, 16)
    
    const tableData = products.map(product => [
      product.name || '',
      product.code || '',
      product.categories?.name || product.category_name || '',
      product.brands?.name || product.brand_name || '',
      Number(product.price),
      product.units?.name || product.unit_name || '',
      Number(product.stock ?? 0)
    ])
    
    autoTable(doc, {
      head: [['Name', 'Code', 'Category', 'Brand', 'Price', 'Unit', 'Quantity']],
      body: tableData,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [26, 35, 126] }
    })
    
    doc.save('products.pdf')
  }

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      products.map(product => ({
        Name: product.name,
        Code: product.code,
        Category: product.categories?.name || product.category_name || '',
        Brand: product.brands?.name || product.brand_name || '',
        Price: Number(product.price),
        Unit: product.units?.name || product.unit_name || '',
        Quantity: Number(product.stock ?? 0)
      }))
    )
    
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products")
    XLSX.writeFile(workbook, "products.xlsx")
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="p-4 md:p-6">
          <div className="mb-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <span>Products</span>
              <span>|</span>
              <span>Product List</span>
            </div>
            <h1 className="text-xl font-semibold">Product List</h1>
          </div>

          <Card>
            <CardHeader className="p-4 pb-0">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="w-full md:w-64">
                  <Input
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
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
                    onClick={() => router.push("/products/create")}
                    size="sm"
                  >
                    Create Product
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">Image</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead className="w-[150px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-10 w-10 rounded" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell className="flex gap-2">
                            <Skeleton className="h-8 w-8 rounded" />
                            <Skeleton className="h-8 w-8 rounded" />
                            <Skeleton className="h-8 w-8 rounded" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : products.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="h-24 text-center">
                          No products found
                        </TableCell>
                      </TableRow>
                    ) : (
                      products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            {product.image ? (
                              <img
                                src={product.image.startsWith("/uploads") ? product.image : `/uploads/${product.image}`}
                                alt={product.name}
                                className="w-10 h-10 object-cover rounded"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">📷</div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{product.code}</TableCell>
                          <TableCell>{product.categories?.name || product.category_name || ''}</TableCell>
                          <TableCell>{product.brands?.name || product.brand_name || ''}</TableCell>
                          <TableCell>{Number(product.price) }</TableCell>
                          <TableCell>{product.units?.name || product.unit_name || ''}</TableCell>
                          <TableCell>{Number(product.stock ?? 0)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  setViewProduct(product)
                                  setIsViewDialogOpen(true)
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => router.push(`/products/edit/${product.id}`)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDeleteClick(product.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
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
                <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-4">
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
            </CardContent>
          </Card>
        </div>

        {viewProduct && (
          <ViewProductDialog
            product={viewProduct}
            open={isViewDialogOpen}
            onOpenChange={setIsViewDialogOpen}
          />
        )}

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the product and remove its data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Product
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DashboardLayout>
    </AuthGuard>
  )
}
