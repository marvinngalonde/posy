"use client"

import { useState } from "react"
import { useGetOrganizationQuery } from "@/lib/slices/organizationApi"
import { Search, X, ChevronDown, Minus, Plus, RotateCcw, CreditCard, Settings, Globe, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

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
  image: string
  category: string
}

const products: Product[] = [
  {
    id: "1",
    name: "Safe Space - Community Hub",
    code: "AAB",
    price: 3.0,
    image: "/placeholder.svg?height=120&width=120",
    category: "all",
  },
  {
    id: "2",
    name: "Academic Project Management",
    code: "AA123",
    price: 260.0,
    image: "/placeholder.svg?height=120&width=120",
    category: "electronic",
  },
  {
    id: "3",
    name: "Academic Project Suite",
    code: "AA1234",
    price: 250.0,
    image: "/placeholder.svg?height=120&width=120",
    category: "electronic",
  },
  {
    id: "4",
    name: "Academic Project Pro",
    code: "AA12345",
    price: 160.0,
    image: "/placeholder.svg?height=120&width=120",
    category: "electronic",
  },
  {
    id: "5",
    name: "5to12v boost cable",
    code: "A123",
    price: 13.0,
    image: "/placeholder.svg?height=120&width=120",
    category: "electronic",
  },
  {
    id: "6",
    name: "Twin Analog Joystick",
    code: "A374",
    price: 25.0,
    image: "/placeholder.svg?height=120&width=120",
    category: "electronic",
  },
  {
    id: "7",
    name: "10OHMTO1MEG Resistor",
    code: "A532",
    price: 0.1,
    image: "/placeholder.svg?height=120&width=120",
    category: "electronic",
  },
  {
    id: "8",
    name: "PIC16F877A Microcontroller",
    code: "A0123",
    price: 12.0,
    image: "/placeholder.svg?height=120&width=120",
    category: "electronic",
  },
]

const categories = [
  { id: "all", name: "All Category", icon: "/placeholder.svg?height=60&width=60" },
  { id: "electronic", name: "Electronic Components for resale", icon: "/placeholder.svg?height=60&width=60" },
  { id: "services", name: "Services", icon: "/placeholder.svg?height=60&width=60" },
  { id: "clothing", name: "Clothing", icon: "/placeholder.svg?height=60&width=60" },
]

const brands = [
  { id: "arduino", name: "Arduino", icon: "/placeholder.svg?height=60&width=60" },
  { id: "raspberry", name: "Raspberry Pi", icon: "/placeholder.svg?height=60&width=60" },
  { id: "texas", name: "Texas Instruments", icon: "/placeholder.svg?height=60&width=60" },
  { id: "microchip", name: "Microchip", icon: "/placeholder.svg?height=60&width=60" },
]

