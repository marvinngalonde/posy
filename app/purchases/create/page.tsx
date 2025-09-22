"use client"

import DashboardLayout from "../../../components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, X } from "lucide-react"

import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { toast } from "sonner"

import type React from "react"

interface Product {
  id: string
  name: string
  code: string
  cost: number
  stock: number
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
  created_by: string
}

export default function CreatePurchase() {
  
  const [searchQuery, setSearchQuery] = useState("")
  // const [setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [selectedProducts, setSelectedProducts] = useState<PurchaseItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [suppliers, setSuppliers] = useState<{id: number, name: string}[]>([])
  const [warehouses, setWarehouses] = useState<{id: number, name: string}[]>([])

  const {
    register,
    handleSubmit,
    control,
    watch,
    
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      supplier_id: "",
      warehouse_id: "",
      tax_rate: 0,
      discount: 0,
      shipping: 0,
      status: "received",
      payment_status: "unpaid",
      notes: "",
      created_by: "1", 
    }
  })

  // Fetch suppliers and warehouses on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true)
        const [suppliersRes, warehousesRes] = await Promise.all([
          fetch('/api/v2/suppliers?limit=1000'),
          fetch('/api/settings/warehouses')
        ])
        
        if (!suppliersRes.ok || !warehousesRes.ok) {
          throw new Error('Failed to fetch initial data')
        }
        
        const suppliersData = await suppliersRes.json()
        const warehousesData = await warehousesRes.json()

        setSuppliers(suppliersData.data || suppliersData)
        setWarehouses(warehousesData.data || warehousesData)
      } catch (error) {
        toast.error("Failed to load initial data")
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchInitialData()
    
  }, [])

  // Search products with debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length < 2) {
        setFilteredProducts([])
        return
      }

      try {
        const res = await fetch(`/api/products?search=${searchQuery}&limit=10`)
        if (!res.ok) throw new Error('Failed to search products')
        const data = await res.json()
        // Handle both paginated and direct array responses
        const products = data.data || data
        setFilteredProducts(products.slice(0, 5))
      } catch (error) {
        toast.error("Failed to search products")
        console.error(error)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Calculate totals
  const subtotal = selectedProducts.reduce((sum, item) => sum + item.subtotal, 0)
  const tax_rate = watch("tax_rate")
  const discount = watch("discount")
  const shipping = watch("shipping")
  
  const tax_amount = subtotal * (tax_rate / 100)
  const total = Number(subtotal) + Number(tax_amount) + Number(shipping) - Number(discount) // shipping - discount
  

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
    if (selectedProducts.length === 0) {
      toast.error("Please add at least one product")
      return
    }

    const user_id = localStorage.getItem('UserId');
    if (!user_id) throw new Error("User authentication required");

    setIsLoading(true)
    
    try {
      const payload = {
        ...data,
        supplier_id: parseInt(data.supplier_id),
        warehouse_id: parseInt(data.warehouse_id),
        subtotal,
        tax_amount,
        total,
        paid: 0,
        due: total,
        items: selectedProducts.map(item => ({
          product_id: parseInt(item.product_id),
          quantity: item.quantity,
          unit_cost: item.unit_cost,
          discount: item.discount,
          tax: item.tax,
          subtotal: item.subtotal
        })),
        created_by: parseInt(user_id),
      }

      const response = await fetch('/api/v2/purchases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error('Failed to create purchase')
      }

      // const result = await response.json()
      toast.success("Purchase created successfully")
      // router.push(`/dashboard/purchases/${result.id}`)
    } catch (error) {
      toast.error("Failed to create purchase")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6">
        <div className="mb-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <span>Purchases</span>
            <span>|</span>
            <span>Create Purchase</span>
          </div>
          <h1 className="text-xl font-semibold">Create Purchase</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
                          <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base">Purchase Information</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-medium">Date *</label>
                    <Input 
                      type="date" 
                      className="mt-1 h-9 text-sm" 
                      {...register("date", { required: "Date is required" })}
                    />
                    {errors.date && <span className="text-red-500 text-xs">{errors.date.message}</span>}
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium">Supplier *</label>
                    <Controller
                      name="supplier_id"
                      control={control}
                      rules={{ required: "Supplier is required" }}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="mt-1 h-9 text-sm">
                            <SelectValue placeholder="Choose Supplier" />
                          </SelectTrigger>
                          <SelectContent>
                            {suppliers.map(supplier => (
                              <SelectItem key={supplier.id} value={supplier.id.toString()}>
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
                    <label className="text-xs font-medium">Warehouse *</label>
                    <Controller
                      name="warehouse_id"
                      control={control}
                      rules={{ required: "Warehouse is required" }}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="mt-1 h-9 text-sm">
                            <SelectValue placeholder="Choose Warehouse" />
                          </SelectTrigger>
                          <SelectContent>
                            {warehouses.map(warehouse => (
                              <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
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
              </CardContent>
            </Card>

              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-base">Product Search</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Scan/Search Product by Code Name" 
                      className="pl-10 h-9 text-sm" 
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
                            <div className="font-medium text-sm">{product.name}</div>
                            <div className="text-xs text-muted-foreground">{product.code}</div>
                          </div>
                          <div className="text-sm">
                            ${product.cost}
                            <span className="ml-2 text-gray-500">Stock: {product.stock}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-base">Order Items *</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="overflow-x-auto">
                    <table className="w-full border">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left p-3 border text-xs font-medium">#</th>
                          <th className="text-left p-3 border text-xs font-medium">Product</th>
                          <th className="text-left p-3 border text-xs font-medium">Net Unit Cost</th>
                          <th className="text-left p-3 border text-xs font-medium">Qty</th>
                          <th className="text-left p-3 border text-xs font-medium">Subtotal</th>
                          <th className="text-left p-3 border text-xs font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedProducts.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center py-8 text-muted-foreground border">
                              No items added
                            </td>
                          </tr>
                        ) : (
                          selectedProducts.map((item, index) => (
                            <tr key={item.id} className="border-b">
                              <td className="p-3 border text-sm">{index + 1}</td>
                              <td className="p-3 border">
                                <div className="font-medium text-sm">{item.product_name}</div>
                                <div className="text-xs text-muted-foreground">{item.product_code}</div>
                              </td>
                              <td className="p-3 border">
                                <Input 
                                  type="number" 
                                  min="0"
                                  step="0.01"
                                  value={item.unit_cost}
                                  onChange={(e) => updateItemCost(item.id, parseFloat(e.target.value))}
                                  className="w-24 h-8 text-sm"
                                />
                              </td>
                            
                              <td className="p-3 border">
                                <Input 
                                  type="number" 
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value))}
                                  className="w-20 h-8 text-sm"
                                />
                              </td>
                              <td className="p-3 border text-sm">${Number(item.subtotal)}</td>
                              <td className="p-3 border">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => removeItem(item.id)}
                                  className="text-destructive hover:text-destructive/80"
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
                </CardContent>
              </Card>

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

                  <Button 
                    type="submit" 
                    className="bg-[#1a237e] hover:bg-purple-700"
                    disabled={isLoading}
                  >
                    {isLoading ? "Processing..." : "Submit"}
                  </Button>
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