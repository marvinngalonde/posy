"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, X, Loader2 } from "lucide-react"
import AuthGuard from "@/components/AuthGuard"
import { useCreateProductMutation } from '@/lib/slices/productsApi'
import { toast } from "sonner"

interface FormData {
  name: string
  code: string
  barcode: string
  category_id: string
  brand_id: string
  unit_id: string
  warehouse_id: string
  cost: string
  price: string
  stock: string
  alert_quantity: string
  description: string
  status: string
}

interface Option {
  value: string
  label: string
}

export default function CreateProduct() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<FormData>({
    name: "",
    code: "",
    barcode: "",
    category_id: "",
    brand_id: "",
    unit_id: "",
    warehouse_id: "",
    cost: "",
    price: "",
    stock: "",
    alert_quantity: "",
    description: "",
    status: "active",
  })
  const [images, setImages] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<Option[]>([])
  const [brands, setBrands] = useState<Option[]>([])
  const [units, setUnits] = useState<Option[]>([])
  const [warehouses, setWarehouses] = useState<Option[]>([])

  // RTK Query hook
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation()

  const initialForm = {
    name: "",
    code: "",
    barcode: "",
    category_id: "",
    brand_id: "",
    unit_id: "",
    warehouse_id: "",
    cost: "",
    price: "",
    stock: "",
    alert_quantity: "",
    description: "",
    status: "active",
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriesRes, brandsRes, unitsRes, warehousesRes] = await Promise.all([
          fetch("/api/settings/categories"),
          fetch("/api/settings/brands"),
          fetch("/api/settings/units"),
          fetch("/api/settings/warehouses"),
        ])

        const [categoriesData, brandsData, unitsData, warehousesData] = await Promise.all([
          categoriesRes.json(),
          brandsRes.json(),
          unitsRes.json(),
          warehousesRes.json(),
        ])

        const categoriesList = categoriesData.data || categoriesData
        const brandsList = brandsData.data || brandsData
        const unitsList = unitsData.data || unitsData
        const warehousesList = warehousesData.data || warehousesData

        setCategories(categoriesList.map((c: any) => ({ value: c.id.toString(), label: c.name })))
        setBrands(brandsList.map((b: any) => ({ value: b.id.toString(), label: b.name })))
        setUnits(unitsList.map((u: any) => ({ value: u.id.toString(), label: u.name })))
        setWarehouses(warehousesList.map((w: any) => ({ value: w.id.toString(), label: w.name })))
      } catch (error) {
        console.error("Error loading data:", error)
        toast.error("Failed to load form data")
      }
    }

    loadData()
  }, [])

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.id]: e.target.value })
  }

  const handleSelect = (field: string, value: string) => {
    setForm({ ...form, [field]: value })
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files))
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (e.dataTransfer.files) {
      setImages(Array.from(e.dataTransfer.files))
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  const safeTrim = (val: unknown) => (typeof val === "string" ? val.trim() : "")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (
      !safeTrim(form.name) ||
      !safeTrim(form.code) ||
      !safeTrim(form.category_id) ||
      !safeTrim(form.unit_id) ||
      !safeTrim(form.cost) ||
      !safeTrim(form.price)
    ) {
      setError("Please fill all required fields.")
      toast.error("Please fill all required fields.")
      return
    }
    
    try {
      const formData = new FormData()
      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value)
      })
      if (images.length > 0) {
        formData.append("image", images[0])
      }
      
      // Use mutation
      await createProduct(formData).unwrap()
      setForm(initialForm)
      setImages([])
      toast.success("Product created successfully!")
      router.push("/products/list")
    } catch (err) {
      setError("Failed to create product")
      toast.error("Failed to create product")
      console.log("Error creating product:", err)
    }
  }


  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="p-4 md:p-6">
          <div className="mb-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <span>Products</span>
              <span>|</span>
              <span>Create product</span>
            </div>
            <h1 className="text-xl font-semibold">Create product</h1>
          </div>

          <form onSubmit={handleSubmit} encType="multipart/form-data">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Main Form Section */}
              <div className="lg:col-span-2 space-y-4">
                <Card className="text-sm">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base">Product Information</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium block mb-1">
                          Name <span className="text-red-500">*</span>
                        </label>
                        <Input 
                          id="name" 
                          value={form.name} 
                          onChange={handleInput} 
                          placeholder="Product name" 
                          className="h-9 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium block mb-1">
                          Code <span className="text-red-500">*</span>
                        </label>
                        <Input 
                          id="code" 
                          value={form.code} 
                          onChange={handleInput} 
                          placeholder="Product code"
                          className="h-9 text-sm" 
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium block mb-1">Barcode</label>
                        <Input 
                          id="barcode" 
                          value={form.barcode} 
                          onChange={handleInput} 
                          placeholder="Optional barcode"
                          className="h-9 text-sm" 
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium block mb-1">
                          Category <span className="text-red-500">*</span>
                        </label>
                        <Select value={form.category_id} onValueChange={v => handleSelect("category_id", v)}>
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((c) => (
                              <SelectItem key={c.value} value={c.value} className="text-sm">{c.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium block mb-1">Brand</label>
                        <Select value={form.brand_id} onValueChange={v => handleSelect("brand_id", v)}>
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="Select brand" />
                          </SelectTrigger>
                          <SelectContent>
                            {brands.map((b) => (
                              <SelectItem key={b.value} value={b.value} className="text-sm">{b.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs font-medium block mb-1">
                          Unit <span className="text-red-500">*</span>
                        </label>
                        <Select value={form.unit_id} onValueChange={v => handleSelect("unit_id", v)}>
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                          <SelectContent>
                            {units.map((u) => (
                              <SelectItem key={u.value} value={u.value} className="text-sm">{u.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="text-sm">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base">Inventory & Pricing</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium block mb-1">Warehouse</label>
                        <Select value={form.warehouse_id} onValueChange={v => handleSelect("warehouse_id", v)}>
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="Select warehouse" />
                          </SelectTrigger>
                          <SelectContent>
                            {warehouses.map((w) => (
                              <SelectItem key={w.value} value={w.value} className="text-sm">{w.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs font-medium block mb-1">
                          Cost <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-muted-foreground text-xs">$</span>
                          <Input 
                            id="cost" 
                            value={form.cost} 
                            onChange={handleInput} 
                            placeholder="0.00" 
                            className="h-9 text-sm pl-7"
                            type="number" 
                            min="0" 
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium block mb-1">
                          Price <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-muted-foreground text-xs">$</span>
                          <Input 
                            id="price" 
                            value={form.price} 
                            onChange={handleInput} 
                            placeholder="0.00" 
                            className="h-9 text-sm pl-7"
                            type="number" 
                            min="0" 
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium block mb-1">Stock</label>
                        <Input 
                          id="stock" 
                          value={form.stock} 
                          onChange={handleInput} 
                          placeholder="0" 
                          className="h-9 text-sm" 
                          type="number" 
                          min="0" 
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium block mb-1">Low Stock Alert</label>
                        <Input 
                          id="alert_quantity" 
                          value={form.alert_quantity} 
                          onChange={handleInput} 
                          placeholder="0" 
                          className="h-9 text-sm" 
                          type="number" 
                          min="0" 
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium block mb-1">Status</label>
                        <Select value={form.status} onValueChange={v => handleSelect("status", v)}>
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active" className="text-sm">Active</SelectItem>
                            <SelectItem value="inactive" className="text-sm">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="text-sm">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base">Description</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <Textarea 
                      id="description" 
                      value={form.description} 
                      onChange={handleInput} 
                      placeholder="Enter product description..." 
                      className="min-h-[100px] text-sm"
                    />
                  </CardContent>
                </Card>
                
                {error && (
                  <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2 rounded-md">
                    <X className="w-3 h-3" />
                    <span>{error}</span>
                  </div>
                )}
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" type="button" size="sm">
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={isCreating}>
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Product"
                    )}
                  </Button>
                </div>
              </div>

              {/* Image Upload Section */}
              <div className="lg:col-span-1">
                <Card className="text-sm">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base">Product Image</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div
                      className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                        images.length > 0 
                          ? "border-primary bg-primary/10" 
                          : "border-muted hover:border-primary/50"
                      }`}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onClick={handleBrowseClick}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="mb-3">
                        <div className="w-14 h-14 bg-muted rounded-lg mx-auto flex items-center justify-center">
                          {images.length > 0 ? (
                            <img
                              src={URL.createObjectURL(images[0])}
                              alt="Preview"
                              className="object-cover w-full h-full rounded-lg"
                            />
                          ) : (
                            <Upload className="w-8 h-8 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                      <h3 className="font-medium mb-1 text-sm">
                        {images.length > 0 ? "Change Image" : "Upload Image"}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Drag & drop or click to browse
                      </p>
                      <input
                        type="file"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        accept="image/*"
                      />
                    </div>
                    
                    {images.length > 0 && (
                      <div className="mt-3">
                        <h4 className="text-xs font-medium mb-1">Preview</h4>
                        <div className="grid grid-cols-3 gap-2">
                          {images.map((file, idx) => (
                            <div 
                              key={idx} 
                              className="aspect-square rounded-md bg-muted overflow-hidden border"
                            >
                              <img
                                src={URL.createObjectURL(file)}
                                alt={file.name}
                                className="object-cover w-full h-full"
                                onLoad={e => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}