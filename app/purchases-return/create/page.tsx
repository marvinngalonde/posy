"use client"

import DashboardLayout from "../../../components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Search, X, Minus, Plus } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type React from "react"

interface Product {
  id: string
  name: string
  code: string
  cost: number
  quantity: number
}

interface CartItem {
  id: string
  product_id: string
  purchase_item_id?: string
  name: string
  cost: number
  quantity: number
  discount: number
  tax: number
  subtotal: number
  maxQuantity: number
}

export default function CreatePurchaseReturn() {
  const router = useRouter()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [suppliers, setSuppliers] = useState<{id: string, name: string}[]>([])
  const [warehouses, setWarehouses] = useState<{id: string, name: string}[]>([])
  const [purchases, setPurchases] = useState<{id: string, reference: string}[]>([])
  const [selectedSupplier, setSelectedSupplier] = useState("")
  const [selectedWarehouse, setSelectedWarehouse] = useState("")
  const [selectedPurchase, setSelectedPurchase] = useState("")
  const [taxRate, setTaxRate] = useState(0)
  const [discount, setDiscount] = useState(0)
  const [shipping, setShipping] = useState(0)
  const [status, setStatus] = useState("completed")
  const [notes, setNotes] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [purchaseItems, setPurchaseItems] = useState<any[]>([])

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch suppliers
        const suppliersRes = await fetch('/api/v2/suppliers')
        const suppliersData = await suppliersRes.json()
        setSuppliers(suppliersData.data || [])
        
        // Fetch warehouses
        const warehousesRes = await fetch('/api/settings/warehouses')
        const warehousesData = await warehousesRes.json()
        setWarehouses(warehousesData)
        
        // Fetch recent purchases
        const purchasesRes = await fetch('/api/purchases')
        const purchasesData = await purchasesRes.json()
        console.log('Purchases data:', purchasesData) // Debug log
        setPurchases(purchasesData.data || [])
        
        if (!purchasesData.data || purchasesData.data.length === 0) {
          toast.error("No purchases found. Please create some purchases first.")
        }
        
      } catch (error) {
        toast.error("Failed to load initial data")
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [])

  // Fetch purchase items when purchase is selected
  useEffect(() => {
    const fetchPurchaseItems = async () => {
      if (!selectedPurchase) return
      
      try {
        const res = await fetch(`/api/purchases/${selectedPurchase}`)
        if (!res.ok) {
          if (res.status === 404) {
            toast.error("Purchase not found")
            return
          }
          throw new Error("Failed to fetch purchase items")
        }
        const data = await res.json()
        setPurchaseItems(data.items || [])
        
        // Set supplier from purchase
        if (data.supplier_id) {
          setSelectedSupplier(data.supplier_id)
        }
        
        // Set warehouse from purchase
        if (data.warehouse_id) {
          setSelectedWarehouse(data.warehouse_id)
        }
        
      } catch (error) {
        toast.error("Failed to load purchase items")
        console.error(error)
      }
    }
    
    fetchPurchaseItems()
  }, [selectedPurchase])

  // Search products
  useEffect(() => {
    const searchProducts = async () => {
      if (searchTerm.trim()) {
        try {
          const res = await fetch(`/api/products?search=${searchTerm}`)
          const data = await res.json()
          setProducts(data)
        } catch (error) {
          toast.error("Failed to search products")
          console.error(error)
        }
      }
    }
    
    const timer = setTimeout(searchProducts, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0)
  const taxAmount = subtotal * (taxRate / 100)
  const total = subtotal + taxAmount + shipping - discount

  // Cart functions
  const addToCart = (product: Product) => {
    // Find if this product exists in the original purchase
    const purchaseItem = purchaseItems.find(item => item.product_id === product.id)
    const maxQty = purchaseItem ? purchaseItem.quantity : 0
    
    setCartItems(prev => {
      const existingItem = prev.find(item => item.product_id === product.id)
      if (existingItem) {
        const newQty = Math.min(existingItem.quantity + 1, maxQty)
        return prev.map(item => 
          item.product_id === product.id 
            ? { 
                ...item, 
                quantity: newQty,
                subtotal: newQty * item.cost
              } 
            : item
        )
      } else {
        return [
          ...prev,
          {
            id: Date.now().toString(),
            product_id: product.id,
            purchase_item_id: purchaseItem?.id,
            name: product.name,
            cost: product.cost,
            quantity: 1,
            discount: 0,
            tax: 0,
            subtotal: product.cost,
            maxQuantity: maxQty
          }
        ]
      }
    })
  }

  const updateQuantity = (id: string, quantity: number) => {
    const item = cartItems.find(item => item.id === id)
    if (!item) return
    
    quantity = Math.max(0, Math.min(quantity, item.maxQuantity))
    
    if (quantity <= 0) {
      setCartItems(cartItems.filter(item => item.id !== id))
    } else {
      setCartItems(cartItems.map(item => 
        item.id === id 
          ? { 
              ...item, 
              quantity,
              subtotal: quantity * item.cost
            } 
          : item
      ))
    }
  }

  const updateItemCost = (id: string, cost: number) => {
    setCartItems(cartItems.map(item => 
      item.id === id 
        ? { 
            ...item, 
            cost,
            subtotal: item.quantity * cost
          } 
        : item
    ))
  }

  const removeItem = (id: string) => {
    setCartItems(cartItems.filter(item => item.id !== id))
  }

  // Submit form
  const handleSubmit = async () => {
    if (cartItems.length === 0) {
      toast.error("Please add at least one product")
      return
    }

    if (!selectedSupplier || !selectedWarehouse || !selectedPurchase) {
      toast.error("Please select supplier, warehouse and purchase")
      return
    }

    setIsLoading(true)
    
    try {
      const returnData = {
        purchase_id: selectedPurchase,
        supplier_id: selectedSupplier,
        warehouse_id: selectedWarehouse,
        date: new Date().toISOString().slice(0, 10),
        subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        discount,
        shipping,
        total,
        status,
        notes,
        items: cartItems.map(item => ({
          product_id: item.product_id,
          purchase_item_id: item.purchase_item_id,
          quantity: item.quantity,
          unit_cost: item.cost,
          discount: item.discount,
          tax: item.tax,
          subtotal: item.subtotal
        }))
      }

      const response = await fetch('/api/purchases-return', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(returnData)
      })

      if (!response.ok) {
        throw new Error('Failed to create purchase return')
      }

      toast.success("Purchase return created successfully")
      router.push('/purchases-return/list')
    } catch (error) {
      toast.error("Failed to create purchase return")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <span>Purchase Return List</span>
            <span>|</span>
            <span>Create Purchase Return</span>
          </div>
          <h1 className="text-2xl font-bold">Create Purchase Return</h1>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="text-sm font-medium">Date *</label>
              <Input 
                type="date" 
                defaultValue={new Date().toISOString().slice(0, 10)}
                className="mt-1" 
              />
            </div>
            <div>
              <label className="text-sm font-medium">Purchase Reference *</label>
              <Select 
                value={selectedPurchase}
                onValueChange={setSelectedPurchase}
                disabled={purchases.length === 0}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={purchases.length === 0 ? "No purchases available" : "Select Purchase"} />
                </SelectTrigger>
                <SelectContent>
                  {purchases.map(purchase => (
                    <SelectItem key={purchase.id} value={purchase.id}>
                      {purchase.reference}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {purchases.length === 0 && (
                <p className="text-sm text-red-500 mt-1">
                  No purchases found. Please create some purchases first to create purchase returns.
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Supplier *</label>
              <Select 
                value={selectedSupplier}
                onValueChange={setSelectedSupplier}
              >
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
            </div>
            <div>
              <label className="text-sm font-medium">Warehouse *</label>
              <Select
                value={selectedWarehouse}
                onValueChange={setSelectedWarehouse}
              >
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
            </div>
          </div>

          <div className="mb-6">
            <label className="text-sm font-medium">Product</label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Scan/Search Product by Code Name" 
                className="pl-10" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Product search results */}
            {searchTerm && products.length > 0 && (
              <div className="mt-2 border rounded-md max-h-60 overflow-auto">
                {products.map(product => (
                  <div 
                    key={product.id}
                    className="p-2 hover:bg-gray-50 cursor-pointer flex justify-between items-center border-b"
                    onClick={() => addToCart(product)}
                  >
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.code}</div>
                    </div>
                    <div className="text-sm font-semibold">
                      ${product.cost}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium mb-3">Return Items *</h3>
            <div className="overflow-x-auto">
              <table className="w-full border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 border">#</th>
                    <th className="text-left p-3 border">Product</th>
                    <th className="text-left p-3 border">Net Unit Cost</th>
                    <th className="text-left p-3 border">Max Qty</th>
                    <th className="text-left p-3 border">Qty</th>
                    <th className="text-left p-3 border">Subtotal</th>
                    <th className="text-left p-3 border">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-500 border">
                        No items added
                      </td>
                    </tr>
                  ) : (
                    cartItems.map((item, index) => (
                      <tr key={item.id} className="border-b">
                        <td className="p-3 border">{index + 1}</td>
                        <td className="p-3 border">
                          <div className="font-medium">{item.name}</div>
                        </td>
                        <td className="p-3 border">
                          <Input 
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.cost}
                            onChange={(e) => updateItemCost(item.id, parseFloat(e.target.value))}
                            className="w-24"
                          />
                        </td>
                        <td className="p-3 border text-center">
                          {item.maxQuantity}
                        </td>
                        <td className="p-3 border">
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 w-6 p-0"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input 
                              type="number"
                              min="1"
                              max={item.maxQuantity}
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                              className="w-16 text-center"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 w-6 p-0"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                        <td className="p-3 border">${item.subtotal}</td>
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
                      value={taxRate}
                      onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    />
                    <Button variant="outline" className="rounded-l-none px-3 bg-transparent">
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
                      value={discount}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    />
                    <Button variant="outline" className="rounded-l-none px-3 bg-transparent">
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
                      value={shipping}
                      onChange={(e) => setShipping(parseFloat(e.target.value) || 0)}
                    />
                    <Button variant="outline" className="rounded-l-none px-3 bg-transparent">
                      $
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Status *</label>
                <Select 
                  value={status}
                  onValueChange={setStatus}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Note</label>
                <Textarea 
                  placeholder="A few words ..." 
                  className="mt-1" 
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <Button 
                className="bg-purple-600 hover:bg-purple-700"
                onClick={handleSubmit}
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
                    <span>${subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Order Tax</span>
                    <span>${taxAmount} = (${taxRate}%)</span>
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
                    <span>${total}</span>
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
