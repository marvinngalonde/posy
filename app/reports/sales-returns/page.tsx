"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "../../../components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DateRangePicker } from "../../../components/date-range-picker"
import { Search, FileDown, Eye, Edit, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface SalesReturn {
  id: string
  reference: string
  customer_name: string
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

export default function SalesReturnsReport() {
  const [salesReturns, setSalesReturns] = useState<SalesReturn[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [dateRange, setDateRange] = useState("1970-01-01 - 2025-07-01")
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedReturn, setSelectedReturn] = useState<SalesReturn | null>(null)
  const [formData, setFormData] = useState({
    reference: "",
    customer_id: "",
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

  // Fetch sales returns
  useEffect(() => {
    const fetchSalesReturns = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/sales-returns')
        if (!res.ok) throw new Error("Failed to fetch sales returns")
        const data = await res.json()
        setSalesReturns(data.data || [])
      } catch (error) {
        toast.error("Failed to load sales returns")
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchSalesReturns()
  }, [])

  // Filter sales returns based on search
  const filteredReturns = Array.isArray(salesReturns) ? salesReturns.filter(returnItem =>
    returnItem.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    returnItem.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    returnItem.warehouse_name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : []

  // Handle edit sales return
  const handleEdit = async () => {
    if (!selectedReturn) return
    
    try {
      const res = await fetch('/api/sales-returns', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, id: selectedReturn.id })
      })
      
      if (!res.ok) throw new Error("Failed to update sales return")
      
      const updatedReturn = await res.json()
      setSalesReturns(prevReturns => Array.isArray(prevReturns) ? prevReturns.map(r =>
        r.id === selectedReturn.id ? { ...r, ...updatedReturn } : r
      ) : [])
      setShowEditModal(false)
      resetForm()
      toast.success("Sales return updated successfully")
    } catch (error) {
      toast.error("Failed to update sales return")
      console.error(error)
    }
  }

  // Handle delete sales return
  const handleDelete = async () => {
    if (!selectedReturn) return
    
    try {
      const res = await fetch(`/api/sales-returns?id=${selectedReturn.id}`, {
        method: 'DELETE'
      })
      
      if (!res.ok) throw new Error("Failed to delete sales return")
      
      setSalesReturns(prevReturns => Array.isArray(prevReturns) ? prevReturns.filter(r => r.id !== selectedReturn.id) : [])
      setShowDeleteModal(false)
      toast.success("Sales return deleted successfully")
    } catch (error) {
      toast.error("Failed to delete sales return")
      console.error(error)
    }
  }

  // Open view modal
  const openViewModal = (returnItem: SalesReturn) => {
    setSelectedReturn(returnItem)
    setShowViewModal(true)
  }

  // Open edit modal
  const openEditModal = (returnItem: SalesReturn) => {
    setSelectedReturn(returnItem)
    setFormData({
      reference: returnItem.reference || "",
      customer_id: "",
      warehouse_id: "",
      date: returnItem.date || "",
      subtotal: returnItem.subtotal || 0,
      tax_rate: 0,
      tax_amount: returnItem.tax_amount || 0,
      discount: returnItem.discount || 0,
      shipping: returnItem.shipping || 0,
      total: returnItem.total || 0,
      paid: returnItem.paid || 0,
      due: returnItem.due || 0,
      status: returnItem.status || "",
      payment_status: returnItem.payment_status || "",
      notes: returnItem.notes || ""
    })
    setShowEditModal(true)
  }

  // Open delete modal
  const openDeleteModal = (returnItem: SalesReturn) => {
    setSelectedReturn(returnItem)
    setShowDeleteModal(true)
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      reference: "",
      customer_id: "",
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
  const handleExportPDF = () => {
    const doc = new jsPDF()
    
    doc.text('Sales Returns Report', 14, 16)
    
    const tableData = filteredReturns.map(returnItem => [
      new Date(returnItem.date).toLocaleDateString(),
      returnItem.reference,
      returnItem.customer_name || "-",
      returnItem.warehouse_name || "-",
      returnItem.status,
      `$${Number(returnItem.total || 0) }`,
      `$${Number(returnItem.paid || 0) }`,
      `$${Number(returnItem.due || 0) }`,
      returnItem.payment_status
    ])
    
    autoTable(doc, {
      head: [['Date', 'Reference', 'Customer', 'Warehouse', 'Status', 'Total', 'Paid', 'Due', 'Payment Status']],
      body: tableData,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [26, 35, 126] }
    })
    
    doc.save('sales-returns.pdf')
  }

  // Export to Excel
  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredReturns.map(returnItem => ({
        Date: new Date(returnItem.date).toLocaleDateString(),
        Reference: returnItem.reference,
        Customer: returnItem.customer_name || "-",
        Warehouse: returnItem.warehouse_name || "-",
        Status: returnItem.status,
        Total: `$${Number(returnItem.total || 0) }`,
        Paid: `$${Number(returnItem.paid || 0) }`,
        Due: `$${Number(returnItem.due || 0) }`,
        'Payment Status': returnItem.payment_status
      }))
    )
    
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Returns")
    XLSX.writeFile(workbook, "sales-returns.xlsx")
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <span>Reports</span>
            <span>|</span>
            <span>Sales Returns Report</span>
          </div>
          <h1 className="text-2xl font-bold">Sales Returns Report</h1>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-4">
              <DateRangePicker value={dateRange} onChange={setDateRange} />
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search this table..." 
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
                onClick={handleExportPDF}
              >
                <FileDown className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
              >
                <FileDown className="h-4 w-4 mr-2" />
                EXCEL
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
                ) : filteredReturns.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center p-6">No sales returns found.</td>
                  </tr>
                ) : (
                  filteredReturns.map((returnItem) => (
                    <tr key={returnItem.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">{new Date(returnItem.date).toLocaleDateString()}</td>
                      <td className="p-3">{returnItem.reference}</td>
                      <td className="p-3">{returnItem.customer_name || "-"}</td>
                      <td className="p-3">{returnItem.warehouse_name || "-"}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          returnItem.status === "completed" ? "bg-green-100 text-green-800" : 
                          returnItem.status === "pending" ? "bg-yellow-100 text-yellow-800" : 
                          "bg-red-100 text-red-800"
                        }`}>
                          {returnItem.status}
                        </span>
                      </td>
                      <td className="p-3">${Number(returnItem.total || 0) }</td>
                      <td className="p-3">${Number(returnItem.paid || 0) }</td>
                      <td className="p-3">${Number(returnItem.due || 0) }</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          returnItem.payment_status === "paid" ? "bg-green-100 text-green-800" : 
                          returnItem.payment_status === "partial" ? "bg-yellow-100 text-yellow-800" : 
                          "bg-red-100 text-red-800"
                        }`}>
                          {returnItem.payment_status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openViewModal(returnItem)}
                          >
                            <Eye className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(returnItem)}
                          >
                            <Edit className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteModal(returnItem)}
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
              {filteredReturns.length > 0 
                ? `1 - ${Math.min(filteredReturns.length, 10)} of ${filteredReturns.length}` 
                : '0 - 0 of 0'}
            </div>
          </div>
        </div>

        {/* View Sales Return Modal */}
        {selectedReturn && (
          <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Sales Return Details</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 p-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Reference</label>
                  <p className="mt-1 text-sm">{selectedReturn.reference}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Date</label>
                  <p className="mt-1 text-sm">{new Date(selectedReturn.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Customer</label>
                  <p className="mt-1 text-sm">{selectedReturn.customer_name || "-"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Warehouse</label>
                  <p className="mt-1 text-sm">{selectedReturn.warehouse_name || "-"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <p className="mt-1 text-sm">{selectedReturn.status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Payment Status</label>
                  <p className="mt-1 text-sm">{selectedReturn.payment_status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Subtotal</label>
                  <p className="mt-1 text-sm">${Number(selectedReturn.subtotal || 0) }</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Tax Amount</label>
                  <p className="mt-1 text-sm">${Number(selectedReturn.tax_amount || 0) }</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Discount</label>
                  <p className="mt-1 text-sm">${Number(selectedReturn.discount || 0) }</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Shipping</label>
                  <p className="mt-1 text-sm">${Number(selectedReturn.shipping || 0) }</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Total</label>
                  <p className="mt-1 text-sm">${Number(selectedReturn.total || 0) }</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Paid</label>
                  <p className="mt-1 text-sm">${Number(selectedReturn.paid || 0) }</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Due</label>
                  <p className="mt-1 text-sm">${Number(selectedReturn.due || 0) }</p>
                </div>
                {selectedReturn.notes && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-500">Notes</label>
                    <p className="mt-1 text-sm">{selectedReturn.notes}</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Edit Sales Return Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Sales Return</DialogTitle>
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
                  <option value="completed">Completed</option>
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
        {selectedReturn && (
          <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Delete Sales Return</DialogTitle>
              </DialogHeader>
              <div className="p-4">
                <p className="text-sm text-gray-600 mb-4">
                  Are you sure you want to delete sales return "{selectedReturn.reference}"? This action cannot be undone.
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
