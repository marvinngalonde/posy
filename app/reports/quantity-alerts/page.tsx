"use client"

import { useState, useMemo } from "react"
import DashboardLayout from "../../../components/dashboard-layout"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, FileDown, Eye, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useGetProductsQuery } from "@/lib/slices/productsApi"
import { Product } from "@/lib/types"

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export default function ProductQuantityAlerts() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedWarehouse, setSelectedWarehouse] = useState("all")
  const { data: productsResponse, isLoading } = useGetProductsQuery({ page: 1, limit: 1000, search: searchTerm })
  const productsData = productsResponse?.data || []

  const products = useMemo(() => {
    if (!productsData) return [];
    return productsData.filter((product: Product) =>
      product.stock <= product.alert_quantity
    );
  }, [productsData]);

  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const handleExportPDF = async () => {
    try {
      // Calculate summary data
      const summary = {
        critical: products.filter(item => item.stock <= (item.alert_quantity * 0.5)).length,
        high: products.filter(item =>
          item.stock > (item.alert_quantity * 0.5) && item.stock <= (item.alert_quantity * 0.8)
        ).length,
        medium: products.filter(item => item.stock > (item.alert_quantity * 0.8)).length
      }

      const reportData = {
        title: 'Product Quantity Alerts Report',
        template: 'quantity-alerts-report',
        data: products,
        filters: [
          { label: 'Search', value: searchTerm || 'All Products' },
          { label: 'Warehouse', value: selectedWarehouse === 'all' ? 'All Warehouses' : selectedWarehouse }
        ].filter(f => f.value !== 'All Products'),
        summary: [
          { label: 'Total Low Stock Items', value: products.length },
          { label: 'Critical Items', value: summary.critical },
          { label: 'High Priority Items', value: summary.high },
          { label: 'Medium Priority Items', value: summary.medium }
        ],
        recommendations: true
      }

      const response = await fetch('/api/reports/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportData)
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `quantity-alerts-report-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('PDF generated successfully')
    } catch (error) {
      console.error('PDF generation error:', error)
      toast.error('Failed to generate PDF')
    }
  }

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      products.map(product => ({
        Code: product.code,
        Product: product.name,
        Warehouse: product.warehouse_name || "-",
        Quantity: product.stock,
        'Alert Quantity': product.alert_quantity,
        Category: product.category_name || "-",
        Brand: product.brand_name || "-",
        Price: `$${Number(product.price || 0) }`
      }))
    )
    
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Product Alerts")
    XLSX.writeFile(workbook, "product-quantity-alerts.xlsx")
  }

  const warehouses = useMemo(() => {
    if (!productsData) return [];
    return [...new Set(productsData.map(p => p.warehouse_name).filter(Boolean))]
  }, [productsData]);

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <span>Reports</span>
            <span>|</span>
            <span>Product Quantity Alerts</span>
          </div>
          <h1 className="text-2xl font-bold">Product Quantity Alerts</h1>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-64">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Warehouse</label>
                  <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Warehouses</SelectItem>
                      {warehouses.map(warehouse => (
                        <SelectItem key={warehouse} value={warehouse.toLowerCase()}>
                          {warehouse}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="Search products..." 
                    className="w-64 pl-10" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleExportPDF}><FileDown className="h-4 w-4 mr-2" />PDF</Button>
                <Button variant="outline" size="sm" onClick={handleExportExcel}><FileDown className="h-4 w-4 mr-2" />EXCEL</Button>
              </div>
            </div>
          </div>

          <div className="p-6 border-b bg-gray-50">
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{products.length}</div>
                <div className="text-sm text-gray-600">Total Alerts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {products.filter(p => p.stock === 0).length}
                </div>
                <div className="text-sm text-gray-600">Out of Stock</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {products.filter(p => p.stock > 0 && p.stock <= p.alert_quantity).length}
                </div>
                <div className="text-sm text-gray-600">Low Stock</div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4 font-medium">Code</th>
                  <th className="text-left p-4 font-medium">Product</th>
                  <th className="text-left p-4 font-medium">Warehouse</th>
                  <th className="text-left p-4 font-medium">Quantity</th>
                  <th className="text-left p-4 font-medium">Alert Quantity</th>
                  <th className="text-left p-4 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center p-6"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-6">No products with quantity alerts found.</td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-medium">{product.code}</td>
                      <td className="p-4 text-blue-600">{product.name}</td>
                      <td className="p-4">{product.warehouse_name || "-"}</td>
                      <td className="p-4">
                        <span className={`font-medium ${
                          product.stock === 0 ? "text-red-600" : 
                          product.stock <= product.alert_quantity ? "text-orange-600" : 
                          "text-green-600"
                        }`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="p-4">
                        <Badge variant="destructive" className="bg-red-100 text-red-800">
                          {product.alert_quantity}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {setSelectedProduct(product); setShowViewModal(true);}}
                          >
                            <Eye className="h-4 w-4 text-blue-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selectedProduct && (
          <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Product Details</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 p-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Code</label>
                  <p className="mt-1 text-sm">{selectedProduct.code}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="mt-1 text-sm">{selectedProduct.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Category</label>
                  <p className="mt-1 text-sm">{selectedProduct.category_name || "-"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Brand</label>
                  <p className="mt-1 text-sm">{selectedProduct.brand_name || "-"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Warehouse</label>
                  <p className="mt-1 text-sm">{selectedProduct.warehouse_name || "-"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Unit</label>
                  <p className="mt-1 text-sm">{selectedProduct.unit_name || "-"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Stock</label>
                  <p className="mt-1 text-sm">{selectedProduct.stock}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Alert Quantity</label>
                  <p className="mt-1 text-sm">{selectedProduct.alert_quantity}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Cost</label>
                  <p className="mt-1 text-sm">${Number(selectedProduct.cost || 0) }</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Price</label>
                  <p className="mt-1 text-sm">${Number(selectedProduct.price || 0) }</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <p className="mt-1 text-sm">{selectedProduct.status}</p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  )
}