export default function POSSystem() {
  const { data: organizationData, isLoading: organizationLoading } = useGetOrganizationQuery()
  const [cartItems, setCartItems] = useState<CartItem[]>([{ id: "1", name: "AAB", price: 3.0, quantity: 2 }])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [tax, setTax] = useState(0)
  const [discount, setDiscount] = useState(0)
  const [shipping, setShipping] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)

  // Modal states
  const [showCategoryList, setShowCategoryList] = useState(false)
  const [showBrandList, setShowBrandList] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showReceiptModal, setShowReceiptModal] = useState(false)

  // Payment form states
  const [receivedAmount, setReceivedAmount] = useState("")
  const [payingAmount, setPayingAmount] = useState("")
  const [paymentChoice, setPaymentChoice] = useState("Cash")
  const [paymentNote, setPaymentNote] = useState("")

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

  const handlePayNow = () => {
    setReceivedAmount(grandTotal)
    setPayingAmount(grandTotal)
    setShowPaymentModal(true)
  }

  const handleSubmitPayment = () => {
    setShowPaymentModal(false)
    setShowReceiptModal(true)
  }

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
              Customer: Walk-In Customer
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div class="item-row">
            <span>Safe Space - Community Hub</span>
          </div>
          <div class="item-row">
            <span>2.00 Pcs X 3.00</span>
            <span>6.00</span>
          </div>
          
          <div class="divider"></div>
          
          <div class="total-section">
            <div class="item-row">
              <span>Order Tax</span>
              <span>${currencySymbol} ${tax.toFixed(2)} (${tax > 0 ? ((tax / subtotal) * 100).toFixed(0) : 0} %)</span>
            </div>
            <div class="item-row">
              <span>Discount</span>
              <span>${currencySymbol} ${discount.toFixed(2)}</span>
            </div>
            <div class="item-row grand-total">
              <span>Grand Total</span>
              <span>${currencySymbol} ${grandTotal.toFixed(2)}</span>
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
              <span>${currencySymbol}${Number(payingAmount).toFixed(2)}</span>
              <span>${currencySymbol}${change.toFixed(2)}</span>
            </div>
          </div>

          <div class="footer">
            <p>${organizationData?.terms_conditions || "Thank You For Shopping With Us. Please Come Again"}</p>
            <div class="barcode">
              ||||| |||| | ||| ||||<br>
              SL_1169
            </div>
          </div>
        </body>
        </html>
      `)
      receiptWindow.document.close()
      receiptWindow.print()
    }
  }

  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Cart */}
      <div className="w-80 bg-white border-r flex flex-col">
        {/* Logo and Navigation Icons */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <div className="text-white font-bold text-xl">B</div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="p-2">
              <div className="w-6 h-6 border-2 border-dashed border-gray-400 rounded"></div>
            </Button>
            <Button variant="ghost" size="sm" className="p-2">
              <Globe className="h-5 w-5 text-gray-600" />
            </Button>
            <Button variant="ghost" size="sm" className="p-2">
              <div className="w-6 h-6 bg-purple-200 rounded flex items-center justify-center">
                <Zap className="h-4 w-4 text-purple-600" />
              </div>
            </Button>
          </div>
        </div>

        {/* Customer Selection */}
        <div className="p-4 space-y-3">
          <div className="relative">
            <Select defaultValue="walk-in-customer">
              <SelectTrigger className="w-full bg-gray-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="walk-in-customer">walk-in-customer</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 bg-purple-600">
              <ChevronDown className="h-3 w-3" />
            </Button>
          </div>

          <div className="relative">
            <Select defaultValue="karigamombe">
              <SelectTrigger className="w-full bg-gray-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="karigamombe">Karigamombe</SelectItem>
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
                  Safe Space - Community Hub
                </div>
              </div>
              <div className="text-sm">{organizationData?.currency_symbol || "$"} {item.price}</div>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 w-6 p-0 bg-purple-600 text-white border-purple-600"
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="mx-2 text-sm w-6 text-center">{item.quantity}</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 w-6 p-0 bg-purple-600 text-white border-purple-600"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">{organizationData?.currency_symbol || "$"} {(item.price * item.quantity)}</span>
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
        <div className="px-4 py-3 bg-teal-400 text-white font-bold text-lg">
          Grand Total : {organizationData?.currency_symbol || "$"} {grandTotal}
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
                  {organizationData?.currency_symbol || "$"}
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
                  {organizationData?.currency_symbol || "$"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 grid grid-cols-2 gap-3">
          <Button variant="destructive" className="bg-red-500 hover:bg-red-600">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button className="bg-purple-600 hover:bg-purple-700" onClick={handlePayNow}>
            <CreditCard className="h-4 w-4 mr-2" />
            Pay Now
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Product Section */}
        <div className="flex-1 p-6">
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="outline"
                className="text-blue-500 border-blue-200 bg-transparent"
                onClick={() => setShowCategoryList(true)}
              >
                📋 List of Category
              </Button>
              <Button
                variant="outline"
                className="text-blue-500 border-blue-200 bg-transparent"
                onClick={() => setShowBrandList(true)}
              >
                🏷️ Brand List
              </Button>
              <Button variant="outline" className="px-8 bg-transparent">
                Product
              </Button>
              <div className="ml-auto">
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="relative max-w-md">
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
            {filteredProducts.map((product) => (
              <Card key={product.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-3">
                  <div className="relative mb-3">
                    <img
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      className="w-full h-24 object-cover rounded bg-gray-100"
                    />
                    <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                      {product.price} Pcs
                    </div>
                  </div>
                  <h3 className="font-medium text-sm mb-1 truncate">{product.name}</h3>
                  <p className="text-xs text-gray-500 mb-2">{product.code}</p>
                  <div className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded inline-block">
                    {organizationData?.currency_symbol || "$"} {product.price}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}>
              ‹
            </Button>
            {[1, 2, 3, 4].map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "ghost"}
                size="sm"
                className={currentPage === page ? "bg-purple-600" : ""}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
            <Button variant="ghost" size="sm" onClick={() => setCurrentPage(currentPage + 1)}>
              ›
            </Button>
          </div>
        </div>
      </div>

      {/* Category List Modal */}
      <Dialog open={showCategoryList} onOpenChange={setShowCategoryList}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>List of Category</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 p-4">
            {categories.map((category) => (
              <Card
                key={category.id}
                className={`cursor-pointer transition-all ${
                  selectedCategory === category.id ? "ring-2 ring-purple-500" : ""
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
            {brands.map((brand) => (
              <Card key={brand.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-center">
                  <img
                    src={brand.icon || "/placeholder.svg"}
                    alt={brand.name}
                    className="w-16 h-16 mx-auto mb-3 bg-gray-100 rounded"
                  />
                  <p className="text-sm font-medium">{brand.name}</p>
                </CardContent>
              </Card>
            ))}
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
              <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleSubmitPayment}>
                Submit
              </Button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Total Products</span>
                <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
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
              <div className="flex justify-between font-bold text-lg">
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
                <p>Customer: Walk-In Customer</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="space-y-2">
                <p className="font-medium">Safe Space - Community Hub</p>
                <div className="flex justify-between">
                  <span>2.00 Pcs X {organizationData?.currency_symbol || "$"}3.00</span>
                  <span>{organizationData?.currency_symbol || "$"}6.00</span>
                </div>
              </div>
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Order Tax</span>
                <span>{organizationData?.currency_symbol || "$"} {tax.toFixed(2)} ({subtotal > 0 ? ((tax / subtotal) * 100).toFixed(0) : 0} %)</span>
              </div>
              <div className="flex justify-between">
                <span>Discount</span>
                <span>{organizationData?.currency_symbol || "$"} {discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Grand Total</span>
                <span>{organizationData?.currency_symbol || "$"} {grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-medium">Paid By:</p>
                  <p>Cash</p>
                </div>
                <div>
                  <p className="font-medium">Amount:</p>
                  <p>{organizationData?.currency_symbol || "$"}{Number(payingAmount).toFixed(2)}</p>
                </div>
                <div>
                  <p className="font-medium">Change:</p>
                  <p>{organizationData?.currency_symbol || "$"}{change.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="text-center text-sm">
              <p>{organizationData?.terms_conditions || "Thank You For Shopping With Us. Please Come Again"}</p>
              <div className="mt-4 font-mono">
                <div className="text-lg">||||| |||| | ||| ||||</div>
                <div>SL_1169</div>
              </div>
            </div>

            <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={handlePrintReceipt}>
              🖨️ Print
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
