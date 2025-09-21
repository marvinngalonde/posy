"use client"

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
import { use } from "react"
import { useGetQuotationByIdQuery, useUpdateQuotationMutation } from '@/lib/slices/quotationsApi'
import { useGetProductsQuery } from '@/lib/slices/productsApi'

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

interface QuotationItem {
  id: string
  product_id: string
  name: string
  code: string
  price: number
  stock: number
  quantity: number
  discount: number
  tax: number
}

interface Quotation {
  id: string
  reference: string
  date: string
  valid_until?: string
  customer_id: string
  warehouse_id: string
  subtotal: number
  tax_rate: number
  tax_amount: number
  discount: number
  shipping: number
  total: number
  status: string
  notes?: string
  created_by: string
  items: QuotationItem[]
}

export default function EditQuotation({ params }: { params: Promise<PageParams> }) {
  const [id, setId] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])

  // Form state
  const [date, setDate] = useState("")
  const [validUntil, setValidUntil] = useState("")
  const [customerId, setCustomerId] = useState("")
  const [warehouseId, setWarehouseId] = useState("")
  const [items, setItems] = useState<QuotationItem[]>([])
  const [orderTax, setOrderTax] = useState(0)
  const [discount, setDiscount] = useState(0)
  const [shipping, setShipping] = useState(0)
  const [status, setStatus] = useState("pending")
  const [note, setNote] = useState("")

  const router = useRouter()

  // RTK Query hooks
  const { data: quotationData, isLoading: isQuotationLoading } = useGetQuotationByIdQuery(id, {
    skip: !id
  })
  const [updateQuotation] = useUpdateQuotationMutation()
  const { data: productsData } = useGetProductsQuery({ page: 1, limit: 1000, search: searchQuery })

  // Get params
  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setId(resolvedParams.id)
    }
    getParams()
  }, [params])

  // Load reference data (customers, warehouses)
  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        setLoading(true)
        
        // Fetch customers and warehouses in parallel
        const [customersRes, warehousesRes] = await Promise.all([
          fetch('/api/customers'),
          fetch('/api/settings/warehouses')
        ])

        if (!customersRes.ok || !warehousesRes.ok) {
          throw new Error("Failed to fetch reference data")
        }

        const customersData = await customersRes.json()
        const warehousesData = await warehousesRes.json()
        
        setCustomers(customersData.data || [])
        setWarehouses(warehousesData)
      } catch (error) {
        console.error("Error fetching reference data:", error)
        toast.error("Failed to load reference data")
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchReferenceData()
    }
  }, [id])

  // Update form when quotation data is loaded
  useEffect(() => {
    if (quotationData) {
      // Handle date conversion
      const formatDate = (date: Date | string) => {
        if (typeof date === 'string') return date
        return date.toISOString().split('T')[0]
      }
      
      setDate(formatDate(quotationData.date))
      setValidUntil(quotationData.valid_until ? formatDate(quotationData.valid_until) : "")
      setCustomerId(quotationData.customer_id || "")
      setWarehouseId(quotationData.warehouse_id || "")
      // Note: items will be loaded separately since they're not part of the main Quotation type
      setOrderTax(quotationData.tax_rate || 0)
      setDiscount(quotationData.discount || 0)
      setShipping(quotationData.shipping || 0)
      setStatus(quotationData.status || "pending")
      setNote(quotationData.notes || "")
    }
  }, [quotationData])

  // Load quotation items separately
  useEffect(() => {
    const loadQuotationItems = async () => {
      if (!id) return
      
      try {
        const response = await fetch(`/api/quotations/items?quotation_id=${id}`)
        if (response.ok) {
          const result = await response.json()
          setItems(result.data || [])
        }
      } catch (error) {
        console.error("Error loading quotation items:", error)
      }
    }

    loadQuotationItems()
  }, [id])

  // Calculations - matching create page logic
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const price = Number(item.price) || 0
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

  // Format date for input fields
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toISOString().split('T')[0]
  }

  // Product search using RTK Query
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search term")
      return
    }

    setIsSearching(true)
    try {
      // The products data is already fetched via RTK Query
      if (productsData?.data) {
        setSearchResults(productsData.data)
        if (productsData.data.length === 0) {
          toast.info("No products found matching your search")
        }
      }
    } catch (error) {
      console.error("Search error:", error)
      toast.error("Failed to search products")
    } finally {
      setIsSearching(false)
    }
  }

  // Item management - matching create page
  const addProduct = (product: Product) => {
    setItems(prev => [
      ...prev,
      {
        id: product.id,
        product_id: product.id,
        name: product.name,
        code: product.code,
        price: product.price,
        stock: product.stock,
        quantity: 1,
        discount: 0,
        tax: 0
      }
    ])
    setSearchQuery("")
    setSearchResults([])
  }

  const updateItem = (id: string, field: string, value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, [field]: numValue } : item
      )
    )
  }

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  // Submit handler - using RTK Query mutation
  const handleSubmit = async () => {
    if (!customerId || !warehouseId || items.length === 0) {
      toast.error("Please fill all required fields and add at least one product")
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        id: id,
        reference: `QT-${Date.now().toString().slice(-6)}`,
        date,
        valid_until: validUntil || null,
        customer_id: customerId,
        warehouse_id: warehouseId,
        subtotal: Number(Number(subtotal)),
        tax_rate: Number(Number(orderTax)),
        tax_amount: Number(Number(taxAmount)),
        discount: Number(Number(discount)),
        shipping: Number(Number(shipping)),
        total: Number(Number(grandTotal)),
        status,
        notes: note || null,
        items: items.map(item => ({
          product_id: item.id,
          quantity: Number(Number(item.quantity)),
          unit_price: Number(Number(item.price)),
          discount: Number(Number(item.discount)),
          tax: Number(Number(item.tax)),
          subtotal: Number(
            (Number(item.price) * Number(item.quantity) - Number(item.discount) + Number(item.tax))
          )
        }))
      }

      // Use RTK Query mutation
      await updateQuotation({ id, data: payload }).unwrap()

      toast.success("Quotation updated successfully")
      router.push("/quotations/list")
    } catch (error) {
      console.error("Update error:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to update quotation"
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
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
            <span>Quotation List</span>
            <span>|</span>
            <span>Edit Quotation</span>
          </div>
          <h1 className="text-2xl font-bold">Edit Quotation</h1>
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
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose Customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">Warehouse *</Label>
              <Select value={warehouseId} onValueChange={setWarehouseId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose Warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map(w => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valid Until</Label>
              <Input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
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

                {searchResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border">
                    {searchResults.map((product) => (
                      <div
                        key={product.id}
                        className="p-2 hover:bg-gray-50 cursor-pointer border-b"
                        onClick={() => {
                          addProduct(product)
                          setSearchResults([])
                          setSearchQuery("")
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
                        <td className="p-3 border">${Number(item.price || 0)}</td>
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
                                ${(
                                  (Number(item.price || 0) * Number(item.quantity || 0)) - 
                                  Number(item.discount || 0) + 
                                  Number(item.tax || 0)
                                )}
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
                {isSubmitting ? "Updating..." : "Update Quotation"}
              </Button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Order Tax</span>
                    <span>
                      ${taxAmount} ({orderTax} %)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discount</span>
                    <span>${discount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>${shipping}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Grand Total</span>
                    <span>${grandTotal}</span>
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