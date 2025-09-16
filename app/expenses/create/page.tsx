"use client"

import DashboardLayout from "../../../components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import { useGetWarehousesQuery } from "@/lib/slices/settingsApi"
import { useGetExpenseCategoriesQuery, useCreateExpenseMutation } from "@/lib/slices/expensesApi"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface CreateExpenseForm {
  date: string
  warehouseId: string
  categoryId: string
  amount: string
  details: string
}

export default function CreateExpense() {
  const router = useRouter()
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [warehouseId, setWarehouseId] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [amount, setAmount] = useState("")
  const [details, setDetails] = useState("")

  const { data: warehouses, isLoading: warehousesLoading } = useGetWarehousesQuery()
  const { data: categories, isLoading: categoriesLoading } = useGetExpenseCategoriesQuery()
  const [createExpense, { isLoading: isCreating }] = useCreateExpenseMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!date || !warehouseId || !categoryId || !amount) {
      toast.error("Please fill all required fields.")
      return
    }

    try {
      await createExpense({
        date,
        warehouse_id: parseInt(warehouseId),
        category_id: parseInt(categoryId),
        amount: parseFloat(amount),
        description: details,
        reference: `EXP_${Date.now()}`,
      }).unwrap()
      toast.success("Expense created successfully!")
      router.push("/expenses/list")
    } catch (error) {
      toast.error("Failed to create expense.")
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Create Expense</h1>
        </div>
        <form className="bg-white rounded-lg shadow p-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="text-sm font-medium">Date *</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" required />
            </div>
            <div>
              <label className="text-sm font-medium">Warehouse *</label>
              <Select value={warehouseId} onValueChange={setWarehouseId} disabled={warehousesLoading}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={warehousesLoading ? "Loading..." : "Choose Warehouse"} />
                </SelectTrigger>
                <SelectContent>
                  {warehouses?.map((w) => (
                    <SelectItem key={w.id} value={w.id.toString()}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Expense Category *</label>
              <Select value={categoryId} onValueChange={setCategoryId} disabled={categoriesLoading}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={categoriesLoading ? "Loading..." : "Choose Category"} />
                </SelectTrigger>
                <SelectContent>
                  {categories?.data?.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mb-6">
            <label className="text-sm font-medium">Amount *</label>
            <Input
              placeholder="Amount"
              className="mt-1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              type="number"
            />
          </div>
          <div className="mb-6">
            <label className="text-sm font-medium">Details</label>
            <Textarea
              placeholder="A few words ..."
              className="mt-1"
              rows={4}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
          </div>
          <Button className="bg-[#1a237e] hover:bg-purple-700" type="submit" disabled={isCreating}>
            {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit"}
          </Button>
        </form>
      </div>
    </DashboardLayout>
  )
}
