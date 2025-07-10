"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import DashboardLayout from "../../../components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, Edit } from "lucide-react"
import type React from "react"
import { ViewProductDialog } from "@/components/view-product-dialog"
import { Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Product } from "@/lib/types/index"
import AuthGuard from "@/components/AuthGuard"


export default function ProductList() {

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const router = useRouter()
  // Inside your ProductList component, add state for the dialog:
  const [viewProduct, setViewProduct] = useState<Product | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const { toast } = useToast()

  // Add delete function
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return

    try {
      const res = await fetch(`/api/products?id=${id}`, {
        method: "DELETE"
      })

      if (res.ok) {
        setProducts(products.filter(p => p.id !== id))
        toast({
          title: "Success",
          description: "Product deleted successfully",
        })
      } else {
        throw new Error("Failed to delete")
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      })
      console.log("Delete error:", err)
    }
  }

  useEffect(() => {
    fetch("/api/products")
      .then(res => res.json())
      .then(data => setProducts(data || []))
      .finally(() => setLoading(false))
  }, [])

  const filteredProducts = products.filter((product) =>
    product.name?.toLowerCase().includes(search.toLowerCase()) ||
    product.code?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
              <span>Products</span>
              <span>|</span>
              <span>Product List</span>
            </div>
            <h1 className="text-2xl font-bold">Product List</h1>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Input
                    placeholder="Search this table..."
                    className="w-64"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">


                <Button
                  variant="outline"
                  className="text-green-600 bg-transparent"
                  onClick={() => window.open("/api/products/export?export=pdf", "_blank")}
                >
                  📄 PDF
                </Button>
                <Button
                  variant="outline"
                  className="text-orange-600 bg-transparent"
                  onClick={() => window.open("/api/products/export?export=excel", "_blank")}
                >
                  📊 EXCEL
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3">
                      <input type="checkbox" />
                    </th>
                    <th className="text-left p-3">Image</th>
                    <th className="text-left p-3">Name</th>
                    <th className="text-left p-3">Code</th>
                    <th className="text-left p-3">Category</th>
                    <th className="text-left p-3">Brand</th>
                    <th className="text-left p-3">Price</th>
                    <th className="text-left p-3">Unit</th>
                    <th className="text-left p-3">Quantity</th>
                    <th className="text-left p-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="p-6 text-center text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-6 text-center text-gray-500">
                        No products found.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => (
                      <tr key={product.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <input type="checkbox" />
                        </td>
                        <td className="p-3">
                          {product.image ? (
                            <img
                              src={product.image.startsWith("/uploads") ? product.image : `/uploads/${product.image}`}
                              alt={product.name}
                              className="w-10 h-10 object-cover rounded"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">📷</div>
                          )}
                        </td>
                        <td className="p-3 font-medium">{product.name}</td>
                        <td className="p-3">{product.code}</td>
                        <td className="p-3">{product.category_name}</td>
                        <td className="p-3">{product.brand_name}</td>
                        <td className="p-3">{Number(product.price).toFixed(2)}</td>
                        <td className="p-3">{product.unit_name}</td>
                        <td className="p-3">{Number(product.stock ?? 0).toFixed(2)}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-blue-600"
                              onClick={() => {
                                setViewProduct(product)
                                setIsViewDialogOpen(true)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-green-600"
                              onClick={() => router.push(`/products/edit/${product.id}`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600"
                              onClick={() => handleDelete(product.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t flex items-center justify-between">
              <div className="text-sm text-gray-600">Rows per page: 10</div>
              <div className="text-sm text-gray-600">
                {filteredProducts.length > 0
                  ? `1 - ${filteredProducts.length} of ${filteredProducts.length}`
                  : "0 - 0 of 0"}{" "}
                | prev next
              </div>
            </div>
          </div>
        </div>
        {viewProduct && (
          <ViewProductDialog
            product={viewProduct}
            open={isViewDialogOpen}
            onOpenChange={setIsViewDialogOpen}
          />
        )}
      </DashboardLayout>
    </AuthGuard>
  )
}