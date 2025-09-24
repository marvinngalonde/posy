"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, X,  Minus, Plus, RotateCcw, CreditCard, Maximize2, Minimize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import type React from "react"
import { useAppDispatch } from "@/lib/hooks"
import { useRouter } from "next/navigation"
import { logout } from "@/lib/slices/authSlice"
import { useGetCategoriesQuery, useGetBrandsQuery, useGetWarehousesQuery } from "@/lib/slices/settingsApi"
import { useGetCustomersQuery } from "@/lib/slices/customersApi"
import { useGetProductsQuery } from "@/lib/slices/productsApi"
import { useCreateSaleMutation } from "@/lib/slices/salesApi" // Import useCreateSaleMutation
import { useSubmitFiscalInvoiceMutation, useGetFDMSStatusQuery } from "@/lib/slices/fdmsApi"
import { useGetOrganizationQuery } from "@/lib/slices/organizationApi"
import { toast } from "sonner" // Import toast for notifications


interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
}

interface Product {
  id: string
  name: string
  code: string
  price: number
  image?: string
  category_id?: string
  category_name?: string
  brand_id?: string
  brand_name?: string
}

interface Category {
  id: string
  name: string
  icon?: string
}

export default function POSSystem() {
  // State
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedBrand, setSelectedBrand] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [tax, setTax] = useState(0)
  const [discount, setDiscount] = useState(0)
  const [shipping, setShipping] = useState(0)


  // Modal states
  const [showCategoryList, setShowCategoryList] = useState(false)
  const [showBrandList, setShowBrandList] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showReceiptModal, setShowReceiptModal] = useState(false)

  // Customers, Warehouses, Brands state
  const [selectedCustomer, setSelectedCustomer] = useState("walkin")
  const [selectedWarehouse, setSelectedWarehouse] = useState("")

  // Payment form states
  const [receivedAmount, setReceivedAmount] = useState("")
  const [payingAmount, setPayingAmount] = useState("")
  const [paymentChoice, setPaymentChoice] = useState("Cash")
  const [paymentNote, setPaymentNote] = useState("")
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false)
  const dispatch = useAppDispatch()
  const router = useRouter()


  
  const handleLogout = () => {
      dispatch(logout())
      router.push("/")
    }

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  };

  // RTK Query hooks
  const { data: categoriesData, isLoading: categoriesLoading } = useGetCategoriesQuery()
  const { data: brandsData, isLoading: brandsLoading } = useGetBrandsQuery()
  const { data: warehousesData, isLoading: warehousesLoading } = useGetWarehousesQuery()
  const { data: customersResponse, isLoading: customersLoading } = useGetCustomersQuery({ page: 1, limit: 1000, search: "" })
  const { data: productsResponse, isLoading: productsLoading } = useGetProductsQuery({ page: 1, limit: 1000 })
  const { data: organizationData, isLoading: organizationLoading } = useGetOrganizationQuery()
  const productsData = productsResponse?.data || []

  // RTK Query Mutations
  const [createSale, { isLoading: isCreatingSale }] = useCreateSaleMutation()
  const [submitFiscalInvoice, { isLoading: isSubmittingFiscal }] = useSubmitFiscalInvoiceMutation()

  // FDMS Status
  const { data: fdmsStatus } = useGetFDMSStatusQuery()

  const allCategories = useMemo(() => {
    return categoriesData ? [{ id: "all", name: "All Category", icon: "/placeholder.svg?height=60&width=60" }, ...categoriesData] : [];
  }, [categoriesData]);

  const allBrands = useMemo(() => {
    return brandsData || [];
  }, [brandsData]);

  const allWarehouses = useMemo(() => {
    return warehousesData || [];
  }, [warehousesData]);

  const allCustomers = useMemo(() => {
    return customersResponse?.data ? [{ id: "walkin", name: "Walk-In-Customer" }, ...customersResponse.data] : [{ id: "walkin", name: "Walk-In-Customer" }];
  }, [customersResponse]);

  // Initialize selectedWarehouse if not already set
  useEffect(() => {
    if (allWarehouses.length > 0 && !selectedWarehouse) {
      setSelectedWarehouse(allWarehouses[0].id);
    }
  }, [allWarehouses, selectedWarehouse]);

  // Filter by category and brand
  const filteredProducts = useMemo(() => {
    const products = productsResponse?.data ?? []; // Ensure products is always an array
    return products.filter(product => {
      const categoryMatch = selectedCategory === "all" || product.category_id === selectedCategory;
      const brandMatch = selectedBrand === "all" || product.brand_id === selectedBrand;
      return categoryMatch && brandMatch;
    });
  }, [productsResponse, selectedCategory, selectedBrand]);

  // Cart logic
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const grandTotal = subtotal + tax + shipping - discount
  const change = Number.parseFloat(receivedAmount) - Number.parseFloat(payingAmount) || 0

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCartItems(cartItems.filter((item) => item.id !== id))
    } else {
      setCartItems(cartItems.map((item) => (item.id === id ? { ...item, quantity: newQuantity } : item)))
    }
  }

  const addToCart = (product: Product) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.id === product.id)
      if (existingItem) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      } else {
        return [
          ...prev,
          {
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1
          }
        ]
      }
    })
  }

  const handlePayNow = () => {
    setReceivedAmount(grandTotal.toString())
    setPayingAmount(grandTotal.toString())
    setShowPaymentModal(true)
  }

  const handleSubmitPayment = async () => {
    setShowPaymentModal(false)
    // Prepare sale data
    const userId = typeof window !== "undefined" ? localStorage.getItem('UserId') : null;
    
    try {
      const saleData = {
        reference: `SL-${Date.now()}`,
        customer_id: selectedCustomer !== "walkin" ? selectedCustomer : null,
        warehouse_id: selectedWarehouse || null,
        date: new Date().toISOString().slice(0, 10),
        subtotal: Number(subtotal.toFixed(2)),
        tax_rate: 0, // Assuming tax_rate is 0 if not explicitly set elsewhere
        tax_amount: Number(tax.toFixed(2)),
        discount: Number(discount.toFixed(2)),
        shipping: Number(shipping.toFixed(2)),
        total: Number(grandTotal.toFixed(2)),
        paid: Number(Number(payingAmount).toFixed(2)),
        due: Number(Math.max(0, grandTotal - Number(payingAmount)).toFixed(2)),
        status: "completed", // Or appropriate status
        payment_status: Number(payingAmount) >= grandTotal ? "paid" : (Number(payingAmount) > 0 ? "partial" : "unpaid"),
        notes: paymentNote || null,
        created_by: userId,
        items: cartItems.map(item => ({
          product_id: item.id,
          name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          discount: 0, // Assuming discount per item is 0 if not captured
          tax: 0, // Assuming tax per item is 0 if not captured
          subtotal: Number((item.price * item.quantity).toFixed(2)),
        })),
        payment: {
          payment_choice: paymentChoice,
          payment_note: paymentNote,
        },
      };
      
      const createdSale = await createSale(saleData).unwrap();
      toast.success("Sale created successfully!");

      // FDMS Integration - Submit fiscal invoice
      if (fdmsStatus?.data?.configured) {
        try {
          const fiscalInvoiceData = {
            invoiceNo: saleData.reference,
            total: saleData.total,
            currency: 'USD', // Default currency
            customer: selectedCustomer !== "walkin" ? {
              name: customersData?.find(c => c.id === selectedCustomer)?.name
            } : undefined,
            items: cartItems.map(item => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              taxRate: 15.0, // Default tax rate for Zimbabwe
              taxId: 1
            })),
            saleId: createdSale.data?.id
          };

          const fiscalResult = await submitFiscalInvoice(fiscalInvoiceData).unwrap();

          if (fiscalResult.success) {
            if (fdmsStatus.data.fdmsEnabled) {
              toast.success("Fiscal invoice submitted to ZIMRA successfully!");
            } else {
              toast.info("Receipt generated (Non-FDMS mode)");
            }
          }
        } catch (fiscalError: any) {
          console.error("Failed to submit fiscal invoice:", fiscalError);
          toast.warning("Sale completed but fiscal submission failed. Check FDMS status.");
        }
      }

      setShowReceiptModal(true);
      setCartItems([]); // Clear cart after successful sale
    } catch (err: any) {
      console.error("Failed to create sale:", err);
      toast.error(err.data?.message || "Failed to create sale");
    }
  };

  const handlePrintReceipt = () => {
    const receiptWindow = window.open("", "_blank")
    if (receiptWindow) {
      // Get organization details or use defaults
      const orgName = organizationData?.name || "Your Company Name"
      const orgAddress = organizationData?.address || ""
      const orgCity = organizationData?.city || ""
      const orgCountry = organizationData?.country || ""
      const orgEmail = organizationData?.email || ""
      const orgPhone = organizationData?.phone || ""
      const currencySymbol = organizationData?.currency_symbol || "$"

      // Format full address
      const fullAddress = [orgAddress, orgCity, orgCountry].filter(Boolean).join(", ")
      const customerName = selectedCustomer?.name || "Walk-In Customer"

      receiptWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Receipt - ${orgName}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; max-width: 400px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 20px; }
            .company-name { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .company-info { font-size: 12px; line-height: 1.4; }
            .divider { border-top: 1px solid #000; margin: 10px 0; }
            .item-row { display: flex; justify-content: space-between; margin: 5px 0; }
            .total-section { margin-top: 20px; }
            .grand-total { font-weight: bold; font-size: 16px; }
            .payment-info { margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; }
            .barcode { text-align: center; margin: 20px 0; font-family: 'Courier New', monospace; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">${orgName}</div>
            <div class="company-info">
              Date: ${new Date().toLocaleDateString()}<br>
              ${fullAddress ? `Address: ${fullAddress}<br>` : ''}
              ${orgEmail ? `Email: ${orgEmail}<br>` : ''}
              ${orgPhone ? `Phone: ${orgPhone}<br>` : ''}
              Customer: ${customerName}
            </div>
          </div>
          <div class="divider"></div>
          ${cartItems.map(item => `
            <div class="item-row">
              <span>${item.name}</span>
            </div>
            <div class="item-row">
              <span>${item.quantity} Pcs X ${currencySymbol}${item.price}</span>
              <span>${currencySymbol}${(item.quantity * item.price)}</span>
            </div>
          `).join('')}
          <div class="divider"></div>
          <div class="total-section">
            <div class="item-row">
              <span>Order Tax</span>
              <span>${currencySymbol}${tax} (${tax > 0 ? ((tax / subtotal) * 100).toFixed(0) : 0} %)</span>
            </div>
            <div class="item-row">
              <span>Discount</span>
              <span>${currencySymbol}${discount}</span>
            </div>
            <div class="item-row grand-total">
              <span>Grand Total</span>
              <span>${currencySymbol}${grandTotal}</span>
            </div>
          </div>
          <div class="divider"></div>
          <div class="payment-info">
            <div class="item-row">
              <span>Paid By:</span>
              <span>Amount:</span>
              <span>Change:</span>
            </div>
            <div class="item-row">
              <span>${paymentChoice}</span>
              <span>${currencySymbol}${payingAmount}</span>
              <span>${currencySymbol}${change}</span>
            </div>
          </div>
          <div class="footer">
            <p>${organizationData?.terms_conditions || "Thank You For Shopping With Us. Please Come Again"}</p>
            <div class="barcode">
              ||||| |||| | ||| ||||<br>
              ${Date.now().toString().slice(-6)}
            </div>
          </div>
        </body>
        </html>
      `)
      receiptWindow.document.close()
      receiptWindow.print()
    }
  }

  return (
    <div className="flex p-4 h-screen bg-gray-50">
      {/* Left Sidebar - Cart */}
      <div className="w-[45%] bg-white border-r flex flex-col">
        {/* Logo and Navigation Icons */}
        <div className="p-4 border-b flex items-center justify-between">
          <Link href="/dashboard">
            <div className="w-12 h-12  rounded-lg flex items-center justify-center cursor-pointer">
              <img src="/PosyLogo.png" alt="POSy Logo" width={64} height={64} className="w-full h-full object-cover" />
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullScreen}
              type="button"
              aria-label={isFullScreen ? "Exit full screen" : "Enter full screen"}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isFullScreen ? (
                <Minimize2 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <Maximize2 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              )}
            </button>

             <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 rounded bg-transparent hover:bg-blue-50"
                  style={{ fontSize: "13px" }}
                  onClick={() => setProfileOpen((open) => !open)}
                >
                  <div className="w-8 h-8 bg-[#1a237e] rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">U</span>
                  </div>
                </Button>
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                    <div className="px-4 py-3">
                      <div className="font-semibold text-gray-800">{typeof window !== "undefined" ? localStorage.getItem("username") || "Username" : "Username"}</div>
                      <div className="text-sm text-gray-500">{typeof window !== "undefined" ? localStorage.getItem("email") || "user@email.com" : "user@email.com"}</div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 border-t"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
          </div>
        </div>

        {/* Customer & Warehouse Selection */}
        <div className="p-4 space-y-3">
          {/* Customer Select */}
          <div className="relative">
            <Select
              value={selectedCustomer}
              onValueChange={setSelectedCustomer}
              disabled={customersLoading}
            >
              <SelectTrigger className="w-full bg-gray-100">
                <SelectValue placeholder={customersLoading ? "Loading customers..." : "Select customer"} />
              </SelectTrigger>
              <SelectContent>
                {allCustomers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Warehouse Select */}
          <div className="relative">
            <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse} disabled={warehousesLoading}>
              <SelectTrigger className="w-full bg-gray-100">
                <SelectValue placeholder={warehousesLoading ? "Loading warehouses..." : "Select warehouse"} />
              </SelectTrigger>
              <SelectContent>
                {allWarehouses.map((warehouse) => (
                  <SelectItem key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 px-4">
          <div className="grid grid-cols-4 gap-2 text-sm font-medium text-gray-600 mb-3">
            <div>Product</div>
            <div>Price</div>
            <div>Qty</div>
            <div>Subtotal</div>
          </div>

          {cartItems.map((item) => (
            <div key={item.id} className="grid grid-cols-4 gap-2 items-center py-2 border-b">
              <div>
                <div className="font-medium">{item.name}</div>
                <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded inline-block mt-1">
                  {item.name}
                </div>
              </div>
              <div className="text-sm">$ {item.price}</div>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 w-6 p-0 bg-[#1a237e] hover:bg-[#23308c] text-white border-purple-600"
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="mx-2 text-sm w-6 text-center">{item.quantity}</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 w-6 p-0 bg-[#1a237e] hover:bg-[#23308c] text-white border-purple-600"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">$ {(item.price * item.quantity)}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-red-500"
                  onClick={() => updateQuantity(item.id, 0)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Grand Total */}
        <div className="px-4 py-3 bg-[#1a237e] hover:bg-[#23308c] text-white font-bold text-lg mr-4 ml-4">
          Grand Total : $ {grandTotal}
        </div>

        {/* Tax, Discount, Shipping */}
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm text-gray-600">Tax</label>
              <div className="flex">
                <Input
                  type="number"
                  value={tax}
                  onChange={(e) => setTax(Number(e.target.value))}
                  className="rounded-r-none text-sm h-8"
                />
                <Button variant="outline" className="rounded-l-none px-2 h-8 text-xs bg-transparent">
                  %
                </Button>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600">Discount</label>
              <div className="flex">
                <Input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="rounded-r-none text-sm h-8"
                />
                <Button variant="outline" className="rounded-l-none px-2 h-8 text-xs bg-transparent">
                  $
                </Button>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600">Shipping</label>
              <div className="flex">
                <Input
                  type="number"
                  value={shipping}
                  onChange={(e) => setShipping(Number(e.target.value))}
                  className="rounded-r-none text-sm h-8"
                />
                <Button variant="outline" className="rounded-l-none px-2 h-8 text-xs bg-transparent">
                  $
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 grid grid-cols-2 gap-3">
          <Button variant="destructive" className="bg-red-500 hover:bg-red-600" onClick={() => setCartItems([])}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button className="bg-[#1a237e] hover:bg-[#23308c] hover:bg-purple-700" onClick={handlePayNow}>
            <CreditCard className="h-4 w-4 mr-2" />
            Pay Now
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-[60%] flex flex-col">
        {/* Product Section */}
        <div className="flex-1 p-6">
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="outline"
                className="flex-1 text-[#1a237e] border-blue-200 bg-transparent"
                onClick={() => setShowCategoryList(true)}
              >
                List of Category
              </Button>
              <Button
                variant="outline"
                className="flex-1 text-[#1a237e] border-blue-200 bg-transparent"
                onClick={() => setShowBrandList(true)}
              >
                Brand List
              </Button>

            </div>

            <div className="relative max-w-l">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Scan/Search Product by Code Name"
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            {productsLoading ? (
              // Loading skeleton
              Array.from({ length: 10 }).map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <CardContent className="p-3">
                    <div className="relative mb-3">
                      <div className="w-full h-24 bg-gray-200 rounded"></div>
                      <div className="absolute top-1 left-1 bg-gray-300 text-gray-300 text-xs px-2 py-1 rounded">
                        Loading...
                      </div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))
            ) : filteredProducts.length === 0 ? (
              <div className="col-span-5 text-center py-8 text-gray-500">
                No products found
              </div>
            ) : (Array.isArray(filteredProducts) && filteredProducts.length > 0) ? (
              filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => addToCart(product)}
                >
                  <CardContent className="p-3">
                    <div className="relative mb-3">
                      <img
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        className="w-full h-24 object-cover rounded bg-gray-100"
                      />
                      <div className="absolute top-1 left-1 bg-blue-800 text-white text-xs px-2 py-1 rounded">
                        {product.price} Pcs
                      </div>
                    </div>
                    <h3 className="font-medium text-sm mb-1 truncate">{product.name}</h3>
                    <p className="text-xs text-gray-500 mb-2">{product.code}</p>
                    <div className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded inline-block">
                      $ {product.price}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : null}
          </div>
        </div>
      </div>

      {/* Category List Modal */}
      {/* Category List Modal */}
      <Dialog open={showCategoryList} onOpenChange={setShowCategoryList}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>List of Category</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 p-4">
            {allCategories.map((category: Category) => (
              <Card
                key={category.id}
                className={`cursor-pointer transition-all ${selectedCategory === category.id ? "ring-2 ring-purple-500" : ""
                  }`}
                onClick={() => {
                  setSelectedCategory(category.id)
                  setShowCategoryList(false)
                }}
              >
                <CardContent className="p-4 text-center">
                  <img
                    src={category.icon || "/placeholder.svg"}
                    alt={category.name}
                    className="w-16 h-16 mx-auto mb-3 bg-gray-100 rounded"
                  />
                  <p className="text-sm font-medium">{category.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Brand List Modal */}
      <Dialog open={showBrandList} onOpenChange={setShowBrandList}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Brand List</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 p-4">
            <Card
              key="all"
              className={`cursor-pointer transition-all ${selectedBrand === "all" ? "ring-2 ring-purple-500" : ""}`}
              onClick={() => {
                setSelectedBrand("all")
                setShowBrandList(false)
              }}
            >
              <CardContent className="p-4 text-center">
                <p className="text-sm font-medium">All Brands</p>
              </CardContent>
            </Card>
            {allBrands.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No brands available</div>
            ) : (
              allBrands.map((brand) => (
                <Card
                  key={brand.id}
                  className={`cursor-pointer transition-all ${selectedBrand === brand.id ? "ring-2 ring-purple-500" : ""}`}
                  onClick={() => {
                    setSelectedBrand(brand.id)
                    setShowBrandList(false)
                  }}
                >
                  <CardContent className="p-4 text-center">
                    <p className="text-sm font-medium">{brand.name}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Payment</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-8 p-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Received Amount *</label>
                <Input value={receivedAmount} onChange={(e) => setReceivedAmount(e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Paying Amount *</label>
                <Input value={payingAmount} onChange={(e) => setPayingAmount(e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Change :</label>
                <div className="mt-1 p-2 bg-gray-100 rounded">{change}</div>
              </div>
              <div>
                <label className="text-sm font-medium">Payment choice *</label>
                <Select value={paymentChoice} onValueChange={setPaymentChoice}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Card">Card</SelectItem>
                    <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Note</label>
                <Textarea
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
              <Button
                className="bg-[#1a237e] hover:bg-[#23308c] hover:bg-purple-700"
                onClick={handleSubmitPayment}
                disabled={isCreatingSale || isSubmittingFiscal}
              >
                {isCreatingSale || isSubmittingFiscal ? (
                  <>Processing...</>
                ) : (
                  <>Submit Payment</>
                )}
              </Button>

              {/* FDMS Status Indicator */}
              {fdmsStatus?.data?.configured && (
                <div className="text-xs text-gray-600 text-center mt-2">
                  {fdmsStatus.data.fdmsEnabled ? (
                    <span className="text-green-600">✓ ZIMRA FDMS Active</span>
                  ) : (
                    <span className="text-orange-600">⚠ Non-FDMS Mode</span>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Total Products</span>
                <div className="bg-[#1a237e] hover:bg-[#23308c] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                  {cartItems.length}
                </div>
              </div>
              <div className="flex justify-between">
                <span>Order Tax</span>
                <span>
                  {organizationData?.currency_symbol || "$"} {tax} ({((tax / subtotal) * 100).toFixed(0)} %)
                </span>
              </div>
              <div className="flex justify-between">
                <span>Discount</span>
                <span>{organizationData?.currency_symbol || "$"} {discount}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{organizationData?.currency_symbol || "$"} {shipping}</span>
              </div>
              <div className="flex justify-between font-bold text-lg  ">
                <span>Grand Total</span>
                <span>{organizationData?.currency_symbol || "$"} {grandTotal}</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Modal */}
      <Dialog open={showReceiptModal} onOpenChange={setShowReceiptModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invoice POS</DialogTitle>
          </DialogHeader>
          <div className="p-4 space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-bold">{organizationData?.name || "Your Company Name"}</h2>
              <div className="text-sm text-gray-600 mt-2">
                <p>Date: {new Date().toLocaleDateString()}</p>
                {organizationData?.address && <p>Address: {[organizationData.address, organizationData.city, organizationData.country].filter(Boolean).join(", ")}</p>}
                {organizationData?.email && <p>Email: {organizationData.email}</p>}
                {organizationData?.phone && <p>Phone: {organizationData.phone}</p>}
                <p>Customer: {selectedCustomer === "walkin" || !selectedCustomer ? "Walk-In Customer" : customersResponse?.data?.find(c => c.id.toString() === selectedCustomer)?.name || "Walk-In Customer"}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              {cartItems.map((item: CartItem) => (
                <div key={item.id} className="space-y-2">
                  <p className="font-medium">{item.name}</p>
                  <div className="flex justify-between">
                    <span>{item.quantity} Pcs X {organizationData?.currency_symbol || "$"}{item.price}</span>
                    <span>{organizationData?.currency_symbol || "$"}{(item.quantity * item.price)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Order Tax</span>
                <span>{organizationData?.currency_symbol || "$"} {tax} ({subtotal > 0 ? ((tax / subtotal) * 100).toFixed(0) : 0} %)</span>
              </div>
              <div className="flex justify-between">
                <span>Discount</span>
                <span>{organizationData?.currency_symbol || "$"} {discount}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Grand Total</span>
                <span>{organizationData?.currency_symbol || "$"} {grandTotal}</span>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-medium">Paid By:</p>
                  <p>{paymentChoice}</p>
                </div>
                <div>
                  <p className="font-medium">Amount:</p>
                  <p>{organizationData?.currency_symbol || "$"}{payingAmount}</p>
                </div>
                <div>
                  <p className="font-medium">Change:</p>
                  <p>{organizationData?.currency_symbol || "$"}{change}</p>
                </div>
              </div>
            </div>

            <div className="text-center text-sm">
              <p>{organizationData?.terms_conditions || "Thank You For Shopping With Us. Please Come Again"}</p>
              <div className="mt-4 font-mono">
                <div className="text-lg">||||| |||| | ||| ||||</div>
                <div>{Date.now().toString().slice(-6)}</div>
              </div>
            </div>

            <Button className="w-full bg-[#1a237e] hover:bg-[#23308c] hover:bg-purple-700" onClick={handlePrintReceipt}>
              🖨️ Print
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}