"use client"

import DashboardLayout from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Search, X } from "lucide-react"
import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { toast } from "sonner"
import type React from "react"
import { useParams, useRouter } from "next/navigation"
import {Purchase} from "@/lib/types/index"


interface Product {
  id: string
  name: string
  code: string
  cost: number
  quantity: number
}

interface PurchaseItem {
  id: string
  product_id: string
  product_name: string
  product_code: string
  quantity: number
  unit_cost: number
  discount: number
  tax: number
  subtotal: number
}

interface FormValues {
  date: string
  supplier_id: string
  warehouse_id: string
  tax_rate: number
  discount: number
  shipping: number
  status: string
  payment_status: string
  notes: string
}

export default function EditPurchase() {
  const router = useRouter()
  const unwrappedParams = useParams()
  const purchaseId = unwrappedParams.id as string
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [selectedProducts, setSelectedProducts] = useState<PurchaseItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [suppliers, setSuppliers] = useState<{id: string, name: string}[]>([])
  const [warehouses, setWarehouses] = useState<{id: string, name: string}[]>([])
  const [purchaseData, setPurchaseData] = useState<Purchase[]>([])
  

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>()




  // Fetch initial data
 useEffect(() => {
  const fetchInitialData = async () => {
    try {
      setIsLoading(true)

      const purchaseRes = await fetch(`/api/purchases?id=${purchaseId}`)
      if (!purchaseRes.ok) throw new Error("Failed to fetch purchase data")
      const purchase = await purchaseRes.json()

      const [suppliersRes, warehousesRes] = await Promise.all([
        fetch("/api/v2/suppliers"),
        fetch("/api/settings/warehouses"),
      ])

      if (!suppliersRes.ok || !warehousesRes.ok)
        throw new Error("Failed to fetch suppliers or warehouses")

      const suppliersData = await suppliersRes.json()
      const warehousesData = await warehousesRes.json()

      setSuppliers(suppliersData.data || suppliersData)
      setWarehouses(warehousesData.data || warehousesData)
      setPurchaseData(purchase)
      setSelectedProducts(purchase.items || [])

      console.log("suppliers", suppliersData)
      console.log("warehouses", warehousesData)

      // Only reset after options are ready
      reset({
        date: purchase.date.split("T")[0],
        supplier_id: purchase.supplier_id,
        warehouse_id: purchase.warehouse_id,
        tax_rate: purchase.tax_rate,
        discount: purchase.discount,
        shipping: purchase.shipping,
        status: purchase.status,
        payment_status: purchase.payment_status,
        notes: purchase.notes,
      })
    } catch (error) {
      toast.error("Failed to load purchase data")
      console.error(error)
      router.push("/purchases")
    } finally {
      setIsLoading(false)
    }
  }

  fetchInitialData()
}, [purchaseId, reset, router])



  // Search products with debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length < 2) {
        setFilteredProducts([])
        return
      }

      try {
        const res = await fetch(`/api/products?search=${searchQuery}`)
        if (!res.ok) throw new Error('Failed to search products')
        const data = await res.json()
        setFilteredProducts(data.slice(0, 5))
      } catch (error) {
        toast.error("Failed to search products")
        console.error(error)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Calculate totals
  const subtotal = selectedProducts.reduce((sum, item) => sum + item.subtotal, 0)
  const tax_rate = watch("tax_rate") || 0
  const discount = watch("discount") || 0
  const shipping = watch("shipping") || 0
  
  const tax_amount = subtotal * (tax_rate / 100)
  const total = Number(subtotal) + Number(tax_amount) + Number(shipping) - Number(discount)

  // Add product to purchase items
  const addProduct = (product: Product) => {
    const existingItem = selectedProducts.find(item => item.product_id === product.id)
    
    if (existingItem) {
      updateItemQuantity(existingItem.id, existingItem.quantity + 1)
    } else {
      const newItem: PurchaseItem = {
        id: Date.now().toString(),
        product_id: product.id,
        product_name: product.name,
        product_code: product.code,
        quantity: 1,
        unit_cost: product.cost,
        discount: 0,
        tax: 0,
        subtotal: product.cost
      }
      setSelectedProducts([...selectedProducts, newItem])
    }
    
    setSearchQuery("")
    setFilteredProducts([])
  }

  // Remove item from purchase
  const removeItem = (id: string) => {
    setSelectedProducts(selectedProducts.filter(item => item.id !== id))
  }

  // Update item quantity
  const updateItemQuantity = (id: string, quantity: number) => {
    setSelectedProducts(selectedProducts.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(1, quantity)
        const newSubtotal = newQuantity * item.unit_cost
        return {
          ...item,
          quantity: newQuantity,
          subtotal: newSubtotal
        }
      }
      return item
    }))
  }

  // Update item unit cost
  const updateItemCost = (id: string, cost: number) => {
    setSelectedProducts(selectedProducts.map(item => {
      if (item.id === id) {
        const newCost = Math.max(0, cost)
        const newSubtotal = item.quantity * newCost
        return {
          ...item,
          unit_cost: newCost,
          subtotal: newSubtotal
        }
      }
      return item
    }))
  }

  // Submit form
  const onSubmit = async (data: FormValues) => {
    console.log("Form Data:", data)
    if (selectedProducts.length === 0) {
      toast.error("Please add at least one product")
      return
    }

    setIsLoading(true)
    
    try {
      const payload = {
        ...data,
        id: purchaseId,
        subtotal,
        tax_amount,
        total,
        items: selectedProducts,
      }

      const response = await fetch('/api/purchases', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error('Failed to update purchase')
      }

      toast.success("Purchase updated successfully")
      router.push('/purchases/list')
    } catch (error) {
      toast.error("Failed to update purchase")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!purchaseData) {
    return (
     
        <DashboardLayout>
          <div className="p-6">
            <div className="flex justify-center items-center h-64">
              <p>Loading purchase data...</p>
            </div>
          </div>
        </DashboardLayout>

    )
  }



const onError = (errors: unknown) => {
  console.log("Validation errors", errors)
  toast.error("Please fix validation errors")
}

  return (
 
      <DashboardLayout>
        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
              <span>Purchase List</span>
              <span>|</span>
              <span>Edit Purchase </span>
            </div>
            <h1 className="text-2xl font-bold">Edit Purchase</h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit,onError)}>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="text-sm font-medium">Date *</label>
                  <Input 
                    type="date" 
                    className="mt-1" 
                    {...register("date", { required: "Date is required" })}
                  />
                  {errors.date && <span className="text-red-500 text-xs">{errors.date.message}</span>}
                </div>
                
                <div>
                  <label className="text-sm font-medium">Supplier *</label>
                  <Controller
                    name="supplier_id"
                    control={control}
                    rules={{ required: "Supplier is required" }}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Choose Supplier" />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers.map(supplier => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.supplier_id && (
                    <span className="text-red-500 text-xs">{errors.supplier_id.message}</span>
                  )}
                </div>
                
                <div>
                  <label className="text-sm font-medium">Warehouse *</label>
                  <Controller
                    name="warehouse_id"
                    control={control}
                    rules={{ required: "Warehouse is required" }}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Choose Warehouse" />
                        </SelectTrigger>
                        <SelectContent>
                          {warehouses.map(warehouse => (
                            <SelectItem key={warehouse.id} value={warehouse.id}>
                              {warehouse.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.warehouse_id && (
                    <span className="text-red-500 text-xs">{errors.warehouse_id.message}</span>
                  )}
                </div>
              </div>

              <div className="mb-6 relative">
                <label className="text-sm font-medium">Product</label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="Scan/Search Product by Code Name" 
                    className="pl-10" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                {/* Search results dropdown */}
                {filteredProducts.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredProducts.map(product => (
                      <div 
                        key={product.id}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                        onClick={() => addProduct(product)}
                      >
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.code}</div>
                        </div>
                        <div className="text-sm">
                          ${product.cost}
                          <span className="ml-2 text-gray-500">Stock: {product.quantity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-medium mb-3">Order Items *</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-3 border">#</th>
                        <th className="text-left p-3 border">Product</th>
                        <th className="text-left p-3 border">Net Unit Cost</th>
                        <th className="text-left p-3 border">Qty</th>
                        <th className="text-left p-3 border">Subtotal</th>
                        <th className="text-left p-3 border">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedProducts.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-gray-500 border">
                            No items added
                          </td>
                        </tr>
                      ) : (
                        selectedProducts.map((item, index) => (
                          <tr key={item.id} className="border-b">
                            <td className="p-3 border">{index + 1}</td>
                            <td className="p-3 border">
                              <div className="font-medium">{item.product_name}</div>
                              <div className="text-sm text-gray-500">{item.product_code}</div>
                            </td>
                            <td className="p-3 border">
                              <Input 
                                type="number" 
                                min="0"
                                step="0.01"
                                value={item.unit_cost}
                                onChange={(e) => updateItemCost(item.id, parseFloat(e.target.value))}
                                className="w-24"
                              />
                            </td>
                            <td className="p-3 border">
                              <Input 
                                type="number" 
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value))}
                                className="w-20"
                              />
                            </td>
                            <td className="p-3 border">${Number(item.subtotal)}</td>
                            <td className="p-3 border">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => removeItem(item.id)}
                              >
                                <X className="h-4 w-4 text-red-500" />
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
                      <label className="text-sm font-medium">Order Tax</label>
                      <div className="flex mt-1">
                        <Input 
                          placeholder="0" 
                          className="rounded-r-none" 
                          {...register("tax_rate", { 
                            min: 0, 
                            max: 100,
                            valueAsNumber: true
                          })}
                        />
                        <Button 
                          variant="outline" 
                          className="rounded-l-none px-3 bg-transparent"
                          type="button"
                        >
                          %
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Discount</label>
                      <div className="flex mt-1">
                        <Input 
                          placeholder="0" 
                          className="rounded-r-none" 
                          {...register("discount", { 
                            min: 0,
                            valueAsNumber: true
                          })}
                        />
                        <Button 
                          variant="outline" 
                          className="rounded-l-none px-3 bg-transparent"
                          type="button"
                        >
                          $
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Shipping</label>
                      <div className="flex mt-1">
                        <Input 
                          placeholder="0" 
                          className="rounded-r-none" 
                          {...register("shipping", { 
                            min: 0,
                            valueAsNumber: true
                          })}
                        />
                        <Button 
                          variant="outline" 
                          className="rounded-l-none px-3 bg-transparent"
                          type="button"
                        >
                          $
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Status *</label>
                    <Controller
                      name="status"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="received">Received</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Payment Status</label>
                    <Controller
                      name="payment_status"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="partial">Partial</SelectItem>
                            <SelectItem value="unpaid">Unpaid</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Note</label>
                    <Textarea 
                      placeholder="A few words ..." 
                      className="mt-1" 
                      rows={4} 
                      {...register("notes")}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      type="submit" 
                      className="bg-[#1a237e] hover:bg-purple-700"
                      disabled={isLoading}
                    >
                      {isLoading ? "Updating..." : "Update Purchase"}
                    </Button>
                    <Button 
                      variant="outline"
                      type="button"
                      onClick={() => router.push('/purchases')}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>${Number(subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Order Tax</span>
                        <span>${Number(tax_amount)} ({tax_rate}%)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Discount</span>
                        <span>${Number(discount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shipping</span>
                        <span>${Number(shipping)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>Grand Total</span>
                        <span>${Number(total)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </DashboardLayout>
    
  )
}