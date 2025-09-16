import DashboardLayout from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
import { Loader2, Search, Minus, Plus, X } from "lucide-react"
import { toast } from "sonner"
import type React from "react"
import { useGetInvoiceByIdQuery, useUpdateInvoiceMutation, useGetInvoiceItemsQuery } from '@/lib/slices/invoicesApi'
import { useGetProductsQuery } from '@/lib/slices/productsApi'
import { useGetCustomersQuery } from "@/lib/slices/customersApi"
import { useGetWarehousesQuery } from "@/lib/slices/settingsApi"
import { InvoiceItem } from "@/lib/types/invoice"
import { v4 as uuidv4 } from "uuid"

// Interfaces matching your create page
interface PageParams {
  id: string
}

interface Product {
  id: string
  code: string
  name: string
  price: number
  stock: number
}

interface Customer {
  id: string
  name: string
}

interface Warehouse {
  id: string
  name: string
}

export default function EditInvoice({ params }: { params: Promise<PageParams> }) {
  const [id, setId] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Product[]>([])

  // Form state
  const [date, setDate] = useState("")
  const [customerId, setCustomerId] = useState("")
  const [warehouseId, setWarehouseId] = useState("")
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [orderTax, setOrderTax] = useState(0)
  const [discount, setDiscount] = useState(0)
  const [shipping, setShipping] = useState(0)
  const [status, setStatus] = useState("pending")
  const [paymentStatus, setPaymentStatus] = useState("unpaid")
  const [paidAmount, setPaidAmount] = useState(0)
  const [note, setNote] = useState("")

  const router = useRouter()

  // RTK Query hooks
  const { data: invoiceData, isLoading: isInvoiceLoading } = useGetInvoiceByIdQuery(id, {
    skip: !id
  })
  const { data: customersResponse, isLoading: customersLoading } = useGetCustomersQuery({ page: 1, limit: 1000, search: "" })
  const { data: warehousesData, isLoading: warehousesLoading } = useGetWarehousesQuery()
  const { data: productsResponse } = useGetProductsQuery({ page: 1, limit: 1000, search: searchQuery })
  const [updateInvoice] = useUpdateInvoiceMutation()

  const customers = useMemo(() => customersResponse?.data || [], [customersResponse])
  const warehouses = useMemo(() => warehousesData || [], [warehousesData])
  const searchProductsData = useMemo(() => productsResponse?.data || [], [productsResponse])

  // Get params
  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setId(resolvedParams.id)
    }
    getParams()
  }, [params])

  // Load reference data (customers, warehouses) and initial invoice data
  useEffect(() => {
    if (id && invoiceData && customers.length > 0 && warehouses.length > 0) {
      setDate(invoiceData.date || new Date().toISOString().split('T')[0])
      setCustomerId(invoiceData.customer_id || (customers.length > 0 ? customers[0].id : ""))
      setWarehouseId(invoiceData.warehouse_id || (warehouses.length > 0 ? warehouses[0].id : ""))
      setOrderTax(invoiceData.tax_rate ?? 0)
      setDiscount(invoiceData.discount ?? 0)
      setShipping(invoiceData.shipping ?? 0)
      setStatus(invoiceData.status || "pending")
      setPaymentStatus(invoiceData.payment_status || "unpaid")
      setPaidAmount(invoiceData.paid ?? 0)
      setNote(invoiceData.notes || "")
      setLoading(false)
    } else if (id && !isInvoiceLoading && customersLoading && warehousesLoading) {
      // If data fetching is complete but no invoiceData, then it's not found
      toast.error("Invoice not found.")
      router.push("/invoice/list")
    }
  }, [id, invoiceData, customers, warehouses, customersLoading, warehousesLoading, isInvoiceLoading, router])

  // Load invoice items separately
  const { data: invoiceItemsData, isLoading: isInvoiceItemsLoading } = useGetInvoiceItemsQuery(id, { skip: !id });

  useEffect(() => {
    if (invoiceItemsData) {
      setItems(invoiceItemsData)
    }
  }, [invoiceItemsData])

  // Calculations - matching create page logic
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const price = Number(item.unit_price) || 0
      const quantity = Number(item.quantity) || 0
      return sum + (price * quantity)
    }, 0)
  }, [items])

  const taxAmount = useMemo(() => {
    const taxRate = Number(orderTax) || 0
    return subtotal * (taxRate / 100)
  }, [subtotal, orderTax])

  const grandTotal = useMemo(() => {
    const discountValue = Number(discount) || 0
    const shippingValue = Number(shipping) || 0
    return subtotal + taxAmount - discountValue + shippingValue
  }, [subtotal, taxAmount, discount, shipping])

  const dueAmount = useMemo(() => Math.max(0, grandTotal - paidAmount), [grandTotal, paidAmount]);

  // Product search using RTK Query
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search term")
      return
    }

    setIsSearching(true)
    setSearchResults(searchProductsData.filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.code.toLowerCase().includes(searchQuery.toLowerCase())
    ))
    setIsSearching(false)
    if (searchResults.length === 0) {
      toast.info("No products found matching your search")
    }
  }

  // Item management - matching create page
  const addProduct = (product: Product) => {
    setItems(prev => {
      const existingItem = prev.find(item => item.product_id === product.id);
      if (existingItem) {
        return prev.map(item => 
          item.product_id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      } else {
        return [
          ...prev,
          {
            id: uuidv4(), // Generate a new UUID for the invoice item
            invoice_id: id, // Use the current invoice ID
            product_id: product.id,
            name: product.name,
            code: product.code,
            unit_price: product.price,
            stock: product.stock,
            quantity: 1,
            discount: 0,
            tax: 0,
            subtotal: product.price,
          },
        ];
      }
    });
    setSearchQuery("")
    setSearchResults([])
  }

  const updateItem = (itemId: string, field: string, value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value
    setItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, [field]: numValue } : item
      )
    )
  }

  const removeItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId))
  }

  // Submit handler - using RTK Query mutation
  const handleSubmit = async () => {
    if (!customerId || !warehouseId || items.length === 0) {
      toast.error("Please fill all required fields and add at least one product")
      return
    }

    setIsSubmitting(true)
    try {
      const user_id = localStorage.getItem('UserId');

      const payload = {
        reference: invoiceData?.reference || `INV-${Date.now().toString().slice(-6)}`,
        date,
        customer_id: customerId,
        warehouse_id: warehouseId,
        subtotal: Number(subtotal.toFixed(2)),
        tax_rate: Number(orderTax.toFixed(2)),
        tax_amount: Number(taxAmount.toFixed(2)),
        discount: Number(discount.toFixed(2)),
        shipping: Number(shipping.toFixed(2)),
        total: Number(grandTotal.toFixed(2)),
        paid: Number(paidAmount.toFixed(2)),
        due: Number(dueAmount.toFixed(2)),
        status,
        payment_status: paymentStatus,
        notes: note || null,
        created_by: invoiceData?.created_by || user_id || null,
        items: items.map(item => ({
          product_id: item.product_id,
          quantity: Number(Number(item.quantity || 0).toFixed(2)),
          unit_price: Number(Number(item.unit_price || 0).toFixed(2)),
          discount: Number(Number(item.discount || 0).toFixed(2)),
          tax: Number(Number(item.tax || 0).toFixed(2)),
          subtotal: Number((Number(item.unit_price || 0) * Number(item.quantity || 0) - Number(item.discount || 0) + Number(item.tax || 0)).toFixed(2)),
        })),
      }

      await updateInvoice({ id, data: payload }).unwrap()

      toast.success("Invoice updated successfully")
      router.push("/invoice/list")
    } catch (error: any) {
      console.error("Update error:", error)
      toast.error(error.data?.message || "Failed to update invoice")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading || isInvoiceLoading || customersLoading || warehousesLoading || isInvoiceItemsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    )
  }

  // UI - Matches create page structure exactly
  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <span>Sales</span>
            <span>|</span>
            <span>Edit Invoice</span>
          </div>
          <h1 className="text-2xl font-bold">Edit Invoice</h1>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div>
              <Label className="text-sm font-medium">Date *</Label>
              <Input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Customer *</Label>
              <Select value={customerId} onValueChange={setCustomerId} disabled={customersLoading}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose Customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">Warehouse *</Label>
              <Select value={warehouseId} onValueChange={setWarehouseId} disabled={warehousesLoading}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose Warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map(w => (
                    <SelectItem key={w.id} value={w.id.toString()}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">Paid Amount</Label>
              <Input
                type="number"
                min={0}
                value={paidAmount}
                onChange={e => setPaidAmount(Number(e.target.value))}
                className="mt-1"
              />
            </div>
          </div>

          <div className="mb-6">
            <Label className="text-sm font-medium">Product</Label>
            <div className="relative mt-1 flex gap-2">
              <div className="relative flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Scan/Search Product by Code Name"
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    disabled={isSearching}
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  )}
                </div>

                {searchProductsData.length > 0 && searchQuery.trim() !== "" && (
                  <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border">
                    {searchProductsData.map((product) => (
                      <div
                        key={product.id}
                        className="p-2 hover:bg-gray-50 cursor-pointer border-b"
                        onClick={() => {
                          addProduct(product)
                          setSearchQuery("")
                          setSearchResults([])
                        }}
                      >
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-500">
                          {product.code} • Stock: {product.stock}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Button type="button" variant="outline" onClick={handleSearch} disabled={isSearching}>
                Search
              </Button>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium mb-3">Order items *</h3>
            <div className="overflow-x-auto">
              <table className="w-full border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 border">#</th>
                    <th className="text-left p-3 border">Product</th>
                    <th className="text-left p-3 border">Net Unit Price</th>
                    <th className="text-left p-3 border">Stock</th>
                    <th className="text-left p-3 border">Qty</th>
                    <th className="text-left p-3 border">Discount</th>
                    <th className="text-left p-3 border">Tax</th>
                    <th className="text-left p-3 border">Subtotal</th>
                    <th className="text-left p-3 border"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-gray-500 border">
                        No data Available
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => (
                      <tr key={item.id}>
                        <td className="p-3 border">{idx + 1}</td>
                        <td className="p-3 border">{item.name}</td>
                        <td className="p-3 border">${Number(item.unit_price || 0).toFixed(2)}</td>
                        <td className="p-3 border">{item.stock}</td>
                        <td className="p-3 border">
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 w-6 p-0"
                              onClick={() => updateItem(item.id, "quantity", Math.max(1, item.quantity - 1))}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="mx-2 text-sm w-6 text-center">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 w-6 p-0"
                              onClick={() => updateItem(item.id, "quantity", item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                        <td className="p-3 border">
                          <Input
                            type="number"
                            min={0}
                            value={item.discount}
                            onChange={e => updateItem(item.id, "discount", Number(e.target.value))}
                            className="w-20"
                          />
                        </td>
                        <td className="p-3 border">
                          <Input
                            type="number"
                            min={0}
                            value={item.tax}
                            onChange={e => updateItem(item.id, "tax", Number(e.target.value))}
                            className="w-20"
                          />
                        </td>
                        <td className="p-3 border">
                          ${((Number(item.unit_price || 0) * Number(item.quantity || 0)) - Number(item.discount || 0) + Number(item.tax || 0)).toFixed(2)}
                        </td>
                        <td className="p-3 border">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500"
                            onClick={() => removeItem(item.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Order Tax (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={orderTax}
                    onChange={e => setOrderTax(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Discount</Label>
                  <Input
                    type="number"
                    min={0}
                    value={discount}
                    onChange={e => setDiscount(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Shipping</Label>
                  <Input
                    type="number"
                    min={0}
                    value={shipping}
                    onChange={e => setShipping(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Status *</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">Payment Status *</Label>
                <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">Note</Label>
                <Textarea
                  placeholder="A few words ..."
                  className="mt-1"
                  rows={4}
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
              </div>

              <Button
                className="bg-[#1a237e] hover:bg-[#23308c] text-white"
                onClick={handleSubmit}
                disabled={isSubmitting}
                type='button'
              >
                {isSubmitting ? "Updating..." : "Update Invoice"}
              </Button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Order Tax</span>
                    <span>
                      ${taxAmount.toFixed(2)} ({orderTax} %)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discount</span>
                    <span>${discount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>${shipping.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Paid Amount</span>
                    <span>${paidAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Due Amount</span>
                    <span>${dueAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Grand Total</span>
                    <span>${grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </DashboardLayout>
  )
}
