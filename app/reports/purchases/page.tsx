"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "../../../components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DateRangePicker } from "../../../components/date-range-picker"
import { Search, Eye, Edit, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Purchase {
  id: string
  reference: string
  supplier_name: string
  warehouse_name: string
  date: string
  subtotal: number
  tax_amount: number
  discount: number
  shipping: number
  total: number
  paid: number
  due: number
  status: string
  payment_status: string
  notes: string
  created_at: string
}

export default function PurchaseReport() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [dateRange, setDateRange] = useState("1970-01-01 - 2025-07-01")
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)
  const [formData, setFormData] = useState({
    reference: "",
    supplier_id: "",
    warehouse_id: "",
    date: "",
    subtotal: 0,
    tax_rate: 0,
    tax_amount: 0,
    discount: 0,
    shipping: 0,
    total: 0,
    paid: 0,
    due: 0,
    status: "",
    payment_status: "",
    notes: ""
  })

  // Fetch purchases
  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/purchases')
        if (!res.ok) throw new Error("Failed to fetch purchases")
        const data = await res.json()
        setPurchases(data.data || [])
      } catch (error) {
        toast.error("Failed to load purchases")
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchPurchases()
  }, [])

  // Filter purchases based on search
  const filteredPurchases = Array.isArray(purchases) ? purchases.filter(purchase =>
    purchase.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    purchase.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    purchase.warehouse_name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : []

  // Handle edit purchase
  const handleEdit = async () => {
    if (!selectedPurchase) return
    
    try {
      const res = await fetch('/api/purchases', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, id: selectedPurchase.id })
      })
      
      if (!res.ok) throw new Error("Failed to update purchase")
      
      const updatedPurchase = await res.json()
      setPurchases(prevPurchases => Array.isArray(prevPurchases) ? prevPurchases.map(p =>
        p.id === selectedPurchase.id ? { ...p, ...updatedPurchase } : p
      ) : [])
      setShowEditModal(false)
      resetForm()
      toast.success("Purchase updated successfully")
    } catch (error) {
      toast.error("Failed to update purchase")
      console.error(error)
    }
  }

  // Handle delete purchase
  const handleDelete = async () => {
    if (!selectedPurchase) return
    
    try {
      const res = await fetch(`/api/purchases?id=${selectedPurchase.id}`, {
        method: 'DELETE'
      })
      
      if (!res.ok) throw new Error("Failed to delete purchase")
      
      setPurchases(prevPurchases => Array.isArray(prevPurchases) ? prevPurchases.filter(p => p.id !== selectedPurchase.id) : [])
      setShowDeleteModal(false)
      toast.success("Purchase deleted successfully")
    } catch (error) {
      toast.error("Failed to delete purchase")
      console.error(error)
    }
  }

  // Open view modal
  const openViewModal = (purchase: Purchase) => {
    setSelectedPurchase(purchase)
    setShowViewModal(true)
  }

  // Open edit modal
  const openEditModal = (purchase: Purchase) => {
    setSelectedPurchase(purchase)
    setFormData({
      reference: purchase.reference || "",
      supplier_id: "",
      warehouse_id: "",
      date: purchase.date || "",
      subtotal: purchase.subtotal || 0,
      tax_rate: 0,
      tax_amount: purchase.tax_amount || 0,
      discount: purchase.discount || 0,
      shipping: purchase.shipping || 0,
      total: purchase.total || 0,
      paid: purchase.paid || 0,
      due: purchase.due || 0,
      status: purchase.status || "",
      payment_status: purchase.payment_status || "",
      notes: purchase.notes || ""
    })
    setShowEditModal(true)
  }

  // Open delete modal
  const openDeleteModal = (purchase: Purchase) => {
    setSelectedPurchase(purchase)
    setShowDeleteModal(true)
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      reference: "",
      supplier_id: "",
      warehouse_id: "",
      date: "",
      subtotal: 0,
      tax_rate: 0,
      tax_amount: 0,
      discount: 0,
      shipping: 0,
      total: 0,
      paid: 0,
      due: 0,
      status: "",
      payment_status: "",
      notes: ""
    })
  }

  // Export to PDF
  const handleExportPDF = async () => {
    try {
      // Calculate summary data
      const statusSummary = Array.from(
        filteredPurchases.reduce((acc, purchase) => {
          const status = purchase.status || 'unknown'
          if (!acc.has(status)) {
            acc.set(status, { status, count: 0, amount: 0 })
          }
          const existing = acc.get(status)!
          existing.count++
          existing.amount += Number(purchase.total || 0)
          return acc
        }, new Map())
      ).map(([_, data]) => data)

      const supplierSummary = Array.from(
        filteredPurchases.reduce((acc, purchase) => {
          const supplier = purchase.supplier_name || 'Unknown'
          if (!acc.has(supplier)) {
            acc.set(supplier, { supplier_name: supplier, count: 0, amount: 0 })
          }
          const existing = acc.get(supplier)!
          existing.count++
          existing.amount += Number(purchase.total || 0)
          return acc
        }, new Map())
      ).map(([_, data]) => data).slice(0, 10) // Top 10 suppliers

      const reportData = {
        title: 'Purchase Report',
        template: 'purchases-report',
        data: filteredPurchases,
        dateRange: dateRange,
        filters: searchTerm ? [{ label: 'Search', value: searchTerm }] : undefined,
        summary: [
          { label: 'Total Purchases', value: filteredPurchases.length },
          { label: 'Total Amount', value: filteredPurchases.reduce((sum, purchase) => sum + Number(purchase.total || 0), 0), isCurrency: true },
          { label: 'Total Paid', value: filteredPurchases.reduce((sum, purchase) => sum + Number(purchase.paid || 0), 0), isCurrency: true },
          { label: 'Total Due', value: filteredPurchases.reduce((sum, purchase) => sum + Number(purchase.due || 0), 0), isCurrency: true }
        ],
        showSummaryByStatus: true,
        showSummaryBySupplier: true,
        statusSummary,
        supplierSummary
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
      a.download = `purchases-report-${new Date().toISOString().split('T')[0]}.pdf`
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

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <span>Reports</span>
            <span>|</span>
            <span>Purchase Report</span>
          </div>
          <h1 className="text-2xl font-bold">Purchase Report</h1>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-4">
              <DateRangePicker value={dateRange} onChange={setDateRange} />
              <div className="relative">
                <Input 
                  placeholder="Search this table..." 
                  className="w-64" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="text-blue-600 bg-transparent">
                🔍 Filter
              </Button>
              <Button variant="outline" className="text-green-600 bg-transparent" onClick={handleExportPDF}>
                📄 PDF
              </Button>
              <Button variant="outline" className="text-red-600 bg-transparent">
                📊 EXCEL
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
                  <th className="text-left p-3">Grand Total</th>
                  <th className="text-left p-3">Paid</th>
                  <th className="text-left p-3">Due</th>
                  <th className="text-left p-3">Payment Status</th>
                  <th className="text-left p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} className="text-center p-6">Loading...</td>
                  </tr>
                ) : filteredPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center p-6">No purchases found.</td>
                  </tr>
                ) : (
                  filteredPurchases.map((purchase) => (
                    <tr key={purchase.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">{new Date(purchase.date).toLocaleDateString()}</td>
                      <td className="p-3">{purchase.reference}</td>
                      <td className="p-3">{purchase.supplier_name || "-"}</td>
                      <td className="p-3">{purchase.warehouse_name || "-"}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          purchase.status === "received" ? "bg-green-100 text-green-800" : 
                          purchase.status === "pending" ? "bg-yellow-100 text-yellow-800" : 
                          "bg-red-100 text-red-800"
                        }`}>
                          {purchase.status}
                        </span>
                      </td>
                      <td className="p-3">${Number(purchase.total || 0) }</td>
                      <td className="p-3">${Number(purchase.paid || 0) }</td>
                      <td className="p-3">${Number(purchase.due || 0) }</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          purchase.payment_status === "paid" ? "bg-green-100 text-green-800" : 
                          purchase.payment_status === "partial" ? "bg-yellow-100 text-yellow-800" : 
                          "bg-red-100 text-red-800"
                        }`}>
                          {purchase.payment_status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openViewModal(purchase)}
                          >
                            <Eye className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(purchase)}
                          >
                            <Edit className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteModal(purchase)}
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

          <div className="p-4 border-t flex items-center justify-between">
            <div className="text-sm text-gray-600">Rows per page: 10</div>
            <div className="text-sm text-gray-600">
              {filteredPurchases.length > 0 
                ? `1 - ${Math.min(filteredPurchases.length, 10)} of ${filteredPurchases.length}` 
                : '0 - 0 of 0'}
            </div>
          </div>
        </div>

        {/* View Purchase Modal */}
        {selectedPurchase && (
          <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Purchase Details</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 p-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Reference</label>
                  <p className="mt-1 text-sm">{selectedPurchase.reference}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Date</label>
                  <p className="mt-1 text-sm">{new Date(selectedPurchase.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Supplier</label>
                  <p className="mt-1 text-sm">{selectedPurchase.supplier_name || "-"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Warehouse</label>
                  <p className="mt-1 text-sm">{selectedPurchase.warehouse_name || "-"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <p className="mt-1 text-sm">{selectedPurchase.status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Payment Status</label>
                  <p className="mt-1 text-sm">{selectedPurchase.payment_status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Subtotal</label>
                  <p className="mt-1 text-sm">${Number(selectedPurchase.subtotal || 0) }</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Tax Amount</label>
                  <p className="mt-1 text-sm">${Number(selectedPurchase.tax_amount || 0) }</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Discount</label>
                  <p className="mt-1 text-sm">${Number(selectedPurchase.discount || 0) }</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Shipping</label>
                  <p className="mt-1 text-sm">${Number(selectedPurchase.shipping || 0) }</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Total</label>
                  <p className="mt-1 text-sm">${Number(selectedPurchase.total || 0) }</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Paid</label>
                  <p className="mt-1 text-sm">${Number(selectedPurchase.paid || 0) }</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Due</label>
                  <p className="mt-1 text-sm">${Number(selectedPurchase.due || 0) }</p>
                </div>
                {selectedPurchase.notes && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-500">Notes</label>
                    <p className="mt-1 text-sm">{selectedPurchase.notes}</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Edit Purchase Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Purchase</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 p-4">
              <div>
                <label className="text-sm font-medium">Reference *</label>
                <Input
                  placeholder="Reference"
                  value={formData.reference}
                  onChange={(e) => setFormData({...formData, reference: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Date *</label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Subtotal</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.subtotal}
                  onChange={(e) => setFormData({...formData, subtotal: parseFloat(e.target.value) || 0})}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Tax Amount</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.tax_amount}
                  onChange={(e) => setFormData({...formData, tax_amount: parseFloat(e.target.value) || 0})}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Discount</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.discount}
                  onChange={(e) => setFormData({...formData, discount: parseFloat(e.target.value) || 0})}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Shipping</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.shipping}
                  onChange={(e) => setFormData({...formData, shipping: parseFloat(e.target.value) || 0})}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Total</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.total}
                  onChange={(e) => setFormData({...formData, total: parseFloat(e.target.value) || 0})}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Paid</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.paid}
                  onChange={(e) => setFormData({...formData, paid: parseFloat(e.target.value) || 0})}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Due</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.due}
                  onChange={(e) => setFormData({...formData, due: parseFloat(e.target.value) || 0})}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="mt-1 w-full p-2 border rounded"
                >
                  <option value="pending">Pending</option>
                  <option value="received">Received</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Payment Status</label>
                <select
                  value={formData.payment_status}
                  onChange={(e) => setFormData({...formData, payment_status: e.target.value})}
                  className="mt-1 w-full p-2 border rounded"
                >
                  <option value="unpaid">Unpaid</option>
                  <option value="paid">Paid</option>
                  <option value="partial">Partial</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">Notes</label>
                <Input
                  placeholder="Notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div className="col-span-2">
                <Button 
                  className="bg-purple-600 hover:bg-purple-700" 
                  onClick={handleEdit}
                  disabled={!formData.reference || !formData.date}
                >
                  Update
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        {selectedPurchase && (
          <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Delete Purchase</DialogTitle>
              </DialogHeader>
              <div className="p-4">
                <p className="text-sm text-gray-600 mb-4">
                  Are you sure you want to delete purchase "{selectedPurchase.reference}"? This action cannot be undone.
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowDeleteModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="bg-red-600 hover:bg-red-700" 
                    onClick={handleDelete}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  )
}
