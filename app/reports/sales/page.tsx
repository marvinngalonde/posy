"use client"

import { useState, useMemo } from "react"
import DashboardLayout from "../../../components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DateRangePicker } from "../../../components/date-range-picker"
import { Search, Eye, Edit, Trash2, FileDown, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useGetSalesQuery, useUpdateSaleMutation, useDeleteSaleMutation } from "@/lib/slices/salesApi"
import { calculateFinancialTotals, groupByStatus } from "@/lib/report-utils"
import type { DateRange } from "react-day-picker"

export default function SaleReport() {
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(50)
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), 0, 1),
    to: new Date()
  })
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedSale, setSelectedSale] = useState<any>(null)
  // RTK Query hooks
  const { data: salesData, isLoading, error, refetch } = useGetSalesQuery({
    page,
    limit,
    search: searchTerm,
    date_from: dateRange?.from?.toISOString().split('T')[0],
    date_to: dateRange?.to?.toISOString().split('T')[0]
  })
  const [updateSale] = useUpdateSaleMutation()
  const [deleteSale] = useDeleteSaleMutation()

  const sales = salesData?.data || []

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

  // Filter sales based on search (using RTK Query for server-side filtering)
  const filteredSales = useMemo(() => {
    return Array.isArray(sales) ? sales : []
  }, [sales])

  // Handle edit sale
  const handleEdit = async () => {
    if (!selectedSale) return

    try {
      await updateSale({
        id: selectedSale.id,
        data: formData
      }).unwrap()

      setShowEditModal(false)
      resetForm()
      toast.success("Sale updated successfully")
      refetch()
    } catch (error) {
      toast.error("Failed to update sale")
      console.error(error)
    }
  }

  // Handle delete sale
  const handleDelete = async () => {
    if (!selectedSale) return

    try {
      await deleteSale(selectedSale.id).unwrap()

      setShowDeleteModal(false)
      toast.success("Sale deleted successfully")
      refetch()
    } catch (error) {
      toast.error("Failed to delete sale")
      console.error(error)
    }
  }

  // Open view modal
  const openViewModal = (sale: Sale) => {
    setSelectedSale(sale)
    setShowViewModal(true)
  }

  // Open edit modal
  const openEditModal = (sale: Sale) => {
    setSelectedSale(sale)
    setFormData({
      reference: sale.reference || "",
      customer_id: "",
      warehouse_id: "",
      date: sale.date || "",
      subtotal: sale.subtotal || 0,
      tax_rate: 0,
      tax_amount: sale.tax_amount || 0,
      discount: sale.discount || 0,
      shipping: sale.shipping || 0,
      total: sale.total || 0,
      paid: sale.paid || 0,
      due: sale.due || 0,
      status: sale.status || "",
      payment_status: sale.payment_status || "",
      notes: sale.notes || ""
    })
    setShowEditModal(true)
  }

  // Open delete modal
  const openDeleteModal = (sale: Sale) => {
    setSelectedSale(sale)
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
  const handleExportPDF = async () => {
    try {
      const totals = calculateFinancialTotals(filteredSales)
      const statusSummary = groupByStatus(filteredSales, 'status')
      const paymentStatusSummary = groupByStatus(filteredSales, 'payment_status')

      const dateRangeString = dateRange?.from && dateRange?.to
        ? `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`
        : 'All Time'

      const reportData = {
        title: 'Sales Report',
        template: 'sales-report',
        data: filteredSales,
        searchTerm,
        dateRange: dateRangeString,
        summary: [
          { label: 'Total Sales', value: filteredSales.length },
          { label: 'Total Revenue', value: totals.total, isCurrency: true },
          { label: 'Total Paid', value: totals.paid, isCurrency: true },
          { label: 'Total Due', value: totals.due, isCurrency: true }
        ],
        totals,
        showSummaryByStatus: true,
        showSummaryByPaymentStatus: true,
        statusSummary,
        paymentStatusSummary
      }

      // Call server-side PDF generation API
      const pdfResponse = await fetch('/api/pdf/sales-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData)
      })

      if (!pdfResponse.ok) {
        throw new Error(`PDF generation failed: ${pdfResponse.statusText}`)
      }

      // Create download from response
      const pdfBlob = await pdfResponse.blob()
      const url = URL.createObjectURL(pdfBlob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `sales-report-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('Sales report PDF generated successfully!')
    } catch (error) {
      console.error('Error generating sales report PDF:', error)
      toast.error('Failed to generate sales report PDF.')
    }
  }

  // Export to Excel
  const handleExportExcel = () => {
    const headers = ['Date', 'Reference', 'Customer', 'Warehouse', 'Status', 'Grand Total', 'Paid', 'Due', 'Payment Status']
    const csvData = filteredSales.map(sale => [
      new Date(sale.date).toLocaleDateString(),
      sale.reference,
      sale.customers?.name || 'Walk-in Customer',
      sale.warehouses?.name || '-',
      sale.status,
      Number(sale.total || 0).toFixed(2),
      Number(sale.paid || 0).toFixed(2),
      Number(sale.due || 0).toFixed(2),
      sale.payment_status
    ])

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `sales-report-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Excel file downloaded successfully')
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <span>Reports</span>
            <span>|</span>
            <span>Sale Report</span>
          </div>
          <h1 className="text-2xl font-bold">Sale Report</h1>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-4">
              <DateRangePicker
                onDateChange={setDateRange}
                initialDateRange={dateRange}
              />
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
              <Button variant="outline" className="text-green-600 bg-transparent" onClick={handleExportPDF}>
                📄 PDF
              </Button>
              <Button variant="outline" className="text-red-600 bg-transparent" onClick={handleExportExcel}>
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
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="text-center p-6">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={10} className="text-center p-6 text-red-500">
                      Error loading sales data
                    </td>
                  </tr>
                ) : filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center p-6">No sales found.</td>
                  </tr>
                ) : (
                  filteredSales.map((sale) => (
                    <tr key={sale.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">{new Date(sale.date).toLocaleDateString()}</td>
                      <td className="p-3">{sale.reference}</td>
                      <td className="p-3">{sale.customers?.name || "Walk-in Customer"}</td>
                      <td className="p-3">{sale.warehouses?.name || "-"}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            sale.status === "completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {sale.status}
                        </span>
                      </td>
                      <td className="p-3">${Number(sale.total || 0) }</td>
                      <td className="p-3">${Number(sale.paid || 0) }</td>
                      <td className="p-3">${Number(sale.due || 0) }</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          sale.payment_status === "paid" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}>
                          {sale.payment_status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openViewModal(sale)}
                          >
                            <Eye className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(sale)}
                          >
                            <Edit className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteModal(sale)}
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
              {filteredSales.length > 0 
                ? `1 - ${Math.min(filteredSales.length, 10)} of ${filteredSales.length}` 
                : '0 - 0 of 0'}
            </div>
          </div>
        </div>

        {/* View Sale Modal */}
        {selectedSale && (
          <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Sale Details</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 p-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Reference</label>
                  <p className="mt-1 text-sm">{selectedSale.reference}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Date</label>
                  <p className="mt-1 text-sm">{new Date(selectedSale.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Customer</label>
                  <p className="mt-1 text-sm">{selectedSale.customer?.name || "Walk-in Customer"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Warehouse</label>
                  <p className="mt-1 text-sm">{selectedSale.warehouse?.name || "-"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <p className="mt-1 text-sm">{selectedSale.status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Payment Status</label>
                  <p className="mt-1 text-sm">{selectedSale.payment_status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Subtotal</label>
                  <p className="mt-1 text-sm">${Number(selectedSale.subtotal || 0) }</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Tax Amount</label>
                  <p className="mt-1 text-sm">${Number(selectedSale.tax_amount || 0) }</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Discount</label>
                  <p className="mt-1 text-sm">${Number(selectedSale.discount || 0) }</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Shipping</label>
                  <p className="mt-1 text-sm">${Number(selectedSale.shipping || 0) }</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Total</label>
                  <p className="mt-1 text-sm">${Number(selectedSale.total || 0) }</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Paid</label>
                  <p className="mt-1 text-sm">${Number(selectedSale.paid || 0) }</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Due</label>
                  <p className="mt-1 text-sm">${Number(selectedSale.due || 0) }</p>
                </div>
                {selectedSale.notes && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-500">Notes</label>
                    <p className="mt-1 text-sm">{selectedSale.notes}</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Edit Sale Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Sale</DialogTitle>
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
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
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
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
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
        {selectedSale && (
          <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Delete Sale</DialogTitle>
              </DialogHeader>
              <div className="p-4">
                <p className="text-sm text-gray-600 mb-4">
                  Are you sure you want to delete sale "{selectedSale.reference}"? This action cannot be undone.
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
